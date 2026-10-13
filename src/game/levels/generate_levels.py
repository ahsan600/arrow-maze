import random, math, re, os, sys

DIRS = {'UP':(-1,0),'DOWN':(1,0),'LEFT':(0,-1),'RIGHT':(0,1)}
NEI = [(-1,0),(1,0),(0,-1),(0,1)]
OUT = '/mnt/user-data/outputs/levels'

ANIMALS = {
'Fish': (["..###...",".#####.#","##.#####",".#####.#","..###..."], ['#f97316','#3b82f6','#fbbf24','#06b6d4']),
'Cat': (["#.....#","##...##","#######","#.###.#","#######",".#####."], ['#f59e0b','#ef4444','#8b5cf6','#10b981']),
'Rabbit': ([".#..#.",".#..#.",".#..#.",".####.","######","#.##.#","######",".####."], ['#ec4899','#8b5cf6','#3b82f6','#f472b6']),
'Pig': (["##.....##","#########","#########","##.###.##","#########","..#####..","..##.##.."], ['#ec4899','#f472b6','#ef4444','#f59e0b']),
'Penguin': (["..###..",".#####.",".#.#.#.",".#####.","#######","#######","#######",".#####.",".##.##."], ['#3b82f6','#8b5cf6','#f59e0b','#10b981']),
'Owl': (["#.....#","##...##","#######","#.###.#","###.###","#######",".#####.",".#####.","..#.#.."], ['#f59e0b','#ef4444','#10b981','#8b5cf6']),
'Duck': (["..###...",".#####..","##.####.",".#####..","..###...","..####..",".#######","########",".######."], ['#fbbf24','#f97316','#3b82f6','#10b981']),
'Turtle': (["...#####....","..#######.##",".#########.#",".#########..","..##....##..","..##....##.."], ['#10b981','#14b8a6','#f59e0b','#3b82f6']),
'Butterfly': (["##...#...##","####.#.####","###########","####.#.####",".###.#.###.","..#..#..#.."], ['#8b5cf6','#ec4899','#3b82f6','#f59e0b']),
'Dog': (["#.#####.#","##.###.##","##.#.#.##","#########",".#######.","..##.##..","...###..."], ['#f59e0b','#ef4444','#3b82f6','#10b981']),
'Crab': (["##.......##","#.#.....#.#","..#######..",".##.###.##.",".#########.",".#.#.#.#.#."], ['#ef4444','#f97316','#f59e0b','#ec4899']),
'Fox': (["#.......#","##.....##","###...###","#########","#.#####.#",".#######.","..#####..","...###...","....#...."], ['#f97316','#ef4444','#f59e0b','#8b5cf6']),
'Octopus': (["..#####..",".#######.","#########","##.###.##","#########",".#######.",".#.#.#.#.",".#.#.#.#."], ['#8b5cf6','#ec4899','#3b82f6','#14b8a6']),
'Bear': (["##.....##","##.....##",".#######.","#########","##.###.##","#########","####.####",".#######.","..#####.."], ['#b45309','#f59e0b','#ef4444','#10b981']),
'Whale': (["..#.........","..#......#.#",".#########.#",".#.########.",".#########..","..#######..."], ['#3b82f6','#06b6d4','#8b5cf6','#10b981']),
'Elephant': (["..########..",".##########.","###.########","##..########","##..########","#...########","#...###..###","....###..###"], ['#64748b','#3b82f6','#8b5cf6','#14b8a6']),
'Snake': (["#########","#########",".......##",".......##","#########","#########","##.......","##.......","#########","#########"], ['#10b981','#84cc16','#f59e0b','#14b8a6']),
'Spider': (["##.......##",".##.....##.","..#######..","###########","..#######..",".##.....##.","##.......##"], ['#ef4444','#8b5cf6','#f59e0b','#3b82f6']),
'Lion': (["..#######..",".#########.","###########","###.###.###","###########","####.#.####","###########",".#########.","..#######.."], ['#f59e0b','#ef4444','#f97316','#10b981']),
}
BASE = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']

def shape_cells(rows):
    return {(r,c) for r,row in enumerate(rows) for c,ch in enumerate(row) if ch=='#'}

