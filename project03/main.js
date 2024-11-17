// load the data
d3.json('data/greeting-cards.json').then(data => { 
    cards = data;
    console.log(cards);
    // analyzeData();
    previewImg();
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
      const delay = holdOpacity ? Math.random() * 10000 : Math.random() * 1000;

      // Transition to 100% opacity one by one
      setTimeout(() => {
          img.style('opacity', 1);
      }, delay);
  });

}