let state = {
  data: [],
  groupBy: {
    menu: ["preview", "occasion", "colors", "elements", "all", "id"],
    selected: "preview",
  },
};

async function loadData() {
  initializeLayout();
  const data = await d3.json("data/greeting-cards.json");

  // copy the data into the state variable, add a unique ID for each object and add the filters
  setState({
    data: data.map((d, i) => ({
      ...d,
      id: d.id,
    })),
  });

  setupScrollama();
  filterCard();
}

function setState(nextState) {
  state = Object.assign({}, state, nextState);
}

function setupScrollama() {
  const scroller = scrollama();

  function handleResize() {
    // update height of step elements
    const stepH = Math.floor(window.innerHeight);
    d3.selectAll(".step").style("height", stepH + "px");

    const figureHeight = window.innerHeight;
    d3.select("figure").style("height", figureHeight + "px");

    scroller.resize();
  }

  function handleStepEnter(response) {
    console.log(response);

    const step = response.element.getAttribute("data-step");
    state.groupBy.selected = step;

    d3.select("#chart-container").selectAll("*").remove();

    if (step === "1") {
      state.groupBy.selected = "preview";
      previewImg();
    } else if (step === "2") {
      state.groupBy.selected = "occasion";
      groupOccasion();
    } else if (step === "3") {
      state.groupBy.selected = "colors";
      groupOccasionColor();
    } else if (step === "4") {
      state.groupBy.selected = "elements";
      groupOccasionElement();
    } else if (step === "5") {
      state.groupBy.selected = "all";
      groupAll();
    }
  }

  // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  // 2. setup the scroller passing options this will also initialize trigger observations
  // 3. bind scrollama event handlers (this can be chained like below)
  handleResize();
  scroller
    .setup({
      step: "#scrolly article .step",
      offset: 0.33,
      debug: false,
    })
    .onStepEnter(handleStepEnter);

  window.addEventListener("resize", handleResize);
}

// sets up before data loads
function initializeLayout() {
  d3.select("figure").append("div").attr("id", "chart-container");
}

// extract colors from images using Vibrant.js and sort them by hue
async function extractAndSortColors(cards) {
  const imgPaths = cards.map(
    (card) => `assets/download_cards/cardImgDownload/${card.id}.jpg`
  );
  const colorPromises = imgPaths.map((imgPath) =>
    Vibrant.from(imgPath)
      .getPalette()
      .catch((err) => {
        console.error("Error extracting palette:", err);
        return null;
      })
  );

  const palettes = await Promise.all(colorPromises);
  const results = palettes.map((palette, index) => {
    const card = cards[index];
    let colorGroup = "gray";
    if (
      palette &&
      (palette.Vibrant || palette.DarkVibrant || palette.LightVibrant)
    ) {
      const vibrantColor =
        palette.Vibrant || palette.DarkVibrant || palette.LightVibrant;
      const color = d3.hsl(vibrantColor.getHex());
      if (color.h >= 330 || color.h < 30) {
        colorGroup = "red";
      } else if (color.h >= 30 && color.h < 90) {
        colorGroup = "orange";
      } else if (color.h >= 90 && color.h < 150) {
        colorGroup = "yellow";
      } else if (color.h >= 150 && color.h < 210) {
        colorGroup = "green";
      } else if (color.h >= 210 && color.h < 270) {
        colorGroup = "cyan";
      } else if (color.h >= 270 && color.h < 330) {
        colorGroup = "blue";
      } else {
        colorGroup = "purple";
      }
      return { color, card, colorGroup };
    } else {
      return { color: d3.hsl("#cccccc"), card, colorGroup: "gray" }; // Fallback color
    }
  });

  const colorOrder = [
    "red",
    "orange",
    "yellow",
    "green",
    "cyan",
    "blue",
    "purple",
    "gray",
  ];
  results.sort(
    (a, b) =>
      colorOrder.indexOf(a.colorGroup) - colorOrder.indexOf(b.colorGroup)
  );
  return results;
}

// Sort occasions by number of cards and put "Other" at the end
function sortOccasions(occasions) {
  return Array.from(occasions).sort((a, b) => {
    if (a[0] === "Other") return 1;
    if (b[0] === "Other") return -1;
    return b[1].length - a[1].length;
  });
}

