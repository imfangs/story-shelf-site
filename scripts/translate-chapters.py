#!/usr/bin/env python3
"""Resumable, paragraph-aligned literary translation using the existing FBT transport."""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
GATEWAY = Path(os.environ.get('FBT_ROOT', '/Users/fangs/workspace/fbt')) / 'friday-gateway/scripts/invoke_chat.sh'
SYSTEM = ROOT / 'scripts/translation-system.txt'

def sha(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()

def check(source, translated):
    if not isinstance(translated, list) or [b.get('id') for b in translated] != [b['id'] for b in source]:
        raise ValueError('paragraph IDs/count/order mismatch')
    for a, b in zip(source, translated):
        value = b.get('text')
        if not isinstance(value, str) or not value.strip():
            raise ValueError('empty translation: ' + a['id'])
        if len(a['text']) > 200 and len(value) < len(a['text']) * .15:
            raise ValueError('suspiciously short paragraph: ' + a['id'])
        if len(re.findall('[A-Za-z]', a['text'])) > 80 and not re.search('[\u3400-\u9fff]', value):
            raise ValueError('untranslated paragraph: ' + a['id'])
    return translated

def chunks(blocks, limit):
    batch, size = [], 0
    for block in blocks:
        if batch and size + len(block['text']) > limit:
            yield batch
            batch, size = [], 0
        batch.append(block)
        size += len(block['text'])
    if batch:
        yield batch

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--book', required=True)
    parser.add_argument('--chapter', type=int)
    parser.add_argument('--workers', type=int, default=3)
    parser.add_argument('--chunk-chars', type=int, default=8000)
    parser.add_argument('--model', default='claude-sonnet-5')
    args = parser.parse_args()
    if not re.fullmatch('[a-z0-9-]+', args.book):
        parser.error('invalid book id')
    source_dir = ROOT / 'private/sources' / args.book
    files = sorted(source_dir.glob('[0-9][0-9].json'))
    if args.chapter:
        files = [source_dir / f'{args.chapter:02}.json']
    if not files:
        raise SystemExit('No source chapters')
    glossary_path = source_dir / 'glossary.json'
    glossary = json.loads(glossary_path.read_text()) if glossary_path.exists() else {}
    cache_dir = ROOT / 'private/translations' / args.book
    cache_dir.mkdir(parents=True, exist_ok=True)
    out_dir = ROOT / 'content/chapters' / args.book
    out_dir.mkdir(parents=True, exist_ok=True)
    plans, jobs = [], []
    for file in files:
        source = json.loads(file.read_text())
        if len({b['id'] for b in source['blocks']}) != len(source['blocks']):
            raise ValueError('duplicate source IDs')
        plan = []
        for index, blocks in enumerate(chunks(source['blocks'], args.chunk_chars)):
            body = {'book': args.book, 'chapter': source['title'], 'glossary': glossary, 'blocks': blocks}
            key = sha({'input': body, 'system': SYSTEM.read_text(), 'model': args.model})
            cache = cache_dir / f'{source["chapter"]:02}-{index:02}-{key[:16]}.json'
            plan.append((blocks, cache))
            if cache.exists():
                check(blocks, json.loads(cache.read_text())['blocks'])
            else:
                jobs.append((body, cache))
        plans.append((source, plan))
    print(json.dumps({'book': args.book, 'chapters': len(plans), 'pendingChunks': len(jobs)}), flush=True)

    def run(job):
        body, cache = job
        request = cache.with_suffix('.input.json')
        request.write_text(json.dumps(body, ensure_ascii=False))
        request.chmod(0o600)
        last_error = ''
        for attempt in range(3):
            try:
                command = ['bash', str(GATEWAY), '--auto-appid', args.model, '--system-file', str(SYSTEM),
                           '--user-file', str(request), '--max-tokens', '16000', '--timeout', '240', '--retries', '1', '--json']
                result = subprocess.run(command, capture_output=True, text=True, timeout=540)
                receipt = json.loads(result.stdout)
                if not receipt.get('ok') or receipt.get('finish_reason') not in ('stop', 'end_turn'):
                    raise ValueError('incomplete transport: ' + str(receipt.get('finish_reason')))
                raw = re.sub(r'^```(?:json)?\s*|\s*```$', '', receipt['text'].strip())
                translated = check(body['blocks'], json.loads(raw)['blocks'])
                data = {'blocks': translated, 'sourceHash': sha(body['blocks']), 'model': receipt.get('resolved_model'),
                        'finishReason': receipt['finish_reason'], 'usage': receipt.get('usage'), 'translatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
                temp = cache.with_suffix('.tmp')
                temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
                temp.replace(cache)
                request.unlink(missing_ok=True)
                return cache.name
            except Exception as error:
                last_error = str(error)
                if attempt < 2:
                    time.sleep(3 * (attempt + 1))
        raise RuntimeError(f'{cache.name}: {last_error}')

    errors = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        for future in concurrent.futures.as_completed([pool.submit(run, j) for j in jobs]):
            try:
                print(json.dumps({'book': args.book, 'completedChunk': future.result()}), flush=True)
            except Exception as error:
                errors.append(str(error))
                print(json.dumps({'book': args.book, 'error': str(error)}), flush=True)
    for source, plan in plans:
        if not all(cache.exists() for blocks, cache in plan):
            continue
        translated = [p for blocks, cache in plan for p in check(blocks, json.loads(cache.read_text())['blocks'])]
        check(source['blocks'], translated)
        file = out_dir / f'{source["chapter"]:02}.md'
        if file.exists() and re.search(r'^verified:\s*true\s*$', file.read_text(), re.M):
            print(json.dumps({'preservedReviewedChapter': str(file.relative_to(ROOT))}), flush=True)
            continue
        title = source.get('titleZh', source['title'])
        front = f'---\ntitle: {title}\nkind: translation\nsource: {source["url"]}\nprovenance: licensed\nverified: false\nsourceHash: {sha(source["blocks"])}\n---\n\n'
        text = '\n\n'.join(f'<!-- {b["id"]} -->\n{b["text"].strip()}' for b in translated)
        file.write_text(front + text + '\n')
        print(json.dumps({'draft': str(file.relative_to(ROOT)), 'paragraphs': len(translated), 'needsReview': True}), flush=True)
    if errors:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
