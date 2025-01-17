/* ========================================================================
 * Bootstrap: transition.js v3.3.5
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
    'use strict';

    // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
    // ============================================================

    function transitionEnd() {
        let el = document.createElement('bootstrap');

        let transEndEventNames = {
            WebkitTransition: 'webkitTransitionEnd',
            MozTransition: 'transitionend',
            OTransition: 'oTransitionEnd otransitionend',
            transition: 'transitionend'
        };

        for (let name in transEndEventNames) {
            if (el.style[name] !== undefined) {
                return {end: transEndEventNames[name]}
            }
        }

        return false // explicit for ie8 (  ._.)
    }

    // http://blog.alexmaccaw.com/css-transitions
    $.fn.emulateTransitionEnd = function (duration) {
        let called = false;
        let $el = this;
        $(this).one('bsTransitionEnd', function () {
            called = true
        });
        let callback = function () {
            if (!called) $($el).trigger($.support.transition.end)
        };
        setTimeout(callback, duration);
        return this
    };

    $(function () {
        $.support.transition = transitionEnd();

        if (!$.support.transition) return;

        $.event.special.bsTransitionEnd = {
            bindType: $.support.transition.end,
            delegateType: $.support.transition.end,
            handle: function (e) {
                if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
            }
        }
    })

}(jQuery);

/* ========================================================================
 * Bootstrap: modal.js v3.3.7
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {


    'use strict';

    // MODAL CLASS DEFINITION
    // ======================


    let Modal = function (element, options) {
        this.options = options;
        this.$body = $(document.body);
        this.$element = $(element);
        this.$dialog = this.$element.find('.modal-dialog');
        this.$backdrop = null;
        this.isShown = null;
        this.originalBodyPad = null;
        this.scrollbarWidth = 0;
        this.ignoreBackdropClick = false;

        if (this.options.remote) {
            this.$element
                .find('.modal-content')
                .load(this.options.remote, $.proxy(function () {
                    this.$element.trigger('loaded.bs.modal')
                }, this))
        }
    };

    Modal.VERSION = '3.3.7';

    Modal.TRANSITION_DURATION = 300;
    Modal.BACKDROP_TRANSITION_DURATION = 150;

    Modal.DEFAULTS = {
        backdrop: true,
        keyboard: true,
        show: true
    };

    Modal.prototype.toggle = function (_relatedTarget) {
        return this.isShown ? this.hide() : this.show(_relatedTarget)
    };

    Modal.prototype.show = function (_relatedTarget) {
        let that = this;
        let e = $.Event('show.bs.modal', {relatedTarget: _relatedTarget});

        this.$element.trigger(e);

        if (this.isShown || e.isDefaultPrevented()) return;

        this.isShown = true;

        this.checkScrollbar();
        this.setScrollbar();
        this.$body.addClass('modal-open');

        this.escape();
        this.resize();

        this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this));

        this.$dialog.on('mousedown.dismiss.bs.modal', function () {
            that.$element.one('mouseup.dismiss.bs.modal', function (e) {
                if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true
            })
        });

        this.backdrop(function () {
            let transition = $.support.transition && that.$element.hasClass('fade');

            if (!that.$element.parent().length) {
                that.$element.appendTo(that.$body) // don't move modals dom position
            }

            that.$element
                .show()
                .scrollTop(0);

            that.adjustDialog();

            if (transition) {
                that.$element[0].offsetWidth // force reflow
            }

            that.$element.addClass('in');

            that.enforceFocus();

            let e = $.Event('shown.bs.modal', {relatedTarget: _relatedTarget});

            transition ?
                that.$dialog // wait for modal to slide in
                    .one('bsTransitionEnd', function () {
                        that.$element.trigger('focus').trigger(e)
                    })
                    .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
                that.$element.trigger('focus').trigger(e)
        })
    };

    Modal.prototype.hide = function (e) {
        if (e) e.preventDefault();

        e = $.Event('hide.bs.modal');

        this.$element.trigger(e);

        if (!this.isShown || e.isDefaultPrevented()) return;

        this.isShown = false;

        this.escape();
        this.resize();

        $(document).off('focusin.bs.modal');

        this.$element
            .removeClass('in')
            .off('click.dismiss.bs.modal')
            .off('mouseup.dismiss.bs.modal');

        this.$dialog.off('mousedown.dismiss.bs.modal');

        $.support.transition && this.$element.hasClass('fade') ?
            this.$element
                .one('bsTransitionEnd', $.proxy(this.hideModal, this))
                .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
            this.hideModal()
    };

    Modal.prototype.enforceFocus = function () {
        $(document)
            .off('focusin.bs.modal') // guard against infinite focus loop
            .on('focusin.bs.modal', $.proxy(function (e) {
                if (document !== e.target &&
                    this.$element[0] !== e.target &&
                    !this.$element.has(e.target).length) {
                    this.$element.trigger('focus')
                }
            }, this))
    };

    Modal.prototype.escape = function () {
        if (this.isShown && this.options.keyboard) {
            this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
                e.which == 27 && this.hide()
            }, this))
        } else if (!this.isShown) {
            this.$element.off('keydown.dismiss.bs.modal')
        }
    };

    Modal.prototype.resize = function () {
        if (this.isShown) {
            $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this))
        } else {
            $(window).off('resize.bs.modal')
        }
    };

    Modal.prototype.hideModal = function () {
        let that = this;
        this.$element.hide();
        this.backdrop(function () {
            that.$body.removeClass('modal-open');
            that.resetAdjustments();
            that.resetScrollbar();
            that.$element.trigger('hidden.bs.modal')
        })
    };

    Modal.prototype.removeBackdrop = function () {
        this.$backdrop && this.$backdrop.remove();
        this.$backdrop = null
    };

    Modal.prototype.backdrop = function (callback) {
        let that = this;
        let animate = this.$element.hasClass('fade') ? 'fade' : '';

        if (this.isShown && this.options.backdrop) {
            let doAnimate = $.support.transition && animate;

            this.$backdrop = $(document.createElement('div'))
                .addClass('modal-backdrop ' + animate)
                .appendTo(this.$body);

            this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
                if (this.ignoreBackdropClick) {
                    this.ignoreBackdropClick = false;
                    return
                }
                if (e.target !== e.currentTarget) return;
                this.options.backdrop == 'static'
                    ? this.$element[0].focus()
                    : this.hide()
            }, this));

            if (doAnimate) this.$backdrop[0].offsetWidth; // force reflow

            this.$backdrop.addClass('in');

            if (!callback) return;

            doAnimate ?
                this.$backdrop
                    .one('bsTransitionEnd', callback)
                    .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
                callback()

        } else if (!this.isShown && this.$backdrop) {
            this.$backdrop.removeClass('in');

            let callbackRemove = function () {
                that.removeBackdrop();
                callback && callback()
            };
            $.support.transition && this.$element.hasClass('fade') ?
                this.$backdrop
                    .one('bsTransitionEnd', callbackRemove)
                    .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
                callbackRemove()

        } else if (callback) {
            callback()
        }
    };

    // these following methods are used to handle overflowing modals

    Modal.prototype.handleUpdate = function () {
        this.adjustDialog()
    };

    Modal.prototype.adjustDialog = function () {
        let modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight;

        this.$element.css({
            paddingLeft: !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
            paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
        })
    };

    Modal.prototype.resetAdjustments = function () {
        this.$element.css({
            paddingLeft: '',
            paddingRight: ''
        })
    };

    Modal.prototype.checkScrollbar = function () {
        let fullWindowWidth = window.innerWidth;
        if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
            let documentElementRect = document.documentElement.getBoundingClientRect();
            fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
        }
        this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
        this.scrollbarWidth = this.measureScrollbar()
    };

    Modal.prototype.setScrollbar = function () {
        let bodyPad = parseInt((this.$body.css('padding-right') || 0), 10);
        this.originalBodyPad = document.body.style.paddingRight || '';
        if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
    };

    Modal.prototype.resetScrollbar = function () {
        this.$body.css('padding-right', this.originalBodyPad)
    };

    Modal.prototype.measureScrollbar = function () { // thx walsh
        let scrollDiv = document.createElement('div');
        scrollDiv.className = 'modal-scrollbar-measure';
        this.$body.append(scrollDiv);
        let scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        this.$body[0].removeChild(scrollDiv);
        return scrollbarWidth
    };


    // MODAL PLUGIN DEFINITION
    // =======================

    function Plugin(option, _relatedTarget) {
        return this.each(function () {
            let $this = $(this);
            let data = $this.data('bs.modal');
            let options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('bs.modal', (data = new Modal(this, options)));
            if (typeof option == 'string') data[option](_relatedTarget);
            else if (options.show) data.show(_relatedTarget)
        })
    }

    let old = $.fn.modal;

    $.fn.modal = Plugin;
    $.fn.modal.Constructor = Modal;


    // MODAL NO CONFLICT
    // =================

    $.fn.modal.noConflict = function () {
        $.fn.modal = old;
        return this
    };


    // MODAL DATA-API
    // ==============

    $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
        let $this = $(this);
        let href = $this.attr('href');
        let $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))); // strip for ie7
        let option = $target.data('bs.modal') ? 'toggle' : $.extend({remote: !/#/.test(href) && href}, $target.data(), $this.data());

        if ($this.is('a')) e.preventDefault();

        $target.one('show.bs.modal', function (showEvent) {
            if (showEvent.isDefaultPrevented()) return; // only register focus restorer if modal will actually get shown
            $target.one('hidden.bs.modal', function () {
                $this.is(':visible') && $this.trigger('focus')
            })
        });
        Plugin.call($target, option, this)
    })

}(jQuery);
