const API = "https://api-gateway-xbk2.onrender.com";
const INVENTORY_API = "https://inventory-service-3z9j.onrender.com/inventory";

async function loadProductsPage() {
    const productsDiv = document.getElementById("products");
    productsDiv.innerHTML = "";

    const products = await fetch(`${API}/products`).then(r => r.json());

    for (let p of products) {

        // Get the latest quantity from inventory
        let qty = await fetch(`${INVENTORY_API}/qty/${p.id}`)
            .then(r => r.text())
            .then(txt => parseInt(txt))
            .catch(() => 0);

        const inStock = qty > 0;

        productsDiv.innerHTML += `
            <div class="product">
                <img src="${p.image}">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <p><strong>$${p.price}</strong></p>

                <span class="stock" style="color:${inStock ? 'green' : 'red'};">
                    ${inStock ? `In Stock (${qty})` : "Out of Stock"}
                </span>

                <div class="qty-box">
                    <button onclick="changeQty(${p.id}, -1)" ${!inStock ? "disabled" : ""}>−</button>
                    <span id="qty-${p.id}" class="qty-num">1</span>
                    <button onclick="changeQty(${p.id}, 1)" ${!inStock ? "disabled" : ""}>+</button>
                </div>

                <button onclick="addToCart(${p.id})"
                    ${!inStock ? "disabled" : ""}
                    style="${!inStock ? 'background:gray; cursor:not-allowed;' : ''}">
                    Add to Cart
                </button>
            </div>
        `;
    }
}


function changeQty(id, change) {
    let el = document.getElementById(`qty-${id}`);
    let qty = parseInt(el.textContent);
    qty = Math.max(1, qty + change);
    el.textContent = qty;
}

async function addToCart(id) {

    const stock = await fetch(`${INVENTORY_API}/qty/${id}`)
        .then(r => r.json())
        .catch(() => 0);

    if (stock <= 0) {
        alert("Sorry, this product is OUT OF STOCK!");
        return;
    }

    let qty = parseInt(document.getElementById(`qty-${id}`).textContent);

    if (qty > stock) {
        alert(`Only ${stock} left in stock!`);
        return;
    }

    fetch(`${API}/cart/${id}/${qty}`, { method: "POST" })
        .then(() => alert("Added to cart!"));
}


function loadCartPage() {
    fetch(`${API}/cart`)
        .then(r => r.json())
        .then(async items => {
            let cartDiv = document.getElementById("cart");
            cartDiv.innerHTML = "";

            for (let item of items) {
                const product = await fetch(`${API}/products/${item.productId}`).then(r => r.json());
                const total = product.price * item.quantity;

                cartDiv.innerHTML += `
                    <div class="cart-item">
                        <img src="${product.image}" class="cart-img">

                        <div>
                            <h3>${product.name}</h3>
                            <p><strong>Price:</strong> $${product.price}</p>
                            <p><strong>Quantity:</strong> ${item.quantity}</p>
                            <p><strong>Total:</strong> $${total.toFixed(2)}</p>

                            <button onclick="removeFromCart(${item.productId})">Remove</button>
                        </div>
                    </div>
                `;
            }
        });
}

function removeFromCart(id) {
    fetch(`${API}/cart/${id}`, { method: "DELETE" })
        .then(() => loadCartPage());
}

function checkout() {
    fetch(`${API}/cart/checkout`, { method: "POST" })
        .then(() => {
            alert("Checkout complete! 🚚");
            clearCart();
            loadCartPage();
        });
}

function clearCart() {
    fetch(`${API}/cart`, { method: "DELETE" })
        .then(() => {
            alert("Cart has been cleared!");
            loadCartPage();
        });
}

