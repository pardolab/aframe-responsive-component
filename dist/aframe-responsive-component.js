'use strict';

/// <reference path="../typings/index.d.ts" />
/**
 * Parses the string using JSON.parse into an array pair of attributes and
 * values, that will be inserted to the element once the controller is
 * detected.
 *
 * We use this because A-Frame doesn't have a property that allows me to pass
 * Array with objects inside of it (It parses it as strings).
 *
 * We also can't include semi-colon ; because it will parse the string into
 * individual characters!
 *
 * @param value form of: [{"attr":"myComponent", "value" :"[myComponentProp:a,
 *                                                myComponentSecondProp:b]"}]
 */
function responsiveParseFunction(value) {
    if (!value || value.length === 0) return [];
    try {
        return JSON.parse(value);
    } catch (e) {
        console.log('Please, check that both the properties and values\n                   are using double quotes, instead of single quotes. This\n                   uses JSON.parse() to get it.\n                   ');
        console.log(e.message);
        return [];
    }
}
/**
 * Registers the component.
 */
AFRAME.registerComponent('responsive', {
    // dependencies: ['progressive-controls'],
    schema: {
        controller: { type: 'selector' },
        // Can't use default because it was conflicting with A-Frame. 
        // Default will be the default property for each of the other 
        // controllers in case they aren't specified.
        _default: { type: 'string', parse: function parse(value) {
                return responsiveParseFunction(value);
            } },
        vive: { type: 'string', parse: function parse(value) {
                return responsiveParseFunction(value);
            } },
        oculus: { type: 'string', parse: function parse(value) {
                return responsiveParseFunction(value);
            } },
        daydream: { type: 'string', parse: function parse(value) {
                return responsiveParseFunction(value);
            } },
        gearvr: { type: 'string', parse: function parse(value) {
                return responsiveParseFunction(value);
            } },
        windows: { type: 'string', parse: function parse(value) {
                return responsiveParseFunction(value);
            } }
    },
    init: function init() {
        this.hasSetup = false;
        if (!this.data._default || this.data._default.length === 0) {
            console.warn('You need to specify at least a default property');
            return;
        }
        var controller = this.data.controller;
        this.addEventListeners(controller);
        this.mapControllers();
    },
    update: function update(oldData) {
        // Check if controller has changed, and remove them
        // from the old.
        // If `oldData` is empty, then this means we're in the initialization process.
        // No need to update.
        if (Object.keys(oldData).length === 0) {
            return;
        }
        if (oldData.controller.object3D.uuid !== this.data.controller.object3D.uuid) {
            this.removeEventListeners(oldData.controller);
            this.addEventListeners(this.data.controller);
        }
        this.updateControllerData('daydream-controls', oldData.daydream, this.data.daydream);
        this.updateControllerData('gearvr-controls', oldData.gearvr, this.data.gearvr);
        this.updateControllerData('oculus-touch-controls', oldData.oculus, this.data.oculus);
        this.updateControllerData('vive-controls', oldData.vive, this.data.vive);
        this.updateControllerData('windows-motion-controls', oldData.windows, this.data.windows);
    },

    // I wish to use Immutable.js but we don't want to run with
    // any dependencies.
    updateControllerData: function updateControllerData(controllerProp, oldDataController, dataController) {
        // It has a different length, hence it has changed.
        if (controllerProp.length !== dataController.length) {
            this.controlMap.set(controllerProp, dataController);
            return;
        }
        // We now do a deep comparison:
        // Note, we already assume they have equal length!
        var areDifferent = false;
        for (var i = 0; i < oldDataController.length; i += 1) {
            if (oldDataController[i].attr !== dataController[i].attr || oldDataController[i].value !== dataController[i].value) {
                areDifferent = true;
                break;
            }
        }
        if (!areDifferent) return;
        this.controlMap.set(controllerProp, this.getControllerProp(dataController));
    },

    /**
     * This will set the property as default in case there
     * are no controllers. We need to be sure for that,
     * so we see if this.hasSetup hasn't been changed by
     * the controller's Event Listeners from the init() property.
     */
    play: function play() {
        if (this.hasSetup || !this.data._default || this.data._default.length === 0) return;
        this.setProp('default');
        this.hasSetup = true;
    },

    /**
     * Adds the required EventListeners.
     * @param this
     * @param controller
     */
    addEventListeners: function addEventListeners(controller) {
        if (!controller) {
            console.warn('There are no controllers to look for. \n        Please add a controllerSelector property to continue, and match the controllers.');
            return;
        }
        controller.addEventListener('controllerconnected', this.processControllerConnection.bind(this));
        controller.addEventListener('controllerdisconnected', this.processControllerConnection.bind(this));
    },
    removeEventListeners: function removeEventListeners(controller) {
        // Do not do any warnings, it means that it doesn't exist anymore...
        if (!controller) return;
        controller.removeEventListener('controllerconnected', this.processControllerConnection.bind(this));
        controller.removeEventListener('controllerdisconnected', this.processControllerConnection.bind(this));
    },

    // This maps all the controllers.
    mapControllers: function mapControllers() {
        var controlMap = new Map();
        controlMap.set('daydream-controls', this.getControllerProp(this.data.daydream));
        controlMap.set('gearvr-controls', this.getControllerProp(this.data.gearvr));
        controlMap.set('oculus-touch-controls', this.getControllerProp(this.data.oculus));
        controlMap.set('vive-controls', this.getControllerProp(this.data.vive));
        controlMap.set('windows-motion-controls', this.getControllerProp(this.data.windows));
        controlMap.set('default', this.getControllerProp(this.data._default));
        this.controlMap = controlMap;
    },

    // Will get the specified controller property
    // or it will return the default.
    getControllerProp: function getControllerProp(activeControllerProp) {
        return activeControllerProp.length > 0 ? activeControllerProp : this.data._default;
    },

    /**
     * Sets the property for the active controller.
     * @param activeController The name of the controller that is active.
     */
    setProp: function setProp(activeController) {
        var _this = this;

        // Removes the previous property:
        this.controlMap.get(activeController).forEach(function (attrProp) {
            var allProps = attrProp.value.join(';');
            _this.el.setAttribute(attrProp.attr, allProps);
        });
        this.activeController = activeController;
    },

    // Removes the previous property:
    removeProp: function removeProp() {
        var _this2 = this;

        var activeController = this.activeController;
        if (activeController) return;
        this.controlMap.get(activeController).forEach(function (attrProp) {
            _this2.el.removeAttribute(attrProp.attr);
        });
    },
    processControllerConnection: function processControllerConnection(evt) {
        this.hasSetup = true;
        // console.log('OK CONTROLLER CONENCTED');
        var activeController = evt.detail.name;
        // console.log('Controller connected is:' + activeController);
        this.setProp(activeController);
    }
});