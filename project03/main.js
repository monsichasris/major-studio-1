// load the data
d3.json('data/greeting-cards.json').then(data => { 
    cards = data;
    console.log(cards);
    previewImg();
    groupOccasion();
    groupOccasionColor();
    groupOccasionElement()
  });

// Display all images preview grid on screen
function previewImg() {
  const grid = d3.select('figure').append('div').attr('class', 'grid');

  // Shuffle the cards array to display images in random order
  const shuffledCards = d3.shuffle(cards);

  shuffledCards.forEach((card, index) => {
      const img = grid.append('img')
          .attr('src', card.img_preview)
          .attr('width', 48)
          .attr('height', 48)
          .attr('z-index', 0)
          .style('opacity', 0)
          .style('transition', 'opacity 10s');

      // Randomly decide if the image should hold 0 opacity longer
      const holdOpacity = Math.random() < 0.98;
      const delay = holdOpacity ? Math.random() * 10000 : Math.random() * 100;

      // Transition to 100% opacity one by one
      setTimeout(() => {
          img.style('opacity', 1);
      }, delay);
  });

}

// Group data by occasion
function groupOccasion() {
  const occasions = d3.group(cards, d => d.occasion);
  // console.log(occasions);
  occasions.forEach((value, key) => {
      // console.log(key, value);

      // Create a div for each occasion
      const occasionContainer = d3.select('#chart').append('div').attr('class', 'occasion');
      
      // Display the occasion name
      occasionContainer.append('h3').text(key);


      // Display the number of cards in each occasion
      occasionContainer.append('text').text('Number of cards: ' + value.length);


      // Display images of cards in each occasion in row
      const grid = occasionContainer.append('div').attr('class', 'row');
      value.forEach((card, index) => {
          const img = grid.append('img')
          .attr('src', card.img_preview)
          .attr('width', 8)
          .attr('height', 48);
      });

    }
  );
}

// Group data by occasion but show color from vibrant.js instead of images
function groupOccasionColor() {
  const occasions = d3.group(cards, d => d.occasion);
  occasions.forEach((value, key) => {

    // Create a div for each occasion
    const occasionContainer = d3.select('#chart').append('div').attr('class', 'occasion');
    
    // Display the occasion name
    occasionContainer.append('h3').text(key);

    // Display color of cards in each occasion in row
    const grid = occasionContainer.append('div').attr('class', 'row');

    // Extract colors and sort by hue
    const colorPromises = value.map(card => {
      const imgPath = `assets/download_cards/cardImgDownload/${card.id}.jpg`;
      return Vibrant.from(imgPath).getPalette().then(palette => {
      let swatchColor = null;
      if (palette && palette.Vibrant) {
        swatchColor = palette.Vibrant.getHex();
      } else if (palette && palette.DarkVibrant) {
        swatchColor = palette.DarkVibrant.getHex();
      } else if (palette && palette.LightVibrant) {
        swatchColor = palette.LightVibrant.getHex();
      } else if (palette && palette.LightMuted) {
        swatchColor = palette.LightMuted.getHex();
      } else if (palette && palette.DarkMuted) {
        swatchColor = palette.DarkMuted.getHex();
      }
      return { card, swatchColor };
      });
    });

    Promise.all(colorPromises).then(results => {
      results.sort((a, b) => {
      const colorA = d3.hsl(a.swatchColor);
      const colorB = d3.hsl(b.swatchColor);
      return colorA.h - colorB.h;
      });

      results.forEach(({ card, swatchColor }) => {
      const swatchContainer = grid.append('div').attr('class', 'swatch-container');
      const div = swatchContainer.append('div').attr('class', 'swatch');
      div.style('background-color', swatchColor);
      swatchContainer.append('img')
        .attr('src', card.img_preview)
        .attr('width', 8)
        .attr('height', 16);
      });
    });
  });
}

function groupOccasionElement() {
  const occasions = d3.group(
    cards,
    d => d.occasion,
    d => d.elements[0]
  );
  console.log(occasions);
  occasions.forEach((value, key) => {
    const occasionContainer = d3.select('#chart').append('div').attr('class', 'occasion');
    occasionContainer.append('h3').text(key);
    occasionContainer.append('text').text('Number of cards: ' + value.length);

    const occasionRow = occasionContainer.append('div').attr('class', 'row');
    value.forEach((elementValue, elementKey) => {
    const elementContainer = occasionRow.append('div').attr('class', 'element');
    elementContainer.append('text').text(elementKey);

    const elementGrid = elementContainer.append('div').attr('class', 'row');
    elementValue.forEach((card, index) => {
      const img = elementGrid.append('img')
        .attr('src', card.img_preview)
        .attr('width', 8)
        .attr('height', 48);
      });
    });
  });
}