//ensures that the function is not called too frequently
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// display all images preview grid on screen
function previewImg() {
  const grid = d3
    .select("#chart-container")
    .style("padding", "0")
    .append("div");

  const shuffledCards = d3.shuffle(state.data);

  shuffledCards.forEach((card, index) => {
    const img = grid
      .append("img")
      .attr("src", card.img_preview)
      .attr("width", 72)
      .attr("height", 72)
      .style("position", "absolute");

    const getRandomPosition = () => {
      let x, y;
      do {
        x = Math.random() * window.innerWidth;
        y = Math.random() * window.innerHeight;
      } while (
        x > window.innerWidth / 2 - 300 &&
        x < window.innerWidth / 2 + 300 &&
        y > window.innerHeight / 2 - 200 &&
        y < window.innerHeight / 2 + 200
      );
      return { x: x - 36, y: y - 36 }; // Adjust position to center of the image
    };

    const { x: randomX, y: randomY } = getRandomPosition();
    img.style("transform", `translate(${randomX}px, ${randomY}px)`);

    // Move the image to a new random position every 10 seconds
    setInterval(() => {
      newRandom = Math.random(-20, 20);
      img
        .transition()
        .duration(1000)
        .style(
          "transform",
          `translate(${randomX + newRandom}px, ${randomY + newRandom}px)`
        );
    });
  });
}

//------------------------------Main Charts------------------------------//
function groupOccasion() {
  const occasions = d3.group(state.data, (d) => d.occasion);
  const sortedOccasions = sortOccasions(occasions);

  sortedOccasions.forEach(([key, value]) => {
    const occasionContainer = d3
      .select("#chart-container")
      .style("padding", "40px")
      .append("div")
      .attr("class", "occasion");

    const groupTitle = occasionContainer
      .append("div")
      .attr("class", "group-title");
    groupTitle.append("h3").text(key);
    groupTitle.append("text").text(value.length + " cards");

    const cards = occasionContainer.append("div").attr("class", "row");
    value.forEach((card, index) => {
      const img = cards
        .append("img")
        .attr("src", card.img_preview)
        .attr("width", 5)
        .attr("height", 48)
        .style("transition", "width 0.3s ease");

      img.on("mouseover", function () {
        const originalWidth = this.naturalWidth;
        const originalHeight = this.naturalHeight;
        const newWidth = (48 / originalHeight) * originalWidth;
        d3.select(this).attr("width", newWidth);
      });

      img.on("mouseout", function () {
        d3.select(this).attr("width", 5);
      });

      img.on("click", function () {
        showCardModal(card);
      });
    });

    scaleUpCard();
  });
}

// Group data by occasion but show color from vibrant.js instead of images
async function groupOccasionColor() {
  const occasions = d3.group(state.data, (d) => d.occasion);
  const sortedOccasions = sortOccasions(occasions);

  for (const [key, value] of sortedOccasions) {
    const occasionContainer = d3
      .select("#chart-container")
      .append("div")
      .attr("class", "occasion");

    const groupTitle = occasionContainer
      .append("div")
      .attr("class", "group-title");
    groupTitle.append("h3").text(key);
    groupTitle.append("text").text(value.length + " cards");

    const cards = occasionContainer.append("div").attr("class", "row");

    const results = await extractAndSortColors(value);
    results.forEach(({ color, card }) => {
      const swatch = cards
        .append("div")
        .attr("class", "swatch")
        .style("background-color", color.toString())
        .style("width", "5px")
        .style("height", "48px")
        .style("display", "inline-block")
        .style("transition", "width 0.3s ease");

      swatch.on("mouseover", function () {
        d3.select(this)
          .style("width", "80px")
          .style("background-image", `url(${card.img_preview})`)
          .style("background-size", "cover");
      });

      swatch.on("mouseout", function () {
        d3.select(this).style("width", "5px").style("background-image", "none");
      });

      swatch.on("click", function () {
        showCardModal(card);
      });
    });

    scaleUpCard();
  }
}

