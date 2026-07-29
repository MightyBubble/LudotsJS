const colors = require('tailwindcss/colors');

// 现代编辑器暗色主题 —— 色阶反转方案：浅色语义（-50/-100/-200 底、-700/-800/-900 文字）
// 映射到对应暗部色阶，全部组件代码零改动即全局换肤。
const invert = (h) => ({ ...h, 50: h[950], 100: h[900], 200: h[800], 300: h[700], 600: h[400], 700: h[300], 800: h[200], 900: h[100], 950: h[50] });

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			white: '#121216',
  			slate: {
  				...colors.slate,
  				50: '#0a0a0d',
  				100: '#19191f',
  				200: '#27272f',
  				300: '#3e3e4a',
  				400: '#85858f',
  				500: '#9a9aa4',
  				600: '#b1b1bb',
  				700: '#c9c9d2',
  				800: '#dfdfe6',
  				900: '#efeff3',
  				950: '#f8f8fb'
  			},
  			emerald: invert(colors.emerald),
  			green: invert(colors.green),
  			teal: invert(colors.teal),
  			cyan: invert(colors.cyan),
  			sky: invert(colors.sky),
  			blue: invert(colors.blue),
  			indigo: invert(colors.indigo),
  			violet: invert(colors.violet),
  			purple: invert(colors.purple),
  			fuchsia: invert(colors.fuchsia),
  			pink: invert(colors.pink),
  			rose: invert(colors.rose),
  			red: invert(colors.red),
  			orange: invert(colors.orange),
  			amber: invert(colors.amber),
  			yellow: invert(colors.yellow),
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
