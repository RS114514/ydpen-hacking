#!/usr/bin/env python3
"""看 history.db / wordbook.db 的结构与内容（本机拉回的副本）。

用途：确认扫描结果落盘的字段，从而决定 AiChat 怎么拿「最近扫描的文字」。
"""
import sqlite3
import sys
from pathlib import Path

DEV = Path(__file__).resolve().parent.parent.parent / 'docs' / 'dev'


def dump(db_path, limit=5):
    print('=' * 70)
    print('DB:', db_path.name, '(' + str(db_path.stat().st_size) + ' bytes)')
    con = sqlite3.connect(str(db_path))
    cur = con.cursor()
    tables = [r[0] for r in cur.execute("select name from sqlite_master where type='table'")]
    print('tables:', tables)
    for name in tables:
        cols = [c[1] for c in cur.execute('pragma table_info("%s")' % name)]
        n = cur.execute('select count(*) from "%s"' % name).fetchone()[0]
        print('\n-- table %s: %d rows' % (name, n))
        print('   cols:', cols)
        try:
            rows = list(cur.execute('select * from "%s" order by rowid desc limit %d' % (name, limit)))
        except Exception as e:
            print('   (select failed: %s)' % e)
            continue
        for row in rows:
            # 只打印前若干字符，避免长文本刷屏
            cells = []
            for v in row:
                s = str(v)
                if v is None:
                    s = 'NULL'
                cells.append(s if len(s) <= 120 else s[:117] + '...')
            print('   | ' + ' | '.join(cells))
    con.close()


def main():
    targets = sys.argv[1:]
    if targets:
        for t in targets:
            dump(Path(t))
    else:
        for name in ('history.db', 'wordbook.db'):
            p = DEV / name
            if p.exists():
                dump(p)
            else:
                print('missing:', p)


if __name__ == '__main__':
    main()