def ray(h,d,rows,cols):
    dr,dc = DIRS[d]; r,c = h[0]+dr,h[1]+dc; out=[]
    while 0<=r<rows and 0<=c<cols:
        out.append((r,c)); r+=dr; c+=dc
    return out

def peel(R0, rows, cols, rng, maxLen, beta, tph=3):
    R=set(R0); arrows=[]; owner={}
    while R:
        cands=[]
        for h in R:
            for d,(dr,dc) in DIRS.items():
                prev=(h[0]-dr,h[1]-dc)
                if prev not in R: continue
                rc=ray(h,d,rows,cols)
                if any(x in R for x in rc): continue
                crossed={owner[x] for x in rc if x in owner}
                for _ in range(tph):
                    k=rng.randint(2,maxLen)
                    path=[h,prev]; seen={h,prev}
                    while len(path)<k:
                        r,c=path[-1]
                        opts=[(r+a,c+b) for a,b in NEI if (r+a,c+b) in R and (r+a,c+b) not in seen]
                        if not opts: break
                        n=rng.choice(opts); path.append(n); seen.add(n)
                    path.reverse(); ps=set(path); ok=True
                    for p in path:
                        for a,b in NEI:
                            q=(p[0]+a,p[1]+b)
                            if q in R and q not in ps:
                                if not any(((q[0]+x,q[1]+y) in R and (q[0]+x,q[1]+y) not in ps) for x,y in NEI):
                                    ok=False;break
                        if not ok:break
                    if ok: cands.append((path,d,len(crossed)))
        if not cands: return None
        w=[math.exp(beta*c) for _,_,c in cands]
        path,d,_=rng.choices(cands,w)[0]
        idx=len(arrows); arrows.append({'cells':path,'direction':d})
        for p in path: owner[p]=idx; R.discard(p)
    return arrows

def analyze(arrows, rows, cols):
    n=len(arrows); own={}
    for i,a in enumerate(arrows):
        for c in a['cells']:
            assert c not in own, 'overlap'
            own[c]=i
    bl=[]
    for a in arrows:
        bl.append({own[x] for x in ray(a['cells'][-1],a['direction'],rows,cols) if x in own})
    removed=[]; rs=set(); prog=True
    while prog:
        prog=False
        for i in range(n):
            if i not in rs and bl[i]<=rs: rs.add(i); removed.append(i); prog=True
    solvable = len(rs)==n
    depth={}
    for i in removed: depth[i]=1+max([depth[b] for b in bl[i]],default=0)
    free=sum(1 for b in bl if not b)
    return dict(solvable=solvable, depth=max(depth.values(),default=0), free=free,
                n=n, edges=sum(len(b) for b in bl))

def validate(arrows, rows, cols):
    for a in arrows:
        cs=a['cells']; assert len(cs)>=2
        for (r,c) in cs: assert 0<=r<rows and 0<=c<cols
        for p,q in zip(cs,cs[1:]): assert abs(p[0]-q[0])+abs(p[1]-q[1])==1
        d=(cs[-1][0]-cs[-2][0], cs[-1][1]-cs[-2][1])
        assert DIRS[a['direction']]==d, 'direction mismatch'
    return True

def blob(rows, cols, N, rng):
    cells={(rng.randrange(rows),rng.randrange(cols))}
    while len(cells)<N:
        if rng.random()<0.08:
            cells.add((rng.randrange(rows),rng.randrange(cols))); continue
        fr=[(r+a,c+b) for r,c in cells for a,b in NEI
            if 0<=r+a<rows and 0<=c+b<cols and (r+a,c+b) not in cells]
        if not fr: break
        cells.add(rng.choice(fr))
    return cells

def color_arrows(arrows, palette, rng):
    own={}
    for i,a in enumerate(arrows):
        for c in a['cells']: own[c]=i
    adj=[set() for _ in arrows]
    for (r,c),i in own.items():
        for a,b in NEI:
            j=own.get((r+a,c+b))
            if j is not None and j!=i: adj[i].add(j)
    col={}; use={p:0 for p in palette}
    order=list(range(len(arrows))); rng.shuffle(order)
    for i in order:
        bad={col[j] for j in adj[i] if j in col}
        opts=[p for p in palette if p not in bad] or palette
        m=min(use[p] for p in opts)
        ch=rng.choice([p for p in opts if use[p]==m]); col[i]=ch; use[ch]+=1
    return [col[i] for i in range(len(arrows))]

