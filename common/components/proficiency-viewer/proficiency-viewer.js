'use strict';

angular.module('knowhub')
    .component('proficiencyViewer', {
        bindings: {
            levels: '<',
            proficiency: '<',
            showProficiencyLabel: '<?'
        },
        templateUrl: 'common/components/proficiency-viewer/proficiency-viewer.html',
        controller: function proficiencyViewerController() {

            let $ctrl = this;

            $ctrl.$onInit = function () {
            };

            $ctrl.$onChanges = function (changes) {
                if (changes.proficiency) {
                    $ctrl.proficiencyIndex = $ctrl.levels.indexOf($ctrl.proficiency);
                }
            };

        }
    });