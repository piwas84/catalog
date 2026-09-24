(function () {
    'use strict';

    // ====================== КОНФІГУРАЦІЯ ======================
    var CORS_PROXY = 'https://corsproxy.io/?';

    var SOURCES_LIST = {
        'tmdb': 'TMDB (Основне)',
        'cub': 'CUB',
        'eneida': 'Енеїда',
        'vokino': 'VoKino',
        'rezka': 'HDRezka',
        'uaflix': 'UAFlix',
        'uakino': 'UAkino',
        'sork': 'Sor\'k',
        'tvflix': 'TVFlix',
        'zima': 'Zima',
        'kinozal': 'Kinozal',
        'kinopoisk': 'Kinopoisk'
    };

    // ====================== КОРС-ПРОКСІ ======================
    function safeAjax(params) {
        var url = params.url;
        var isExternal = !url.includes('lampaua.mooo.com');
        var useProxy = params.useCorsProxy || isExternal;

        if (useProxy) {
            url = CORS_PROXY + encodeURIComponent(url);
        }

        $.ajax({
            url: url,
            type: params.type || 'GET',
            dataType: 'json',
            timeout: params.timeout || 20000,
            headers: params.headers || {},
            success: function (res) {
                params.success(res);
            },
            error: function (jqXHR) {
                var status = jqXHR.status || 0;
                var statusText = jqXHR.statusText || 'Unknown';
                console.warn('CORS / Ajax error: ' + status + ' (' + statusText + ') — ' + url);

                if (params.retryCount && params.retryCount < 3) {
                    params.retryCount++;
                    setTimeout(function () { safeAjax(params); }, 800);
                    return;
                }

                if (status !== 200 && status !== 0) {
                    params.error(jqXHR);
                    return;
                }
                params.success(res);
            }
        });
    }

    // ====================== АДАПТЕРИ ДЖЕРЕЛ ======================
    var ApiProviders = {
        tmdb: { /* той самий код, що в попередній версії */ },
        cub: { getCatalog: ApiProviders.tmdb.getCatalog },
        eneida: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: 'http://lampaua.mooo.com/eneida/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id || i.news_id, title: i.title, poster: i.poster || i.img, year: i.year || '', type: i.type || 'movie', url: i.url || i.link, source: 'eneida' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        // ... (всі інші джерела — vokino, rezka, uaflix, uakino, sork, tvflix, zima, kinozal, kinopoisk) — ті самі, що в останньому повідомленні
        // (щоб не повторювати 200 рядків — використовуй той самий блок, що я надсилав у попередній відповіді)
    };

    // ====================== КОМПОНЕНТ КАТАЛОГУ ======================
    function PrimaryCatalog(object) {
        // весь код компоненту — той самий, що в попередній версії (без змін)
        var comp = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html = $('<div></div>');
        var lines = [];

        this.create = function () {
            this.activity.loader(true);
            var categories = [
                { id: 'popular', title: 'Популярні фільми' },
                { id: 'now_playing', title: 'Новинки кіно' },
                { id: 'tv_series', title: 'Серіали' }
            ];
            comp.buildLines(categories);
            this.activity.loader(false);
            return this.render();
        };

        this.buildLines = function (cats) {
            cats.forEach(function (cat) {
                var line = new Lampa.Line({ title: cat.title, card_small: false });
                line.create();
                var loader = $('<div class="broadcast__scan"><div></div></div>');
                line.render().find('.items').append(loader);
                lines.push(line);
                scroll.append(line.render());
                comp.loadLinePage(cat, line, 1, loader);
            });
            html.append(scroll.render());
        };

        // loadLinePage, appendMoreButton, render, destroy — ті самі
        this.loadLinePage = /* ... той самий код ... */;
        this.appendMoreButton = /* ... той самий код ... */;
        this.render = function () { return html; };
        this.destroy = function () {
            lines.forEach(function (l) { if (l.destroy) l.destroy(); });
            scroll.destroy();
            html.remove();
        };
    }

    // ====================== ОНЛАЙН ПЛЕЄР ======================
    function startOnlinePlayback(cardData) {
        var source = Lampa.Storage.get('active_primary_source', 'tmdb');
        Lampa.Noty.show('Пошук потоків [' + source.toUpperCase() + ']...');

        safeAjax({
            url: 'http://lampaua.mooo.com/' + source + '/stream?id=' + cardData.id + '&url=' + encodeURIComponent(cardData.url || ''),
            useCorsProxy: true,
            success: function (res) {
                var translations = res.translations || res || [];
                if (!translations.length) return Lampa.Noty.show('Відеопотоків не знайдено');

                var selectItems = translations.map(function (t) {
                    return { title: t.name || 'Стандартний переклад', translation: t };
                });

                Lampa.Select.show({
                    title: 'Оберіть озвучку',
                    items: selectItems,
                    onSelect: function (item) {
                        var t = item.translation;
                        if (t.seasons) {
                            showSeasons(cardData, t.seasons);
                        } else {
                            Lampa.Player.play({
                                title: cardData.title,
                                subtitle: t.name,
                                url: t.stream_url || t.file,
                                headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'http://lampaua.mooo.com' }
                            });
                        }
                    }
                });
            },
            error: function () {
                Lampa.Noty.show('Помилка отримання даних від сервера');
            }
        });
    }

    function showSeasons(cardData, seasons) {
        // той самий код
    }

    // ====================== РЕЄСТРАЦІЯ (тільки в правому меню) ======================
    function initPlugin() {
        Lampa.Component.add('primary_catalog', PrimaryCatalog);

        Lampa.Params.select('active_primary_source', SOURCES_LIST, 'tmdb');

        Lampa.Template.add('settings_primary_source_item', 
            '<div class="settings-param selector" data-type="select" data-name="active_primary_source">' +
                '<div class="settings-param__name">Основний Каталог</div>' +
                '<div class="settings-param__value"></div>' +
                '<div class="settings-param__descr">Оберіть єдине джерело для пошуку та каталогу</div>' +
            '</div>'
        );

        Lampa.Listener.follow('settings', function (e) {
            if (e.name === 'parent' && e.body) {
                var other_block = e.body.find('[data-component="more"], [data-component="other"]');
                if (other_block.length) {
                    other_block.after(Lampa.Template.get('settings_primary_source_item'));
                }
            }
        });

        Lampa.Listener.follow('change', function (e) {
            if (e.name === 'active_primary_source') {
                Lampa.Storage.set('active_primary_source', e.value);
                Lampa.Noty.show('Активне джерело: ' + SOURCES_LIST[e.value]);
                if (Lampa.Activity.active() && Lampa.Activity.active().component === 'primary_catalog') {
                    Lampa.Activity.replace();
                }
            }
        });

        // ====================== ПУНКТ У ПРАВОМУ МЕНЮ ======================
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                var icon = '<svg height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>';
                var menu_item = $('<div class="menu__item selector" data-action="primary_catalog">' +
                    '<div class="menu__ico">' + icon + '</div>' +
                    '<div class="menu__text">Основний Каталог</div>' +
                '</div>');
                menu_item.on('hover:enter', function () {
                    Lampa.Activity.push({ title: 'Каталог', component: 'primary_catalog', page: 1 });
                });
                $('.menu .menu__list').append(menu_item);
            }
        });

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complete') {
                var btn = $('<div class="full-start__button selector button--online-primary" style="background: rgba(255,255,255,0.1); border-radius: 0.3em; margin-left: 0.5em;">' +
                    '<svg height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
                    '<span>Онлайн</span>' +
                '</div>');
                btn.on('hover:enter', function () { startOnlinePlayback(e.data.movie); });
                e.body.find('.full-start__buttons').append(btn);
            }
        });
    }

    if (window.appready) initPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') initPlugin(); });
})();
