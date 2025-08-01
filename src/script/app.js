import { productInfo } from "./mockData/productInfo.js";
// helper
import { debounce } from "./utils/debounce.js";
// services
import { initGlideSlider } from "./services/slider.js";
import { isEmailValid, initEmailJS, sendEmail } from "./services/email.js";

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

document.addEventListener('DOMContentLoaded', function() {
  const mainProductContainer = document.querySelector('.sec-4-cards');
  const anotherProductContainer = document.querySelector('.sec-6-cards');

  function createProductCard(product, classOfSection) {
    const activeRatingWidth = (product.rating * 100) / 5;
    return `
      <div class="sec-${classOfSection}-card product-card" data-product-id="${product.id}">
        <p class="badge">${product.category}</p>
        <div class="photo">
          <img src="${product.imgSrc}">
        </div>
        <p class="title">${product.title}</p>
        <div class="info df align-e justify-b">
          <p class="price">
            <span class="full">${product.price}</span>
            <span class="discount">${product.discountPrice}</span>
          </p>
          <div class="rating">
            <span class="default">★★★★★</span>
            <span class="active" style="width: ${activeRatingWidth}%">★★★★★</span>
          </div>
        </div>
        <a href="#" class="buy">Add to cart</a>
      </div>
    `;
  }

  function renderProducts(productContainer, products, classOfSection) {
    products.forEach(product => {
      const productCard = createProductCard(product, classOfSection);

      productContainer.innerHTML += productCard;
    });
  }

  renderProducts(mainProductContainer, productInfo, 4);
  renderProducts(anotherProductContainer, productInfo.slice(5, 9), 6);


  const burgerBtn = document.querySelector('header button.burger');
  const burgerBtnIcons = document.querySelectorAll('header button.burger img');

  burgerBtn.addEventListener('click', function() {
    burgerBtnIcons.forEach((icon) => {
      icon.classList.toggle('hidden');
    });

    document.querySelector('header .mobile-menu .nav').classList.toggle('visible');
  })

  const searchBtn = document.querySelector('header button.search-btn');

  searchBtn.addEventListener('click', function() {
    document.querySelector('header .mobile-menu .features .search').classList.toggle('expanded');
  })

  initGlideSlider();

  const btnIdsToOpenModal = ['sec-8-card-1-btn', 'sec-8-card-2-btn', 'cart-modal-btn'];
  const generalModalWrapper = document.querySelector('.modals-wrapper');
  const closeModalBtns = document.querySelectorAll('.modal-close-btn');

  btnIdsToOpenModal.forEach((btnId) => {
    const btnEl = document.getElementById(btnId);
    const modalId = btnEl.getAttribute('data-modal-id');
    const modalEl = document.getElementById(modalId);

    btnEl.addEventListener('click', function() {
      generalModalWrapper.classList.add('visible');
      modalEl.classList.add('visible');
      document.querySelector('body').classList.add('overflow');

      if (modalId === 'cart-modal') {
        displaySelectedProducts();
      }
    });
  })

  closeModalBtns.forEach((closeBtn) => {
    closeBtn.addEventListener('click', function() {
      generalModalWrapper.classList.remove('visible');
      this.parentElement.classList.remove('visible');
      document.querySelector('body').classList.remove('overflow');
    })
  });

  const loadMoreProductCards = document.getElementById('load-more-cards');
  const productCards = document.querySelectorAll('.sec-4-card');
  let visibleCards = getVisibleCardValue();
  let activeVisibleCards = visibleCards;
  let cardToOpen = visibleCards / 2;

  function getVisibleCardValue() {
    return Array.from(productCards).filter(card => getComputedStyle(card).display !== 'none').length
  }

  window.addEventListener('resize', debounce(() => {
    visibleCards = getVisibleCardValue();
    activeVisibleCards = visibleCards;
    cardToOpen = visibleCards / 2;
  }, 200));

  function showCards() {
    const remainingCards = productInfo.length - activeVisibleCards;
    const cardsToShow = Math.min(cardToOpen, remainingCards);
  
    for (let i = activeVisibleCards; i < activeVisibleCards + cardsToShow && i < productInfo.length; i++) {
      productCards[i].style.display = 'block';
    }
  
    activeVisibleCards += cardsToShow;

    if (activeVisibleCards >= productInfo.length) {
      loadMoreProductCards.querySelector('span').textContent = 'Load Less';
    }
  }

  function hideCards() {
    activeVisibleCards = visibleCards;
  
    for (let i = productInfo.length - 1; i >= visibleCards; i--) {
      productCards[i].style.display = 'none';
    }

    loadMoreProductCards.querySelector('span').textContent = 'Load More';

    const offset = 60;
    const section = document.querySelector('.sec-4');
    const sectionPosition = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: sectionPosition + offset,
      behavior: 'smooth'
    });
  }

  loadMoreProductCards.addEventListener('click', function() {
    if (activeVisibleCards < productInfo.length) {
      showCards();
    } else {
      hideCards();
    }
  });

  initEmailJS(EMAILJS_PUBLIC_KEY);

  const formBtn = document.getElementById('form-submit');
  const emailField = document.getElementById('email-input');
  const notifier = new AWN({
    position: 'top-right',
    maxNotifications: 3
  });

  formBtn.addEventListener("click", function (event) {
      event.preventDefault();

      const currentEmail = emailField.value;

      if (isEmailValid(currentEmail)) {
          sendEmail(currentEmail);
          emailField.value = "";
      } else {
          notifier.alert("Please type correct email address!");
      }
  });
  
  let selectedProducts = JSON.parse(localStorage.getItem('selectedProducts')) || [];
  const allBuyButtons = document.querySelectorAll('.product-card .buy');

  function updateCartValueIndicators() {
    const allSelectedProducts = JSON.parse(localStorage.getItem('selectedProducts')) || [];
    const cartCountElement = document.querySelector('header .features .cart p span');
    cartCountElement.textContent = allSelectedProducts.length;

    allBuyButtons.forEach(buyBtn => {
      const productId = buyBtn.parentElement.getAttribute('data-product-id');
      buyBtn.classList.toggle('active', allSelectedProducts.includes(productId));
    });
  }

  function handleBuyButtonClick(event) {
    event.preventDefault();

    const productId = this.parentElement.getAttribute('data-product-id');
    this.classList.toggle('active');

    if (this.classList.contains('active')) {
      selectedProducts.push(productId);
    } else {
      selectedProducts = selectedProducts.filter(id => id !== productId);
    }

    localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
    updateCartValueIndicators();
  }

  function displaySelectedProducts() {
    const productList = document.querySelector('#cart-modal ul');
    productList.innerHTML = selectedProducts.map(productId => {
      const productName = getProductNameById(productId);
      return `
        <li data-product-id="${productId}">
          <span>${productName}</span>
          <i class="fa-regular fa-circle-xmark fa-lg" style="color: #274c5b;"></i>
        </li>
      `;
    }).join('');

    selectedProducts.forEach(productId => {
      const listItem = productList.querySelector(`li[data-product-id="${productId}"]`);
      listItem.addEventListener('click', () => removeProductFromList(productId));
    });
  }

  function getProductNameById(productId) {
    const product = productInfo.find(p => p.id == productId);
    return product ? product.title : 'Unknown Product';
  }

  function removeProductFromList(productId) {
    selectedProducts = selectedProducts.filter(id => id !== productId);
    localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
    updateCartValueIndicators();
    displaySelectedProducts();
  }

  updateCartValueIndicators();
  allBuyButtons.forEach(buyBtn => {
    buyBtn.addEventListener('click', handleBuyButtonClick);
  });

});