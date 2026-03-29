In laboratorio-tesouraria-bancos project, which is already pushed to github and deployed on Vercel, I want to create a Remotion animation component to add to my hero section. This react component will elegantly coexist with the text which is already there (find a way) and replace the image which is also already there.

The React component you wiil create will be at src/components/HeroAnimation.tsx that:
- Is a Remotion composition (1920x1080, 30fps, 10 seconds, looping)
- Shows A dark gradient background shifting slowly from deep navy to charcoal. An animated yield curve draws itself smoothly from left to right — a clean upward-sloping line in golden/amber color with small dots at each vertex lighting up as the line reaches them. Each dot briefly shows a label like "6M", "1Y", "2Y", "5Y", "10Y" that fades after a moment. Once the curve is complete, it gently pulses. The title "Laboratório de Tesouraria" types in letter by letter at the center in a modern sans-serif white font, followed by "Cenários · Curva de Juros · Precificação · Carregamento" appearing word by word below in a smaller muted font.
- Uses Tailwind for styling
- Export it so I can use it with @remotion/player

Then create a HeroSection component at src/components/HeroSection.tsx 
that uses <Player> from @remotion/player to render the animation 
as a full-width hero with autoplay, loop, and muted.

Do NOT set up a separate Remotion project. This lives inside 
my existing Next.js app.
```

