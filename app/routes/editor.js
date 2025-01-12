import $ from 'jquery';
import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {htmlSafe} from '@ember/template';
import {run} from '@ember/runloop';
import {inject as service} from '@ember/service';

export default AuthenticatedRoute.extend({
    feature: service(),
    notifications: service(),
    userAgent: service(),
    ui: service(),

    classNames: ['editor'],

    activate() {
        this._super(...arguments);
        this.ui.set('isFullScreen', true);
    },

    setupController() {
        this._super(...arguments);

        // edge has known issues
        if (this.userAgent.browser.isEdge && this.userAgent.parser.getEngine().name === 'EdgeHTML') {
            this.notifications.showAlert(
                htmlSafe('Microsoft Edge is not currently supported. Please use a recent version of Chrome/Firefox/Safari.'),
                {type: 'info', key: 'koenig.browserSupport'}
            );
        }
    },

    deactivate() {
        this._super(...arguments);
        this.ui.set('isFullScreen', false);
    },

    actions: {
        save() {
            this._blurAndScheduleAction(function () {
                this.controller.send('save');
            });
        },

        authorizationFailed() {
            this.controller.send('toggleReAuthenticateModal');
        },

        willTransition(transition) {
            // exit early if an upgrade is required because our extended route
            // class will abort the transition and show an error
            if (this.get('upgradeStatus.isRequired')) {
                return this._super(...arguments);
            }

            this.controller.willTransition(transition);
        }
    },

    buildRouteInfoMetadata() {
        return {
            titleToken: () => {
                return this.get('controller.post.title') || 'Editor';
            },
            bodyClasses: ['gh-body-fullscreen'],
            mainClasses: ['gh-main-white']
        };
    },

    _blurAndScheduleAction(func) {
        let selectedElement = $(document.activeElement);

        // TODO: we should trigger a blur for textareas as well as text inputs
        if (selectedElement.is('input[type="text"]')) {
            selectedElement.trigger('focusout');
        }

        // wait for actions triggered by the focusout to finish before saving
        run.scheduleOnce('actions', this, func);
    }
});