// Group data by occasion and elements
function groupOccasionElement() {
  const occasions = d3.group(state.data, (d) => d.occasion);
  const sortedOccasions = sortOccasions(occasions);

  sortedOccasions.forEach(([key, value]) => {
    const elements = value.map((card) => card.elements).flat();
    const elementCounts = d3.rollup(
      elements,
      (v) => v.length,
      (d) => d
    );
    const sortedElements = Array.from(elementCounts).sort(
      (a, b) => b[1] - a[1]
    );

    const occasionContainer = d3
      .select("#chart-container")
      .append("div")
      .attr("class", "occasion");

    const groupTitle = occasionContainer
      .append("div")
      .attr("class", "group-title");
    groupTitle.append("h3").text(key);
    groupTitle.append("text").text(value.length + " cards");

    const cards = occasionContainer.append("div").attr("class", "row");

    sortedElements.forEach(([element]) => {
      const elementContainer = cards.append("div").attr("class", "element");

      elementContainer
        .append("svg")
        .style("width", "24px")
        .style("height", "48px")
        .append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .attr("x", -24)
        .attr("y", 20)
        .attr("transform", "rotate(-90)")
        .text(element);

      const elementImgContainer = elementContainer
        .append("div")
        .attr("class", "row");
      value.forEach((card) => {
        if (card.elements.includes(element)) {
          const img = elementImgContainer
            .append("img")
            .attr("src", card.img_preview)
            .attr("width", 2.5)
            .attr("height", 48)
            .style("transition", "width 0.3s ease");

          img.on("mouseover", function () {
            d3.select(this).attr("width", 80);
          });

          img.on("mouseout", function () {
            d3.select(this).attr("width", 2.5);
          });

          img.on("click", function () {
            showCardModal(card);
          });
        }

        scaleUpCard();
      });
    });
  });
}

// Group all data by occasion and elements
async function groupAll() {
  const occasions = d3.group(state.data, (d) => d.occasion);
  const sortedOccasions = sortOccasions(occasions);

  for (const [key, value] of sortedOccasions) {
    const elements = value.map((card) => card.elements).flat();
    const uniqueElements = [...new Set(elements)];
    const occasionContainer = d3
      .select("#chart-container")
      .append("div")
      .attr("class", "occasion");

    const groupTitle = occasionContainer
      .append("div")
      .attr("class", "group-title");
    groupTitle.append("h3").text(key);
    groupTitle.append("text").text(value.length + " cards");

    const cards = occasionContainer.append("div").attr("class", "row");

    for (const element of uniqueElements) {
      const elementContainer = cards.append("div").attr("class", "element");

      elementContainer
        .append("svg")
        .style("width", "24px")
        .style("height", "48px")
        .append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .attr("x", -24)
        .attr("y", 20)
        .attr("transform", "rotate(-90)")
        .text(element);

      const elementImgContainer = elementContainer
        .append("div")
        .attr("class", "row");

      const elementCards = value.filter((card) =>
        card.elements.includes(element)
      );
      const results = await extractAndSortColors(elementCards);
      results.forEach(({ color, card }) => {
        const swatch = elementImgContainer
          .append("div")
          .attr("class", "swatch2")
          .style("background-color", color.toString())
          .style("width", "2.5px")
          .style("height", "48px")
          .style("display", "inline-block")
          .style("transition", "width 0.3s ease");

        swatch.on("mouseover", function () {
          d3.select(this)
            .style("width", "80px")
            .style("background-image", `url(${card.img_preview})`)
            .style("background-size", "cover");
        });

        swatch.on("mouseout", function () {
          d3.select(this)
            .style("width", "2.5px")
            .style("background-image", "none");
        });

        swatch.on("click", function () {
          showCardModal(card);
        });

        scaleUpCard();
      });
    }
  }
}
//------------------------------Main Charts------------------------------//

