       const YOOMONEY_WALLET = '4100117768437490';
       const WEB3FORMS_KEY = '613c201d-64a1-4421-bccc-ebe70d066dc4';
       let cart = JSON.parse(localStorage.getItem('darkynx_cart') || '[]');
       let currentModalId = null;
       let currentSize = null;

       function saveCart(){ localStorage.setItem('darkynx_cart', JSON.stringify(cart)); }

       const container = document.getElementById('catalog-container');
       products.forEach(p => {
           const card = document.createElement('div');
           card.className = 'product-card';
           const wrapper = document.createElement('div');
           wrapper.className = 'img-wrapper';
           const img = document.createElement('img');
           img.src = p.img;
           img.alt = p.name;
           img.loading = 'lazy';
           wrapper.appendChild(img);

           card.appendChild(wrapper);

           card.innerHTML += `
               <div class="product-title">${p.name}</div>
               <div class="product-desc">${p.desc}</div>
               <div class="product-price">${p.price} ₽</div>
               <button class="add-to-cart-btn" onclick="event.stopPropagation(); quickAdd(${p.id})">Купить</button>
           `;

           card.addEventListener('mousemove', (e) => {
               const rect = card.getBoundingClientRect();
               const x = e.clientX - rect.left;
               const y = e.clientY - rect.top;
               const rotateX = ((y - rect.height / 2) / rect.height) * -12;
               const rotateY = ((x - rect.width / 2) / rect.width) * 12;
               wrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
           });
           card.addEventListener('mouseleave', () => {
               wrapper.style.transform = 'rotateX(0deg) rotateY(0deg)';
           });
           card.onclick = () => openModal(p.id);
           container.appendChild(card);
       });

       function openModal(id) {
           currentModalId = id;
           const p = products.find(x => x.id === id);
           document.getElementById('modal-img').src = p.img;
           document.getElementById('modal-title').innerText = p.name;
           document.getElementById('modal-desc').innerText = p.desc;
           document.getElementById('modal-price').innerText = p.price + ' ₽';
           document.getElementById('productModal').style.display = 'flex';
           currentSize = null;
           document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
       }
       function closeModal() { document.getElementById('productModal').style.display = 'none'; }
       function selectSize(btn) {
           document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
           btn.classList.add('active');
           currentSize = btn.innerText;
       }
       function showNotification(text) {
           document.getElementById('notif-text').innerText = text;
           document.getElementById('notification').style.display = 'flex';
       }
       function closeNotification() { document.getElementById('notification').style.display = 'none'; }

       function addFromModal() {
           if(!currentSize) { showNotification("Выберите размер!"); return; }
           const p = products.find(x => x.id === currentModalId);
           addToCart(p, currentSize);
           closeModal();
           showNotification(`"${p.name}" (${currentSize}) добавлен в корзину`);
       }

       function quickAdd(id) { openModal(id); }

       function addToCart(product, size) {
           const existing = cart.find(i => i.id === product.id && i.size === size);
           if (existing) existing.qty += 1;
           else cart.push({ id: product.id, name: product.name, price: product.price, img: product.img, size, qty: 1 });
           saveCart();
           updateCartUI();
       }

       function changeQty(index, delta) {
           cart[index].qty += delta;
           if (cart[index].qty <= 0) cart.splice(index, 1);
           saveCart();
           updateCartUI();
       }

       function removeFromCart(index) {
           cart.splice(index, 1);
           saveCart();
           updateCartUI();
       }

       function updateCartUI() {
           const count = cart.reduce((s, i) => s + i.qty, 0);
           document.getElementById('header-cart-count').innerText = count;
           document.getElementById('float-cart-count').innerText = count;

           const container = document.getElementById('cart-items');
           container.innerHTML = '';
           let total = 0;
           cart.forEach((item, index) => {
               total += item.price * item.qty;
               container.innerHTML += `
                   <div class="cart-item">
                       <div>
                           <div class="cart-item-name">${item.name}</div>
                           <div class="cart-item-size">Размер: ${item.size}</div>
                           <div class="qty-controls">
                               <button onclick="changeQty(${index},-1)">−</button>
                               <span>${item.qty}</span>
                               <button onclick="changeQty(${index},1)">+</button>
                           </div>
                       </div>
                       <div style="display:flex;align-items:center;gap:10px;">
                           <div class="cart-item-price">${item.price * item.qty} ₽</div>
                           <button class="remove-item" onclick="removeFromCart(${index})">✕</button>
                       </div>
                   </div>
               `;
           });
           document.getElementById('total-price').innerText = total;
       }
       function toggleCart() { document.getElementById('cartSidebar').classList.toggle('open'); }

       document.addEventListener('keydown', (e) => {
           if (e.key === 'Escape') {
               closeModal();
               closeNotification();
               document.getElementById('cartSidebar').classList.remove('open');
           }
       });

       updateCartUI();

       /* ================== ОФОРМЛЕНИЕ ЗАКАЗА (СДЭК + валидация) ================== */

       const CDEK_POINTS = [
           { city: 'Москва', name: 'ПВЗ Тверская', address: 'г. Москва, ул. Тверская, д. 10', code: 'MSK-101', hours: '09:00–21:00' },
           { city: 'Москва', name: 'Постамат Арбат', address: 'г. Москва, ул. Арбат, д. 25', code: 'MSK-202', hours: 'круглосуточно' },
           { city: 'Санкт-Петербург', name: 'ПВЗ Невский', address: 'г. Санкт-Петербург, Невский пр-т, д. 50', code: 'SPB-101', hours: '10:00–20:00' },
           { city: 'Санкт-Петербург', name: 'Постамат Лиговский', address: 'г. Санкт-Петербург, Лиговский пр-т, д. 30', code: 'SPB-202', hours: 'круглосуточно' },
           { city: 'Самара', name: 'ПВЗ Московское шоссе', address: 'г. Самара, ул. Московское шоссе, д. 4, ПВЗ № 123', code: 'SAM-123', hours: '09:00–20:00' },
           { city: 'Самара', name: 'Постамат Ленина', address: 'г. Самара, ул. Ленина, д. 15', code: 'SAM-215', hours: 'круглосуточно' },
           { city: 'Новосибирск', name: 'ПВЗ Красный проспект', address: 'г. Новосибирск, Красный проспект, д. 30', code: 'NSK-101', hours: '09:00–21:00' },
           { city: 'Екатеринбург', name: 'ПВЗ Малышева', address: 'г. Екатеринбург, ул. Малышева, д. 12', code: 'EKB-101', hours: '10:00–20:00' },
           { city: 'Казань', name: 'ПВЗ Баумана', address: 'г. Казань, ул. Баумана, д. 20', code: 'KZN-101', hours: '09:00–21:00' },
           { city: 'Нижний Новгород', name: 'ПВЗ Большая Покровская', address: 'г. Нижний Новгород, ул. Большая Покровская, д. 18', code: 'NN-101', hours: '09:00–20:00' },
           { city: 'Челябинск', name: 'ПВЗ Кировка', address: 'г. Челябинск, ул. Кирова, д. 10', code: 'CHL-101', hours: '09:00–21:00' },
           { city: 'Омск', name: 'ПВЗ Ленина', address: 'г. Омск, ул. Ленина, д. 25', code: 'OMS-101', hours: '09:00–20:00' },
           { city: 'Ростов-на-Дону', name: 'ПВЗ Большая Садовая', address: 'г. Ростов-на-Дону, ул. Большая Садовая, д. 45', code: 'RND-101', hours: '09:00–21:00' },
           { city: 'Уфа', name: 'ПВЗ Ленина', address: 'г. Уфа, ул. Ленина, д. 12', code: 'UFA-101', hours: '09:00–20:00' },
           { city: 'Красноярск', name: 'ПВЗ Мира', address: 'г. Красноярск, пр-т Мира, д. 30', code: 'KRS-101', hours: '09:00–21:00' },
           { city: 'Воронеж', name: 'ПВЗ Плехановская', address: 'г. Воронеж, ул. Плехановская, д. 10', code: 'VRN-101', hours: '09:00–20:00' },
           { city: 'Пермь', name: 'ПВЗ Ленина', address: 'г. Пермь, ул. Ленина, д. 15', code: 'PRM-101', hours: '09:00–20:00' },
           { city: 'Волгоград', name: 'ПВЗ Мира', address: 'г. Волгоград, пр-т Мира, д. 8', code: 'VLG-101', hours: '09:00–20:00' },
           { city: 'Краснодар', name: 'ПВЗ Красная', address: 'г. Краснодар, ул. Красная, д. 50', code: 'KRD-101', hours: '09:00–21:00' },
           { city: 'Саратов', name: 'ПВЗ Московская', address: 'г. Саратов, ул. Московская, д. 20', code: 'SRT-101', hours: '09:00–20:00' },
           { city: 'Тюмень', name: 'ПВЗ Республики', address: 'г. Тюмень, ул. Республики, д. 10', code: 'TMN-101', hours: '09:00–20:00' },
           { city: 'Тольятти', name: 'ПВЗ Революционная', address: 'г. Тольятти, ул. Революционная, д. 25', code: 'TLT-101', hours: '09:00–20:00' },
           { city: 'Ижевск', name: 'ПВЗ Пушкинская', address: 'г. Ижевск, ул. Пушкинская, д. 14', code: 'IZH-101', hours: '09:00–20:00' },
           { city: 'Барнаул', name: 'ПВЗ Ленина', address: 'г. Барнаул, пр-т Ленина, д. 30', code: 'BRN-101', hours: '09:00–20:00' },
           { city: 'Иркутск', name: 'ПВЗ Ленина', address: 'г. Иркутск, ул. Ленина, д. 10', code: 'IRK-101', hours: '09:00–20:00' },
           { city: 'Хабаровск', name: 'ПВЗ Муравьёва-Амурского', address: 'г. Хабаровск, ул. Муравьёва-Амурского, д. 15', code: 'KHB-101', hours: '09:00–20:00' },
           { city: 'Владивосток', name: 'ПВЗ Светланская', address: 'г. Владивосток, ул. Светланская, д. 20', code: 'VLD-101', hours: '09:00–20:00' }
       ];

       function toggleDeliveryBlocks() {
           const isCdek = document.querySelector('input[name="cf-delivery"]:checked').value === 'cdek';
           document.getElementById('cf-cdek-block').style.display = isCdek ? 'block' : 'none';
           document.getElementById('cf-post-block').style.display = isCdek ? 'none' : 'block';
       }

       let selectedCdekPoint = null;

       const cfCity = document.getElementById('cf-city');
       const cfFindBtn = document.getElementById('cf-find-btn');

       cfCity.addEventListener('input', () => {
           cfFindBtn.disabled = cfCity.value.trim().length === 0;
       });

       function cdekResetPoint() {
           selectedCdekPoint = null;
           document.getElementById('cf-point-info').style.display = 'none';
       }

       function openCdekPicker() {
           const city = cfCity.value.trim();
           document.getElementById('cdek-city-label').textContent = city;
           const list = document.getElementById('cdek-list');
           const empty = document.getElementById('cdek-empty');
           const matches = CDEK_POINTS.filter(p => p.city.toLowerCase() === city.toLowerCase());

           list.innerHTML = '';
           if (matches.length === 0) {
               empty.innerHTML = `
                   <p style="margin-bottom:14px;">Готовых пунктов СДЭК для города «${city}» нет в списке. Впишите адрес пункта выдачи или постамата вручную:</p>
                   <input type="text" id="manual-cdek-address" placeholder="Например: ул. Ленина, д. 5, ПВЗ СДЭК" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:10px;">
                   <button type="button" class="modal-add-btn" onclick="confirmManualCdek()">Подтвердить адрес</button>
               `;
               empty.style.display = 'block';
           } else {
               empty.style.display = 'none';
               matches.forEach((p, i) => {
                   const card = document.createElement('div');
                   card.className = 'cdek-point-card';
                   card.innerHTML = `<b>${p.name}</b><br>${p.address}<br><span class="cdek-point-code">Режим работы: ${p.hours} · Код: ${p.code}</span>`;
                   card.onclick = () => selectCdekPoint(matches[i]);
                   list.appendChild(card);
               });
           }
           document.getElementById('cdekOverlay').style.display = 'flex';
       }
       function closeCdekPicker() { document.getElementById('cdekOverlay').style.display = 'none'; }

       function selectCdekPoint(point) {
           selectedCdekPoint = point;
           document.getElementById('cf-point-address').textContent = point.address;
           document.getElementById('cf-point-code').textContent = point.code;
           document.getElementById('cf-point-info').style.display = 'block';
           closeCdekPicker();
       }

       function confirmManualCdek() {
           const addr = document.getElementById('manual-cdek-address').value.trim();
           if (!addr) { showNotification('Введите адрес пункта выдачи'); return; }
           const city = cfCity.value.trim();
           selectCdekPoint({ address: `${city}, ${addr}`, code: 'РУЧНОЙ ВВОД' });
       }

       const cfPhone = document.getElementById('cf-phone');
       cfPhone.addEventListener('input', () => {
           let digits = cfPhone.value.replace(/\D/g, '').replace(/^7/, '').replace(/^8/, '').slice(0, 10);
           let masked = '+7';
           if (digits.length > 0) masked += ' (' + digits.slice(0, 3);
           if (digits.length >= 3) masked += ') ' + digits.slice(3, 6);
           if (digits.length >= 6) masked += '-' + digits.slice(6, 8);
           if (digits.length >= 8) masked += '-' + digits.slice(8, 10);
           cfPhone.value = masked;
       });

       document.getElementById('openCheckoutBtn').addEventListener('click', () => {
           if (cart.length === 0) { showNotification('Корзина пуста'); return; }
           document.getElementById('cf-error').style.display = 'none';
           document.getElementById('cf-success').style.display = 'none';
           document.getElementById('checkoutForm').style.display = 'block';
           document.getElementById('checkoutOverlay').style.display = 'flex';
       });
       function closeCheckout() { document.getElementById('checkoutOverlay').style.display = 'none'; }

       let orderSubmitting = false;

       document.getElementById('checkoutForm').addEventListener('submit', (e) => {
           e.preventDefault();
           if (orderSubmitting) return;

           const fio = document.getElementById('cf-fio').value.trim();
           const phoneDigits = cfPhone.value.replace(/\D/g, '');
           const agree1 = document.getElementById('cf-agree1').checked;
           const agree2 = document.getElementById('cf-agree2').checked;
           const deliveryMethod = document.querySelector('input[name="cf-delivery"]:checked').value;

           const emailVal = document.getElementById('cf-email').value.trim();
           const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
           const telegramVal = document.getElementById('cf-telegram').value.trim();
           const telegramOk = telegramVal.length > 1;

           const baseFields = [
               { el: document.getElementById('cf-fio'), ok: fio.split(/\s+/).filter(Boolean).length >= 2 },
               { el: cfPhone, ok: phoneDigits.length >= 11 },
               { el: document.getElementById('cf-email'), ok: emailOk },
               { el: document.getElementById('cf-telegram'), ok: telegramOk }
           ];

           let deliveryOk = false;
           let deliveryInfo = {};

           if (deliveryMethod === 'cdek') {
               const indexVal = document.getElementById('cf-index').value.trim();
               const city = cfCity.value.trim();
               baseFields.push(
                   { el: document.getElementById('cf-index'), ok: /^\d{6}$/.test(indexVal) },
                   { el: cfCity, ok: city.length > 0 }
               );
               deliveryOk = baseFields.slice(4).every(f => f.ok) && !!selectedCdekPoint;
               deliveryInfo = { method: 'СДЭК', index: indexVal, city, point: selectedCdekPoint };
           } else {
               const postIndex = document.getElementById('cf-post-index').value.trim();
               const postCity = document.getElementById('cf-post-city').value.trim();
               const postAddress = document.getElementById('cf-post-address').value.trim();
               baseFields.push(
                   { el: document.getElementById('cf-post-index'), ok: /^\d{6}$/.test(postIndex) },
                   { el: document.getElementById('cf-post-city'), ok: postCity.length > 0 },
                   { el: document.getElementById('cf-post-address'), ok: postAddress.length > 0 }
               );
               deliveryOk = baseFields.slice(4).every(f => f.ok);
               deliveryInfo = { method: 'Почта России', index: postIndex, city: postCity, address: postAddress };
           }

           let allOk = baseFields.slice(0, 4).every(f => f.ok) && deliveryOk && agree1 && agree2;

           baseFields.forEach(f => f.el.classList.toggle('cf-invalid', !f.ok));

           const errEl = document.getElementById('cf-error');
           if (!allOk) {
               errEl.style.display = 'block';
               return;
           }
           errEl.style.display = 'none';
           orderSubmitting = true;
           const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
           if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Отправка...'; }

           const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
           const orderText = cart.map(i => `${i.name} (${i.size}) x${i.qty}`).join(', ');
           const payType = document.querySelector('input[name="cf-pay"]:checked').value;
           const email = document.getElementById('cf-email').value.trim();
           const telegram = document.getElementById('cf-telegram').value.trim();
           const comment = document.getElementById('cf-comment').value.trim();

           // уникальный номер заказа: дата + случайные символы, например DKX-20260819-4F7A
           const orderId = 'DKX-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).slice(2,6).toUpperCase();

           let deliveryText = '';
           if (deliveryInfo.method === 'СДЭК') {
               deliveryText = `СДЭК, ${deliveryInfo.city}, ${deliveryInfo.point.address} (код ${deliveryInfo.point.code})`;
           } else {
               deliveryText = `Почта России, ${deliveryInfo.city}, индекс ${deliveryInfo.index}, ${deliveryInfo.address}`;
           }

           const itemsText = cart.map(i => `${i.name} (${i.size}) x${i.qty}`).join('\n');

           const messageBody =
       `Номер заказа: ${orderId}

       Получатель: ${fio}
       Телефон: ${cfPhone.value}
       Email: ${email}
       Telegram: ${telegram}

       Товары:
       ${itemsText}

       Итого: ${total} ₽
       Оплата: ${payType === 'online' ? 'онлайн' : 'наложенный платёж'}
       Доставка: ${deliveryText}
       Комментарий: ${comment || '—'}`;

           fetch('https://api.web3forms.com/submit', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   access_key: WEB3FORMS_KEY,
                   subject: `Новый заказ DARKYNX ${orderId} — ${total} ₽`,
                   from_name: 'DARKYNX Shop',
                   email: email || 'no-reply@darkynx.shop',
                   message: messageBody
               })
           })
           .then(r => r.json())
           .then(data => {
               if (!data.success) console.error('Web3Forms error:', data);
           })
           .catch(err => console.error('Ошибка отправки заказа:', err))
           .finally(() => {
               orderSubmitting = false;
               if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Оплатить заказ'; }
           });

           // очищаем корзину сразу после успешного оформления, чтобы не заказали повторно
           cart = [];
           saveCart();
           updateCartUI();

           document.getElementById('checkoutForm').style.display = 'none';
           document.getElementById('cf-success').style.display = 'block';
           document.getElementById('cf-success').insertAdjacentHTML('afterbegin',
               `<p style="font-weight:700;font-size:16px;margin-bottom:10px;">Номер вашего заказа: ${orderId}</p>`);

           const link = document.getElementById('checkout-link');
           if (payType === 'online') {
               // уникальный label = номер заказа, чтобы потом искать оплату в истории кошелька ЮMoney по этому заказу
               link.href = `https://yoomoney.ru/quickpay/confirm.xml?receiver=${YOOMONEY_WALLET}&quickpay-form=shop&targets=${encodeURIComponent('Заказ DARKYNX ' + orderId + ': ' + orderText)}&sum=${total}&label=${encodeURIComponent(orderId)}`;
               link.textContent = 'Перейти к оплате на ЮMoney';
               link.style.display = 'block';
           } else {
               link.style.display = 'none';
               document.getElementById('cf-success').insertAdjacentHTML('beforeend',
                   '<p style="margin-top:10px;">Оплата наложенным платежом — оплатите заказ курьеру/в пункте СДЭК при получении.</p>');
           }
       });

       document.addEventListener('keydown', (e) => {
           if (e.key === 'Escape') { closeCheckout(); closeCdekPicker(); }
       });
