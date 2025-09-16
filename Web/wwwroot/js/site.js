// Nested dropdowns for Bootstrap 5 (robust: guards non-Element targets)
(function () {
    const isDesktop = () => window.matchMedia('(min-width: 992px)').matches;
    const asEl = (t) => (t instanceof Element ? t : (t && t.parentElement) || null);

    // Click to toggle the nested menu
    document.addEventListener('click', function (e) {
        const target = asEl(e.target);
        if (!target) return;

        const toggle = target.closest('.dropdown-submenu > .dropdown-toggle');
        if (!toggle) return;

        e.preventDefault();
        e.stopPropagation(); // keep parent dropdown open

        const submenu = toggle.nextElementSibling;
        if (!submenu) return;

        // Close other open submenus within the same parent menu
        const parentMenu = toggle.closest('.dropdown-menu');
        parentMenu?.querySelectorAll(':scope > .dropdown-submenu .dropdown-menu.show')
            .forEach(m => { if (m !== submenu) m.classList.remove('show'); });

        const nowOpen = !submenu.classList.contains('show');
        submenu.classList.toggle('show', nowOpen);
        toggle.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
    });

    // Hover support on desktop (optional)
    document.addEventListener('pointerenter', function (e) {
        if (!isDesktop()) return;
        const target = asEl(e.target);
        if (!target) return;

        const item = target.closest('.dropdown-submenu');
        if (!item) return;

        const submenu = item.querySelector(':scope > .dropdown-menu');
        if (submenu) submenu.classList.add('show');
    }, true);

    document.addEventListener('pointerleave', function (e) {
        if (!isDesktop()) return;
        const target = asEl(e.target);
        if (!target) return;

        const item = target.closest('.dropdown-submenu');
        if (!item) return;

        const submenu = item.querySelector(':scope > .dropdown-menu');
        if (submenu) submenu.classList.remove('show');
    }, true);

    // When the top-level dropdown hides, close any open submenus inside it
    document.addEventListener('hide.bs.dropdown', function (e) {
        e.target.querySelectorAll?.('.dropdown-menu.show')
            .forEach(m => m.classList.remove('show'));
    });
})();
