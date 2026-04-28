import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Badge, Button, Card, DataTable, Segmented } from '@zhiyu/ui';
import { games, titleCase, tracks } from '../data';

export function CoursePage({ route, navigate, loggedIn }: { route: string; navigate: (path: string) => void; loggedIn: boolean }) {
  const activeTrack = route.split('/')[2];
  if (route.split('/').length > 4) return <LessonPage navigate={navigate} />;
  return <section className="page stack"><h1>Courses</h1><Card><h2>My learning</h2><p>{loggedIn ? 'Continue Stage 1 Chapter 1, then review your wrong set.' : 'Browse themes now; login unlocks free trials and progress sync.'}</p></Card><div className="track-grid">{tracks.map((track) => <button key={track} className="track-card glass-porcelain" onClick={() => navigate(`/courses/${track}`)}><strong>{titleCase(track)}</strong><small>12 stages · Stage 1-3 all chapters free</small>{activeTrack === track ? <Badge>Open</Badge> : null}</button>)}</div>{activeTrack ? <StageMap track={activeTrack} navigate={navigate} /> : null}</section>;
}

function StageMap({ track, navigate }: { track: string; navigate: (path: string) => void }) {
  return <Card><h2>{titleCase(track)} pathway</h2><div className="stage-grid">{Array.from({ length: 12 }, (_, index) => <button key={index} onClick={() => navigate(`/courses/${track}/stage-${index + 1}`)}><span>{index + 1}</span><small>{index < 3 ? 'free stage' : 'locked or owned'}</small></button>)}</div><DataTable rows={Array.from({ length: 12 }, (_, index) => ({ id: index + 1, chapter: `Chapter ${index + 1}`, state: 'stage 1-3 free, stage 4+ permission required' }))} columns={['chapter', 'state']} /></Card>;
}

function LessonPage({ navigate }: { navigate: (path: string) => void }) {
  return <section className="page stack immersive-lesson"><Badge>Lesson</Badge><h1>Pinyin introduction</h1><progress max={6} value={2} /><Card><p className="learning-sentence">你好，欢迎来到知语。</p><p>ni3 hao3, huan1 ying2 lai2 dao4 zhi1 yu3</p></Card><div className="sticky-actions"><Button variant="secondary">Check</Button><Button onClick={() => navigate('/courses')}>Next</Button></div></section>;
}

export function GamePage({ route, navigate, loggedIn }: { route: string; navigate: (path: string) => void; loggedIn: boolean }) {
  const parts = route.split('/');
  const slug = parts[2];
  if (parts[3] === 'play') return <GameCanvas slug={slug ?? 'hanzi-ninja'} navigate={navigate} />;
  if (parts[3] === 'result') return <GameResult slug={slug ?? 'hanzi-ninja'} navigate={navigate} />;
  if (slug) return <GameDetail slug={slug} navigate={navigate} loggedIn={loggedIn} />;
  return <section className="page stack"><h1>Games</h1><p>12 MVP games are active, 60 seconds per round, no leaderboard or coin reward in v1.</p><div className="game-grid">{games.map((game) => <button key={game} className="game-card glass-porcelain" onClick={() => navigate(`/games/${game}`)}><strong>{titleCase(game)}</strong><small>60s · wrong answers enter SRS</small><Badge tone="success">Active</Badge></button>)}</div></section>;
}

function GameDetail({ slug, navigate, loggedIn }: { slug: string; navigate: (path: string) => void; loggedIn: boolean }) {
  const [track, setTrack] = useState('hsk');
  return <section className="page stack"><div className="game-cover"><Badge>Landscape required</Badge><h1>{titleCase(slug)}</h1><p>Choose a course-linked word pack and play a fixed 60 second round.</p></div><Segmented label="Word pack track" items={tracks} value={track} onChange={setTrack} /><Card><h2>Access</h2><p>{loggedIn ? `${track} word packs are filtered by owned stage permissions.` : 'Login to play all 12 games and unlock course-permission word packs.'}</p><Button onClick={() => navigate(`/games/${slug}/play`)}>Start 60s round</Button></Card><DataTable rows={['tap', 'swipe', 'keyboard', 'pause'].map((input) => ({ id: input, input, fallback: 'button available' }))} columns={['input', 'fallback']} /></section>;
}

function GameCanvas({ slug, navigate }: { slug: string; navigate: (path: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let frame = 0;
    let raf = 0;
    const draw = () => {
      frame += 1;
      ctx.fillStyle = '#171512';
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = '#DCE8E2';
      ctx.fillRect(40, 40, 1200, 640);
      ctx.fillStyle = '#2F6F5E';
      ctx.beginPath();
      ctx.arc(160 + (frame % 900), 240 + Math.sin(frame / 20) * 80, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1F2421';
      ctx.font = '48px sans-serif';
      ctx.fillText('汉', 145 + (frame % 900), 258 + Math.sin(frame / 20) * 80);
      ctx.font = '28px sans-serif';
      ctx.fillText(`${titleCase(slug)} · 60s · Score 120`, 72, 96);
      if (!paused) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [slug, paused]);
  return <section className="game-play"><canvas ref={canvasRef} width="1280" height="720" aria-label={`${slug} game canvas`} /><div className="game-hud glass-ink"><Button variant="ink" onClick={() => setPaused(!paused)}>{paused ? <Play size={18} /> : <Pause size={18} />}{paused ? 'Resume' : 'Pause'}</Button><Button variant="ink">Tutorial</Button><Button variant="ink" onClick={() => navigate(`/games/${slug}/result`)}>Exit</Button></div></section>;
}

function GameResult({ slug, navigate }: { slug: string; navigate: (path: string) => void }) {
  return <section className="page stack"><h1>{titleCase(slug)} result</h1><Card><h2>Score 120</h2><p>Correct 80% · 5 review words added to SRS.</p><div className="row"><Button onClick={() => navigate(`/games/${slug}/play`)}><RotateCcw size={18} />Play again</Button><Button variant="secondary" onClick={() => navigate(`/games/${slug}`)}>Change word pack</Button><Button variant="ghost" onClick={() => navigate('/games')}>Back to games</Button></div></Card></section>;
}