#!/usr/bin/env python3
"""Compare deployed public files and reader routes with the exact local build."""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='https://stories.fangs.cc')
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--out', default='.qa/live-integrity.json')
    args = parser.parse_args()
    if not args.url.startswith('https://'):
        parser.error('Public verification requires HTTPS with normal certificate validation.')
    dist = ROOT / 'docs/.vitepress/dist'
    report_path = ROOT / args.out
    static_receipt = report_path.with_name(report_path.stem + '-files.json')
    static_receipt.parent.mkdir(parents=True, exist_ok=True)
    fbt_root = Path(os.environ.get('FBT_ROOT', '/Users/fangs/workspace/fbt'))
    static_command = ['node', str(fbt_root / 'public-preview/scripts/verify_static.mjs'),
                      '--directory', str(dist), '--url', args.url, '--transport', 'curl',
                      '--exclude', 'CNAME', '--exclude', '.nojekyll', '--concurrency', str(args.workers),
                      '--budget-ms', '300000', '--out', str(static_receipt), '--json']
    static_result = subprocess.run(static_command, capture_output=True, text=True)
    if static_result.returncode:
        print('Static file verification failed; inspect ' + str(static_receipt), flush=True)
        raise SystemExit(static_result.returncode)
    # Project-specific contract: clean reader routes must serve their exact built pages.
    checks = []
    for file in sorted(dist.rglob('*.html')):
        if file.name == '404.html':
            continue
        relative = file.relative_to(dist).as_posix()
        route = relative[:-10] if relative.endswith('index.html') else relative[:-5]
        checks.append((route, file))

    def verify(item):
        route, file = item
        expected = hashlib.sha256(file.read_bytes()).hexdigest()
        url = args.url.rstrip('/') + '/' + quote(route, safe='/')
        last = ''
        for attempt in range(2):
            with tempfile.TemporaryDirectory(prefix='story-shelf-verify-') as temp:
                output = Path(temp) / 'body'
                result = subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location', '--proto', '=https', '--proto-redir', '=https', '--max-time', '25', '--output', str(output), '--write-out', '%{http_code}', url], capture_output=True, text=True)
                if result.returncode == 0 and output.exists():
                    actual = hashlib.sha256(output.read_bytes()).hexdigest()
                    if actual == expected:
                        return {'route': route, 'status': int(result.stdout), 'sha256': actual, 'bytes': output.stat().st_size, 'ok': True}
                    last = 'Content hash differs from local build'
                else:
                    last = result.stderr.strip()[:300] or result.stdout
            if attempt == 0:
                time.sleep(1)
        return {'route': route, 'ok': False, 'error': last}

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        for result in pool.map(verify, checks):
            results.append(result)
            if not result['ok']:
                print(json.dumps(result, ensure_ascii=False), flush=True)
    report = {'url': args.url, 'checkedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
              'checks': len(results), 'passed': sum(r['ok'] for r in results), 'staticReceipt': str(static_receipt.relative_to(ROOT)), 'results': results}
    out = ROOT / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k:v for k,v in report.items() if k != 'results'}, ensure_ascii=False), flush=True)
    raise SystemExit(0 if report['checks'] == report['passed'] else 1)

if __name__ == '__main__':
    main()
