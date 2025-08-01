export function initGlideSlider(selector = ".sec5-cards") {
    new Glide(selector, {
        type: "carousel",
        startAt: 0,
        perView: 1,
    }).mount();
}
