
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
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
            flush_render_callbacks($$.after_update);
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
            ctx: [],
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
            if (!is_function(callback)) {
                return noop;
            }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    /* src/components/Sidebar.svelte generated by Svelte v3.59.2 */

    const file$5 = "src/components/Sidebar.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (30:6) {#each menuItems as item}
    function create_each_block$2(ctx) {
    	let li;
    	let t_value = /*item*/ ctx[1] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "svelte-25t6bi");
    			add_location(li, file$5, 30, 8, 501);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(30:6) {#each menuItems as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let nav;
    	let ul;
    	let each_value = /*menuItems*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-25t6bi");
    			add_location(ul, file$5, 28, 4, 456);
    			attr_dev(nav, "class", "svelte-25t6bi");
    			add_location(nav, file$5, 27, 2, 446);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*menuItems*/ 1) {
    				each_value = /*menuItems*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
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
    	validate_slots('Sidebar', slots, []);
    	let menuItems = ["Översikt", "Presentationer", "Skapa presentation", "Mallar"];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ menuItems });

    	$$self.$inject_state = $$props => {
    		if ('menuItems' in $$props) $$invalidate(0, menuItems = $$props.menuItems);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [menuItems];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Navbar.svelte generated by Svelte v3.59.2 */

    const file$4 = "src/components/Navbar.svelte";

    function create_fragment$4(ctx) {
    	let header;
    	let div0;
    	let t1;
    	let div1;

    	const block = {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			div0.textContent = "Test";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Exempelbolaget AB";
    			attr_dev(div0, "class", "branding svelte-bvuk");
    			add_location(div0, file$4, 16, 4, 266);
    			add_location(div1, file$4, 17, 4, 303);
    			attr_dev(header, "class", "svelte-bvuk");
    			add_location(header, file$4, 15, 2, 253);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div0);
    			append_dev(header, t1);
    			append_dev(header, div1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
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

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/TabNavigation.svelte generated by Svelte v3.59.2 */

    const file$3 = "src/components/TabNavigation.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (29:4) {#each tabs as tab, index}
    function create_each_block$1(ctx) {
    	let div;
    	let t0_value = /*tab*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*index*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(div, "class", div_class_value = "tab " + (/*activeTab*/ ctx[0] === /*index*/ ctx[6]
    			? 'active'
    			: '') + " svelte-ydop1j");

    			add_location(div, file$3, 29, 6, 523);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*activeTab*/ 1 && div_class_value !== (div_class_value = "tab " + (/*activeTab*/ ctx[0] === /*index*/ ctx[6]
    			? 'active'
    			: '') + " svelte-ydop1j")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(29:4) {#each tabs as tab, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let each_value = /*tabs*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "tabs svelte-ydop1j");
    			add_location(div, file$3, 27, 2, 467);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activeTab, selectTab, tabs*/ 7) {
    				each_value = /*tabs*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    	validate_slots('TabNavigation', slots, []);
    	let tabs = ["1", "2"];
    	let activeTab = 0;

    	function selectTab(index) {
    		$$invalidate(0, activeTab = index);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TabNavigation> was created with unknown prop '${key}'`);
    	});

    	const click_handler = index => selectTab(index);
    	$$self.$capture_state = () => ({ tabs, activeTab, selectTab });

    	$$self.$inject_state = $$props => {
    		if ('tabs' in $$props) $$invalidate(1, tabs = $$props.tabs);
    		if ('activeTab' in $$props) $$invalidate(0, activeTab = $$props.activeTab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [activeTab, tabs, selectTab, click_handler];
    }

    class TabNavigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabNavigation",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/MainContent.svelte generated by Svelte v3.59.2 */

    const file$2 = "src/components/MainContent.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (56:6) {#each groups as group}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*group*/ ctx[10] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*group*/ ctx[10];
    			option.value = option.__value;
    			add_location(option, file$2, 56, 8, 1482);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(56:6) {#each groups as group}",
    		ctx
    	});

    	return block;
    }

    // (63:6) {#each accounts as account}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*account*/ ctx[7] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*account*/ ctx[7];
    			option.value = option.__value;
    			add_location(option, file$2, 63, 8, 1624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(63:6) {#each accounts as account}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div5;
    	let label0;
    	let t1;
    	let input;
    	let t2;
    	let label1;
    	let t4;
    	let select0;
    	let t5;
    	let label2;
    	let t7;
    	let select1;
    	let t8;
    	let button0;
    	let t10;
    	let div0;
    	let strong0;
    	let t12;
    	let p0;
    	let t14;
    	let div1;
    	let strong1;
    	let t16;
    	let p1;
    	let t18;
    	let div2;
    	let strong2;
    	let t20;
    	let p2;
    	let t22;
    	let button1;
    	let t24;
    	let div3;
    	let h3;
    	let t26;
    	let p3;
    	let t28;
    	let div4;
    	let p4;
    	let t30;
    	let p5;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*groups*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*accounts*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			label0 = element("label");
    			label0.textContent = "Ange fliknamn:";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			label1 = element("label");
    			label1.textContent = "Välj grupp:";
    			t4 = space();
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			label2 = element("label");
    			label2.textContent = "Välj konto:";
    			t7 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			button0 = element("button");
    			button0.textContent = "Generera smart text";
    			t10 = space();
    			div0 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Formell och analytisk";
    			t12 = space();
    			p0 = element("p");
    			p0.textContent = `${/*formalText*/ ctx[3]}`;
    			t14 = space();
    			div1 = element("div");
    			strong1 = element("strong");
    			strong1.textContent = "Negativ och varnande";
    			t16 = space();
    			p1 = element("p");
    			p1.textContent = `${/*negativeText*/ ctx[4]}`;
    			t18 = space();
    			div2 = element("div");
    			strong2 = element("strong");
    			strong2.textContent = "Optimistisk och framåtblickande";
    			t20 = space();
    			p2 = element("p");
    			p2.textContent = `${/*optimisticText*/ ctx[5]}`;
    			t22 = space();
    			button1 = element("button");
    			button1.textContent = "Välj den lämpligaste texten ovan genom att klicka på den.";
    			t24 = space();
    			div3 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Förhandsgranska";
    			t26 = space();
    			p3 = element("p");
    			p3.textContent = "Visa presentation...";
    			t28 = space();
    			div4 = element("div");
    			p4 = element("p");
    			p4.textContent = "Det verkar finnas ofullständiga sidor.";
    			t30 = space();
    			p5 = element("p");
    			p5.textContent = "Du bör se över och justera de sidor och flikar som har en röd ram runt sig innan du visar presentationen.";
    			add_location(label0, file$2, 50, 4, 1292);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Ange fliknamn");
    			add_location(input, file$2, 51, 4, 1326);
    			add_location(label1, file$2, 53, 4, 1404);
    			add_location(select0, file$2, 54, 4, 1435);
    			add_location(label2, file$2, 60, 4, 1542);
    			add_location(select1, file$2, 61, 4, 1573);
    			add_location(button0, file$2, 67, 4, 1686);
    			add_location(strong0, file$2, 70, 6, 1782);
    			add_location(p0, file$2, 71, 6, 1827);
    			attr_dev(div0, "class", "text-option svelte-1prauii");
    			add_location(div0, file$2, 69, 4, 1750);
    			add_location(strong1, file$2, 75, 6, 1897);
    			add_location(p1, file$2, 76, 6, 1941);
    			attr_dev(div1, "class", "text-option svelte-1prauii");
    			add_location(div1, file$2, 74, 4, 1865);
    			add_location(strong2, file$2, 80, 6, 2013);
    			add_location(p2, file$2, 81, 6, 2068);
    			attr_dev(div2, "class", "text-option svelte-1prauii");
    			add_location(div2, file$2, 79, 4, 1981);
    			attr_dev(button1, "class", "select-button svelte-1prauii");
    			add_location(button1, file$2, 84, 4, 2110);
    			add_location(h3, file$2, 87, 6, 2242);
    			add_location(p3, file$2, 88, 6, 2273);
    			attr_dev(div3, "class", "preview svelte-1prauii");
    			add_location(div3, file$2, 86, 4, 2214);
    			add_location(p4, file$2, 92, 6, 2347);
    			add_location(p5, file$2, 93, 6, 2399);
    			attr_dev(div4, "class", "warning svelte-1prauii");
    			add_location(div4, file$2, 91, 4, 2319);
    			attr_dev(div5, "class", "content svelte-1prauii");
    			add_location(div5, file$2, 49, 2, 1266);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, label0);
    			append_dev(div5, t1);
    			append_dev(div5, input);
    			set_input_value(input, /*tabName*/ ctx[0]);
    			append_dev(div5, t2);
    			append_dev(div5, label1);
    			append_dev(div5, t4);
    			append_dev(div5, select0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(select0, null);
    				}
    			}

    			append_dev(div5, t5);
    			append_dev(div5, label2);
    			append_dev(div5, t7);
    			append_dev(div5, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(select1, null);
    				}
    			}

    			append_dev(div5, t8);
    			append_dev(div5, button0);
    			append_dev(div5, t10);
    			append_dev(div5, div0);
    			append_dev(div0, strong0);
    			append_dev(div0, t12);
    			append_dev(div0, p0);
    			append_dev(div5, t14);
    			append_dev(div5, div1);
    			append_dev(div1, strong1);
    			append_dev(div1, t16);
    			append_dev(div1, p1);
    			append_dev(div5, t18);
    			append_dev(div5, div2);
    			append_dev(div2, strong2);
    			append_dev(div2, t20);
    			append_dev(div2, p2);
    			append_dev(div5, t22);
    			append_dev(div5, button1);
    			append_dev(div5, t24);
    			append_dev(div5, div3);
    			append_dev(div3, h3);
    			append_dev(div3, t26);
    			append_dev(div3, p3);
    			append_dev(div5, t28);
    			append_dev(div5, div4);
    			append_dev(div4, p4);
    			append_dev(div4, t30);
    			append_dev(div4, p5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(button0, "click", click_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tabName*/ 1 && input.value !== /*tabName*/ ctx[0]) {
    				set_input_value(input, /*tabName*/ ctx[0]);
    			}

    			if (dirty & /*groups*/ 2) {
    				each_value_1 = /*groups*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*accounts*/ 4) {
    				each_value = /*accounts*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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

    const click_handler = () => {
    	
    };

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MainContent', slots, []);
    	let groups = ["Intäkter", "Kostnader"];
    	let accounts = ["Försäljning", "Marknadsföring"];
    	let tabName = "";
    	let formalText = "Omsättningen för december 2024 uppgick till 513 540 kr, en nedgång på 50 % jämfört med december 2023...";
    	let negativeText = "December 2024 steg en dramatisk minskning med 50 %, ner från 1 027 530 kr i december 2023...";
    	let optimisticText = "Trots en nedgång på 50 % i december till 513 540 kr, företaget har en imponerande ökning på 64 %...";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MainContent> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		tabName = this.value;
    		$$invalidate(0, tabName);
    	}

    	$$self.$capture_state = () => ({
    		groups,
    		accounts,
    		tabName,
    		formalText,
    		negativeText,
    		optimisticText
    	});

    	$$self.$inject_state = $$props => {
    		if ('groups' in $$props) $$invalidate(1, groups = $$props.groups);
    		if ('accounts' in $$props) $$invalidate(2, accounts = $$props.accounts);
    		if ('tabName' in $$props) $$invalidate(0, tabName = $$props.tabName);
    		if ('formalText' in $$props) $$invalidate(3, formalText = $$props.formalText);
    		if ('negativeText' in $$props) $$invalidate(4, negativeText = $$props.negativeText);
    		if ('optimisticText' in $$props) $$invalidate(5, optimisticText = $$props.optimisticText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tabName,
    		groups,
    		accounts,
    		formalText,
    		negativeText,
    		optimisticText,
    		input_input_handler
    	];
    }

    class MainContent extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MainContent",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src/ClaudeAPI.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1 } = globals;
    const file$1 = "src/ClaudeAPI.svelte";

    // (89:4) {#if $response}
    function create_if_block_1(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let p;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Response:";
    			t1 = space();
    			p = element("p");
    			t2 = text(/*$response*/ ctx[2]);
    			add_location(h3, file$1, 90, 8, 2200);
    			add_location(p, file$1, 91, 8, 2227);
    			attr_dev(div, "class", "response svelte-1elnsfs");
    			add_location(div, file$1, 89, 6, 2169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$response*/ 4) set_data_dev(t2, /*$response*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(89:4) {#if $response}",
    		ctx
    	});

    	return block;
    }

    // (96:4) {#if $error}
    function create_if_block(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let p;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Error:";
    			t1 = space();
    			p = element("p");
    			t2 = text(/*$error*/ ctx[3]);
    			add_location(h3, file$1, 97, 8, 2323);
    			add_location(p, file$1, 98, 8, 2347);
    			attr_dev(div, "class", "error svelte-1elnsfs");
    			add_location(div, file$1, 96, 6, 2295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$error*/ 8) set_data_dev(t2, /*$error*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(96:4) {#if $error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let textarea;
    	let t2;
    	let button;
    	let t3_value = (/*$loading*/ ctx[1] ? "Generating..." : "Generate Text") + "";
    	let t3;
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$response*/ ctx[2] && create_if_block_1(ctx);
    	let if_block1 = /*$error*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Claude AI Text Generator";
    			t1 = space();
    			textarea = element("textarea");
    			t2 = space();
    			button = element("button");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			if (if_block1) if_block1.c();
    			add_location(h1, file$1, 81, 4, 1898);
    			attr_dev(textarea, "placeholder", "Enter your prompt...");
    			attr_dev(textarea, "class", "svelte-1elnsfs");
    			add_location(textarea, file$1, 83, 4, 1939);
    			button.disabled = /*$loading*/ ctx[1];
    			attr_dev(button, "class", "svelte-1elnsfs");
    			add_location(button, file$1, 84, 4, 2020);
    			attr_dev(div, "class", "container svelte-1elnsfs");
    			add_location(div, file$1, 80, 2, 1870);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, textarea);
    			set_input_value(textarea, /*prompt*/ ctx[0]);
    			append_dev(div, t2);
    			append_dev(div, button);
    			append_dev(button, t3);
    			append_dev(div, t4);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t5);
    			if (if_block1) if_block1.m(div, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[8]),
    					listen_dev(button, "click", /*generateText*/ ctx[7], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*prompt*/ 1) {
    				set_input_value(textarea, /*prompt*/ ctx[0]);
    			}

    			if (dirty & /*$loading*/ 2 && t3_value !== (t3_value = (/*$loading*/ ctx[1] ? "Generating..." : "Generate Text") + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*$loading*/ 2) {
    				prop_dev(button, "disabled", /*$loading*/ ctx[1]);
    			}

    			if (/*$response*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div, t5);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$error*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
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

    const CLAUDE_API_URL = "https://api.anthropic.com/v1/completion";
    const CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY"; // Replace with your actual API key

    function instance$1($$self, $$props, $$invalidate) {
    	let $loading;
    	let $response;
    	let $error;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ClaudeAPI', slots, []);
    	let prompt = "";
    	let response = writable(null);
    	validate_store(response, 'response');
    	component_subscribe($$self, response, value => $$invalidate(2, $response = value));
    	let error = writable(null);
    	validate_store(error, 'error');
    	component_subscribe($$self, error, value => $$invalidate(3, $error = value));
    	let loading = writable(false);
    	validate_store(loading, 'loading');
    	component_subscribe($$self, loading, value => $$invalidate(1, $loading = value));

    	// Function to call Claude AI's API
    	async function generateText() {
    		error.set(null);
    		response.set(null);
    		loading.set(true);

    		const body = JSON.stringify({
    			prompt: `Assistant: ${prompt}\n\nUser:`,
    			max_tokens: 100,
    			model: "claude-2",
    			temperature: 0.7
    		});

    		try {
    			const res = await fetch(CLAUDE_API_URL, {
    				method: "POST",
    				headers: {
    					"Content-Type": "application/json",
    					"Authorization": `Bearer ${CLAUDE_API_KEY}`
    				},
    				body
    			});

    			if (!res.ok) {
    				throw new Error(`API Error: ${res.statusText}`);
    			}

    			const data = await res.json();
    			response.set(data.completion || "No response generated.");
    		} catch(err) {
    			error.set(err.message || "An error occurred.");
    		} finally {
    			loading.set(false);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ClaudeAPI> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		prompt = this.value;
    		$$invalidate(0, prompt);
    	}

    	$$self.$capture_state = () => ({
    		writable,
    		prompt,
    		response,
    		error,
    		loading,
    		CLAUDE_API_URL,
    		CLAUDE_API_KEY,
    		generateText,
    		$loading,
    		$response,
    		$error
    	});

    	$$self.$inject_state = $$props => {
    		if ('prompt' in $$props) $$invalidate(0, prompt = $$props.prompt);
    		if ('response' in $$props) $$invalidate(4, response = $$props.response);
    		if ('error' in $$props) $$invalidate(5, error = $$props.error);
    		if ('loading' in $$props) $$invalidate(6, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		prompt,
    		$loading,
    		$response,
    		$error,
    		response,
    		error,
    		loading,
    		generateText,
    		textarea_input_handler
    	];
    }

    class ClaudeAPI extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClaudeAPI",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div2;
    	let div1;
    	let navbar;
    	let t;
    	let div0;
    	let claudeapi;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	claudeapi = new ClaudeAPI({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			create_component(navbar.$$.fragment);
    			t = space();
    			div0 = element("div");
    			create_component(claudeapi.$$.fragment);
    			attr_dev(div0, "class", "content svelte-e05x2f");
    			add_location(div0, file, 29, 3, 595);
    			attr_dev(div1, "class", "main svelte-e05x2f");
    			add_location(div1, file, 26, 1, 529);
    			attr_dev(div2, "class", "layout svelte-e05x2f");
    			add_location(div2, file, 24, 2, 485);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			mount_component(navbar, div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			mount_component(claudeapi, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(claudeapi.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(claudeapi.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(navbar);
    			destroy_component(claudeapi);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Sidebar,
    		Navbar,
    		TabNavigation,
    		MainContent,
    		ClaudeAPI
    	});

    	return [];
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
