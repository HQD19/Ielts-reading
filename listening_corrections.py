"""Apply traceable editorial corrections and recover blanks from source geometry."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def corrected_layouts(layouts):
    patches = json.loads((ROOT / 'data/listening/corrections.json').read_text(encoding='utf8'))['pages']
    for key, patch in patches.items():
        layout = layouts[key]
        for edit in patch['replace']:
            run = layout['runs'][edit['run']]
            assert run[0] == edit['old'], (key, edit)
            run[0] = edit['text']
        layout['runs'].extend(patch['append'])
        for field in ('table', 'answerGaps', 'silentRuns'):
            if field in patch:
                layout[field] = patch[field]
    for key, layout in layouts.items():
        if 'table' in layout:
            table = layout['table']
            indices = table['prefix'] + [i for h in table['headers'] for i in h] + [i for row in table['rows'] for cell in row for i in cell]
            assert sorted(indices) == list(range(len(layout['runs']))), ('Table word coverage', key)
        if 'answerGaps' in layout:
            continue
        # Horizontal dotted rules already reconstructed from the original scan.
        gaps = list(layout.get('rules', []))
        for contour in layout.get('paths', '').split('Z'):
            numbers = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', contour)]
            if len(numbers) < 6:
                continue
            xs, ys = numbers[::2], numbers[1::2]
            if max(xs)-min(xs) > 40 and max(ys)-min(ys) < 10:
                gaps.append([min(xs), min(ys), max(xs), max(ys)])
        layout['answerGaps'] = []
        for index, run in enumerate(layout['runs']):
            if not re.fullmatch(r'[•�]?\s*(?:[1-9]|[1-3]\d|40)\s*[£$]?[. _…]*', run[0]):
                continue
            if any(-8 <= x-run[1]-run[3] <= run[4]*2.5 and abs(y-run[2]) < run[4]*.65
                   for x,y,_,_ in gaps):
                layout['answerGaps'].append(index)
    return layouts