// scale cards size up when click on occasion
function scaleUpCard() {
  d3.selectAll(".occasion").on("click", function () {
    d3.select(this)
      .style("height", "200px")
      .style("overflow", "auto")
      .style("display", "flex")
      .style("align-items", "center");
    d3.select(this).select(".group-title h3").style("font-size", "24px");
    d3.select(this)
      .select(".row")
      .style("transform", "scale(4)")
      .style("transform-origin", "center left");

    // Add a close button
    const closeButton = d3
      .select(this)
      .append("div")
      .attr("class", "close-button")
      .text("╳")
      .style("position", "absolute")
      .style("top", "10px")
      .style("right", "10px")
      .style("padding", "5px")
      .style("cursor", "pointer")
      .style("z-index", "1000");

    closeButton.on("click", function (event) {
      event.stopPropagation();
      d3.select(this.parentNode)
        .style("height", null)
        .style("overflow", "hidden");
      d3.select(this.parentNode)
        .select(".group-title h3")
        .style("font-size", "16px");
      d3.select(this.parentNode).select(".row").style("transform", "scale(1)");
      d3.select(this).remove();
    });

    // Close the scaled-up card when clicking anywhere on the screen
    d3.select("body").on("click", function (event) {
      event.stopPropagation();
      if (!event.target.closest(".occasion")) {
        d3.select(this).style("height", null);
        d3.selectAll(".occasion .group-title h3").style("font-size", "16px");
        d3.selectAll(".occasion .row").style("transform", "scale(1)");
        d3.selectAll(".close-button").remove();
      } else {
        const clickedOccasion = event.target.closest(".occasion");
        d3.selectAll(".occasion").each(function () {
          if (this !== clickedOccasion) {
            d3.select(this).style("height", null);
            d3.select(this)
              .select(".group-title h3")
              .style("font-size", "16px");
            d3.select(this).select(".row").style("transform", "scale(1)");
            d3.select(this).select(".close-button").remove();
          }
        });
      }
    });
  });
}

// show the cards in popup modal when clicked on the image
async function showCardModal(card) {
  // Remove any existing modal
  d3.select(".modal").remove();

  // Create the modal
  const modal = d3.select("body").append("div").attr("class", "modal");
  modal.html(`
    <div class="modal-content">
      <img src="${card.img_large}" width="400">
      <div class="modal-text">
        <div>
          <span>Ocassion:</span>
          <h2 style="transform: scale(0.8); text-align: left;">${
            card.occasion
          }</h2>
        </div>
        <div>
          <span>Element:</span>
          <h3>${card.elements.join(", ")}</h3>
        </div>
        <div>
          <span>Vibrant Color:</span>
          <div class="color-palette"></div>
        </div>
      </div>
      <span class="close">╳</span>
    </div>
  `);
  modal.style("display", "block");

  // Extract and display colors
  const results = await extractAndSortColors([card]);
  const colorPalette = d3.select(".color-palette");
  results.forEach(({ color, colorGroup }) => {
    const colorDiv = colorPalette
      .append("div")
      .style("background-color", color.toString())
      .style("width", "300px")
      .style("height", "24px")
      .style("display", "inline-block")
      .attr("title", colorGroup);
  });

  // Close the modal when the close button is clicked
  const span = document.querySelector(".close");
  span.onclick = function (event) {
    event.stopPropagation();
    modal.style("display", "none");
  };

  // Close the modal when clicking outside of the modal content
  window.onclick = function (event) {
    event.stopPropagation().style("height", "48px").style("overflow", "hidden");
    if (event.target == modal.node()) {
      modal.style("display", "none");
    }
  };
}

let selectedOccasion = null;
let selectedElement = null;
let selectedColor = null;
let colorResults = [];

