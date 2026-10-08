// Only authored fenced examples are formatted; nothing is evaluated or inserted as HTML.
export function CodeExplanation({text}:{text:string}) {
  const pieces=text.split(/(```python\n[\s\S]*?\n```)/g);
  return <div className="code-explanation">{pieces.map((piece,i)=>piece.startsWith('```python\n')?
    <pre className="python-output" key={i}>{piece.slice(10,-4)}</pre>:
    piece.split(/\n\n+/).filter(Boolean).map((paragraph,j)=><p key={`${i}-${j}`}>{paragraph}</p>))}</div>;
}