def size_for(L):
    s=4
    for t,v in [(7,5),(18,6),(28,7),(40,8),(52,9),(64,10),(76,11),(88,12)]:
        if L>=t: s=v
    return s

def make_level(L, animal, rng, K=60):
    best=None
    if animal:
        name,(shape,pal)=animal
        rows,cols=len(shape),len(shape[0]); R=shape_cells(shape)
        maxLen=min(5,3+L//40); beta=0.6; palette=pal
    else:
        s=size_for(L); rows=cols=s
        maxLen=min(8,3+L//14); beta=min(0.55,0.05+L*0.006); palette=BASE
    target=1.5+L*0.11
    got=0; tries=0
    while got<K and tries<K*30:
        tries+=1
        if not animal:
            N=max(4 if L<2 else 5 if L<4 else 6,round(rows*cols*(0.32+0.0045*L)))
            R=blob(rows,cols,N,rng)
        arrows=peel(R,rows,cols,rng,maxLen,beta)
        if arrows is None: continue
        st=analyze(arrows,rows,cols)
        if not st['solvable']: continue
        if not animal and st['n']<(2 if L<5 else 3 if L<12 else 4 if L<30 else 6): continue
        got+=1
        score = (st['depth']*10 - st['free']*4 + st['n']) if animal else -abs(st['depth']-target)*10 - st['free']*0.5
        if best is None or score>best[0]: best=(score,arrows,st)
    if best is None: raise RuntimeError(f'level {L} failed')
    _,arrows,st=best
    rng.shuffle(arrows)
    cols_=color_arrows(arrows,palette,rng)
    for a,c in zip(arrows,cols_): a['color']=c
    return dict(id=L,rows=rows,cols=cols,arrows=arrows,stats=st,animal=animal[0] if animal else None)

def build():
    order=sorted(ANIMALS.items(), key=lambda kv: len(shape_cells(kv[1][0])))
    alvls=list(range(10,101,5)); amap={L:order[i] for i,L in enumerate(alvls)}
    levels=[]
    for L in range(1,101):
        rng=random.Random(L*7919+13)
        levels.append(make_level(L, amap.get(L), rng))
    return levels

def to_ts(levels_chunk, a, b):
    o=["import { Level } from '../../types/game.types';","",f"export const levels{a}_{b}: Level[] = ["]
    for k,lv in enumerate(levels_chunk):
        if lv['animal']: o.append(f"  // Animal level: {lv['animal']}")
        o.append("  {"); o.append(f"    id: {lv['id']},")
        o.append(f"    gridSize: {{ rows: {lv['rows']}, cols: {lv['cols']} }},")
        o.append("    arrows: [")
        for i,ar in enumerate(lv['arrows']):
            cells=', '.join(f"{{r: {r}, c: {c}}}" for r,c in ar['cells'])
            comma=',' if i<len(lv['arrows'])-1 else ''
            o.append(f"      {{ id: '{i+1}', cells: [{cells}], direction: '{ar['direction']}', color: '{ar['color']}', active: true, cleared: false }}{comma}")
        o.append("    ]"); o.append("  }"+(',' if k<len(levels_chunk)-1 else ''))
    o.append("];"); return '\n'.join(o)+'\n'

if __name__=='__main__':
    levels=build()
    for lv in levels: validate(lv['arrows'],lv['rows'],lv['cols'])
    idx=["import { Level } from '../../types/game.types';"]; names=[]
    for a in range(1,100,10):
        b=a+9; open(f'{OUT}/levels{a}_{b}.ts','w').write(to_ts(levels[a-1:b],a,b))
        idx.append(f"import {{ levels{a}_{b} }} from './levels{a}_{b}';"); names.append(f'...levels{a}_{b}')
    idx+=["","export const allLevels: Level[] = [","  "+",\n  ".join(names),"];",""]
    open(f'{OUT}/index.ts','w').write('\n'.join(idx))
    print('L  grid   arrows depth free animal')
    for lv in levels:
        s=lv['stats']; print(f"{lv['id']:3} {lv['rows']}x{lv['cols']:<3} {s['n']:4} {s['depth']:5} {s['free']:4}  {lv['animal'] or ''}")
