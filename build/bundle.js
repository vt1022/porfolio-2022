
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.50.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\HeaderNavLink.svelte generated by Svelte v3.50.1 */
    const file$8 = "src\\components\\HeaderNavLink.svelte";

    function create_fragment$8(ctx) {
    	let li;
    	let t;
    	let li_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(/*innerHtml*/ ctx[0]);

    			attr_dev(li, "class", li_class_value = "" + (null_to_empty(`navLink primary ${/*activePage*/ ctx[2] === /*toPage*/ ctx[1]
			? 'active'
			: ''}`) + " svelte-1lrgl76"));

    			add_location(li, file$8, 8, 0, 255);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", prevent_default(/*click_handler*/ ctx[4]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*innerHtml*/ 1) set_data_dev(t, /*innerHtml*/ ctx[0]);

    			if (dirty & /*activePage, toPage*/ 6 && li_class_value !== (li_class_value = "" + (null_to_empty(`navLink primary ${/*activePage*/ ctx[2] === /*toPage*/ ctx[1]
			? 'active'
			: ''}`) + " svelte-1lrgl76"))) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HeaderNavLink', slots, []);
    	let { innerHtml } = $$props;
    	let { toPage } = $$props;
    	let { activePage } = $$props;
    	const dispatch = createEventDispatcher();
    	const handlePageClick = page => dispatch('pageChange', page);
    	const writable_props = ['innerHtml', 'toPage', 'activePage'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HeaderNavLink> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handlePageClick(toPage);

    	$$self.$$set = $$props => {
    		if ('innerHtml' in $$props) $$invalidate(0, innerHtml = $$props.innerHtml);
    		if ('toPage' in $$props) $$invalidate(1, toPage = $$props.toPage);
    		if ('activePage' in $$props) $$invalidate(2, activePage = $$props.activePage);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		innerHtml,
    		toPage,
    		activePage,
    		dispatch,
    		handlePageClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('innerHtml' in $$props) $$invalidate(0, innerHtml = $$props.innerHtml);
    		if ('toPage' in $$props) $$invalidate(1, toPage = $$props.toPage);
    		if ('activePage' in $$props) $$invalidate(2, activePage = $$props.activePage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [innerHtml, toPage, activePage, handlePageClick, click_handler];
    }

    class HeaderNavLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { innerHtml: 0, toPage: 1, activePage: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HeaderNavLink",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*innerHtml*/ ctx[0] === undefined && !('innerHtml' in props)) {
    			console.warn("<HeaderNavLink> was created without expected prop 'innerHtml'");
    		}

    		if (/*toPage*/ ctx[1] === undefined && !('toPage' in props)) {
    			console.warn("<HeaderNavLink> was created without expected prop 'toPage'");
    		}

    		if (/*activePage*/ ctx[2] === undefined && !('activePage' in props)) {
    			console.warn("<HeaderNavLink> was created without expected prop 'activePage'");
    		}
    	}

    	get innerHtml() {
    		throw new Error("<HeaderNavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set innerHtml(value) {
    		throw new Error("<HeaderNavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toPage() {
    		throw new Error("<HeaderNavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toPage(value) {
    		throw new Error("<HeaderNavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activePage() {
    		throw new Error("<HeaderNavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activePage(value) {
    		throw new Error("<HeaderNavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ThemeToggle.svelte generated by Svelte v3.50.1 */
    const file$7 = "src\\components\\ThemeToggle.svelte";

    // (16:4) {:else}
    function create_else_block$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "class", "path svelte-guoqw8");
    			attr_dev(path, "d", "M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z");
    			add_location(path, file$7, 17, 181, 1685);
    			attr_dev(svg, "class", "icon svelte-guoqw8");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			add_location(svg, file$7, 16, 8, 1428);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(16:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (9:4) {#if isDarkTheme}
    function create_if_block$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "class", "path svelte-guoqw8");
    			attr_dev(path, "d", "M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM352 256c0 53-43 96-96 96s-96-43-96-96s43-96 96-96s96 43 96 96zm32 0c0-70.7-57.3-128-128-128s-128 57.3-128 128s57.3 128 128 128s128-57.3 128-128z");
    			add_location(path, file$7, 10, 181, 654);
    			attr_dev(svg, "class", "icon svelte-guoqw8");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			add_location(svg, file$7, 9, 8, 397);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(9:4) {#if isDarkTheme}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let button;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*isDarkTheme*/ ctx[0]) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(`btn ${/*desktopMode*/ ctx[1] ? 'btn--desktop' : 'btn--mobile'}`) + " svelte-guoqw8"));
    			add_location(button, file$7, 7, 0, 237);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", prevent_default(/*click_handler*/ ctx[3]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}

    			if (dirty & /*desktopMode*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(`btn ${/*desktopMode*/ ctx[1] ? 'btn--desktop' : 'btn--mobile'}`) + " svelte-guoqw8"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ThemeToggle', slots, []);
    	let { isDarkTheme } = $$props;
    	let { desktopMode } = $$props;
    	const dispatch = createEventDispatcher();
    	const handleClick = theme => dispatch('themeChange', theme);
    	const writable_props = ['isDarkTheme', 'desktopMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ThemeToggle> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleClick(isDarkTheme);

    	$$self.$$set = $$props => {
    		if ('isDarkTheme' in $$props) $$invalidate(0, isDarkTheme = $$props.isDarkTheme);
    		if ('desktopMode' in $$props) $$invalidate(1, desktopMode = $$props.desktopMode);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		isDarkTheme,
    		desktopMode,
    		dispatch,
    		handleClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('isDarkTheme' in $$props) $$invalidate(0, isDarkTheme = $$props.isDarkTheme);
    		if ('desktopMode' in $$props) $$invalidate(1, desktopMode = $$props.desktopMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isDarkTheme, desktopMode, handleClick, click_handler];
    }

    class ThemeToggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { isDarkTheme: 0, desktopMode: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThemeToggle",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*isDarkTheme*/ ctx[0] === undefined && !('isDarkTheme' in props)) {
    			console.warn("<ThemeToggle> was created without expected prop 'isDarkTheme'");
    		}

    		if (/*desktopMode*/ ctx[1] === undefined && !('desktopMode' in props)) {
    			console.warn("<ThemeToggle> was created without expected prop 'desktopMode'");
    		}
    	}

    	get isDarkTheme() {
    		throw new Error("<ThemeToggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isDarkTheme(value) {
    		throw new Error("<ThemeToggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get desktopMode() {
    		throw new Error("<ThemeToggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set desktopMode(value) {
    		throw new Error("<ThemeToggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Header.svelte generated by Svelte v3.50.1 */
    const file$6 = "src\\components\\Header.svelte";

    // (19:8) {:else}
    function create_else_block$1(ctx) {
    	let a;
    	let t1;
    	let input;
    	let t2;
    	let label;
    	let div3;
    	let div0;
    	let t3;
    	let div1;
    	let t4;
    	let div2;
    	let t5;
    	let ul;
    	let headernavlink0;
    	let t6;
    	let headernavlink1;
    	let t7;
    	let headernavlink2;
    	let current;

    	headernavlink0 = new HeaderNavLink({
    			props: {
    				innerHtml: "Home.js",
    				toPage: 0,
    				activePage: /*activePage*/ ctx[0]
    			},
    			$$inline: true
    		});

    	headernavlink0.$on("pageChange", /*pageChange_handler_3*/ ctx[8]);

    	headernavlink1 = new HeaderNavLink({
    			props: {
    				innerHtml: "MyWork.js",
    				toPage: 1,
    				activePage: /*activePage*/ ctx[0]
    			},
    			$$inline: true
    		});

    	headernavlink1.$on("pageChange", /*pageChange_handler_4*/ ctx[9]);

    	headernavlink2 = new HeaderNavLink({
    			props: {
    				innerHtml: "AboutMe.html",
    				toPage: 2,
    				activePage: /*activePage*/ ctx[0]
    			},
    			$$inline: true
    		});

    	headernavlink2.$on("pageChange", /*pageChange_handler_5*/ ctx[10]);

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "skip to main content";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			label = element("label");
    			div3 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div1 = element("div");
    			t4 = space();
    			div2 = element("div");
    			t5 = space();
    			ul = element("ul");
    			create_component(headernavlink0.$$.fragment);
    			t6 = space();
    			create_component(headernavlink1.$$.fragment);
    			t7 = space();
    			create_component(headernavlink2.$$.fragment);
    			attr_dev(a, "href", "#home");
    			attr_dev(a, "class", "skip-link visuallyHidden");
    			add_location(a, file$6, 20, 12, 857);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "toggle");
    			attr_dev(input, "name", "toggle");
    			attr_dev(input, "class", "nav__toggle-input svelte-1n5wate");
    			add_location(input, file$6, 22, 12, 992);
    			attr_dev(div0, "class", "hamburger-lines line1 svelte-1n5wate");
    			add_location(div0, file$6, 25, 20, 1192);
    			attr_dev(div1, "class", "hamburger-lines line2 svelte-1n5wate");
    			add_location(div1, file$6, 26, 20, 1251);
    			attr_dev(div2, "class", "hamburger-lines line3 svelte-1n5wate");
    			add_location(div2, file$6, 27, 20, 1310);
    			attr_dev(div3, "class", "hamburger svelte-1n5wate");
    			add_location(div3, file$6, 24, 16, 1147);
    			attr_dev(label, "for", "toggle");
    			attr_dev(label, "class", "nav__toggle-label svelte-1n5wate");
    			add_location(label, file$6, 23, 12, 1083);
    			attr_dev(ul, "class", "nav__links svelte-1n5wate");
    			add_location(ul, file$6, 30, 12, 1407);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, label, anchor);
    			append_dev(label, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, ul, anchor);
    			mount_component(headernavlink0, ul, null);
    			append_dev(ul, t6);
    			mount_component(headernavlink1, ul, null);
    			append_dev(ul, t7);
    			mount_component(headernavlink2, ul, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const headernavlink0_changes = {};
    			if (dirty & /*activePage*/ 1) headernavlink0_changes.activePage = /*activePage*/ ctx[0];
    			headernavlink0.$set(headernavlink0_changes);
    			const headernavlink1_changes = {};
    			if (dirty & /*activePage*/ 1) headernavlink1_changes.activePage = /*activePage*/ ctx[0];
    			headernavlink1.$set(headernavlink1_changes);
    			const headernavlink2_changes = {};
    			if (dirty & /*activePage*/ 1) headernavlink2_changes.activePage = /*activePage*/ ctx[0];
    			headernavlink2.$set(headernavlink2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headernavlink0.$$.fragment, local);
    			transition_in(headernavlink1.$$.fragment, local);
    			transition_in(headernavlink2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headernavlink0.$$.fragment, local);
    			transition_out(headernavlink1.$$.fragment, local);
    			transition_out(headernavlink2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(label);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(ul);
    			destroy_component(headernavlink0);
    			destroy_component(headernavlink1);
    			destroy_component(headernavlink2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(19:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:8) {#if desktopMode}
    function create_if_block$1(ctx) {
    	let ul;
    	let headernavlink0;
    	let t0;
    	let headernavlink1;
    	let t1;
    	let headernavlink2;
    	let current;

    	headernavlink0 = new HeaderNavLink({
    			props: {
    				innerHtml: "Home.js",
    				toPage: 0,
    				activePage: /*activePage*/ ctx[0]
    			},
    			$$inline: true
    		});

    	headernavlink0.$on("pageChange", /*pageChange_handler*/ ctx[5]);

    	headernavlink1 = new HeaderNavLink({
    			props: {
    				innerHtml: "MyWork.js",
    				toPage: 1,
    				activePage: /*activePage*/ ctx[0]
    			},
    			$$inline: true
    		});

    	headernavlink1.$on("pageChange", /*pageChange_handler_1*/ ctx[6]);

    	headernavlink2 = new HeaderNavLink({
    			props: {
    				innerHtml: "AboutMe.html",
    				toPage: 2,
    				activePage: /*activePage*/ ctx[0]
    			},
    			$$inline: true
    		});

    	headernavlink2.$on("pageChange", /*pageChange_handler_2*/ ctx[7]);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			create_component(headernavlink0.$$.fragment);
    			t0 = space();
    			create_component(headernavlink1.$$.fragment);
    			t1 = space();
    			create_component(headernavlink2.$$.fragment);
    			attr_dev(ul, "class", "navList svelte-1n5wate");
    			add_location(ul, file$6, 13, 12, 469);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			mount_component(headernavlink0, ul, null);
    			append_dev(ul, t0);
    			mount_component(headernavlink1, ul, null);
    			append_dev(ul, t1);
    			mount_component(headernavlink2, ul, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const headernavlink0_changes = {};
    			if (dirty & /*activePage*/ 1) headernavlink0_changes.activePage = /*activePage*/ ctx[0];
    			headernavlink0.$set(headernavlink0_changes);
    			const headernavlink1_changes = {};
    			if (dirty & /*activePage*/ 1) headernavlink1_changes.activePage = /*activePage*/ ctx[0];
    			headernavlink1.$set(headernavlink1_changes);
    			const headernavlink2_changes = {};
    			if (dirty & /*activePage*/ 1) headernavlink2_changes.activePage = /*activePage*/ ctx[0];
    			headernavlink2.$set(headernavlink2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headernavlink0.$$.fragment, local);
    			transition_in(headernavlink1.$$.fragment, local);
    			transition_in(headernavlink2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headernavlink0.$$.fragment, local);
    			transition_out(headernavlink1.$$.fragment, local);
    			transition_out(headernavlink2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_component(headernavlink0);
    			destroy_component(headernavlink1);
    			destroy_component(headernavlink2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(13:8) {#if desktopMode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let header;
    	let nav;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let themetoggle;
    	let nav_class_value;
    	let header_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[4]);
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*desktopMode*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	themetoggle = new ThemeToggle({
    			props: {
    				isDarkTheme: /*isDarkTheme*/ ctx[1],
    				desktopMode: /*desktopMode*/ ctx[3]
    			},
    			$$inline: true
    		});

    	themetoggle.$on("themeChange", /*themeChange_handler*/ ctx[11]);

    	const block = {
    		c: function create() {
    			header = element("header");
    			nav = element("nav");
    			if_block.c();
    			t = space();
    			create_component(themetoggle.$$.fragment);
    			attr_dev(nav, "class", nav_class_value = "" + (null_to_empty(`nav ${/*desktopMode*/ ctx[3] ? 'nav--desktop' : 'nav--mobile'}`) + " svelte-1n5wate"));
    			add_location(nav, file$6, 11, 4, 361);

    			attr_dev(header, "class", header_class_value = "" + (null_to_empty(`header ${/*desktopMode*/ ctx[3]
			? 'header--desktop'
			: 'header--mobile'}`) + " svelte-1n5wate"));

    			add_location(header, file$6, 10, 0, 276);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, nav);
    			if_blocks[current_block_type_index].m(nav, null);
    			append_dev(nav, t);
    			mount_component(themetoggle, nav, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "resize", /*onwindowresize*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(nav, t);
    			}

    			const themetoggle_changes = {};
    			if (dirty & /*isDarkTheme*/ 2) themetoggle_changes.isDarkTheme = /*isDarkTheme*/ ctx[1];
    			if (dirty & /*desktopMode*/ 8) themetoggle_changes.desktopMode = /*desktopMode*/ ctx[3];
    			themetoggle.$set(themetoggle_changes);

    			if (!current || dirty & /*desktopMode*/ 8 && nav_class_value !== (nav_class_value = "" + (null_to_empty(`nav ${/*desktopMode*/ ctx[3] ? 'nav--desktop' : 'nav--mobile'}`) + " svelte-1n5wate"))) {
    				attr_dev(nav, "class", nav_class_value);
    			}

    			if (!current || dirty & /*desktopMode*/ 8 && header_class_value !== (header_class_value = "" + (null_to_empty(`header ${/*desktopMode*/ ctx[3]
			? 'header--desktop'
			: 'header--mobile'}`) + " svelte-1n5wate"))) {
    				attr_dev(header, "class", header_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(themetoggle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(themetoggle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if_blocks[current_block_type_index].d();
    			destroy_component(themetoggle);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let desktopMode;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	let { activePage } = $$props;
    	let { isDarkTheme } = $$props;
    	let innerWidth = 0;
    	const writable_props = ['activePage', 'isDarkTheme'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	function onwindowresize() {
    		$$invalidate(2, innerWidth = window.innerWidth);
    	}

    	function pageChange_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function pageChange_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function pageChange_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function pageChange_handler_3(event) {
    		bubble.call(this, $$self, event);
    	}

    	function pageChange_handler_4(event) {
    		bubble.call(this, $$self, event);
    	}

    	function pageChange_handler_5(event) {
    		bubble.call(this, $$self, event);
    	}

    	function themeChange_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('activePage' in $$props) $$invalidate(0, activePage = $$props.activePage);
    		if ('isDarkTheme' in $$props) $$invalidate(1, isDarkTheme = $$props.isDarkTheme);
    	};

    	$$self.$capture_state = () => ({
    		HeaderNavLink,
    		ThemeToggle,
    		activePage,
    		isDarkTheme,
    		innerWidth,
    		desktopMode
    	});

    	$$self.$inject_state = $$props => {
    		if ('activePage' in $$props) $$invalidate(0, activePage = $$props.activePage);
    		if ('isDarkTheme' in $$props) $$invalidate(1, isDarkTheme = $$props.isDarkTheme);
    		if ('innerWidth' in $$props) $$invalidate(2, innerWidth = $$props.innerWidth);
    		if ('desktopMode' in $$props) $$invalidate(3, desktopMode = $$props.desktopMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*innerWidth*/ 4) {
    			$$invalidate(3, desktopMode = innerWidth > 399);
    		}
    	};

    	return [
    		activePage,
    		isDarkTheme,
    		innerWidth,
    		desktopMode,
    		onwindowresize,
    		pageChange_handler,
    		pageChange_handler_1,
    		pageChange_handler_2,
    		pageChange_handler_3,
    		pageChange_handler_4,
    		pageChange_handler_5,
    		themeChange_handler
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { activePage: 0, isDarkTheme: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*activePage*/ ctx[0] === undefined && !('activePage' in props)) {
    			console.warn("<Header> was created without expected prop 'activePage'");
    		}

    		if (/*isDarkTheme*/ ctx[1] === undefined && !('isDarkTheme' in props)) {
    			console.warn("<Header> was created without expected prop 'isDarkTheme'");
    		}
    	}

    	get activePage() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activePage(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isDarkTheme() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isDarkTheme(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src\pages\Home.svelte generated by Svelte v3.50.1 */
    const file$5 = "src\\pages\\Home.svelte";

    function create_fragment$5(ctx) {
    	let section;
    	let div;
    	let p;
    	let t1;
    	let h20;
    	let t2;
    	let span0;
    	let t4;
    	let h21;
    	let t6;
    	let ul;
    	let li0;
    	let span1;
    	let t8;
    	let span2;
    	let t10;
    	let span3;
    	let t12;
    	let a0;
    	let t14;
    	let li1;
    	let span4;
    	let t16;
    	let span5;
    	let t18;
    	let span6;
    	let t20;
    	let a1;
    	let t22;
    	let li2;
    	let span7;
    	let t24;
    	let span8;
    	let t26;
    	let span9;
    	let t28;
    	let a2;
    	let t30;
    	let li3;
    	let span10;
    	let t32;
    	let span11;
    	let t34;
    	let span12;
    	let t36;
    	let a3;
    	let section_intro;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div = element("div");
    			p = element("p");
    			p.textContent = "hey, i'm";
    			t1 = space();
    			h20 = element("h2");
    			t2 = text("vincci ");
    			span0 = element("span");
    			span0.textContent = "tsui";
    			t4 = space();
    			h21 = element("h2");
    			h21.textContent = "frontend developer";
    			t6 = space();
    			ul = element("ul");
    			li0 = element("li");
    			span1 = element("span");
    			span1.textContent = "const";
    			t8 = space();
    			span2 = element("span");
    			span2.textContent = "email";
    			t10 = space();
    			span3 = element("span");
    			span3.textContent = "=";
    			t12 = space();
    			a0 = element("a");
    			a0.textContent = "vinccimantsui@gmail.com";
    			t14 = space();
    			li1 = element("li");
    			span4 = element("span");
    			span4.textContent = "const";
    			t16 = space();
    			span5 = element("span");
    			span5.textContent = "github";
    			t18 = space();
    			span6 = element("span");
    			span6.textContent = "=";
    			t20 = space();
    			a1 = element("a");
    			a1.textContent = "/vt1022";
    			t22 = space();
    			li2 = element("li");
    			span7 = element("span");
    			span7.textContent = "const";
    			t24 = space();
    			span8 = element("span");
    			span8.textContent = "linkedin";
    			t26 = space();
    			span9 = element("span");
    			span9.textContent = "=";
    			t28 = space();
    			a2 = element("a");
    			a2.textContent = "/vinccimantsui";
    			t30 = space();
    			li3 = element("li");
    			span10 = element("span");
    			span10.textContent = "const";
    			t32 = space();
    			span11 = element("span");
    			span11.textContent = "resume";
    			t34 = space();
    			span12 = element("span");
    			span12.textContent = "=";
    			t36 = space();
    			a3 = element("a");
    			a3.textContent = "download pdf";
    			attr_dev(p, "class", "greeting svelte-1ekkrhv");
    			add_location(p, file$5, 5, 8, 187);
    			attr_dev(span0, "class", "name name--last svelte-1ekkrhv");
    			add_location(span0, file$5, 6, 32, 253);
    			attr_dev(h20, "class", "name svelte-1ekkrhv");
    			add_location(h20, file$5, 6, 8, 229);
    			attr_dev(h21, "class", "title svelte-1ekkrhv");
    			add_location(h21, file$5, 7, 8, 309);
    			attr_dev(div, "class", "greetingContainer svelte-1ekkrhv");
    			add_location(div, file$5, 4, 4, 146);
    			attr_dev(span1, "class", "codePurple");
    			add_location(span1, file$5, 11, 12, 445);
    			attr_dev(span2, "class", "codeRed");
    			add_location(span2, file$5, 11, 50, 483);
    			attr_dev(span3, "class", "codePurple");
    			add_location(span3, file$5, 11, 85, 518);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener");
    			attr_dev(a0, "href", "mailto:vinccimantsui@gmail.com");
    			attr_dev(a0, "aria-label", "email me");
    			add_location(a0, file$5, 12, 12, 565);
    			attr_dev(li0, "class", "contact");
    			add_location(li0, file$5, 10, 8, 411);
    			attr_dev(span4, "class", "codePurple");
    			add_location(span4, file$5, 17, 12, 777);
    			attr_dev(span5, "class", "codeRed");
    			add_location(span5, file$5, 17, 50, 815);
    			attr_dev(span6, "class", "codePurple");
    			add_location(span6, file$5, 17, 86, 851);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener");
    			attr_dev(a1, "href", "https://github.com/vt1022");
    			attr_dev(a1, "aria-label", "go to my github");
    			add_location(a1, file$5, 18, 12, 898);
    			attr_dev(li1, "class", "contact");
    			add_location(li1, file$5, 16, 8, 743);
    			attr_dev(span7, "class", "codePurple");
    			add_location(span7, file$5, 21, 12, 1066);
    			attr_dev(span8, "class", "codeRed");
    			add_location(span8, file$5, 21, 50, 1104);
    			attr_dev(span9, "class", "codePurple");
    			add_location(span9, file$5, 21, 88, 1142);
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "rel", "noopener");
    			attr_dev(a2, "href", "https://www.linkedin.com/in/vincci-tsui-040a031a3/");
    			attr_dev(a2, "aria-label", "go to my linkedin");
    			add_location(a2, file$5, 22, 12, 1189);
    			attr_dev(li2, "class", "contact");
    			add_location(li2, file$5, 20, 8, 1032);
    			attr_dev(span10, "class", "codePurple");
    			add_location(span10, file$5, 32, 12, 1503);
    			attr_dev(span11, "class", "codeRed");
    			add_location(span11, file$5, 32, 50, 1541);
    			attr_dev(span12, "class", "codePurple");
    			add_location(span12, file$5, 32, 86, 1577);
    			attr_dev(a3, "href", "assets/resume-vincci-tsui-2022-b.pdf");
    			attr_dev(a3, "download", "resume-vincci-tsui");
    			attr_dev(a3, "aria-label", "download resume");
    			add_location(a3, file$5, 33, 12, 1624);
    			attr_dev(li3, "class", "contact");
    			add_location(li3, file$5, 31, 8, 1469);
    			attr_dev(ul, "class", "contactList bodyFont svelte-1ekkrhv");
    			add_location(ul, file$5, 9, 4, 368);
    			attr_dev(section, "class", "home container svelte-1ekkrhv");
    			add_location(section, file$5, 3, 0, 73);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			append_dev(div, p);
    			append_dev(div, t1);
    			append_dev(div, h20);
    			append_dev(h20, t2);
    			append_dev(h20, span0);
    			append_dev(div, t4);
    			append_dev(div, h21);
    			append_dev(section, t6);
    			append_dev(section, ul);
    			append_dev(ul, li0);
    			append_dev(li0, span1);
    			append_dev(li0, t8);
    			append_dev(li0, span2);
    			append_dev(li0, t10);
    			append_dev(li0, span3);
    			append_dev(li0, t12);
    			append_dev(li0, a0);
    			append_dev(ul, t14);
    			append_dev(ul, li1);
    			append_dev(li1, span4);
    			append_dev(li1, t16);
    			append_dev(li1, span5);
    			append_dev(li1, t18);
    			append_dev(li1, span6);
    			append_dev(li1, t20);
    			append_dev(li1, a1);
    			append_dev(ul, t22);
    			append_dev(ul, li2);
    			append_dev(li2, span7);
    			append_dev(li2, t24);
    			append_dev(li2, span8);
    			append_dev(li2, t26);
    			append_dev(li2, span9);
    			append_dev(li2, t28);
    			append_dev(li2, a2);
    			append_dev(ul, t30);
    			append_dev(ul, li3);
    			append_dev(li3, span10);
    			append_dev(li3, t32);
    			append_dev(li3, span11);
    			append_dev(li3, t34);
    			append_dev(li3, span12);
    			append_dev(li3, t36);
    			append_dev(li3, a3);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!section_intro) {
    				add_render_callback(() => {
    					section_intro = create_in_transition(section, fly, { x: 300, duration: 500 });
    					section_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fly });
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\pages\About.svelte generated by Svelte v3.50.1 */
    const file$4 = "src\\pages\\About.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let p;
    	let span3;
    	let span0;
    	let span1;
    	let span2;
    	let t3;
    	let span4;
    	let t5;
    	let span8;
    	let span5;
    	let span6;
    	let span7;
    	let section_intro;

    	const block = {
    		c: function create() {
    			section = element("section");
    			p = element("p");
    			span3 = element("span");
    			span0 = element("span");
    			span0.textContent = "<";
    			span1 = element("span");
    			span1.textContent = "p";
    			span2 = element("span");
    			span2.textContent = ">";
    			t3 = space();
    			span4 = element("span");
    			span4.textContent = "I am a developer with design experience. My experience has taught me the value of reusability, user experience, and\r\n            accessibility from both a development and design perspective. I love finding solutions that balance these concepts. I\r\n            currently work daily with React, JavaScript, TypeScript, Node, Git, Webpack, HTML and SASS. I am also currently\r\n            learning other new technologies such as Svelte.";
    			t5 = space();
    			span8 = element("span");
    			span5 = element("span");
    			span5.textContent = "</";
    			span6 = element("span");
    			span6.textContent = "p";
    			span7 = element("span");
    			span7.textContent = ">";
    			attr_dev(span0, "class", "codeBlue");
    			add_location(span0, file$4, 6, 12, 210);
    			attr_dev(span1, "class", "codeRed");
    			add_location(span1, file$4, 6, 46, 244);
    			attr_dev(span2, "class", "codeBlue");
    			add_location(span2, file$4, 6, 76, 274);
    			attr_dev(span3, "class", "pTag svelte-idh6a8");
    			add_location(span3, file$4, 5, 8, 177);
    			attr_dev(span4, "class", "content svelte-idh6a8");
    			add_location(span4, file$4, 8, 8, 335);
    			attr_dev(span5, "class", "codeBlue");
    			add_location(span5, file$4, 15, 12, 863);
    			attr_dev(span6, "class", "codeRed");
    			add_location(span6, file$4, 15, 47, 898);
    			attr_dev(span7, "class", "codeBlue");
    			add_location(span7, file$4, 15, 77, 928);
    			attr_dev(span8, "class", "pTag svelte-idh6a8");
    			add_location(span8, file$4, 14, 8, 830);
    			attr_dev(p, "class", "bodyFont svelte-idh6a8");
    			add_location(p, file$4, 4, 4, 147);
    			attr_dev(section, "class", "about container svelte-idh6a8");
    			add_location(section, file$4, 3, 0, 73);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    			append_dev(p, span3);
    			append_dev(span3, span0);
    			append_dev(span3, span1);
    			append_dev(span3, span2);
    			append_dev(p, t3);
    			append_dev(p, span4);
    			append_dev(p, t5);
    			append_dev(p, span8);
    			append_dev(span8, span5);
    			append_dev(span8, span6);
    			append_dev(span8, span7);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!section_intro) {
    				add_render_callback(() => {
    					section_intro = create_in_transition(section, fly, { x: 300, duration: 500 });
    					section_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fly });
    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\ObjectDeclaration.svelte generated by Svelte v3.50.1 */

    const file$3 = "src\\components\\ObjectDeclaration.svelte";

    function create_fragment$3(ctx) {
    	let span4;
    	let span0;
    	let t1;
    	let span1;
    	let t2;
    	let t3;
    	let span2;
    	let t5;
    	let span3;

    	const block = {
    		c: function create() {
    			span4 = element("span");
    			span0 = element("span");
    			span0.textContent = "const";
    			t1 = space();
    			span1 = element("span");
    			t2 = text(/*name*/ ctx[0]);
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "=";
    			t5 = space();
    			span3 = element("span");
    			span3.textContent = "{";
    			attr_dev(span0, "class", "codePurple");
    			add_location(span0, file$3, 4, 4, 83);
    			attr_dev(span1, "class", "codeRed");
    			add_location(span1, file$3, 4, 42, 121);
    			attr_dev(span2, "class", "codePurple");
    			add_location(span2, file$3, 4, 78, 157);
    			attr_dev(span3, "class", "codeOrange");
    			add_location(span3, file$3, 5, 4, 196);
    			attr_dev(span4, "class", "objectDeclare svelte-3lfeme");
    			add_location(span4, file$3, 3, 0, 49);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span4, anchor);
    			append_dev(span4, span0);
    			append_dev(span4, t1);
    			append_dev(span4, span1);
    			append_dev(span1, t2);
    			append_dev(span4, t3);
    			append_dev(span4, span2);
    			append_dev(span4, t5);
    			append_dev(span4, span3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t2, /*name*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ObjectDeclaration', slots, []);
    	let { name } = $$props;
    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ObjectDeclaration> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class ObjectDeclaration extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ObjectDeclaration",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<ObjectDeclaration> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<ObjectDeclaration>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<ObjectDeclaration>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ObjectLine.svelte generated by Svelte v3.50.1 */

    const file$2 = "src\\components\\ObjectLine.svelte";

    function create_fragment$2(ctx) {
    	let span3;
    	let t0;
    	let span0;
    	let span1;
    	let t2;
    	let span2;

    	const block = {
    		c: function create() {
    			span3 = element("span");
    			t0 = text(/*key*/ ctx[0]);
    			span0 = element("span");
    			span0.textContent = ": '";
    			span1 = element("span");
    			t2 = text(/*value*/ ctx[1]);
    			span2 = element("span");
    			span2.textContent = "'";
    			attr_dev(span0, "class", "codeBlue");
    			add_location(span0, file$2, 5, 9, 103);
    			attr_dev(span1, "class", "bodyFont svelte-1rdwz2r");
    			add_location(span1, file$2, 5, 42, 136);
    			attr_dev(span2, "class", "codeBlue");
    			add_location(span2, file$2, 5, 80, 174);
    			attr_dev(span3, "class", "objectLine svelte-1rdwz2r");
    			add_location(span3, file$2, 4, 0, 67);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span3, anchor);
    			append_dev(span3, t0);
    			append_dev(span3, span0);
    			append_dev(span3, span1);
    			append_dev(span1, t2);
    			append_dev(span3, span2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*key*/ 1) set_data_dev(t0, /*key*/ ctx[0]);
    			if (dirty & /*value*/ 2) set_data_dev(t2, /*value*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ObjectLine', slots, []);
    	let { key } = $$props;
    	let { value } = $$props;
    	const writable_props = ['key', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ObjectLine> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('key' in $$props) $$invalidate(0, key = $$props.key);
    		if ('value' in $$props) $$invalidate(1, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ key, value });

    	$$self.$inject_state = $$props => {
    		if ('key' in $$props) $$invalidate(0, key = $$props.key);
    		if ('value' in $$props) $$invalidate(1, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [key, value];
    }

    class ObjectLine extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { key: 0, value: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ObjectLine",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*key*/ ctx[0] === undefined && !('key' in props)) {
    			console.warn("<ObjectLine> was created without expected prop 'key'");
    		}

    		if (/*value*/ ctx[1] === undefined && !('value' in props)) {
    			console.warn("<ObjectLine> was created without expected prop 'value'");
    		}
    	}

    	get key() {
    		throw new Error("<ObjectLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<ObjectLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<ObjectLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<ObjectLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\Work.svelte generated by Svelte v3.50.1 */
    const file$1 = "src\\pages\\Work.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let ul;
    	let li0;
    	let objectdeclaration0;
    	let t0;
    	let p0;
    	let t1;
    	let span0;
    	let t3;
    	let a0;
    	let span1;
    	let t6;
    	let br0;
    	let t7;
    	let span2;
    	let t9;
    	let a1;
    	let span3;
    	let t12;
    	let objectline0;
    	let t13;
    	let objectline1;
    	let t14;
    	let span4;
    	let t16;
    	let li1;
    	let objectdeclaration1;
    	let t17;
    	let p1;
    	let t18;
    	let span5;
    	let t20;
    	let a2;
    	let span6;
    	let t23;
    	let objectline2;
    	let t24;
    	let objectline3;
    	let t25;
    	let objectline4;
    	let t26;
    	let span7;
    	let t28;
    	let li2;
    	let objectdeclaration2;
    	let t29;
    	let p2;
    	let t30;
    	let span8;
    	let t32;
    	let a3;
    	let span9;
    	let t35;
    	let br1;
    	let t36;
    	let span10;
    	let t38;
    	let a4;
    	let span11;
    	let t41;
    	let objectline5;
    	let t42;
    	let objectline6;
    	let t43;
    	let span12;
    	let t45;
    	let li3;
    	let objectdeclaration3;
    	let t46;
    	let p3;
    	let t47;
    	let span13;
    	let t49;
    	let a5;
    	let span14;
    	let t52;
    	let br2;
    	let t53;
    	let span15;
    	let t55;
    	let a6;
    	let span16;
    	let t58;
    	let objectline7;
    	let t59;
    	let objectline8;
    	let t60;
    	let span17;
    	let section_intro;
    	let current;

    	objectdeclaration0 = new ObjectDeclaration({
    			props: { name: "my_portfolio" },
    			$$inline: true
    		});

    	objectline0 = new ObjectLine({
    			props: {
    				key: "description",
    				value: "Built as a project to learn Svelte with TypeScript. The design concept is to make it look like VS Code because\r\n                    it is the main tool of a developer"
    			},
    			$$inline: true
    		});

    	objectline1 = new ObjectLine({
    			props: {
    				key: "skills",
    				value: "Svelte, TypeScript, Css, Html"
    			},
    			$$inline: true
    		});

    	objectdeclaration1 = new ObjectDeclaration({
    			props: { name: "che_patisserie" },
    			$$inline: true
    		});

    	objectline2 = new ObjectLine({
    			props: {
    				key: "code",
    				value: "available upon request"
    			},
    			$$inline: true
    		});

    	objectline3 = new ObjectLine({
    			props: {
    				key: "description",
    				value: "Mobile-first e-Commerce website for a home baker client built with React. Integration with Google Sheets for\r\n                    content management and Discord webhooks for notifications"
    			},
    			$$inline: true
    		});

    	objectline4 = new ObjectLine({
    			props: {
    				key: "skills",
    				value: "React, JavaScript, Sass, Html"
    			},
    			$$inline: true
    		});

    	objectdeclaration2 = new ObjectDeclaration({
    			props: { name: "poké_match" },
    			$$inline: true
    		});

    	objectline5 = new ObjectLine({
    			props: {
    				key: "description",
    				value: "Memory game to match pairs of Pokémon. Interactive game made with AJAX call to Pokémon api"
    			},
    			$$inline: true
    		});

    	objectline6 = new ObjectLine({
    			props: {
    				key: "skills",
    				value: "JavaScript, jQuery, Sass, Html"
    			},
    			$$inline: true
    		});

    	objectdeclaration3 = new ObjectDeclaration({
    			props: { name: "div_craft" },
    			$$inline: true
    		});

    	objectline7 = new ObjectLine({
    			props: {
    				key: "description",
    				value: "Character creation screen of a game. Made with React and Firebase. One div style css drawings and animations"
    			},
    			$$inline: true
    		});

    	objectline8 = new ObjectLine({
    			props: {
    				key: "skills",
    				value: "React, JavaScript, Firebase, Sass, Html"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			ul = element("ul");
    			li0 = element("li");
    			create_component(objectdeclaration0.$$.fragment);
    			t0 = space();
    			p0 = element("p");
    			t1 = text("live");
    			span0 = element("span");
    			span0.textContent = ":";
    			t3 = space();
    			a0 = element("a");
    			a0.textContent = "vinccitsui.me";
    			span1 = element("span");
    			span1.textContent = ",";
    			t6 = space();
    			br0 = element("br");
    			t7 = text("\r\n                code");
    			span2 = element("span");
    			span2.textContent = ":";
    			t9 = space();
    			a1 = element("a");
    			a1.textContent = "github/portfolio";
    			span3 = element("span");
    			span3.textContent = ",";
    			t12 = space();
    			create_component(objectline0.$$.fragment);
    			t13 = space();
    			create_component(objectline1.$$.fragment);
    			t14 = space();
    			span4 = element("span");
    			span4.textContent = "}";
    			t16 = space();
    			li1 = element("li");
    			create_component(objectdeclaration1.$$.fragment);
    			t17 = space();
    			p1 = element("p");
    			t18 = text("live");
    			span5 = element("span");
    			span5.textContent = ":";
    			t20 = space();
    			a2 = element("a");
    			a2.textContent = "chepatisserie.com";
    			span6 = element("span");
    			span6.textContent = ",";
    			t23 = space();
    			create_component(objectline2.$$.fragment);
    			t24 = space();
    			create_component(objectline3.$$.fragment);
    			t25 = space();
    			create_component(objectline4.$$.fragment);
    			t26 = space();
    			span7 = element("span");
    			span7.textContent = "}";
    			t28 = space();
    			li2 = element("li");
    			create_component(objectdeclaration2.$$.fragment);
    			t29 = space();
    			p2 = element("p");
    			t30 = text("live");
    			span8 = element("span");
    			span8.textContent = ":";
    			t32 = space();
    			a3 = element("a");
    			a3.textContent = "gh-pages.pokematch";
    			span9 = element("span");
    			span9.textContent = ",";
    			t35 = space();
    			br1 = element("br");
    			t36 = text("\r\n                code");
    			span10 = element("span");
    			span10.textContent = ":";
    			t38 = space();
    			a4 = element("a");
    			a4.textContent = "github/pokematch";
    			span11 = element("span");
    			span11.textContent = ",";
    			t41 = space();
    			create_component(objectline5.$$.fragment);
    			t42 = space();
    			create_component(objectline6.$$.fragment);
    			t43 = space();
    			span12 = element("span");
    			span12.textContent = "}";
    			t45 = space();
    			li3 = element("li");
    			create_component(objectdeclaration3.$$.fragment);
    			t46 = space();
    			p3 = element("p");
    			t47 = text("live");
    			span13 = element("span");
    			span13.textContent = ":";
    			t49 = space();
    			a5 = element("a");
    			a5.textContent = "gh-pages.divcraft";
    			span14 = element("span");
    			span14.textContent = ",";
    			t52 = space();
    			br2 = element("br");
    			t53 = text("\r\n                code");
    			span15 = element("span");
    			span15.textContent = ":";
    			t55 = space();
    			a6 = element("a");
    			a6.textContent = "github/divcraft";
    			span16 = element("span");
    			span16.textContent = ",";
    			t58 = space();
    			create_component(objectline7.$$.fragment);
    			t59 = space();
    			create_component(objectline8.$$.fragment);
    			t60 = space();
    			span17 = element("span");
    			span17.textContent = "}";
    			attr_dev(span0, "class", "codeBlue");
    			add_location(span0, file$1, 11, 20, 458);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener");
    			attr_dev(a0, "href", "https://vinccitsui.me");
    			attr_dev(a0, "aria-label", "my portfolio");
    			add_location(a0, file$1, 12, 16, 507);
    			attr_dev(span1, "class", "codeBlue");
    			add_location(span1, file$1, 12, 123, 614);
    			add_location(br0, file$1, 15, 16, 702);
    			attr_dev(span2, "class", "codeBlue");
    			add_location(span2, file$1, 16, 20, 730);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener");
    			attr_dev(a1, "href", "https://github.com/vt1022/portfolio-2022");
    			attr_dev(a1, "aria-label", "my portfolio");
    			add_location(a1, file$1, 17, 16, 779);
    			attr_dev(span3, "class", "codeBlue");
    			add_location(span3, file$1, 19, 17, 947);
    			attr_dev(p0, "class", "insideObj codeGreen svelte-ta87hr");
    			add_location(p0, file$1, 10, 12, 405);
    			attr_dev(span4, "class", "codeOrange");
    			add_location(span4, file$1, 27, 12, 1377);
    			attr_dev(li0, "class", "work");
    			add_location(li0, file$1, 8, 8, 319);
    			attr_dev(span5, "class", "codeBlue");
    			add_location(span5, file$1, 32, 20, 1581);
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "rel", "noopener");
    			attr_dev(a2, "href", "https://chepatisserie.com");
    			attr_dev(a2, "aria-label", "che patisserie");
    			add_location(a2, file$1, 33, 16, 1630);
    			attr_dev(span6, "class", "codeBlue");
    			add_location(span6, file$1, 35, 17, 1786);
    			attr_dev(p1, "class", "insideObj codeGreen svelte-ta87hr");
    			add_location(p1, file$1, 31, 12, 1528);
    			attr_dev(span7, "class", "codeOrange");
    			add_location(span7, file$1, 44, 12, 2311);
    			attr_dev(li1, "class", "work");
    			add_location(li1, file$1, 29, 8, 1440);
    			attr_dev(span8, "class", "codeBlue");
    			add_location(span8, file$1, 49, 20, 2511);
    			attr_dev(a3, "target", "_blank");
    			attr_dev(a3, "rel", "noopener");
    			attr_dev(a3, "href", "https://vt1022.github.io/pokematch/");
    			attr_dev(a3, "aria-label", "pokématch");
    			add_location(a3, file$1, 50, 16, 2560);
    			attr_dev(span9, "class", "codeBlue");
    			add_location(span9, file$1, 52, 17, 2722);
    			add_location(br1, file$1, 53, 16, 2771);
    			attr_dev(span10, "class", "codeBlue");
    			add_location(span10, file$1, 54, 20, 2799);
    			attr_dev(a4, "target", "_blank");
    			attr_dev(a4, "rel", "noopener");
    			attr_dev(a4, "href", "https://github.com/vt1022/pokematch");
    			attr_dev(a4, "aria-label", "pokématch code repo");
    			add_location(a4, file$1, 55, 16, 2848);
    			attr_dev(span11, "class", "codeBlue");
    			add_location(span11, file$1, 57, 17, 3018);
    			attr_dev(p2, "class", "insideObj codeGreen svelte-ta87hr");
    			add_location(p2, file$1, 48, 12, 2458);
    			attr_dev(span12, "class", "codeOrange");
    			add_location(span12, file$1, 64, 12, 3373);
    			attr_dev(li2, "class", "work");
    			add_location(li2, file$1, 46, 8, 2374);
    			attr_dev(span13, "class", "codeBlue");
    			add_location(span13, file$1, 69, 20, 3572);
    			attr_dev(a5, "target", "_blank");
    			attr_dev(a5, "rel", "noopener");
    			attr_dev(a5, "href", "https://vt1022.github.io/characterSelection/");
    			attr_dev(a5, "aria-label", "div craft");
    			add_location(a5, file$1, 70, 16, 3621);
    			attr_dev(span14, "class", "codeBlue");
    			add_location(span14, file$1, 72, 17, 3791);
    			add_location(br2, file$1, 73, 16, 3840);
    			attr_dev(span15, "class", "codeBlue");
    			add_location(span15, file$1, 74, 20, 3868);
    			attr_dev(a6, "target", "_blank");
    			attr_dev(a6, "rel", "noopener");
    			attr_dev(a6, "href", "https://github.com/vt1022/characterSelection");
    			attr_dev(a6, "aria-label", "div craft code repo");
    			add_location(a6, file$1, 75, 16, 3917);
    			attr_dev(span16, "class", "codeBlue");
    			add_location(span16, file$1, 82, 17, 4197);
    			attr_dev(p3, "class", "insideObj codeGreen svelte-ta87hr");
    			add_location(p3, file$1, 68, 12, 3519);
    			attr_dev(span17, "class", "codeOrange");
    			add_location(span17, file$1, 89, 12, 4579);
    			attr_dev(li3, "class", "work");
    			add_location(li3, file$1, 66, 8, 3436);
    			attr_dev(ul, "class", "workList bodyFont svelte-ta87hr");
    			add_location(ul, file$1, 7, 4, 279);
    			attr_dev(section, "class", "work container svelte-ta87hr");
    			add_location(section, file$1, 6, 0, 206);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, ul);
    			append_dev(ul, li0);
    			mount_component(objectdeclaration0, li0, null);
    			append_dev(li0, t0);
    			append_dev(li0, p0);
    			append_dev(p0, t1);
    			append_dev(p0, span0);
    			append_dev(p0, t3);
    			append_dev(p0, a0);
    			append_dev(p0, span1);
    			append_dev(p0, t6);
    			append_dev(p0, br0);
    			append_dev(p0, t7);
    			append_dev(p0, span2);
    			append_dev(p0, t9);
    			append_dev(p0, a1);
    			append_dev(p0, span3);
    			append_dev(p0, t12);
    			mount_component(objectline0, p0, null);
    			append_dev(p0, t13);
    			mount_component(objectline1, p0, null);
    			append_dev(li0, t14);
    			append_dev(li0, span4);
    			append_dev(ul, t16);
    			append_dev(ul, li1);
    			mount_component(objectdeclaration1, li1, null);
    			append_dev(li1, t17);
    			append_dev(li1, p1);
    			append_dev(p1, t18);
    			append_dev(p1, span5);
    			append_dev(p1, t20);
    			append_dev(p1, a2);
    			append_dev(p1, span6);
    			append_dev(p1, t23);
    			mount_component(objectline2, p1, null);
    			append_dev(p1, t24);
    			mount_component(objectline3, p1, null);
    			append_dev(p1, t25);
    			mount_component(objectline4, p1, null);
    			append_dev(li1, t26);
    			append_dev(li1, span7);
    			append_dev(ul, t28);
    			append_dev(ul, li2);
    			mount_component(objectdeclaration2, li2, null);
    			append_dev(li2, t29);
    			append_dev(li2, p2);
    			append_dev(p2, t30);
    			append_dev(p2, span8);
    			append_dev(p2, t32);
    			append_dev(p2, a3);
    			append_dev(p2, span9);
    			append_dev(p2, t35);
    			append_dev(p2, br1);
    			append_dev(p2, t36);
    			append_dev(p2, span10);
    			append_dev(p2, t38);
    			append_dev(p2, a4);
    			append_dev(p2, span11);
    			append_dev(p2, t41);
    			mount_component(objectline5, p2, null);
    			append_dev(p2, t42);
    			mount_component(objectline6, p2, null);
    			append_dev(li2, t43);
    			append_dev(li2, span12);
    			append_dev(ul, t45);
    			append_dev(ul, li3);
    			mount_component(objectdeclaration3, li3, null);
    			append_dev(li3, t46);
    			append_dev(li3, p3);
    			append_dev(p3, t47);
    			append_dev(p3, span13);
    			append_dev(p3, t49);
    			append_dev(p3, a5);
    			append_dev(p3, span14);
    			append_dev(p3, t52);
    			append_dev(p3, br2);
    			append_dev(p3, t53);
    			append_dev(p3, span15);
    			append_dev(p3, t55);
    			append_dev(p3, a6);
    			append_dev(p3, span16);
    			append_dev(p3, t58);
    			mount_component(objectline7, p3, null);
    			append_dev(p3, t59);
    			mount_component(objectline8, p3, null);
    			append_dev(li3, t60);
    			append_dev(li3, span17);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(objectdeclaration0.$$.fragment, local);
    			transition_in(objectline0.$$.fragment, local);
    			transition_in(objectline1.$$.fragment, local);
    			transition_in(objectdeclaration1.$$.fragment, local);
    			transition_in(objectline2.$$.fragment, local);
    			transition_in(objectline3.$$.fragment, local);
    			transition_in(objectline4.$$.fragment, local);
    			transition_in(objectdeclaration2.$$.fragment, local);
    			transition_in(objectline5.$$.fragment, local);
    			transition_in(objectline6.$$.fragment, local);
    			transition_in(objectdeclaration3.$$.fragment, local);
    			transition_in(objectline7.$$.fragment, local);
    			transition_in(objectline8.$$.fragment, local);

    			if (!section_intro) {
    				add_render_callback(() => {
    					section_intro = create_in_transition(section, fly, { x: 300, duration: 500 });
    					section_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(objectdeclaration0.$$.fragment, local);
    			transition_out(objectline0.$$.fragment, local);
    			transition_out(objectline1.$$.fragment, local);
    			transition_out(objectdeclaration1.$$.fragment, local);
    			transition_out(objectline2.$$.fragment, local);
    			transition_out(objectline3.$$.fragment, local);
    			transition_out(objectline4.$$.fragment, local);
    			transition_out(objectdeclaration2.$$.fragment, local);
    			transition_out(objectline5.$$.fragment, local);
    			transition_out(objectline6.$$.fragment, local);
    			transition_out(objectdeclaration3.$$.fragment, local);
    			transition_out(objectline7.$$.fragment, local);
    			transition_out(objectline8.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(objectdeclaration0);
    			destroy_component(objectline0);
    			destroy_component(objectline1);
    			destroy_component(objectdeclaration1);
    			destroy_component(objectline2);
    			destroy_component(objectline3);
    			destroy_component(objectline4);
    			destroy_component(objectdeclaration2);
    			destroy_component(objectline5);
    			destroy_component(objectline6);
    			destroy_component(objectdeclaration3);
    			destroy_component(objectline7);
    			destroy_component(objectline8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Work', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Work> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fly, ObjectDeclaration, ObjectLine });
    	return [];
    }

    class Work extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Work",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const theme = {
        // codePurple: '#8574CB',
        // codeRed: '#8E3543',
        // codeGreen: '#7E9D6F',
        dark: {
            primary: '#55ccc0',
            secondary: '#8574CB',
            softBlack: '#252525',
            mediumGrey: '#666',
            bg: '#222',
            offBg: '#313131',
            bodyFont: '#eee',
            codePurple: '#8574CB',
            codeRed: '#ff6133',
            codeGreen: '#acde61',
            codeBlue: '#33ccff',
            codeOrange: '#ffcc00'
        },
        light: {
            primary: '#7258e0',
            secondary: '#55ccc0',
            softBlack: '#252525',
            mediumGrey: '#888',
            bg: '#fff',
            offBg: '#ccc',
            bodyFont: '#212121',
            codePurple: '#7258e0',
            codeRed: '#AD0000',
            codeGreen: '#2E5C00',
            codeBlue: '#025F7E',
            codeOrange: '#AD5700'
        }
    };

    /* src\App.svelte generated by Svelte v3.50.1 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (29:4) {:else}
    function create_else_block(ctx) {
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(29:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:40) 
    function create_if_block_1(ctx) {
    	let work;
    	let current;
    	work = new Work({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(work.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(work, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(work.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(work.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(work, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(27:40) ",
    		ctx
    	});

    	return block;
    }

    // (25:4) {#if activePage === Pages.about}
    function create_if_block(ctx) {
    	let about;
    	let current;
    	about = new About({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(about.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(about, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(about, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(25:4) {#if activePage === Pages.about}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	header = new Header({
    			props: {
    				activePage: /*activePage*/ ctx[2],
    				isDarkTheme: /*isDarkTheme*/ ctx[1]
    			},
    			$$inline: true
    		});

    	header.$on("pageChange", /*changePage*/ ctx[5]);
    	header.$on("themeChange", /*changeTheme*/ ctx[4]);
    	const if_block_creators = [create_if_block, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*activePage*/ ctx[2] === /*Pages*/ ctx[0].about) return 0;
    		if (/*activePage*/ ctx[2] === /*Pages*/ ctx[0].work) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t = space();
    			if_block.c();
    			attr_dev(main, "style", /*themeCssVars*/ ctx[3]);
    			attr_dev(main, "class", "svelte-7wjm4p");
    			add_location(main, file, 21, 0, 772);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const header_changes = {};
    			if (dirty & /*activePage*/ 4) header_changes.activePage = /*activePage*/ ctx[2];
    			if (dirty & /*isDarkTheme*/ 2) header_changes.isDarkTheme = /*isDarkTheme*/ ctx[1];
    			header.$set(header_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}

    			if (!current || dirty & /*themeCssVars*/ 8) {
    				attr_dev(main, "style", /*themeCssVars*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let isDarkTheme;
    	let themeCssVars;
    	let activePage;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	var Pages;

    	(function (Pages) {
    		Pages[Pages["home"] = 0] = "home";
    		Pages[Pages["work"] = 1] = "work";
    		Pages[Pages["about"] = 2] = "about";
    	})(Pages || (Pages = {}));

    	const changeTheme = e => $$invalidate(1, isDarkTheme = !e.detail);
    	const changePage = e => $$invalidate(2, activePage = e.detail);
    	console.log(`Thanks for looking ¯\\(°‿o)/¯`);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		Home,
    		About,
    		Work,
    		theme,
    		Pages,
    		changeTheme,
    		changePage,
    		activePage,
    		isDarkTheme,
    		themeCssVars
    	});

    	$$self.$inject_state = $$props => {
    		if ('Pages' in $$props) $$invalidate(0, Pages = $$props.Pages);
    		if ('activePage' in $$props) $$invalidate(2, activePage = $$props.activePage);
    		if ('isDarkTheme' in $$props) $$invalidate(1, isDarkTheme = $$props.isDarkTheme);
    		if ('themeCssVars' in $$props) $$invalidate(3, themeCssVars = $$props.themeCssVars);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isDarkTheme*/ 2) {
    			$$invalidate(3, themeCssVars = Object.entries(isDarkTheme ? theme.dark : theme.light).map(([key, value]) => `--${key}:${value}`).join(';'));
    		}

    		if ($$self.$$.dirty & /*Pages*/ 1) {
    			$$invalidate(2, activePage = Pages.home);
    		}
    	};

    	$$invalidate(1, isDarkTheme = true);
    	return [Pages, isDarkTheme, activePage, themeCssVars, changeTheme, changePage];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
