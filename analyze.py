"""python analyze.py downloaded_data/ --out results/ [--mode pilot]
Only *_complete.json containing a completed session is analyzed.
Repeated participant IDs are flagged, never silently deleted. Block snapshots ignored.
"""
import argparse,csv,json
from pathlib import Path
from collections import Counter
p=argparse.ArgumentParser();p.add_argument('folder',type=Path);p.add_argument('--out',type=Path,default=Path('results'));p.add_argument('--mode',choices=['formal','pilot','demo'],default='formal');a=p.parse_args()
sessions={}
for path in a.folder.rglob('*.json'):
    try: d=json.loads(path.read_text(encoding='utf-8-sig'))
    except (ValueError,UnicodeError): continue
    if not isinstance(d,dict) or d.get('status')!='complete' or d.get('mode')!=a.mode:continue
    if d.get('save_stage') not in (None,'complete'):continue
    sid=d.get('session_id')
    if sid: sessions.setdefault(sid,d)
counts=Counter(d['participant_id'] for d in sessions.values());summary=[];trials=[]
for d in sessions.values():
    common={k:d.get(k) for k in ['participant_id','session_id','mode','condition','program_version','started_at','completed_at']}
    common['duplicate_participant']=counts[d['participant_id']]>1
    common['online_review_required']=d.get('online_review_required',False)
    common['event_count']=len(d.get('events',[]))
    for s in d.get('summary',[]):summary.append({**common,**s})
    for t in d.get('trials',[]):trials.append({**common,**t})
a.out.mkdir(parents=True,exist_ok=True)
for name,rows in [('summary.csv',summary),('trials.csv',trials)]:
    if not rows:continue
    keys=list(dict.fromkeys(k for r in rows for k in r))
    with (a.out/name).open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(rows)
print(f'{len(sessions)} completed {a.mode} sessions; {len(trials)} trials. Duplicate IDs: {[k for k,v in counts.items() if v>1]}')
