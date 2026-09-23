import base64

with open('public/culturace-ruby.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="rounded">
      <rect width="180" height="180" rx="36" />
    </clipPath>
  </defs>
  <rect width="180" height="180" rx="36" fill="#fffdfa" />
  <g clip-path="url(#rounded)">
    <image href="data:image/png;base64,{b64}" x="5" y="42" width="170" height="96" preserveAspectRatio="xMidYMid meet" />
  </g>
</svg>'''

with open('public/icon.svg', 'w', encoding='utf-8') as out:
    out.write(svg_content)

print('Updated icon.svg')