// Combine filters to select both occasion and element
async function filterCard() {
  // Clear existing filter containers
  d3.select("#occasion-filter").selectAll("*").remove();
  d3.select("#element-filter").selectAll("*").remove();
  d3.select("#color-filter").selectAll("*").remove();
  d3.select("#reset").selectAll("*").remove();

  const occasionFilterContainer = d3
    .select("#occasion-filter")
    .append("div")
    .attr("class", "filter-container");
  const elementFilterContainer = d3
    .select("#element-filter")
    .append("div")
    .attr("class", "filter-container");
  const colorFilterContainer = d3
    .select("#color-filter")
    .append("div")
    .attr("class", "filter-container");

  const occasions = d3.group(state.data, (d) => d.occasion);
  const elements = new Set(state.data.flatMap((card) => card.elements));

  // Create buttons for each occasion
  const sortedOccasions = Array.from(occasions.keys()).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  sortedOccasions.forEach((occasion) => {
    occasionFilterContainer
      .append("button")
      .attr("class", "occasion-button")
      .text(occasion)
      .on("click", function () {
        if (selectedOccasion === occasion) {
          selectedOccasion = null;
          d3.select(this).style("background-color", null);
        } else {
          selectedOccasion = occasion;
          d3.selectAll(".occasion-button").style("background-color", null);
          d3.selectAll(".occasion-button").style(
            "color",
            "rgba(35, 55, 36, 0.5)"
          );
          d3.selectAll(".occasion-button").style(
            "border",
            "1px solid rgba(35, 55, 36, 0.25)"
          );
          d3.select(this).style("background-color", "#182619");
          d3.select(this).style("color", "white");
        }
        updateResults();
      });
  });

  // Create buttons for each element
  elements.forEach((element) => {
    elementFilterContainer
      .append("button")
      .attr("class", "element-button")
      .text(element)
      .on("click", function () {
        if (selectedElement === element) {
          selectedElement = null;
          d3.select(this).style("background-color", null);
        } else {
          selectedElement = element;
          d3.selectAll(".element-button").style("background-color", null);
          d3.selectAll(".element-button").style(
            "color",
            "rgba(35, 55, 36, 0.5)"
          );
          d3.selectAll(".element-button").style(
            "border",
            "1px solid rgba(35, 55, 36, 0.25)"
          );
          d3.select(this).style("background-color", "#182619");
          d3.select(this).style("color", "white");
        }
        updateResults();
      });
  });

  // Extract colors and create color filter buttons
  colorResults = await extractAndSortColors(state.data);

  const colorGroups = {
    red: [],
    orange: [],
    yellow: [],
    green: [],
    cyan: [],
    blue: [],
    purple: [],
    gray: [],
  };

  // Group cards by color
  colorResults.forEach(({ card, colorGroup }) => {
    if (colorGroups[colorGroup]) {
      colorGroups[colorGroup].push(card);
    }
  });

  // Create buttons for each color group
  Object.keys(colorGroups).forEach((color) => {
    colorFilterContainer
      .append("button")
      .attr("class", "color-button")
      .text(color)
      .on("click", function () {
        if (selectedColor === color) {
          selectedColor = null;
          d3.select(this).style("background-color", null);
        } else {
          selectedColor = color;
          d3.selectAll(".color-button").style("background-color", null);
          d3.selectAll(".color-button").style("color", "rgba(35, 55, 36, 0.5)");
          d3.selectAll(".color-button").style(
            "border",
            "1px solid rgba(35, 55, 36, 0.25)"
          );
          d3.select(this).style("background-color", "#182619");
          d3.select(this).style("color", "white");
        }
        updateResults();
      });
  });

  // Add a clear button to reset filters
  d3.select("#reset")
    .append("button")
    .text("↩︎ Reset")
    .on("click", function () {
      selectedOccasion = null;
      selectedElement = null;
      selectedColor = null;
      d3.selectAll("#result img").remove();
      d3.selectAll(".filtered-cards p").remove();
      d3.selectAll(".occasion-button, .element-button, .color-button")
        .style("background-color", null)
        .style("color", "#182619")
        .style("border", "1px solid #182619");
    });
}

// Function to update results based on selected filters
function updateResults() {
  d3.select("#result").selectAll("*").remove();

  let filteredCards = state.data;
  if (selectedOccasion) {
    filteredCards = filteredCards.filter(
      (card) => card.occasion === selectedOccasion
    );
  }
  if (selectedElement) {
    filteredCards = filteredCards.filter((card) =>
      card.elements.includes(selectedElement)
    );
  }
  if (selectedColor) {
    filteredCards = filteredCards.filter((card) => {
      const result = colorResults.find((r) => r.card.id === card.id);
      return result && result.colorGroup === selectedColor;
    });
  }

  // Display the filtered cards
  const container = d3
    .select("#result")
    .append("div")
    .attr("class", "filtered-cards");
  if (filteredCards.length > 0) {
    filteredCards.forEach((card) => {
      const img = container
        .append("img")
        .attr("src", card.img_preview)
        .attr("height", 200)
        .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)");

      img.on("click", function () {
        showCardModal(card);
      });

      img.on("mouseover", function () {
        const originalWidth = this.naturalWidth;
        const originalHeight = this.naturalHeight;
        const newWidth = (200 / originalHeight) * originalWidth;
        d3.select(this).attr("width", newWidth);
      });

      img.on("mouseout", function () {
        d3.select(this).attr("width", imgWidth);
      });

      // Calculate width to fit all images in the container
      const containerWidth = d3
        .select("#result")
        .node()
        .getBoundingClientRect().width;
      const numImages = filteredCards.length;
      const imgWidth = containerWidth / numImages;
      img.attr("width", Math.min(imgWidth, 300));
    });
  } else {
    container.append("p").text("No cards match the selected filters.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  filterCard();
});
