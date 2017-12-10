/// <reference path="../typings/index.d.ts" />

/**
 * This creates a responsive environment by listening to each controller that is connected. 
 * It is strongly recommended to use it with progressive-controls component (Comes with superhands)
 *  
 * List of supported controllers:
 *  ['daydream-controls', 'gearvr-controls', 'oculus-touch-controls',
 *  'vive-controls', 'windows-motion-controls', 'default'];
 * 
 * Thanks to wmurphyrd for his awesome progressive-controls component:
 * https://github.com/wmurphyrd/aframe-super-hands-component/blob/2b59338672ae6f24a9663a8528dbe770ed121c33/misc_components/progressive-controls.js 
 */
/**
 * Note, if you're asking why am I passing `this` to each of the parameters,
 * it's because that's how TypeScript statically check the functions. 
 */

 /**
  * interface ControllerAttrProps:
  * This is the supposed format that people are supposed to pass
  * the data. Remember, they need to be enclosed in double quotes "".
  * This applies values and keys altogether. 
  */
  interface ControllerAttrProps {
    attr: string;
    value: string[];
  }
  
  interface Data {
    controller: AFrame.Entity;
    _default: ControllerAttrProps[];
    vive: ControllerAttrProps[];
    oculus: ControllerAttrProps[];
    daydream: ControllerAttrProps[];
    gearvr: ControllerAttrProps[];
    windows: ControllerAttrProps[];
  }
  
  interface DetectController extends AFrame.Component {
  
    data: Data;
    controlMap: Map<string, ControllerAttrProps[]>;
    activeController: string;
    /**
     * https://stackoverflow.com/a/46679810/1057052
     * What we're doing is that we're setting the default property
     * only if there hasn't been any controllers connected. 
     * 
     * For that we need the whole scene to load. We do this by triggering
     * it in the play() command. 
     */
    hasSetup : boolean;
    mapControllers(): void;
    getControllerProp(activeControllerProp: ControllerAttrProps[]);
    setProp(activeController: string);
    removeProp(this: DetectController);
    processControllerConnection(evt);
    addEventListeners(controller : AFrame.Entity); 
    removeEventListeners(controller : AFrame.Entity); 
    updateControllerData(controllerProp, oldDataController : ControllerAttrProps[], 
                         dataController : ControllerAttrProps[]);
  
  }
  
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
      console.log(`Please, check that both the properties and values
                   are using double quotes, instead of single quotes. This
                   uses JSON.parse() to get it.
                   `);
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
      _default: { type: 'string', parse: value =>  responsiveParseFunction(value) },
      vive: { type: 'string', parse: value =>  responsiveParseFunction(value) },
      oculus: { type: 'string', parse: value =>  responsiveParseFunction(value) },
      daydream: { type: 'string', parse: value =>  responsiveParseFunction(value) },
      gearvr: { type: 'string', parse: value =>  responsiveParseFunction(value) },
      windows: { type: 'string', parse: value =>  responsiveParseFunction(value) },
    },
  
    init(this: DetectController) {
      this.hasSetup = false;
      if (!this.data._default || this.data._default.length === 0) {
        console.warn('You need to specify at least a default property');
        return;
      }
      const controller = this.data.controller;
      this.addEventListeners(controller);
      this.mapControllers();
    },
  
  
    update(this: DetectController,  oldData: Data) {
      // Check if controller has changed, and remove them
      // from the old.
      // If `oldData` is empty, then this means we're in the initialization process.
      // No need to update.
      if (Object.keys(oldData).length === 0) { return; }
  
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
    updateControllerData(this: DetectController, controllerProp, 
                         oldDataController : ControllerAttrProps[], 
                         dataController : ControllerAttrProps[]) {
      // It has a different length, hence it has changed.
      if (controllerProp.length !== dataController.length) {
        this.controlMap.set(controllerProp, dataController);
        return;
      }
  
      // We now do a deep comparison:
      // Note, we already assume they have equal length!
      let areDifferent = false;
      for (let i = 0; i < oldDataController.length; i += 1) {
        if (oldDataController[i].attr !== dataController[i].attr
            || oldDataController[i].value !== dataController[i].value) {
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
    play(this: DetectController) {
      if (this.hasSetup || !this.data._default || this.data._default.length === 0) return;
      this.setProp('default');
      this.hasSetup = true;
    },
  
    /**
     * Adds the required EventListeners.
     * @param this 
     * @param controller 
     */
    addEventListeners(this: DetectController,  controller : AFrame.Entity) {
      if (!controller) {
        console.warn(`There are no controllers to look for. 
        Please add a controllerSelector property to continue, and match the controllers.`);
        return;
      }
      controller.addEventListener('controllerconnected', this.processControllerConnection.bind(this));
      controller.addEventListener('controllerdisconnected',
                                  this.processControllerConnection.bind(this));
    },
  
    removeEventListeners(this: DetectController, controller : AFrame.Entity) {
      // Do not do any warnings, it means that it doesn't exist anymore...
      if (!controller) return;
  
      controller.removeEventListener('controllerconnected', 
                                     this.processControllerConnection.bind(this));
      controller.removeEventListener('controllerdisconnected',
                                     this.processControllerConnection.bind(this));
    },
  
    // This maps all the controllers.
    mapControllers(this: DetectController) {
      const controlMap = new Map<string, ControllerAttrProps[]>();
      
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
    getControllerProp(this: DetectController, activeControllerProp: ControllerAttrProps[]) {
      return activeControllerProp.length > 0 ? activeControllerProp : this.data._default;
    },
  
    /**
     * Sets the property for the active controller.
     * @param activeController The name of the controller that is active.
     */
    setProp(this: DetectController, activeController: string) {
      // Removes the previous property:
      this.controlMap.get(activeController).forEach((attrProp) => {
        const allProps = attrProp.value.join(';');
        this.el.setAttribute(attrProp.attr, allProps);
      });
      this.activeController = activeController;
    },
  
    // Removes the previous property:
    removeProp(this: DetectController) {
      const activeController = this.activeController;
      if (activeController) return;
      this.controlMap.get(activeController)
        .forEach((attrProp) => {
          this.el.removeAttribute(attrProp.attr);
        });
    },
  
    processControllerConnection(this: DetectController, evt) {
      this.hasSetup = true;
      // console.log('OK CONTROLLER CONENCTED');
      const activeController = evt.detail.name as string;
      // console.log('Controller connected is:' + activeController);
      this.setProp(activeController);
    },
  });
  