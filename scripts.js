let currentTab = null;

function showTab(tabId, event) {
  const tabContent = document.getElementById(tabId);
  const isActive = tabContent.classList.contains('active');

  // Remove active class from all tab contents and buttons
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

  if (!isActive) {
    tabContent.classList.add('active');
    event.currentTarget.classList.add('active');
    currentTab = tabId;
  } else {
    currentTab = null;
  }

  // ✅ Hide the dropdown menu after selection
  const menu = document.getElementById("dropdownMenu");
  if (menu) {
    menu.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll('.full-section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;

        // Remove class to reset animation
        el.classList.remove('visible');

        // Force reflow to restart animation
        void el.offsetWidth;

        // Re-add class to re-trigger the animation
        el.classList.add('visible');
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(section => observer.observe(section));
});

function toggleMenu() {
  const menu = document.getElementById("dropdownMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
    
    // Also close the dropdown menu after click (optional)
    const menu = document.getElementById("dropdownMenu");
    menu.style.display = "none";
  }
}

let cart = [];

function toggleCart() {
 const cartElement = document.getElementById("cart");
  const isVisible = cartElement.style.display === "block";
  cartElement.style.display = isVisible ? "none" : "block";

  if (!isVisible && cart.length > 0) {
    document.getElementById("paypal-button-container").innerHTML = ""; // clear old button
    renderPayPalButton(); // render new button
  }
}

function updateCartDisplay() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalDisplay = document.getElementById("cart-total");

  cartItemsContainer.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.name}</strong> - $${item.price.toFixed(2)} x ${item.quantity}
      <button onclick="removeFromCart(${index})">Remove</button>
    `;
    cartItemsContainer.appendChild(li);
  });

  cartTotalDisplay.innerText = `Total: $${total.toFixed(2)}`;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartDisplay();
}

function addToCart(item) {
  const existing = cart.find(c => c.name === item.name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  updateCartDisplay();
}

document.querySelectorAll(".add-to-cart").forEach(button => {
  button.addEventListener("click", function () {
    const artCard = this.closest(".art");
    const name = artCard.getAttribute("data-name");
    const price = parseFloat(artCard.getAttribute("data-price"));
    const image = artCard.getAttribute("data-image");

    addToCart({ name, price, image });
    toggleCart(); // Optional: open cart after adding
  });
});

function checkoutCart() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  // Basic redirect or form logic (or integrate PayPal/Stripe later)
  alert("Checkout not yet implemented. You could now send this to PayPal or EmailJS.");
}

function renderPayPalButton() {
  if (typeof paypal === 'undefined') {
    console.error("PayPal SDK not loaded.");
    return;
  }

  paypal.Buttons({
createOrder: function (data, actions) {
  const items = cart.map(item => ({
    name: item.name,
    unit_amount: {
      currency_code: "USD",
      value: item.price.toFixed(2)
    },
    quantity: item.quantity
  }));

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  console.log("Creating order with items:", items, "total:", total);

  return actions.order.create({
    purchase_units: [{
      amount: {
        currency_code: "USD",
        value: total.toFixed(2),
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: total.toFixed(2)
          }
        }
      },
      items: items
    }]
  });
},


    onApprove: function (data, actions) {
  return actions.order.capture().then(function (details) {
    alert("Transaction completed by " + details.payer.name.given_name);

    // Reduce stock for one-of-a-kind items
    cart.forEach(item => {
      const allArtItems = document.querySelectorAll(".art");
      allArtItems.forEach(art => {
        if (art.getAttribute("data-name") === item.name) {
          let stock = parseInt(art.getAttribute("data-stock"));
          if (stock === 1) {
            art.classList.add("sold-out");
            art.querySelector(".add-to-cart").disabled = true;
            art.querySelector(".add-to-cart").innerText = "Sold Out";

            const buyForm = art.querySelector("form.buy-button");
            if (buyForm) buyForm.remove(); // remove PayPal button
          }
        }
      });
    });

    cart = [];
    updateCartDisplay();
    toggleCart();
  });
},

    onError: function (err) {
      console.error("PayPal Checkout Error:", err);
      alert("Something went wrong during checkout.");
    }
  }).render("#paypal-button-container");
}

document.addEventListener("DOMContentLoaded", () => {
  // Existing observer code here...

  // Check for sold out items on page load
  document.querySelectorAll(".art").forEach(art => {
    const stock = parseInt(art.getAttribute("data-stock"));
    if (stock === 0) {
      art.classList.add("sold-out");

      const addButton = art.querySelector(".add-to-cart");
      if (addButton) {
        addButton.disabled = true;
        addButton.innerText = "Sold Out";
      }

      const buyForm = art.querySelector("form.buy-button");
      if (buyForm) {
        buyForm.remove();
      }
    }
  });
});
