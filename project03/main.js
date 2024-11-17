// load the data
d3.json('data/greeting-cards.json').then(data => { 
    cards = data;
    console.log(cards);
    previewImg();
    groupOccasion();
    groupOccasionColor();
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
  console.log(occasions);
  occasions.forEach((value, key) => {
      console.log(key, value);

      // Create a div for each occasion
      const occasionContainer = d3.select('#chart').append('div').attr('class', 'occasion');
      
      // Display the occasion name
      occasionContainer.append('h2').text(key);


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

// Group data by occasion but show color form vibrant.js instead of images
function groupOccasionColor() {
  const occasions = d3.group(cards, d => d.occasion);
  occasions.forEach((value, key) => {

      // Create a div for each occasion
      const occasionContainer = d3.select('#chart').append('div').attr('class', 'occasion');
      
      // Display the occasion name
      occasionContainer.append('h2').text(key);

      // Display color of cards in each occasion in row
      const grid = occasionContainer.append('div').attr('class', 'row');
      value.forEach((card, index) => {
          const imgPath = `assets/download_cards/cardImgDownload${card.id}.jpg`;
          Vibrant.from(imgPath).getPalette(function(err, palette) {
        const div = grid.append('div').attr('class', 'swatch');
        div.style.backgroundColor = palette.Vibrant.getHex();
          });
      });
  });
}



// Sample of vibrant
// Vibrant.from('images/VanGogh-OliveTrees.jpg').getPalette(function(err, palette) {
//   for (let swatch in palette) {
//     console.log(swatch, palette[swatch].getHex());
    
//     const div = document.createElement("div");
//     div.className = 'swatch';
//     div.style.backgroundColor = palette[swatch].getHex();
//     let element = document.getElementById("palette_container");
//     element.appendChild(div);
//   }
// });