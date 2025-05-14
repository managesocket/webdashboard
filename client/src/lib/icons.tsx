import React from 'react';

export const SlotSymbols = {
  Seven: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="game-symbol" viewBox="0 0 200 200" {...props}>
      <g>
        <path d="M17,15 L183,15 C191.8,15 199,22.2 199,31 L199,169 C199,177.8 191.8,185 183,185 L17,185 C8.2,185 1,177.8 1,169 L1,31 C1,22.2 8.2,15 17,15 Z" fill="#8B0000" stroke="#000" strokeWidth="6" />
        <path d="M60,40 L140,40 L110,160 L90,160 Z" fill="none" stroke="#ffffff" strokeWidth="10" />
      </g>
    </svg>
  ),
  
  Diamond: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="game-symbol" viewBox="0 0 200 200" {...props}>
      <g>
        <path d="M100,20 L180,100 L100,180 L20,100 Z" fill="#5DADE2" stroke="#000" strokeWidth="8" />
        <path d="M100,20 L100,180" stroke="#000" strokeWidth="6" />
        <path d="M20,100 L180,100" stroke="#000" strokeWidth="6" />
      </g>
    </svg>
  ),
  
  Cherry: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="game-symbol" viewBox="0 0 200 200" {...props}>
      <g>
        <circle cx="70" cy="120" r="40" fill="#FF0000" stroke="#000" strokeWidth="6" />
        <circle cx="130" cy="120" r="40" fill="#FF0000" stroke="#000" strokeWidth="6" />
        <path d="M70,120 Q100,40 130,120" fill="none" stroke="#006400" strokeWidth="6" />
        <path d="M100,40 L100,10" fill="none" stroke="#006400" strokeWidth="6" />
      </g>
    </svg>
  ),
  
  Bar: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="game-symbol" viewBox="0 0 200 200" {...props}>
      <g>
        <rect x="30" y="50" width="140" height="30" fill="#FFD700" stroke="#000" strokeWidth="6" />
        <rect x="30" y="85" width="140" height="30" fill="#FFD700" stroke="#000" strokeWidth="6" />
        <rect x="30" y="120" width="140" height="30" fill="#FFD700" stroke="#000" strokeWidth="6" />
      </g>
    </svg>
  ),
  
  Lemon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="game-symbol" viewBox="0 0 200 200" {...props}>
      <g>
        <ellipse cx="100" cy="100" rx="70" ry="50" fill="#FFFF00" stroke="#000" strokeWidth="6" />
        <path d="M170,100 Q200,100 170,130" fill="none" stroke="#006400" strokeWidth="6" />
        <path d="M170,100 Q200,100 180,80" fill="none" stroke="#006400" strokeWidth="6" />
      </g>
    </svg>
  ),
  
  Bell: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="game-symbol" viewBox="0 0 200 200" {...props}>
      <g>
        <path d="M100,30 Q140,30 160,100 Q180,170 100,170 Q20,170 40,100 Q60,30 100,30 Z" fill="#FFD700" stroke="#000" strokeWidth="6" />
        <rect x="95" y="15" width="10" height="15" fill="#000" />
        <rect x="90" y="170" width="20" height="15" fill="#000" />
        <ellipse cx="100" cy="190" rx="15" ry="10" fill="#000" />
      </g>
    </svg>
  ),
  
  Melon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="game-symbol" viewBox="0 0 200 200" {...props}>
      <g>
        <path d="M100,30 L190,100 L100,170 L10,100 Z" fill="#FF0000" stroke="#000" strokeWidth="6" />
        <circle cx="100" cy="100" r="50" fill="#FF0000" stroke="#000" strokeWidth="6" />
        <path d="M100,50 L100,150" stroke="#000" strokeWidth="4" />
        <path d="M50,100 L150,100" stroke="#000" strokeWidth="4" />
        <circle cx="80" cy="80" r="5" fill="#000" />
        <circle cx="120" cy="80" r="5" fill="#000" />
        <circle cx="100" cy="100" r="5" fill="#000" />
        <circle cx="80" cy="120" r="5" fill="#000" />
        <circle cx="120" cy="120" r="5" fill="#000" />
        <path d="M10,100 Q0,120 20,130" fill="none" stroke="#228B22" strokeWidth="6" />
        <path d="M10,100 Q0,80 20,70" fill="none" stroke="#228B22" strokeWidth="6" />
      </g>
    </svg>
  ),
  
  Heart: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="game-symbol" viewBox="0 0 200 200" {...props}>
      <g>
        <path d="M100,180 Q20,110 20,60 Q20,20 60,20 Q90,20 100,50 Q110,20 140,20 Q180,20 180,60 Q180,110 100,180 Z" fill="#FF0000" stroke="#000" strokeWidth="6" />
      </g>
    </svg>
  )
};
