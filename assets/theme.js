(function () { if (!("IntersectionObserver" in window)) return; const io = new IntersectionObserver((entries) => { for (const e of entries) { if (e.isIntersecting) { e.target.classList.add("hh-reveal--shown"); io.unobserve(e.target); } } }, { rootMargin: "0px 0px -8% 0px", threshold: 0.04 }); document.querySelectorAll(".hh-reveal").forEach((el) => io.observe(el)); })();
const cart = { data: null, listeners: new Set(), async refresh() { try { const r = await fetch("/cart.js", { headers: { Accept: "application/json" } }); this.data = await r.json(); this.listeners.forEach((fn) => fn(this.data)); } catch (e) {} return this.data; }, subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); } };
window.Helio = Object.freeze({ cart }); cart.refresh();
class HhCartDrawer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<div class="hh-cart-drawer__scrim" data-close></div><aside class="hh-cart-drawer__panel"><header class="hh-cart-drawer__head"><span class="hh-eyebrow">Your edit</span><button data-close class="hh-link">close</button></header><ul class="hh-cart-drawer__items"></ul><footer class="hh-cart-drawer__foot"><div style="display:flex;justify-content:space-between;"><span class="hh-eyebrow">Subtotal</span><strong class="hh-h3" data-subtotal>—</strong></div><a href="/checkout" class="hh-btn hh-btn--solid" style="justify-content:center;">Checkout</a></footer></aside>`;
    this.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => this.close()));
    this.unsubscribe = cart.subscribe((c) => this.render(c));
    if (cart.data) this.render(cart.data);
    document.addEventListener("helio:open-cart", () => this.open());
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && this.classList.contains("is-open")) this.close(); });
  }
  open() { this.classList.add("is-open"); document.body.style.overflow = "hidden"; }
  close() { this.classList.remove("is-open"); document.body.style.overflow = ""; }
  render(c) {
    if (!c) return;
    const list = this.querySelector(".hh-cart-drawer__items");
    if (c.item_count === 0) { list.innerHTML = `<li style="padding:1rem;color:var(--hh-ink-mute);">Empty. <a class="hh-link" href="/collections/all">Explore the range</a></li>`; }
    else {
      list.innerHTML = c.items.map((i) => `<li class="hh-cart-drawer__item" data-key="${i.key}">${i.image ? `<img src="${i.image}" alt="">` : ""}<div><a href="${i.url}" style="font-family:var(--hh-serif);font-size:0.95rem;">${i.product_title}</a><small style="display:block;color:var(--hh-ink-mute);font-size:0.75rem;">${i.variant_title === "Default Title" ? "" : i.variant_title}</small><div style="margin-top:0.5rem;display:flex;gap:0.5rem;align-items:center;font-size:0.875rem;"><button data-q="-">−</button><span>${i.quantity}</span><button data-q="+">+</button><button data-q="0" style="margin-left:auto;text-decoration:underline;color:var(--hh-ink-mute);font-size:0.75rem;">remove</button></div></div><strong style="font-family:var(--hh-serif);">${(i.line_price / 100).toFixed(2)}</strong></li>`).join("");
    }
    this.querySelector("[data-subtotal]").textContent = `${(c.total_price / 100).toFixed(2)} ${c.currency}`;
    list.querySelectorAll(".hh-cart-drawer__item").forEach((row) => {
      row.querySelectorAll("button[data-q]").forEach((btn) => {
        btn.addEventListener("click", async () => { const key = row.dataset.key; const current = c.items.find((x) => x.key === key)?.quantity || 0; const op = btn.dataset.q; const qty = op === "0" ? 0 : op === "+" ? current + 1 : current - 1; await fetch("/cart/change.js", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: key, quantity: qty }) }); await cart.refresh(); });
      });
    });
  }
}
customElements.define("hh-cart-drawer", HhCartDrawer);
class HhProductForm extends HTMLElement {
  connectedCallback() {
    const form = this.querySelector("form[action$='/cart/add']"); if (!form) return;
    form.addEventListener("submit", async (e) => { e.preventDefault(); const fd = new FormData(form); const btn = form.querySelector("[type=submit]"); btn?.setAttribute("disabled", "");
      try { const res = await fetch("/cart/add.js", { method: "POST", body: fd, headers: { Accept: "application/json" } }); if (!res.ok) throw await res.json(); await cart.refresh(); document.dispatchEvent(new CustomEvent("helio:open-cart")); } catch (err) { alert(err?.description || err?.message || "Could not add."); } finally { btn?.removeAttribute("disabled"); } });
  }
}
customElements.define("hh-product-form", HhProductForm);
document.addEventListener("click", (e) => { const t = e.target.closest("[data-cart-toggle]"); if (t) { e.preventDefault(); document.dispatchEvent(new CustomEvent("helio:open-cart")); } });
