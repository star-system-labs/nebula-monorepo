module.exports = {
  purge: ['./src/**/*.vue', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        'nixie': ['NixieOne', 'nixieone'], 
        'dune': ['Dune', 'dune'],
        'spaceage': ['SpaceAge', 'spaceage'],
        'origin': ['OriginTech', 'origintech'],
        'tesla': ['Tesla', 'tesla']
      },
      fontSize: {
        'xxs': ['0.5rem', '0.65rem'] 
      },
      borderWidth: {
        'custom-blue': '2px',
        'red-500': '2px',
      },
      borderColor: {
        'custom-blue': '#0751bf',
        'red-500': '#ff0000',
      },
      backgroundColor: {
        'button-inactive': 'rgba(19, 24, 32, 0.45)',
        'card-blue': '#182233',
        'button': '#131820',
        'button-hover': '#0a0f14',
        'button-active': '#1a2026',
        'timer': '#0751bf',
      },
      textColor: {
        'custom-blue': '#0751bf',
        'custom-blue-inactive': '#0751bf',
        'teal': '#5d9fa5',
        'red-500': '#ff0000',
      },
      textShadow: {
        'custom-blue': '0 0 2px #0751bf',
      },
      minHeight: {
        'content': '400px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.placeholder-blue::placeholder': {
          color: '#0751bf',
        },
      };
      addUtilities(newUtilities, ['responsive', 'hover']);
    },
  ],
}
