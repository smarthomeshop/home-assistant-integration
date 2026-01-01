function e(e,t,i,o){var n,s=arguments.length,r=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,o);else for(var a=e.length-1;a>=0;a--)(n=e[a])&&(r=(s<3?n(r):s>3?n(t,i,r):n(t,i))||r);return s>3&&r&&Object.defineProperty(t,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),n=new WeakMap;let s=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=n.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(t,e))}return e}toString(){return this.cssText}};const r=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[o+1],e[0]);return new s(i,e,o)},a=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new s("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:l,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:g}=Object,u=globalThis,_=u.trustedTypes,x=_?_.emptyScript:"",v=u.reactiveElementPolyfillSupport,m=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?x:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},f=(e,t)=>!l(e,t),b={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:f};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=b){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(e,i,t);void 0!==o&&d(this.prototype,e,o)}}static getPropertyDescriptor(e,t,i){const{get:o,set:n}=c(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const s=o?.call(this);n?.call(this,t),this.requestUpdate(e,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??b}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const e=g(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const e=this.properties,t=[...h(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(a(e))}else void 0!==e&&t.push(a(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(i)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of o){const o=document.createElement("style"),n=t.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=i.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,i);if(void 0!==o&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(t,i.type);this._$Em=e,null==n?this.removeAttribute(o):this.setAttribute(o,n),this._$Em=null}}_$AK(e,t){const i=this.constructor,o=i._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=i.getPropertyOptions(o),n="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=o;const s=n.fromAttribute(t,e.type);this[o]=s??this._$Ej?.get(o)??s,this._$Em=null}}requestUpdate(e,t,i){if(void 0!==e){const o=this.constructor,n=this[e];if(i??=o.getPropertyOptions(e),!((i.hasChanged??f)(n,t)||i.useDefault&&i.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:o,wrapped:n},s){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==n||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,i,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[m("elementProperties")]=new Map,w[m("finalized")]=new Map,v?.({ReactiveElement:w}),(u.reactiveElementVersions??=[]).push("2.1.1");const $=globalThis,k=$.trustedTypes,P=k?k.createPolicy("lit-html",{createHTML:e=>e}):void 0,z="$lit$",D=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+D,S=`<${M}>`,I=document,T=()=>I.createComment(""),Z=e=>null===e||"object"!=typeof e&&"function"!=typeof e,C=Array.isArray,A="[ \t\n\f\r]",E=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,W=/-->/g,R=/>/g,j=RegExp(`>|${A}(?:([^\\s"'>=/]+)(${A}*=${A}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),H=/'/g,O=/"/g,N=/^(?:script|style|textarea|title)$/i,F=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),L=F(1),U=F(2),G=Symbol.for("lit-noChange"),B=Symbol.for("lit-nothing"),V=new WeakMap,Y=I.createTreeWalker(I,129);function K(e,t){if(!C(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==P?P.createHTML(t):t}const X=(e,t)=>{const i=e.length-1,o=[];let n,s=2===t?"<svg>":3===t?"<math>":"",r=E;for(let t=0;t<i;t++){const i=e[t];let a,l,d=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===E?"!--"===l[1]?r=W:void 0!==l[1]?r=R:void 0!==l[2]?(N.test(l[2])&&(n=RegExp("</"+l[2],"g")),r=j):void 0!==l[3]&&(r=j):r===j?">"===l[0]?(r=n??E,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,a=l[1],r=void 0===l[3]?j:'"'===l[3]?O:H):r===O||r===H?r=j:r===W||r===R?r=E:(r=j,n=void 0);const h=r===j&&e[t+1].startsWith("/>")?" ":"";s+=r===E?i+S:d>=0?(o.push(a),i.slice(0,d)+z+i.slice(d)+D+h):i+D+(-2===d?t:h)}return[K(e,s+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class q{constructor({strings:e,_$litType$:t},i){let o;this.parts=[];let n=0,s=0;const r=e.length-1,a=this.parts,[l,d]=X(e,t);if(this.el=q.createElement(l,i),Y.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=Y.nextNode())&&a.length<r;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(z)){const t=d[s++],i=o.getAttribute(e).split(D),r=/([.?@])?(.*)/.exec(t);a.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?ie:"?"===r[1]?oe:"@"===r[1]?ne:te}),o.removeAttribute(e)}else e.startsWith(D)&&(a.push({type:6,index:n}),o.removeAttribute(e));if(N.test(o.tagName)){const e=o.textContent.split(D),t=e.length-1;if(t>0){o.textContent=k?k.emptyScript:"";for(let i=0;i<t;i++)o.append(e[i],T()),Y.nextNode(),a.push({type:2,index:++n});o.append(e[t],T())}}}else if(8===o.nodeType)if(o.data===M)a.push({type:2,index:n});else{let e=-1;for(;-1!==(e=o.data.indexOf(D,e+1));)a.push({type:7,index:n}),e+=D.length-1}n++}}static createElement(e,t){const i=I.createElement("template");return i.innerHTML=e,i}}function J(e,t,i=e,o){if(t===G)return t;let n=void 0!==o?i._$Co?.[o]:i._$Cl;const s=Z(t)?void 0:t._$litDirective$;return n?.constructor!==s&&(n?._$AO?.(!1),void 0===s?n=void 0:(n=new s(e),n._$AT(e,i,o)),void 0!==o?(i._$Co??=[])[o]=n:i._$Cl=n),void 0!==n&&(t=J(e,n._$AS(e,t.values),n,o)),t}class Q{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,o=(e?.creationScope??I).importNode(t,!0);Y.currentNode=o;let n=Y.nextNode(),s=0,r=0,a=i[0];for(;void 0!==a;){if(s===a.index){let t;2===a.type?t=new ee(n,n.nextSibling,this,e):1===a.type?t=new a.ctor(n,a.name,a.strings,this,e):6===a.type&&(t=new se(n,this,e)),this._$AV.push(t),a=i[++r]}s!==a?.index&&(n=Y.nextNode(),s++)}return Y.currentNode=I,o}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class ee{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,o){this.type=2,this._$AH=B,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=J(this,e,t),Z(e)?e===B||null==e||""===e?(this._$AH!==B&&this._$AR(),this._$AH=B):e!==this._$AH&&e!==G&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>C(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==B&&Z(this._$AH)?this._$AA.nextSibling.data=e:this.T(I.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,o="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=q.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new Q(o,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=V.get(e.strings);return void 0===t&&V.set(e.strings,t=new q(e)),t}k(e){C(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,o=0;for(const n of e)o===t.length?t.push(i=new ee(this.O(T()),this.O(T()),this,this.options)):i=t[o],i._$AI(n),o++;o<t.length&&(this._$AR(i&&i._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=e.nextSibling;e.remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class te{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,o,n){this.type=1,this._$AH=B,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=B}_$AI(e,t=this,i,o){const n=this.strings;let s=!1;if(void 0===n)e=J(this,e,t,0),s=!Z(e)||e!==this._$AH&&e!==G,s&&(this._$AH=e);else{const o=e;let r,a;for(e=n[0],r=0;r<n.length-1;r++)a=J(this,o[i+r],t,r),a===G&&(a=this._$AH[r]),s||=!Z(a)||a!==this._$AH[r],a===B?e=B:e!==B&&(e+=(a??"")+n[r+1]),this._$AH[r]=a}s&&!o&&this.j(e)}j(e){e===B?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ie extends te{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===B?void 0:e}}class oe extends te{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==B)}}class ne extends te{constructor(e,t,i,o,n){super(e,t,i,o,n),this.type=5}_$AI(e,t=this){if((e=J(this,e,t,0)??B)===G)return;const i=this._$AH,o=e===B&&i!==B||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==B&&(i===B||o);o&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class se{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){J(this,e)}}const re=$.litHtmlPolyfillSupport;re?.(q,ee),($.litHtmlVersions??=[]).push("3.3.1");const ae=globalThis;class le extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const o=i?.renderBefore??t;let n=o._$litPart$;if(void 0===n){const e=i?.renderBefore??null;o._$litPart$=n=new ee(t.insertBefore(T(),e),e,void 0,i??{})}return n._$AI(e),n})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}}le._$litElement$=!0,le.finalized=!0,ae.litElementHydrateSupport?.({LitElement:le});const de=ae.litElementPolyfillSupport;de?.({LitElement:le}),(ae.litElementVersions??=[]).push("4.2.1");const ce=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},he={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:f},pe=(e=he,t,i)=>{const{kind:o,metadata:n}=i;let s=globalThis.litPropertyMetadata.get(n);if(void 0===s&&globalThis.litPropertyMetadata.set(n,s=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),s.set(i.name,e),"accessor"===o){const{name:o}=i;return{set(i){const n=t.get.call(this);t.set.call(this,i),this.requestUpdate(o,n,e)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=i;return function(i){const n=this[o];t.call(this,i),this.requestUpdate(o,n,e)}}throw Error("Unsupported decorator location: "+o)};function ge(e){return(t,i)=>"object"==typeof i?pe(e,t,i):((e,t,i)=>{const o=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),o?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function ue(e){return ge({...e,state:!0,attribute:!1})}function _e(e,t){return(t,i,o)=>((e,t,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,i),i))(t,i,{get(){return(t=>t.renderRoot?.querySelector(e)??null)(this)}})}const xe={ultimatesensor:{icon:"mdi:radar",gradient:"linear-gradient(135deg, #4361ee, #3f37c9)",category:"sensor",color:"#4361ee"},ultimatesensor_mini:{icon:"mdi:radar",gradient:"linear-gradient(135deg, #4361ee, #7209b7)",category:"sensor",color:"#4361ee"},waterp1meterkit:{icon:"mdi:water-pump",gradient:"linear-gradient(135deg, #4cc9f0, #4361ee)",category:"water",color:"#4cc9f0"},watermeterkit:{icon:"mdi:water-circle",gradient:"linear-gradient(135deg, #4cc9f0, #00b4d8)",category:"water",color:"#4cc9f0"},waterflowkit:{icon:"mdi:waves",gradient:"linear-gradient(135deg, #00b4d8, #0096c7)",category:"water",color:"#00b4d8"},p1meterkit:{icon:"mdi:flash",gradient:"linear-gradient(135deg, #f72585, #b5179e)",category:"energy",color:"#f72585"},ceilsense:{icon:"mdi:ceiling-light",gradient:"linear-gradient(135deg, #7209b7, #560bad)",category:"sensor",color:"#7209b7"}};let ve=class extends le{constructor(){super(...arguments),this._devices=[],this._loading=!0}connectedCallback(){super.connectedCallback(),this._loadDevices()}async _loadDevices(){this._loading=!0;try{const e=await this.hass.callWS({type:"smarthomeshop/devices"}),t=await Promise.all(e.devices.map(async e=>{try{const t=await this.hass.callWS({type:"smarthomeshop/device/entities",device_id:e.id});return{...e,entities:t.entities}}catch{return{...e,entities:[]}}}));this._devices=t}catch(e){console.error("Failed to load devices:",e)}this._loading=!1}_selectDevice(e){this.dispatchEvent(new CustomEvent("device-select",{detail:{deviceId:e.id}}))}_navigateTo(e){this.dispatchEvent(new CustomEvent("navigate",{detail:{page:e}}))}_getProductConfig(e){return xe[e||""]||{icon:"mdi:devices",gradient:"linear-gradient(135deg, #4361ee, #3f37c9)",category:"other",color:"#4361ee"}}_getSensorValue(e,t){if(!e)return null;const i=e.find(e=>e.entity_id.toLowerCase().includes(t.toLowerCase()));return i&&i.state&&"unavailable"!==i.state&&"unknown"!==i.state?i.state:null}_formatValue(e,t,i=1){if(null===e)return"—";const o=parseFloat(e);return isNaN(o)?e:`${o.toFixed(i)}${t}`}_renderDeviceSensors(e){const t=this._getProductConfig(e.product_type),i=e.entities||[];if("water"===t.category){const e=this._getSensorValue(i,"flow_rate")||this._getSensorValue(i,"flow"),o=this._getSensorValue(i,"total_consumption")||this._getSensorValue(i,"total"),n=this._getSensorValue(i,"daily");return L`
        <div class="sensor-grid">
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:water" style="color: ${t.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(e," L/m")}</span>
            <div class="sensor-label">Flow</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:counter" style="color: ${t.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(o," L",0)}</span>
            <div class="sensor-label">Total</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:calendar-today" style="color: ${t.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(n," L",0)}</span>
            <div class="sensor-label">Today</div>
          </div>
        </div>
      `}if("sensor"===t.category){const o=this._getSensorValue(i,"temperature"),n=this._getSensorValue(i,"humidity"),s=this._getSensorValue(i,"co2"),r=this._getSensorValue(i,"illuminance")||this._getSensorValue(i,"lux"),a=this._getSensorValue(i,"presence")||this._getSensorValue(i,"occupancy"),l=[];o&&l.push({icon:"mdi:thermometer",value:this._formatValue(o,"°C"),label:"Temp"}),n&&l.push({icon:"mdi:water-percent",value:this._formatValue(n,"%",0),label:"Humidity"}),s&&l.push({icon:"mdi:molecule-co2",value:this._formatValue(s," ppm",0),label:"CO₂"}),r&&l.push({icon:"mdi:brightness-6",value:this._formatValue(r," lx",0),label:"Light"}),a&&l.push({icon:"mdi:motion-sensor",value:"on"===a?"Yes":"No",label:"Motion"});const d=l.slice(0,3);return 0===d.length?L`
          <div class="sensor-grid">
            <div class="sensor-item" style="grid-column: span 3;">
              <span class="sensor-value">${e.entity_count}</span>
              <div class="sensor-label">Entities</div>
            </div>
          </div>
        `:L`
        <div class="sensor-grid">
          ${d.map(e=>L`
            <div class="sensor-item">
              <ha-icon class="sensor-icon" icon="${e.icon}" style="color: ${t.color}"></ha-icon>
              <span class="sensor-value">${e.value}</span>
              <div class="sensor-label">${e.label}</div>
            </div>
          `)}
        </div>
      `}if("energy"===t.category){const e=this._getSensorValue(i,"power"),o=this._getSensorValue(i,"energy")||this._getSensorValue(i,"total"),n=this._getSensorValue(i,"voltage");return L`
        <div class="sensor-grid">
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:flash" style="color: ${t.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(e," W",0)}</span>
            <div class="sensor-label">Power</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:lightning-bolt" style="color: ${t.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(o," kWh")}</span>
            <div class="sensor-label">Energy</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:sine-wave" style="color: ${t.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(n," V",0)}</span>
            <div class="sensor-label">Voltage</div>
          </div>
        </div>
      `}return L`
      <div class="sensor-grid">
        <div class="sensor-item" style="grid-column: span 3;">
          <span class="sensor-value">${e.entity_count}</span>
          <div class="sensor-label">Entities</div>
        </div>
      </div>
    `}_countByCategory(e){return this._devices.filter(t=>this._getProductConfig(t.product_type).category===e).length}render(){if(this._loading)return L`
        <div class="loading">
          <ha-circular-progress active></ha-circular-progress>
          <span class="loading-text">Loading devices...</span>
        </div>
      `;const e=this._countByCategory("water"),t=this._countByCategory("sensor"),i=this._countByCategory("energy");return L`
      <!-- Hero Section -->
      <div class="hero">
        <div class="hero-logo" .innerHTML=${'\n<svg viewBox="0 0 772.9 607.6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n  <g>\n    <g>\n      <path d="M636.8,285.9c-0.5-10.6-11-15.9-18.8-21.6c-40.6-30.1-81.2-60.1-121.8-90.2c-34.5-25.6-69-51.1-103.5-76.7 c-3.2-2.4-9.4-2.4-12.6,0c-71.6,53.1-143.3,106.1-214.9,159.2c-5.8,4.3-11.6,8.6-17.4,12.9c-3.2,2.4-8.1,5.2-10.1,8.6 c-4.8,8.3-1.7,24.7-1.7,33.6c0,52.9,0,105.8,0,158.7c0,41.6,0,83.1,0,124.7c0,6.7,5.7,12.5,12.5,12.5c30.9,0,61.9,0,92.8,0 c16.1,0,16.1-25,0-25c-26.8,0-53.6,0-80.4,0c0-86.7,0-173.3,0-260c0-10.7,0-21.4,0-32c67.3-49.9,134.6-99.7,202-149.6 c7.8-5.8,15.6-11.6,23.5-17.4c67.3,49.8,134.6,99.7,201.8,149.5c7.9,5.8,15.7,11.6,23.6,17.5c0,88.8,0,177.5,0,266.3 c0,8.6,0,17.2,0,25.8c-26.8,0-53.6,0-80.4,0c-16.1,0-16.1,25,0,25c30.9,0,61.9,0,92.8,0c6.7,0,12.5-5.7,12.5-12.5 c0-89.3,0-178.7,0-268C636.8,313.4,637.4,299.6,636.8,285.9z"/>\n      <g>\n        <g>\n          <path d="M261.7,428.8c0,27.7,13.7,53.7,36,69.9c17.3,12.5,37.1,16,58,16c18.5,0,37,0,55.4,0c19.1,0,37.3-0.9,54.7-10.2 c27.6-14.6,45.4-44.5,45.4-75.7c0-16.1-25-16.1-25,0c0,29.1-21.2,54.6-49.8,60c-16,3-33.9,1-50,1c-16.1,0-34,2-50-1 c-28.6-5.4-49.8-30.9-49.8-60C286.6,412.8,261.7,412.7,261.7,428.8L261.7,428.8z"/>\n        </g>\n      </g>\n      <g>\n        <g>\n          <circle cx="310.9" cy="351.6" r="21.4"/>\n        </g>\n        <g>\n          <circle cx="462" cy="351.6" r="21.4"/>\n        </g>\n      </g>\n      <path d="M767.5,279.4c-42.2-31.3-84.5-62.6-126.7-93.8C573.5,135.7,506.3,85.9,439,36c-15.4-11.4-30.8-22.8-46.2-34.3 c-3.2-2.4-9.4-2.4-12.6,0c-42.2,31.3-84.5,62.6-126.7,93.8c-67.3,49.8-134.6,99.7-201.9,149.5C36.2,256.5,20.8,268,5.4,279.4 c-12.8,9.5-0.3,31.1,12.6,21.5c42.2-31.3,84.5-62.6,126.7-93.8c67.3-49.8,134.6-99.7,201.9-149.5c13.3-9.9,26.6-19.7,40-29.6 c40.1,29.7,80.3,59.4,120.4,89.2c67.3,49.8,134.6,99.7,201.9,149.5c15.4,11.4,30.8,22.8,46.2,34.3 C767.8,310.5,780.3,288.8,767.5,279.4z"/>\n    </g>\n  </g>\n</svg>\n'}></div>
        <div class="hero-content">
          <div class="hero-text">
            <h1>SmartHomeShop Integration</h1>
            <p>Configure and monitor your SmartHomeShop.io devices directly in Home Assistant. Manage presence detection zones, room layouts, and device settings.</p>
            <a href="https://smarthomeshop.io" target="_blank" class="website-link">
              <ha-icon icon="mdi:open-in-new"></ha-icon>
              Shop more devices
            </a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-value">${this._devices.length}</span>
              <span class="hero-stat-label">Devices</span>
            </div>
            ${e>0?L`
              <div class="hero-stat">
                <span class="hero-stat-value">${e}</span>
                <span class="hero-stat-label">Water</span>
              </div>
            `:B}
            ${t>0?L`
              <div class="hero-stat">
                <span class="hero-stat-value">${t}</span>
                <span class="hero-stat-label">Sensors</span>
              </div>
            `:B}
            ${i>0?L`
              <div class="hero-stat">
                <span class="hero-stat-value">${i}</span>
                <span class="hero-stat-label">Energy</span>
              </div>
            `:B}
          </div>
        </div>
      </div>

      ${0===this._devices.length?L`
        <div class="empty-state">
          <div class="empty-icon">
            <ha-icon icon="mdi:package-variant"></ha-icon>
          </div>
          <h3>No SmartHomeShop devices found</h3>
          <p>Connect your SmartHomeShop.io devices via ESPHome, then add this integration via Settings → Devices & Services</p>
        </div>
      `:L`
        <!-- Devices Section -->
        <div class="section-header">
          <h2 class="section-title">
            <ha-icon icon="mdi:devices"></ha-icon>
            Your Devices
          </h2>
          <span class="section-badge">${this._devices.length} device${1!==this._devices.length?"s":""}</span>
        </div>

        <div class="devices-grid">
          ${this._devices.map(e=>{const t=this._getProductConfig(e.product_type);return L`
              <div
                class="device-card ${this.selectedDeviceId===e.id?"selected":""}"
                @click=${()=>this._selectDevice(e)}
              >
                <div class="device-header">
                  <div class="device-icon" style="background: ${t.gradient}">
                    <ha-icon icon="${t.icon}"></ha-icon>
                  </div>
                  <div class="device-info">
                    <h3 class="device-name">${e.name}</h3>
                    <div class="device-type">
                      <span class="device-type-badge ${t.category}">${t.category}</span>
                      ${e.product_name||"Unknown"}
                    </div>
                  </div>
                </div>
                ${this._renderDeviceSensors(e)}
              </div>
            `})}
        </div>
      `}

      <!-- Quick Actions -->
      <div class="actions-section">
        <div class="section-header">
          <h2 class="section-title">
            <ha-icon icon="mdi:lightning-bolt"></ha-icon>
            Quick Actions
          </h2>
        </div>

        <div class="actions-grid">
          <div class="action-card" @click=${()=>this._navigateTo("room-builder")}>
            <div class="action-icon">
              <ha-icon icon="mdi:floor-plan"></ha-icon>
            </div>
            <h3 class="action-title">Room Builder</h3>
            <p class="action-desc">Draw your room layout for accurate mmWave positioning</p>
          </div>

          <div class="action-card" @click=${()=>this._navigateTo("zones")}>
            <div class="action-icon" style="background: linear-gradient(135deg, #7209b7, #560bad)">
              <ha-icon icon="mdi:vector-polygon"></ha-icon>
            </div>
            <h3 class="action-title">Detection Zones</h3>
            <p class="action-desc">Define areas for presence and exclusion zones</p>
          </div>

          <div class="action-card" @click=${()=>this._navigateTo("settings")}>
            <div class="action-icon" style="background: linear-gradient(135deg, #4cc9f0, #00b4d8)">
              <ha-icon icon="mdi:tune"></ha-icon>
            </div>
            <h3 class="action-title">Sensor Settings</h3>
            <p class="action-desc">Adjust sensitivity and radar parameters</p>
          </div>
        </div>
      </div>
    `}};ve.styles=r`
    :host {
      display: block;
      --shs-blue: #4361ee;
      --shs-purple: #7209b7;
      --shs-cyan: #4cc9f0;
      --shs-pink: #f72585;
    }

    /* Hero Section - Matching SmartHomeShop.io style */
    .hero {
      background: linear-gradient(135deg, #4361ee 0%, #3f37c9 50%, #4cc9f0 100%);
      border-radius: 24px;
      padding: 40px;
      margin-bottom: 32px;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 60%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 50%;
      height: 150%;
      background: radial-gradient(circle, rgba(76, 201, 240, 0.2) 0%, transparent 60%);
      pointer-events: none;
    }

    .hero-content {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 40px;
      align-items: center;
    }

    .hero-text h1 {
      font-size: 36px;
      font-weight: 700;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }

    .hero-text p {
      font-size: 16px;
      opacity: 0.9;
      margin: 0;
      max-width: 500px;
      line-height: 1.6;
    }

    .hero-stats {
      display: flex;
      gap: 16px;
    }

    .hero-stat {
      text-align: center;
      background: rgba(255,255,255,0.15);
      padding: 20px 28px;
      border-radius: 16px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      min-width: 100px;
    }

    .hero-stat-value {
      font-size: 40px;
      font-weight: 700;
      display: block;
      line-height: 1;
    }

    .hero-stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      opacity: 0.85;
      margin-top: 8px;
      display: block;
    }

    .hero-logo {
      position: absolute;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
      width: 120px;
      height: 120px;
      opacity: 0.15;
      color: white;
    }

    /* Section Headers */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
    }

    .section-title ha-icon {
      color: var(--shs-blue);
    }

    .section-badge {
      background: linear-gradient(135deg, #4361ee, #3f37c9);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }

    /* Device Grid */
    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    /* Device Card */
    .device-card {
      background: var(--card-background-color);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      border: 2px solid transparent;
    }

    .device-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 40px rgba(67, 97, 238, 0.2);
    }

    .device-card.selected {
      border-color: var(--shs-blue);
      box-shadow: 0 8px 30px rgba(67, 97, 238, 0.25);
    }

    .device-header {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .device-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .device-icon ha-icon {
      --mdc-icon-size: 30px;
    }

    .device-info {
      flex: 1;
      min-width: 0;
    }

    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 0 0 6px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .device-type {
      font-size: 13px;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .device-type-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .device-type-badge.water {
      background: linear-gradient(135deg, rgba(76, 201, 240, 0.2), rgba(0, 180, 216, 0.2));
      color: #0096c7;
    }

    .device-type-badge.sensor {
      background: linear-gradient(135deg, rgba(67, 97, 238, 0.15), rgba(114, 9, 183, 0.15));
      color: #4361ee;
    }

    .device-type-badge.energy {
      background: linear-gradient(135deg, rgba(247, 37, 133, 0.15), rgba(181, 23, 158, 0.15));
      color: #f72585;
    }

    /* Sensor Data Grid */
    .sensor-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: var(--divider-color);
      border-top: 1px solid var(--divider-color);
    }

    .sensor-item {
      background: var(--card-background-color);
      padding: 18px 16px;
      text-align: center;
      transition: background 0.2s ease;
    }

    .sensor-item:hover {
      background: var(--secondary-background-color);
    }

    .sensor-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary-text-color);
      display: block;
    }

    .sensor-label {
      font-size: 10px;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 6px;
    }

    .sensor-icon {
      --mdc-icon-size: 20px;
      color: var(--shs-blue);
      margin-bottom: 6px;
    }

    /* Quick Actions */
    .actions-section {
      margin-top: 40px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }

    .action-card {
      background: var(--card-background-color);
      border-radius: 20px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid transparent;
      position: relative;
      overflow: hidden;
    }

    .action-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #4361ee, #4cc9f0);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(67, 97, 238, 0.15);
    }

    .action-card:hover::before {
      opacity: 1;
    }

    .action-icon {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, #4361ee, #3f37c9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-bottom: 16px;
      box-shadow: 0 6px 20px rgba(67, 97, 238, 0.35);
    }

    .action-icon ha-icon {
      --mdc-icon-size: 28px;
    }

    .action-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 0 0 6px 0;
    }

    .action-desc {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin: 0;
      line-height: 1.5;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 40px;
      background: var(--card-background-color);
      border-radius: 24px;
      border: 2px dashed var(--divider-color);
    }

    .empty-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(67, 97, 238, 0.1), rgba(76, 201, 240, 0.1));
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .empty-icon ha-icon {
      --mdc-icon-size: 48px;
      color: var(--shs-blue);
    }

    .empty-state h3 {
      font-size: 22px;
      color: var(--primary-text-color);
      margin: 0 0 12px 0;
    }

    .empty-state p {
      color: var(--secondary-text-color);
      margin: 0;
      font-size: 15px;
    }

    /* Loading */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      gap: 20px;
    }

    .loading-text {
      color: var(--secondary-text-color);
      font-size: 15px;
    }

    /* Website Link */
    .website-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: white;
      text-decoration: none;
      font-size: 13px;
      opacity: 0.9;
      margin-top: 16px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      transition: all 0.2s ease;
    }

    .website-link:hover {
      opacity: 1;
      background: rgba(255,255,255,0.25);
    }

    /* Responsive */
    @media (max-width: 900px) {
      .hero {
        padding: 32px;
      }
      .hero-content {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .hero-stats {
        justify-content: center;
      }
      .hero-text p {
        max-width: 100%;
      }
      .devices-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .hero-stats {
        flex-wrap: wrap;
      }
      .sensor-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `,e([ge({attribute:!1})],ve.prototype,"hass",void 0),e([ge()],ve.prototype,"selectedDeviceId",void 0),e([ue()],ve.prototype,"_devices",void 0),e([ue()],ve.prototype,"_loading",void 0),ve=e([ce("shs-dashboard-page")],ve);const me=800,ye=400,fe=2500,be=[{id:"bed",name:"Bed",icon:"mdi:bed-double",defaultWidth:1600,defaultHeight:2e3},{id:"sofa",name:"Bank",icon:"mdi:sofa",defaultWidth:2e3,defaultHeight:900},{id:"chair",name:"Stoel",icon:"mdi:chair-rolling",defaultWidth:500,defaultHeight:500},{id:"table",name:"Tafel",icon:"mdi:table-furniture",defaultWidth:1200,defaultHeight:800},{id:"cabinet",name:"Kast",icon:"mdi:wardrobe",defaultWidth:1e3,defaultHeight:600}];let we=class extends le{constructor(){super(...arguments),this.rooms=[],this._selectedRoomId=null,this._roomPoints=[],this._toolMode="walls",this._pendingStart=null,this._previewPoint=null,this._zoom=1,this._panOffset={x:0,y:0},this._snapGrid=100,this._cursorPos=null,this._saving=!1,this._showNewRoomDialog=!1,this._newRoomName="",this._newRoomWidth=0,this._newRoomLength=0,this._isDragging=!1,this._furniture=[],this._selectedFurnitureType=null,this._showFurnitureDialog=!1,this._furnitureWidth=1e3,this._furnitureHeight=1e3,this._selectedFurnitureIndex=null,this._draggingFurnitureIndex=null,this._draggingPointIndex=null,this._draggingDoorIndex=null,this._draggingWindowIndex=null,this._wallHoverPreview=null,this._doorWindowPreview=null,this._editingDoorIndex=null,this._editingWindowIndex=null,this._doors=[],this._windows=[],this._showDoorDialog=!1,this._showWindowDialog=!1,this._selectedWallIndex=null,this._doorWidth=900,this._doorOpenDirection="inward",this._doorOpenSide="left",this._windowWidth=1200,this._windowHeight=1e3,this._windowType="open",this._viewMode="2d",this._camera3d={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3},this._isDragging3D=!1,this._lastMouseX=0,this._lastMouseY=0,this._animationFrame=null}connectedCallback(){super.connectedCallback(),this._loadRooms()}async _loadRooms(){try{const e=await this.hass.callWS({type:"smarthomeshop/rooms"});this.rooms=e.rooms||[],this.rooms.length>0&&!this._selectedRoomId&&this._selectRoom(this.rooms[0].id)}catch(e){console.error("Failed to load rooms:",e)}}_selectRoom(e){this._selectedRoomId=e;const t=this.rooms.find(t=>t.id===e);t&&(this._roomPoints=t.walls?.length>0?t.walls.map(e=>({x:e.x1,y:e.y1})):[],this._furniture=(t.furniture||[]).map(e=>({id:e.id,type:e.typeId||e.type||"unknown",name:e.name||be.find(t=>t.id===(e.typeId||e.type))?.name||"Meubel",x:e.x,y:e.y,width:e.width,height:e.height||e.depth||e.width,rotation:e.rotationDeg??e.rotation??0})),this._doors=t.doors||[],this._windows=t.windows||[],this._autoZoom()),this._toolMode="walls",this._pendingStart=null,this._previewPoint=null,this._selectedFurnitureType=null,this._selectedFurnitureIndex=null}_autoZoom(){if(this._roomPoints.length<2)return this._zoom=1,void(this._panOffset={x:0,y:0});const e=this._roomPoints.map(e=>e.x),t=this._roomPoints.map(e=>e.y),i=Math.min(...e),o=Math.max(...e),n=Math.min(...t),s=Math.max(...t),r=o-i,a=s-n;this._zoom=Math.min(8500/Math.max(r,a,2e3),3);const l=(i+o)/2,d=(n+s)/2;this._panOffset={x:.08*-l*this._zoom,y:.08*-d*this._zoom}}_toCanvas(e){return{x:ye+.08*(e.x-this._panOffset.x)*this._zoom,y:ye+.08*(e.y-this._panOffset.y)*this._zoom}}_fromCanvas(e,t){return{x:12.5*(e-ye)/this._zoom+this._panOffset.x,y:12.5*(t-ye)/this._zoom+this._panOffset.y}}_snapToGrid(e){return this._snapGrid<=0?e:{x:Math.round(e.x/this._snapGrid)*this._snapGrid,y:Math.round(e.y/this._snapGrid)*this._snapGrid}}_snapToExisting(e,t=250){let i=e,o=t;for(const t of this._roomPoints){const n=Math.hypot(t.x-e.x,t.y-e.y);n<o&&(i=t,o=n)}return i}_findNearestWall(e){if(this._roomPoints.length<3)return null;let t=-1,i=1/0,o=0;for(let n=0;n<this._roomPoints.length;n++){const s=this._roomPoints[n],r=this._roomPoints[(n+1)%this._roomPoints.length],a=r.x-s.x,l=r.y-s.y,d=Math.hypot(a,l);if(0===d)continue;const c=Math.max(.05,Math.min(.95,((e.x-s.x)*a+(e.y-s.y)*l)/(d*d))),h=s.x+c*a,p=s.y+c*l,g=Math.hypot(e.x-h,e.y-p);g<i&&(i=g,t=n,o=c)}return t>=0?{wallIndex:t,position:o,distance:i}:null}_getSvgPoint(e){if(!this._svg)return null;const t=this._svg.createSVGPoint();t.x=e.clientX,t.y=e.clientY;const i=this._svg.getScreenCTM();if(!i)return null;const o=t.matrixTransform(i.inverse());return{x:o.x,y:o.y}}_handleCanvasClick(e){if(0!==e.button)return;if("furniture"===this._toolMode&&this._selectedFurnitureType){const t=this._getSvgPoint(e);if(t){const e=this._fromCanvas(t.x,t.y),i=this._snapToGrid(e);this._furnitureWidth=this._selectedFurnitureType.defaultWidth,this._furnitureHeight=this._selectedFurnitureType.defaultHeight,this._pendingStart=i,this._showFurnitureDialog=!0}return}if("door"===this._toolMode||"window"===this._toolMode)return;if("walls"!==this._toolMode)return;const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y),o=this._snapToExisting(this._snapToGrid(i));if(this._roomPoints.length>=3)return;if(!this._pendingStart)return void(this._pendingStart=o);const n=this._roomPoints[0];if(n&&this._roomPoints.length>=2&&Math.hypot(o.x-n.x,o.y-n.y)<250)return this._pendingStart=null,void(this._previewPoint=null);0===this._roomPoints.length?this._roomPoints=[this._pendingStart,o]:this._roomPoints=[...this._roomPoints,o],this._pendingStart=o}_addPointOnWall(e,t,i=!1){if(e>=this._roomPoints.length)return;const o=this._roomPoints[e],n=this._roomPoints[(e+1)%this._roomPoints.length],s={x:o.x+(n.x-o.x)*t,y:o.y+(n.y-o.y)*t},r=this._snapToGrid(s),a=[...this._roomPoints];a.splice(e+1,0,r),this._roomPoints=a,i&&(this._draggingPointIndex=e+1),this._wallHoverPreview=null}_handleCanvasMove(e){const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if(this._cursorPos=i,null!==this._draggingFurnitureIndex){const e=this._snapToGrid(i);return void(this._furniture=this._furniture.map((t,i)=>i===this._draggingFurnitureIndex?{...t,x:e.x,y:e.y}:t))}if(null!==this._draggingPointIndex){const e=this._snapToGrid(i);return void(this._roomPoints=this._roomPoints.map((t,i)=>i===this._draggingPointIndex?e:t))}if(null!==this._draggingDoorIndex){const e=this._doors[this._draggingDoorIndex];if(e&&e.wallIndex<this._roomPoints.length){const t=this._roomPoints[e.wallIndex],o=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],n=o.x-t.x,s=o.y-t.y,r=Math.hypot(n,s);if(r>0){const e=Math.max(.05,Math.min(.95,((i.x-t.x)*n+(i.y-t.y)*s)/(r*r)));this._doors=this._doors.map((t,i)=>i===this._draggingDoorIndex?{...t,position:e}:t)}}return}if(null!==this._draggingWindowIndex){const e=this._windows[this._draggingWindowIndex];if(e&&e.wallIndex<this._roomPoints.length){const t=this._roomPoints[e.wallIndex],o=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],n=o.x-t.x,s=o.y-t.y,r=Math.hypot(n,s);if(r>0){const e=Math.max(.05,Math.min(.95,((i.x-t.x)*n+(i.y-t.y)*s)/(r*r)));this._windows=this._windows.map((t,i)=>i===this._draggingWindowIndex?{...t,position:e}:t)}}return}if(this._isDragging){const t=e.movementX/this._svg.clientWidth*(1e4/this._zoom),i=e.movementY/this._svg.clientHeight*(1e4/this._zoom);return void(this._panOffset={x:this._panOffset.x-t,y:this._panOffset.y-i})}if("walls"===this._toolMode&&this._pendingStart&&(this._previewPoint=this._snapToExisting(this._snapToGrid(i))),("walls"===this._toolMode||"select"===this._toolMode)&&this._roomPoints.length>=3){const e=this._findNearestWall(i);if(e&&e.distance<400){const t=this._roomPoints[e.wallIndex],i=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],o=.5,n={x:t.x+(i.x-t.x)*o,y:t.y+(i.y-t.y)*o};this._wallHoverPreview={wallIndex:e.wallIndex,position:o,point:n}}else this._wallHoverPreview=null}else this._wallHoverPreview=null;if(("door"===this._toolMode||"window"===this._toolMode)&&this._roomPoints.length>=3){if(this._isHoveringDoorOrWindow(i))this._doorWindowPreview=null;else{const e=this._findNearestWall(i);if(e){const t=this._roomPoints[e.wallIndex],i=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],o={x:t.x+(i.x-t.x)*e.position,y:t.y+(i.y-t.y)*e.position};this._doorWindowPreview={wallIndex:e.wallIndex,position:e.position,point:o,type:this._toolMode}}else this._doorWindowPreview=null}}else this._doorWindowPreview=null}_isHoveringDoorOrWindow(e){for(const t of this._doors){if(t.wallIndex>=this._roomPoints.length)continue;const i=this._roomPoints[t.wallIndex],o=this._roomPoints[(t.wallIndex+1)%this._roomPoints.length],n=i.x+(o.x-i.x)*t.position,s=i.y+(o.y-i.y)*t.position;if(Math.hypot(e.x-n,e.y-s)<300)return!0}for(const t of this._windows){if(t.wallIndex>=this._roomPoints.length)continue;const i=this._roomPoints[t.wallIndex],o=this._roomPoints[(t.wallIndex+1)%this._roomPoints.length],n=i.x+(o.x-i.x)*t.position,s=i.y+(o.y-i.y)*t.position;if(Math.hypot(e.x-n,e.y-s)<300)return!0}return!1}_handleCanvasDown(e){1!==e.button&&2!==e.button||(e.preventDefault(),this._isDragging=!0)}_handleCanvasUp(){this._isDragging=!1,this._draggingFurnitureIndex=null,this._draggingPointIndex=null,this._draggingDoorIndex=null,this._draggingWindowIndex=null}_startFurnitureDrag(e,t){e.stopPropagation(),e.preventDefault(),this._selectedFurnitureIndex=t,"furniture"!==this._toolMode&&"select"!==this._toolMode||(this._draggingFurnitureIndex=t)}_handleWheel(e){e.preventDefault(),this._zoom=Math.min(5,Math.max(.2,this._zoom+(e.deltaY>0?-.1:.1)))}_setToolMode(e){this._toolMode=e,this._pendingStart=null,this._previewPoint=null,this._selectedFurnitureType=null,this._selectedFurnitureIndex=null}_undoLastPoint(){this._roomPoints.length>0&&(this._roomPoints=this._roomPoints.slice(0,-1),this._pendingStart=this._roomPoints.length>0?this._roomPoints[this._roomPoints.length-1]:null)}_clearRoom(){this._roomPoints=[],this._pendingStart=null,this._previewPoint=null}_showAddRoomDialog(){this._newRoomName="",this._newRoomWidth=0,this._newRoomLength=0,this._showNewRoomDialog=!0}_hideAddRoomDialog(){this._showNewRoomDialog=!1}_selectFurnitureType(e){this._selectedFurnitureType=e,this._selectedFurnitureIndex=null}_placeFurniture(){if(!this._selectedFurnitureType||!this._pendingStart)return;const e={id:`furniture_${Date.now()}`,type:this._selectedFurnitureType.id,name:this._selectedFurnitureType.name,x:this._pendingStart.x,y:this._pendingStart.y,width:this._furnitureWidth,height:this._furnitureHeight,rotation:0};this._furniture=[...this._furniture,e],this._showFurnitureDialog=!1,this._pendingStart=null}_deleteFurniture(e){this._furniture=this._furniture.filter((t,i)=>i!==e),this._selectedFurnitureIndex=null}_addDoor(){if(null===this._selectedWallIndex||!this._pendingStart)return;const e={id:"door_"+Date.now(),wallIndex:this._selectedWallIndex,position:this._pendingStart.x,width:this._doorWidth,openDirection:this._doorOpenDirection,openSide:this._doorOpenSide};this._doors=[...this._doors,e],this._hideDoorDialog()}_hideDoorDialog(){this._showDoorDialog=!1,this._selectedWallIndex=null,this._pendingStart=null,this._editingDoorIndex=null}_deleteDoor(e){this._doors=this._doors.filter((t,i)=>i!==e)}_editDoor(e){const t=this._doors[e];t&&(this._editingDoorIndex=e,this._doorWidth=t.width,this._doorOpenDirection=t.openDirection,this._doorOpenSide=t.openSide,this._showDoorDialog=!0)}_saveDoorEdit(){null!==this._editingDoorIndex&&(this._doors=this._doors.map((e,t)=>t===this._editingDoorIndex?{...e,width:this._doorWidth,openDirection:this._doorOpenDirection,openSide:this._doorOpenSide}:e),this._editingDoorIndex=null,this._showDoorDialog=!1)}_addWindow(){if(null===this._selectedWallIndex||!this._pendingStart)return;const e={id:"window_"+Date.now(),wallIndex:this._selectedWallIndex,position:this._pendingStart.x,width:this._windowWidth,height:this._windowHeight,windowType:this._windowType};this._windows=[...this._windows,e],this._hideWindowDialog()}_hideWindowDialog(){this._showWindowDialog=!1,this._selectedWallIndex=null,this._pendingStart=null,this._editingWindowIndex=null}_deleteWindow(e){this._windows=this._windows.filter((t,i)=>i!==e)}_editWindow(e){const t=this._windows[e];t&&(this._editingWindowIndex=e,this._windowWidth=t.width,this._windowHeight=t.height,this._windowType=t.windowType,this._showWindowDialog=!0)}_saveWindowEdit(){null!==this._editingWindowIndex&&(this._windows=this._windows.map((e,t)=>t===this._editingWindowIndex?{...e,width:this._windowWidth,height:this._windowHeight,windowType:this._windowType}:e),this._editingWindowIndex=null,this._showWindowDialog=!1)}async _createNewRoom(){if(!this._newRoomName.trim())return;let e=[];if(this._newRoomWidth>0&&this._newRoomLength>0){const t=10*this._newRoomWidth/2,i=10*this._newRoomLength/2;e=[{x1:-t,y1:-i,x2:t,y2:-i},{x1:t,y1:-i,x2:t,y2:i},{x1:t,y1:i,x2:-t,y2:i},{x1:-t,y1:i,x2:-t,y2:-i}]}const t={id:"room_"+Date.now(),name:this._newRoomName.trim(),walls:e,furniture:[],devices:[],zones:[]};try{await this.hass.callWS({type:"smarthomeshop/room/save",room:t}),this.rooms=[...this.rooms,t],this._selectRoom(t.id),this._hideAddRoomDialog()}catch(e){console.error("Failed to create room:",e)}}async _saveRoom(){if(!this._selectedRoomId)return;this._saving=!0;const e=this.rooms.find(e=>e.id===this._selectedRoomId);if(!e)return;const t=this._roomPoints.map((e,t)=>{const i=this._roomPoints[(t+1)%this._roomPoints.length];return{x1:e.x,y1:e.y,x2:i.x,y2:i.y}}),i=this._furniture.map(e=>({id:e.id,typeId:e.type,x:e.x,y:e.y,width:e.width,height:e.height,rotationDeg:e.rotation}));try{const o={...e,walls:t,furniture:i,doors:this._doors,windows:this._windows};await this.hass.callWS({type:"smarthomeshop/room/save",room:o}),this.rooms=this.rooms.map(e=>e.id===this._selectedRoomId?o:e)}catch(e){console.error("Failed to save room:",e)}finally{this._saving=!1}}_calculateArea(){if(this._roomPoints.length<3)return 0;let e=0;for(let t=0;t<this._roomPoints.length;t++){const i=(t+1)%this._roomPoints.length;e+=this._roomPoints[t].x*this._roomPoints[i].y,e-=this._roomPoints[i].x*this._roomPoints[t].y}return Math.abs(e/2)/1e6}_getInstructions(){switch(this._toolMode){case"walls":return{title:"Muren Tekenen",text:this._roomPoints.length>=3?"Hover muur → groen punt. Klik = toevoegen. Sleep = verplaatsen. Rechtsklik = verwijderen.":this._pendingStart?"Klik om hoeken toe te voegen. Klik bij eerste punt om te sluiten.":"Klik om de eerste hoek te zetten."};case"select":return{title:"Selecteer & Verplaats",text:"Sleep meubels, sensor of muurpunten om te verplaatsen."};case"furniture":return{title:"Meubels Plaatsen",text:this._selectedFurnitureType?`Klik op de kaart om ${this._selectedFurnitureType.name} te plaatsen.`:"Selecteer een meubel rechts, of sleep bestaande meubels."};case"door":return{title:"Deur Toevoegen",text:"Beweeg over muur → paarse preview. Klik om te plaatsen. Sleep bestaande deuren om te verplaatsen."};case"window":return{title:"Raam Toevoegen",text:"Beweeg over muur → blauwe preview. Klik om te plaatsen. Sleep bestaande ramen om te verplaatsen."};default:return{title:"Selecteer Gereedschap",text:"Kies een tool links."}}}_renderGrid(){const e=[];for(let t=-1e4;t<=1e4;t+=500){const i=this._toCanvas({x:t,y:-1e4}),o=this._toCanvas({x:t,y:1e4}),n=this._toCanvas({x:-1e4,y:t}),s=this._toCanvas({x:1e4,y:t}),r=0===t;e.push(U`<line class="grid-line ${r?"axis":""}" x1="${i.x}" y1="${i.y}" x2="${o.x}" y2="${o.y}"/>`),e.push(U`<line class="grid-line ${r?"axis":""}" x1="${n.x}" y1="${n.y}" x2="${s.x}" y2="${s.y}"/>`)}return e}_renderRoom(){if(this._roomPoints.length<2)return B;const e=this._roomPoints.map((e,t)=>{const i=this._toCanvas(e);return(0===t?"M":"L")+" "+i.x+" "+i.y}).join(" ")+(this._roomPoints.length>=3?" Z":""),t=this._roomPoints.map((e,t)=>{const i=this._roomPoints[(t+1)%this._roomPoints.length];if(this._roomPoints.length<3&&t===this._roomPoints.length-1)return B;const o=(Math.hypot(i.x-e.x,i.y-e.y)/1e3).toFixed(2),n=this._toCanvas(e),s=this._toCanvas(i),r=(n.x+s.x)/2,a=(n.y+s.y)/2,l=180*Math.atan2(s.y-n.y,s.x-n.x)/Math.PI,d=l>90||l<-90?l+180:l,c=(l+90)*Math.PI/180,h=15*Math.cos(c),p=15*Math.sin(c);return U`
        <text
          x="${r+h}"
          y="${a+p}"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(${d}, ${r+h}, ${a+p})"
          fill="#4361ee"
          font-size="12"
          font-weight="600"
          style="text-shadow: 0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6);"
        >${o}m</text>
      `});return U`<path class="room-fill" d="${e}"/><path class="room-outline" d="${e}"/>${t}`}_renderPoints(){const e="walls"===this._toolMode||"select"===this._toolMode,t=this._roomPoints.length>3;return this._roomPoints.map((i,o)=>{const n=this._toCanvas(i),s=o===this._draggingPointIndex;return U`
        <circle
          class="point-handle"
          cx="${n.x}" cy="${n.y}" r="8"
          fill="${s?"#22c55e":"#4361ee"}"
          stroke="${s?"#16a34a":"white"}"
          stroke-width="2"
          style="cursor: ${s?"grabbing":e?"grab":"default"}"
          @mousedown="${t=>{e&&(t.stopPropagation(),t.preventDefault(),this._draggingPointIndex=o)}}"
          @contextmenu="${i=>{i.stopPropagation(),i.preventDefault(),t&&e&&this._deletePoint(o)}}"
        />
      `})}_deletePoint(e){this._roomPoints.length<=3||(this._roomPoints=this._roomPoints.filter((t,i)=>i!==e),this._draggingPointIndex=null)}_renderWallHoverPreview(){if(!this._wallHoverPreview)return B;const e=this._toCanvas(this._wallHoverPreview.point);return U`
      <g style="cursor: pointer;"
         @mousedown="${e=>{e.stopPropagation(),e.preventDefault(),this._addPointOnWall(this._wallHoverPreview.wallIndex,this._wallHoverPreview.position,!0)}}">
        <circle cx="${e.x}" cy="${e.y}" r="12" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="2" stroke-dasharray="4 2"/>
        <circle cx="${e.x}" cy="${e.y}" r="4" fill="#22c55e"/>
      </g>
    `}_renderDoorWindowPreview(){if(!this._doorWindowPreview)return B;const e=this._doorWindowPreview,t=this._roomPoints[e.wallIndex],i=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],o=this._toCanvas(e.point),n=Math.atan2(i.y-t.y,i.x-t.x),s=.08*this._zoom,r=("door"===e.type?this._doorWidth:this._windowWidth)*s,a="door"===e.type,l=a?"#8b5cf6":"#0ea5e9",d=a?"rgba(139, 92, 246, 0.3)":"rgba(14, 165, 233, 0.3)",c=o.x-Math.cos(n)*r/2,h=o.y-Math.sin(n)*r/2,p=o.x+Math.cos(n)*r/2,g=o.y+Math.sin(n)*r/2;return U`
      <g style="cursor: pointer;"
         @mousedown="${t=>{t.stopPropagation(),t.preventDefault(),this._selectedWallIndex=e.wallIndex,this._pendingStart={x:e.position,y:0},a?this._showDoorDialog=!0:this._showWindowDialog=!0}}">
        <!-- Preview line -->
        <line x1="${c}" y1="${h}" x2="${p}" y2="${g}"
              stroke="${l}" stroke-width="6" stroke-dasharray="8 4" opacity="0.8"/>
        <!-- Center handle -->
        <circle cx="${o.x}" cy="${o.y}" r="10" fill="${d}" stroke="${l}" stroke-width="2"/>
        <text x="${o.x}" y="${o.y+4}" text-anchor="middle" fill="${l}" font-size="10" font-weight="bold">
          ${a?"🚪":"🪟"}
        </text>
      </g>
    `}_renderPreview(){if(!this._pendingStart||!this._previewPoint||"walls"!==this._toolMode)return B;const e=this._toCanvas(this._pendingStart),t=this._toCanvas(this._previewPoint),i=this._roomPoints[0],o=i&&this._roomPoints.length>=2&&Math.hypot(this._previewPoint.x-i.x,this._previewPoint.y-i.y)<250,n=i?this._toCanvas(i):null;return U`
      ${o&&n?U`<circle class="snap-indicator" cx="${n.x}" cy="${n.y}" r="20"/>`:B}
      <line class="preview-line" x1="${e.x}" y1="${e.y}" x2="${t.x}" y2="${t.y}"/>
      <circle class="preview-point" cx="${t.x}" cy="${t.y}" r="6"/>
    `}_renderFurniture(){const e="furniture"===this._toolMode||"select"===this._toolMode;return this._furniture.map((t,i)=>{const o=this._toCanvas({x:t.x,y:t.y}),n=.08*this._zoom,s=t.width*n,r=t.height*n,a=i===this._selectedFurnitureIndex,l=i===this._draggingFurnitureIndex;return U`
        <g @mousedown="${e=>this._startFurnitureDrag(e,i)}"
           style="cursor: ${l?"grabbing":e?"grab":"default"};">
          <rect
            x="${o.x-s/2}" y="${o.y-r/2}"
            width="${s}" height="${r}"
            fill="${l?"rgba(34, 197, 94, 0.3)":a?"rgba(59, 130, 246, 0.3)":"rgba(148, 163, 184, 0.2)"}"
            stroke="${l?"#22c55e":a?"#3b82f6":"#64748b"}"
            stroke-width="${l?3:2}"
            rx="4"
          />
          <text x="${o.x}" y="${o.y+4}" text-anchor="middle" fill="${l?"#22c55e":a?"#3b82f6":"#94a3b8"}" font-size="11" font-weight="500">
            ${t.name}
          </text>
        </g>
      `})}_renderDoorsAndWindows(){const e=[],t="door"===this._toolMode||"window"===this._toolMode||"select"===this._toolMode;return this._doors.forEach((i,o)=>{if(i.wallIndex>=this._roomPoints.length)return;const n=this._roomPoints[i.wallIndex],s=this._roomPoints[(i.wallIndex+1)%this._roomPoints.length],r=n.x+(s.x-n.x)*i.position,a=n.y+(s.y-n.y)*i.position,l=this._toCanvas({x:r,y:a}),d=Math.atan2(s.y-n.y,s.x-n.x),c=d+("inward"===i.openDirection?Math.PI/2:-Math.PI/2),h=.08*this._zoom,p=i.width*h,g=o===this._draggingDoorIndex,u=g?"#22c55e":"#8b5cf6";e.push(U`
        <g style="cursor: ${g?"grabbing":t?"grab":"default"};"
           @mousedown="${e=>{t&&(e.stopPropagation(),e.preventDefault(),this._draggingDoorIndex=o)}}">
          <!-- Hit area for easier clicking -->
          <circle cx="${l.x}" cy="${l.y}" r="15" fill="transparent"/>
          <!-- Door opening (gap in wall) -->
          <line
            x1="${l.x-Math.cos(d)*p/2}"
            y1="${l.y-Math.sin(d)*p/2}"
            x2="${l.x+Math.cos(d)*p/2}"
            y2="${l.y+Math.sin(d)*p/2}"
            stroke="#0f172a" stroke-width="6"
          />
          <!-- Door panel -->
          <line
            x1="${l.x}" y1="${l.y}"
            x2="${l.x+Math.cos(c)*p*.9}"
            y2="${l.y+Math.sin(c)*p*.9}"
            stroke="${u}" stroke-width="3"
          />
          <!-- Swing indicator arc -->
          <path
            d="M ${l.x+Math.cos(c)*p*.9} ${l.y+Math.sin(c)*p*.9} A ${.9*p} ${.9*p} 0 0 ${"left"===i.openSide?1:0} ${l.x+Math.cos(d+("left"===i.openSide?-1:1)*Math.PI/2)*p*.9} ${l.y+Math.sin(d+("left"===i.openSide?-1:1)*Math.PI/2)*p*.9}"
            fill="none" stroke="${u}" stroke-width="1" stroke-dasharray="4 2" opacity="0.5"
          />
          <!-- Center handle -->
          <circle cx="${l.x}" cy="${l.y}" r="6" fill="${u}" stroke="white" stroke-width="2"/>
        </g>
      `)}),this._windows.forEach((i,o)=>{if(i.wallIndex>=this._roomPoints.length)return;const n=this._roomPoints[i.wallIndex],s=this._roomPoints[(i.wallIndex+1)%this._roomPoints.length],r=n.x+(s.x-n.x)*i.position,a=n.y+(s.y-n.y)*i.position,l=this._toCanvas({x:r,y:a}),d=Math.atan2(s.y-n.y,s.x-n.x),c=.08*this._zoom,h=i.width*c,p=o===this._draggingWindowIndex,g=p?"#22c55e":"#0ea5e9",u=p?"#4ade80":"#38bdf8",_=l.x-Math.cos(d)*h/2,x=l.y-Math.sin(d)*h/2,v=l.x+Math.cos(d)*h/2,m=l.y+Math.sin(d)*h/2;e.push(U`
        <g style="cursor: ${p?"grabbing":t?"grab":"default"};"
           @mousedown="${e=>{t&&(e.stopPropagation(),e.preventDefault(),this._draggingWindowIndex=o)}}">
          <!-- Hit area for easier clicking -->
          <circle cx="${l.x}" cy="${l.y}" r="15" fill="transparent"/>
          <!-- Window frame -->
          <line x1="${_}" y1="${x}" x2="${v}" y2="${m}" stroke="${g}" stroke-width="6"/>
          <!-- Glass -->
          <line x1="${_}" y1="${x}" x2="${v}" y2="${m}" stroke="${u}" stroke-width="3"/>
          ${"fixed"!==i.windowType?U`
            <!-- Open indicator -->
            <line x1="${(_+v)/2}" y1="${(x+m)/2}"
                  x2="${(_+v)/2+15*Math.cos(d+Math.PI/2)}"
                  y2="${(x+m)/2+15*Math.sin(d+Math.PI/2)}"
                  stroke="${u}" stroke-width="2"/>
          `:""}
          <!-- Center handle -->
          <circle cx="${l.x}" cy="${l.y}" r="6" fill="${g}" stroke="white" stroke-width="2"/>
        </g>
      `)}),e}_project3D(e){const t=this._camera3d,i=t.azimuth*Math.PI/180,o=t.elevation*Math.PI/180,n=e.x-t.targetX,s=e.y-t.targetY,r=e.z-t.targetZ,a=n*Math.cos(i)-s*Math.sin(i),l=n*Math.sin(i)+s*Math.cos(i),d=r,c=l*Math.cos(o)-d*Math.sin(o),h=l*Math.sin(o)+d*Math.cos(o),p=1/Math.tan(60*Math.PI/360)*400,g=t.distance+c,u=g>50?p/g:p/50;return{x:400-a*u,y:300-h*u}}_render3DScene(){if(!this._canvas3d)return;const e=this._canvas3d.getContext("2d");if(!e)return;const t=this._canvas3d.width,i=this._canvas3d.height,o=e.createLinearGradient(0,0,0,i);o.addColorStop(0,"#1e293b"),o.addColorStop(1,"#0f172a"),e.fillStyle=o,e.fillRect(0,0,t,i),this._draw3DGrid(e),this._roomPoints.length>=3&&this._draw3DRoom(e),this._draw3DFurniture(e)}_draw3DGrid(e){e.strokeStyle="rgba(71, 85, 105, 0.3)",e.lineWidth=1;const t=5e3;for(let i=-5e3;i<=t;i+=1e3){const o=this._project3D({x:i,y:-5e3,z:0}),n=this._project3D({x:i,y:t,z:0});e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(n.x,n.y),e.stroke();const s=this._project3D({x:-5e3,y:i,z:0}),r=this._project3D({x:t,y:i,z:0});e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(r.x,r.y),e.stroke()}const i=this._project3D({x:0,y:0,z:0});e.strokeStyle="rgba(239, 68, 68, 0.6)",e.lineWidth=2;const o=this._project3D({x:2e3,y:0,z:0});e.beginPath(),e.moveTo(i.x,i.y),e.lineTo(o.x,o.y),e.stroke(),e.strokeStyle="rgba(34, 197, 94, 0.6)";const n=this._project3D({x:0,y:2e3,z:0});e.beginPath(),e.moveTo(i.x,i.y),e.lineTo(n.x,n.y),e.stroke(),e.strokeStyle="rgba(59, 130, 246, 0.6)";const s=this._project3D({x:0,y:0,z:2e3});e.beginPath(),e.moveTo(i.x,i.y),e.lineTo(s.x,s.y),e.stroke()}_draw3DRoom(e){const t=this._roomPoints;if(t.length<3)return;e.fillStyle="rgba(67, 97, 238, 0.1)",e.strokeStyle="rgba(67, 97, 238, 0.5)",e.lineWidth=2,e.beginPath();const i=this._project3D({x:t[0].x,y:t[0].y,z:0});e.moveTo(i.x,i.y);for(let i=1;i<t.length;i++){const o=this._project3D({x:t[i].x,y:t[i].y,z:0});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();const o=t.map((e,i)=>{const o=t[(i+1)%t.length],n=(e.x+o.x)/2,s=(e.y+o.y)/2,r=this._camera3d;return{index:i,dist:Math.hypot(n-r.targetX,s-r.targetY)}}).sort((e,t)=>t.dist-e.dist);for(const{index:t}of o)this._draw3DWall(e,t)}_draw3DWall(e,t){const i=this._roomPoints,o=i[t],n=i[(t+1)%i.length],s=this._project3D({x:o.x,y:o.y,z:0}),r=this._project3D({x:n.x,y:n.y,z:0}),a=this._project3D({x:n.x,y:n.y,z:fe}),l=this._project3D({x:o.x,y:o.y,z:fe}),d=n.x-o.x,c=n.y-o.y,h=Math.atan2(c,d)+Math.PI/2,p=this._camera3d.azimuth*Math.PI/180,g=.3+.4*Math.abs(Math.cos(h-p)),u=e.createLinearGradient((s.x+r.x)/2,Math.max(s.y,r.y),(l.x+a.x)/2,Math.min(l.y,a.y));u.addColorStop(0,`rgba(67, 97, 238, ${.4*g})`),u.addColorStop(1,`rgba(67, 97, 238, ${.2*g})`),e.fillStyle=u,e.strokeStyle="#4361ee",e.lineWidth=2,e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(r.x,r.y),e.lineTo(a.x,a.y),e.lineTo(l.x,l.y),e.closePath(),e.fill(),e.stroke();for(const i of this._doors)i.wallIndex===t&&this._draw3DDoor(e,i,o,n);for(const i of this._windows)i.wallIndex===t&&this._draw3DWindow(e,i,o,n);const _=Math.hypot(n.x-o.x,n.y-o.y)/1e3,x=this._project3D({x:(o.x+n.x)/2,y:(o.y+n.y)/2,z:2700});e.fillStyle="#4361ee",e.font="bold 12px sans-serif",e.textAlign="center",e.fillText(`${_.toFixed(2)}m`,x.x,x.y)}_draw3DDoor(e,t,i,o){const n=2100,s=t.width/2,r=i.x+(o.x-i.x)*t.position,a=i.y+(o.y-i.y)*t.position,l=o.x-i.x,d=o.y-i.y,c=Math.hypot(l,d),h=l/c,p=d/c,g=this._project3D({x:r-h*s,y:a-p*s,z:0}),u=this._project3D({x:r+h*s,y:a+p*s,z:0}),_=this._project3D({x:r+h*s,y:a+p*s,z:n}),x=this._project3D({x:r-h*s,y:a-p*s,z:n});e.fillStyle="rgba(15, 23, 42, 0.8)",e.beginPath(),e.moveTo(g.x,g.y),e.lineTo(u.x,u.y),e.lineTo(_.x,_.y),e.lineTo(x.x,x.y),e.closePath(),e.fill(),e.strokeStyle="#8b5cf6",e.lineWidth=3,e.stroke();const v=this._project3D({x:r+h*s*.7,y:a+p*s*.7,z:945});e.fillStyle="#fbbf24",e.beginPath(),e.arc(v.x,v.y,4,0,2*Math.PI),e.fill()}_draw3DWindow(e,t,i,o){const n=900,s=t.width/2,r=i.x+(o.x-i.x)*t.position,a=i.y+(o.y-i.y)*t.position,l=o.x-i.x,d=o.y-i.y,c=Math.hypot(l,d),h=l/c,p=d/c,g=this._project3D({x:r-h*s,y:a-p*s,z:n}),u=this._project3D({x:r+h*s,y:a+p*s,z:n}),_=this._project3D({x:r+h*s,y:a+p*s,z:n+t.height}),x=this._project3D({x:r-h*s,y:a-p*s,z:n+t.height});e.fillStyle="rgba(56, 189, 248, 0.3)",e.strokeStyle="#0ea5e9",e.lineWidth=2,e.beginPath(),e.moveTo(g.x,g.y),e.lineTo(u.x,u.y),e.lineTo(_.x,_.y),e.lineTo(x.x,x.y),e.closePath(),e.fill(),e.stroke(),e.strokeStyle="#0ea5e9",e.lineWidth=1,this._project3D({x:r,y:a,z:n+t.height/2});const v=this._project3D({x:r-h*s,y:a-p*s,z:n+t.height/2}),m=this._project3D({x:r+h*s,y:a+p*s,z:n+t.height/2}),y=this._project3D({x:r,y:a,z:n}),f=this._project3D({x:r,y:a,z:n+t.height});e.beginPath(),e.moveTo(v.x,v.y),e.lineTo(m.x,m.y),e.moveTo(y.x,y.y),e.lineTo(f.x,f.y),e.stroke()}_draw3DFurniture(e){for(const t of this._furniture){const i=t.width/2,o=t.height/2,n=400,s=[{x:t.x-i,y:t.y-o,z:0},{x:t.x+i,y:t.y-o,z:0},{x:t.x+i,y:t.y+o,z:0},{x:t.x-i,y:t.y+o,z:0}],r=s.map(e=>({...e,z:n})),a=s.map(e=>this._project3D(e)),l=r.map(e=>this._project3D(e));e.fillStyle="rgba(148, 163, 184, 0.4)",e.strokeStyle="#64748b",e.lineWidth=1,e.beginPath(),e.moveTo(l[0].x,l[0].y);for(let t=1;t<4;t++)e.lineTo(l[t].x,l[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle="rgba(148, 163, 184, 0.2)",e.beginPath(),e.moveTo(a[t].x,a[t].y),e.lineTo(a[i].x,a[i].y),e.lineTo(l[i].x,l[i].y),e.lineTo(l[t].x,l[t].y),e.closePath(),e.fill(),e.stroke()}const d=this._project3D({x:t.x,y:t.y,z:n+100});e.fillStyle="#94a3b8",e.font="11px sans-serif",e.textAlign="center",e.fillText(t.name,d.x,d.y)}}_handle3DMouseDown(e){0===e.button&&(this._isDragging3D=!0,this._lastMouseX=e.clientX,this._lastMouseY=e.clientY)}_handle3DMouseMove(e){if(!this._isDragging3D)return;const t=e.clientX-this._lastMouseX,i=e.clientY-this._lastMouseY;this._camera3d={...this._camera3d,azimuth:(this._camera3d.azimuth-.5*t)%360,elevation:Math.max(5,Math.min(85,this._camera3d.elevation+.3*i))},this._lastMouseX=e.clientX,this._lastMouseY=e.clientY,this._render3DScene()}_handle3DMouseUp(){this._isDragging3D=!1}_handle3DWheel(e){e.preventDefault();const t=e.deltaY>0?1.1:.9;this._camera3d={...this._camera3d,distance:Math.max(2e3,Math.min(2e4,this._camera3d.distance*t))},this._render3DScene()}_reset3DCamera(){if(this._roomPoints.length>=3){const e=this._roomPoints.map(e=>e.x),t=this._roomPoints.map(e=>e.y),i=(Math.min(...e)+Math.max(...e))/2,o=(Math.min(...t)+Math.max(...t))/2,n=Math.max(Math.max(...e)-Math.min(...e),Math.max(...t)-Math.min(...t));this._camera3d={azimuth:45,elevation:35,distance:Math.max(4e3,1.5*n),targetX:i,targetY:o,targetZ:1250}}else this._camera3d={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3};this._render3DScene()}_toggleViewMode(){this._viewMode="2d"===this._viewMode?"3d":"2d","3d"===this._viewMode&&(this._reset3DCamera(),requestAnimationFrame(()=>{this._canvas3d&&(this._canvas3d.width=this._canvas3d.offsetWidth,this._canvas3d.height=this._canvas3d.offsetHeight,this._render3DScene())}))}updated(e){super.updated(e),"3d"===this._viewMode&&this._canvas3d&&this._render3DScene()}_renderRightSidebar(){if("furniture"===this._toolMode)return L`
        <div class="section-title">MEUBELS</div>
        <p class="info-text" style="margin-bottom: 12px;">Selecteer een meubel en klik op de kaart om te plaatsen.</p>
        <div class="furniture-grid">
          ${be.map(e=>L`
            <div class="furniture-item ${this._selectedFurnitureType?.id===e.id?"selected":""}" @click="${()=>this._selectFurnitureType(e)}">
              <ha-icon icon="${e.icon}"></ha-icon>
              <span>${e.name}</span>
              <small>${e.defaultWidth/10}×${e.defaultHeight/10}cm</small>
            </div>
          `)}
        </div>

        ${this._furniture.length>0?L`
          <div class="placed-furniture">
            <div class="section-title">GEPLAATSTE MEUBELS</div>
            ${this._furniture.map((e,t)=>L`
              <div class="placed-item ${this._selectedFurnitureIndex===t?"selected":""}" @click="${()=>this._selectedFurnitureIndex=t}">
                <ha-icon icon="${be.find(t=>t.id===e.type)?.icon||"mdi:square"}"></ha-icon>
                <span class="name">${e.name}</span>
                <span class="size">${e.width/10}×${e.height/10}</span>
                <button class="delete-btn" @click="${e=>{e.stopPropagation(),this._deleteFurniture(t)}}">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `)}
          </div>
        `:""}
      `;if("door"===this._toolMode)return L`
        <div class="section-title">DEUREN</div>
        <p class="info-text" style="margin-bottom: 12px;">Klik op een muur om een deur toe te voegen.</p>

        ${this._doors.length>0?L`
          <div class="placed-furniture">
            <div class="section-title">GEPLAATSTE DEUREN</div>
            ${this._doors.map((e,t)=>L`
              <div class="placed-item">
                <ha-icon icon="mdi:door"></ha-icon>
                <span class="name">Deur ${t+1}</span>
                <span class="size">${e.width/10}cm</span>
                <button class="delete-btn" @click="${()=>this._editDoor(t)}" title="Bewerken">
                  <ha-icon icon="mdi:pencil"></ha-icon>
                </button>
                <button class="delete-btn" @click="${()=>this._deleteDoor(t)}" title="Verwijderen">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `)}
          </div>
        `:L`<p class="info-text" style="color: #64748b;">Nog geen deuren toegevoegd.</p>`}
      `;if("window"===this._toolMode)return L`
        <div class="section-title">RAMEN</div>
        <p class="info-text" style="margin-bottom: 12px;">Klik op een muur om een raam toe te voegen.</p>

        ${this._windows.length>0?L`
          <div class="placed-furniture">
            <div class="section-title">GEPLAATSTE RAMEN</div>
            ${this._windows.map((e,t)=>L`
              <div class="placed-item">
                <ha-icon icon="mdi:window-closed-variant"></ha-icon>
                <span class="name">${"fixed"===e.windowType?"Vast":"tilt"===e.windowType?"Kantel":"Draai"}</span>
                <span class="size">${e.width/10}×${e.height/10}cm</span>
                <button class="delete-btn" @click="${()=>this._editWindow(t)}" title="Bewerken">
                  <ha-icon icon="mdi:pencil"></ha-icon>
                </button>
                <button class="delete-btn" @click="${()=>this._deleteWindow(t)}" title="Verwijderen">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `)}
          </div>
        `:L`<p class="info-text" style="color: #64748b;">Nog geen ramen toegevoegd.</p>`}
      `;const e=this._calculateArea();return L`
      <div class="section-title">KAMER INFO</div>
      <div class="info-text">
        ${this._roomPoints.length>=3?L`
          <p>Oppervlakte: <span class="info-value">${e.toFixed(1)} m²</span></p>
          <p>Hoekpunten: <span class="info-value">${this._roomPoints.length}</span></p>
          <p>Meubels: <span class="info-value">${this._furniture.length}</span></p>
        `:L`<p>Teken muren om metingen te zien.</p>`}
      </div>
    `}render(){const e=this.rooms.find(e=>e.id===this._selectedRoomId),t=this._getInstructions();return L`
      <div class="sidebar-left">
        <div>
          <div class="section-title">KAMERS</div>
          <div class="room-list">
            ${this.rooms.map(e=>L`
              <div class="room-item ${e.id===this._selectedRoomId?"selected":""}" @click="${()=>this._selectRoom(e.id)}">
                <div class="room-icon"><ha-icon icon="mdi:floor-plan"></ha-icon></div>
                <span class="room-name">${e.name}</span>
              </div>
            `)}
            <button class="add-room-btn" @click="${this._showAddRoomDialog}"><ha-icon icon="mdi:plus"></ha-icon>Kamer Toevoegen</button>
          </div>
        </div>
        <div>
          <div class="section-title">GEREEDSCHAPPEN</div>
          <div class="tool-grid">
            <button class="tool-btn ${"select"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("select")}"><ha-icon icon="mdi:cursor-default"></ha-icon>Selecteer</button>
            <button class="tool-btn ${"walls"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("walls")}"><ha-icon icon="mdi:wall"></ha-icon>Muren</button>
            <button class="tool-btn ${"door"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("door")}"><ha-icon icon="mdi:door"></ha-icon>Deur</button>
            <button class="tool-btn ${"window"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("window")}"><ha-icon icon="mdi:window-closed-variant"></ha-icon>Raam</button>
            <button class="tool-btn ${"furniture"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("furniture")}"><ha-icon icon="mdi:sofa"></ha-icon>Meubels</button>
          </div>
        </div>
        <div class="instructions">
          <div class="instructions-title">${t.title}</div>
          <div class="instructions-text">${t.text}</div>
        </div>
      </div>

      <div class="canvas-area">
        <div class="canvas-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="room-label">Kamer: <span>${e?.name||"Geen geselecteerd"}</span></span>
          ${e?L`
            <div class="view-toggle">
              <button class="view-toggle-btn ${"2d"===this._viewMode?"active":""}" @click="${()=>this._viewMode="2d"}">
                <ha-icon icon="mdi:floor-plan"></ha-icon>2D
              </button>
              <button class="view-toggle-btn ${"3d"===this._viewMode?"active":""}" @click="${this._toggleViewMode}">
                <ha-icon icon="mdi:cube-outline"></ha-icon>3D
              </button>
            </div>
          `:B}
        </div>
        ${e?"2d"===this._viewMode?L`
          <svg viewBox="0 0 ${me} ${me}" @click="${this._handleCanvasClick}" @mousemove="${this._handleCanvasMove}" @mousedown="${this._handleCanvasDown}" @mouseup="${this._handleCanvasUp}" @mouseleave="${this._handleCanvasUp}" @wheel="${this._handleWheel}" @contextmenu="${e=>e.preventDefault()}">
            ${this._renderGrid()}${this._renderRoom()}${this._renderDoorsAndWindows()}${this._renderFurniture()}${this._renderPreview()}${this._renderPoints()}${this._renderWallHoverPreview()}${this._renderDoorWindowPreview()}
          </svg>
          <div class="canvas-controls">
            <div class="control-group">
              <button class="control-btn" @click="${()=>this._zoom=Math.min(5,this._zoom+.2)}"><ha-icon icon="mdi:plus"></ha-icon></button>
              <button class="control-btn" @click="${()=>this._zoom=Math.max(.2,this._zoom-.2)}"><ha-icon icon="mdi:minus"></ha-icon></button>
              <button class="control-btn" @click="${this._autoZoom}"><ha-icon icon="mdi:fit-to-screen"></ha-icon></button>
            </div>
            <div class="control-group"><span class="snap-label">Snap:</span>
              <button class="control-btn ${0===this._snapGrid?"active":""}" @click="${()=>this._snapGrid=0}" style="width:auto;padding:0 10px;font-size:11px">Uit</button>
              <button class="control-btn ${50===this._snapGrid?"active":""}" @click="${()=>this._snapGrid=50}" style="width:auto;padding:0 10px;font-size:11px">5cm</button>
              <button class="control-btn ${100===this._snapGrid?"active":""}" @click="${()=>this._snapGrid=100}" style="width:auto;padding:0 10px;font-size:11px">10cm</button>
              <button class="control-btn ${200===this._snapGrid?"active":""}" @click="${()=>this._snapGrid=200}" style="width:auto;padding:0 10px;font-size:11px">20cm</button>
            </div>
            ${"walls"===this._toolMode?L`<div class="control-group"><button class="control-btn" @click="${this._undoLastPoint}"><ha-icon icon="mdi:undo"></ha-icon></button><button class="control-btn" @click="${this._clearRoom}"><ha-icon icon="mdi:delete"></ha-icon></button></div>`:""}
          </div>
          ${this._cursorPos?L`<div class="cursor-info">X: <span>${(this._cursorPos.x/1e3).toFixed(2)}m</span> Y: <span>${(this._cursorPos.y/1e3).toFixed(2)}m</span>${this._roomPoints.length>0?L` | Pts: <span>${this._roomPoints.length}</span>`:""}</div>`:""}
        `:L`
          <canvas
            id="canvas3d"
            class="canvas3d"
            @mousedown="${this._handle3DMouseDown}"
            @mousemove="${this._handle3DMouseMove}"
            @mouseup="${this._handle3DMouseUp}"
            @mouseleave="${this._handle3DMouseUp}"
            @wheel="${this._handle3DWheel}"
          ></canvas>
          <div class="view-info">
            <div class="view-info-title">3D Weergave</div>
            <div class="view-info-value">${this._roomPoints.length>=3?"Sleep om te roteren":"Teken eerst muren in 2D"}</div>
          </div>
          <div class="camera-controls">
            <button class="camera-btn" @click="${this._reset3DCamera}" title="Reset camera">
              <ha-icon icon="mdi:camera-flip"></ha-icon>
            </button>
            <button class="camera-btn" @click="${()=>{this._camera3d={...this._camera3d,elevation:90},this._render3DScene()}}" title="Bovenaanzicht">
              <ha-icon icon="mdi:arrow-down-circle"></ha-icon>
            </button>
            <button class="camera-btn" @click="${()=>{this._camera3d={...this._camera3d,elevation:15},this._render3DScene()}}" title="Ooghoogte">
              <ha-icon icon="mdi:eye"></ha-icon>
            </button>
          </div>
        `:L`
          <div class="empty-state"><ha-icon icon="mdi:floor-plan"></ha-icon><h3>Kamer Builder</h3><p>Selecteer een kamer om te beginnen</p></div>
        `}
      </div>

      <div class="sidebar-right">
        ${this._renderRightSidebar()}
        <button class="save-btn" @click="${this._saveRoom}" ?disabled="${!this._selectedRoomId||this._saving}"><ha-icon icon="mdi:content-save"></ha-icon>${this._saving?"Opslaan...":"Kamer Opslaan"}</button>
      </div>

      ${this._showNewRoomDialog?L`
        <div class="dialog-overlay" @click="${this._hideAddRoomDialog}">
          <div class="dialog" @click="${e=>e.stopPropagation()}">
            <h3>Nieuwe Kamer</h3>
            <div style="display: grid; gap: 16px;">
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Kamer naam *</label>
                <input type="text" placeholder="Bijv. Woonkamer" .value="${this._newRoomName}" @input="${e=>this._newRoomName=e.target.value}" @keydown="${e=>"Enter"===e.key&&this._createNewRoom()}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;" autofocus/>
              </div>
              <div style="border-top: 1px solid #334155; padding-top: 16px;">
                <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Optioneel: afmetingen voor rechthoekige kamer (laat leeg om zelf te tekenen)</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <div>
                    <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Breedte (cm)</label>
                    <input type="number" placeholder="bijv. 400" .value="${this._newRoomWidth||""}" @input="${e=>this._newRoomWidth=parseInt(e.target.value)||0}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;"/>
                  </div>
                  <div>
                    <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Lengte (cm)</label>
                    <input type="number" placeholder="bijv. 500" .value="${this._newRoomLength||""}" @input="${e=>this._newRoomLength=parseInt(e.target.value)||0}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;"/>
                  </div>
                </div>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideAddRoomDialog}">Annuleren</button>
              <button class="dialog-btn primary" @click="${this._createNewRoom}">${this._newRoomWidth>0&&this._newRoomLength>0?"Aanmaken met afmetingen":"Aanmaken (zelf tekenen)"}</button>
            </div>
          </div>
        </div>
      `:""}

      ${this._showFurnitureDialog&&this._selectedFurnitureType?L`
        <div class="dialog-overlay" @click="${()=>this._showFurnitureDialog=!1}">
          <div class="dialog" @click="${e=>e.stopPropagation()}">
            <h3>${this._selectedFurnitureType.name} Plaatsen</h3>
            <p class="info-text" style="margin-bottom: 16px;">Geef de afmetingen op (bovenaanzicht)</p>
            <div class="input-row">
              <div>
                <label>Breedte (cm)</label>
                <input type="number" min="10" max="500" .value="${this._furnitureWidth/10}" @input="${e=>this._furnitureWidth=10*parseInt(e.target.value)||100}"/>
              </div>
              <div>
                <label>Diepte (cm)</label>
                <input type="number" min="10" max="500" .value="${this._furnitureHeight/10}" @input="${e=>this._furnitureHeight=10*parseInt(e.target.value)||100}"/>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${()=>this._showFurnitureDialog=!1}">Annuleren</button>
              <button class="dialog-btn primary" @click="${this._placeFurniture}">Plaatsen</button>
            </div>
          </div>
        </div>
      `:""}

      ${this._showDoorDialog?L`
        <div class="dialog-overlay" @click="${this._hideDoorDialog}">
          <div class="dialog" @click="${e=>e.stopPropagation()}">
            <h3>${null!==this._editingDoorIndex?"Deur Bewerken":"Deur Toevoegen"}</h3>
            <p class="info-text" style="margin-bottom: 16px;">Configureer de deur eigenschappen</p>
            <div style="display: grid; gap: 16px;">
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Breedte (cm)</label>
                <input type="number" .value="${this._doorWidth/10}" @input="${e=>this._doorWidth=10*parseInt(e.target.value)}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;"/>
              </div>
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Open richting</label>
                <select .value="${this._doorOpenDirection}" @change="${e=>this._doorOpenDirection=e.target.value}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;">
                  <option value="inward">Naar binnen</option>
                  <option value="outward">Naar buiten</option>
                </select>
              </div>
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Scharnier zijde</label>
                <select .value="${this._doorOpenSide}" @change="${e=>this._doorOpenSide=e.target.value}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;">
                  <option value="left">Links</option>
                  <option value="right">Rechts</option>
                </select>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideDoorDialog}">Annuleren</button>
              <button class="dialog-btn primary" @click="${null!==this._editingDoorIndex?this._saveDoorEdit:this._addDoor}">${null!==this._editingDoorIndex?"Opslaan":"Toevoegen"}</button>
            </div>
          </div>
        </div>
      `:""}

      ${this._showWindowDialog?L`
        <div class="dialog-overlay" @click="${this._hideWindowDialog}">
          <div class="dialog" @click="${e=>e.stopPropagation()}">
            <h3>${null!==this._editingWindowIndex?"Raam Bewerken":"Raam Toevoegen"}</h3>
            <p class="info-text" style="margin-bottom: 16px;">Configureer de raam eigenschappen</p>
            <div style="display: grid; gap: 16px;">
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Breedte (cm)</label>
                <input type="number" .value="${this._windowWidth/10}" @input="${e=>this._windowWidth=10*parseInt(e.target.value)}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;"/>
              </div>
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Hoogte (cm)</label>
                <input type="number" .value="${this._windowHeight/10}" @input="${e=>this._windowHeight=10*parseInt(e.target.value)}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;"/>
              </div>
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Raam type</label>
                <select .value="${this._windowType}" @change="${e=>this._windowType=e.target.value}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;">
                  <option value="fixed">Vast raam</option>
                  <option value="open">Draai raam</option>
                  <option value="tilt">Kantel raam</option>
                </select>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideWindowDialog}">Annuleren</button>
              <button class="dialog-btn primary" @click="${null!==this._editingWindowIndex?this._saveWindowEdit:this._addWindow}">${null!==this._editingWindowIndex?"Opslaan":"Toevoegen"}</button>
            </div>
          </div>
        </div>
      `:""}
    `}};we.styles=r`
    :host { display: grid; grid-template-columns: 280px 1fr 280px; height: 100%; background: #0f172a; color: #e2e8f0; overflow: hidden; }
    .sidebar-left, .sidebar-right { background: #1e293b; border-right: 1px solid #334155; padding: 20px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
    .sidebar-right { border-right: none; border-left: 1px solid #334155; }
    .section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 12px; }
    .room-list { display: flex; flex-direction: column; gap: 8px; }
    .room-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #0f172a; border: 1px solid transparent; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .room-item:hover { border-color: #475569; }
    .room-item.selected { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .room-icon { width: 40px; height: 40px; background: #4361ee; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .room-icon ha-icon { --mdc-icon-size: 20px; color: white; }
    .room-name { font-size: 14px; font-weight: 500; }
    .add-room-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border: 2px dashed #475569; border-radius: 12px; background: transparent; color: #94a3b8; font-size: 14px; cursor: pointer; transition: all 0.2s; }
    .add-room-btn:hover { border-color: #4361ee; color: #4361ee; }
    .tool-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .tool-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 12px; border: 1px solid #334155; border-radius: 12px; background: #0f172a; color: #94a3b8; font-size: 12px; cursor: pointer; transition: all 0.2s; }
    .tool-btn:hover { border-color: #4361ee; }
    .tool-btn.active { background: #4361ee; border-color: #4361ee; color: white; }
    .tool-btn ha-icon { --mdc-icon-size: 24px; }
    .instructions { background: rgba(67, 97, 238, 0.1); border: 1px solid rgba(67, 97, 238, 0.3); border-radius: 12px; padding: 12px; }
    .instructions-title { font-size: 13px; font-weight: 600; color: #4361ee; margin-bottom: 6px; }
    .instructions-text { font-size: 12px; color: #94a3b8; line-height: 1.5; }
    .canvas-area { position: relative; background: #0a0f1a; overflow: hidden; }
    .canvas-header { position: absolute; top: 0; left: 0; right: 0; padding: 16px 20px; background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, transparent 100%); z-index: 10; }
    .room-label { font-size: 14px; color: #94a3b8; }
    .room-label span { color: #e2e8f0; font-weight: 600; }
    svg { width: 100%; height: 100%; cursor: crosshair; }
    .grid-line { stroke: #1e293b; stroke-width: 1; vector-effect: non-scaling-stroke; }
    .grid-line.axis { stroke: #4361ee; stroke-width: 1; opacity: 0.3; }
    .room-fill { fill: rgba(67, 97, 238, 0.08); }
    .room-outline { fill: none; stroke: #4361ee; stroke-width: 3; vector-effect: non-scaling-stroke; }
    .point-handle { fill: #4361ee; stroke: white; stroke-width: 2; cursor: grab; }
    .preview-line { stroke: #22c55e; stroke-width: 2; stroke-dasharray: 8 4; vector-effect: non-scaling-stroke; }
    .preview-point { fill: #22c55e; stroke: white; stroke-width: 2; }
    .snap-indicator { fill: rgba(34, 197, 94, 0.3); stroke: #22c55e; stroke-width: 1; }
    .empty-state { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; }
    .empty-state ha-icon { --mdc-icon-size: 64px; color: #334155; margin-bottom: 16px; }
    .empty-state h3 { font-size: 18px; margin: 0 0 8px; color: #e2e8f0; }
    .empty-state p { font-size: 14px; color: #64748b; max-width: 300px; }
    .canvas-controls { position: absolute; bottom: 20px; left: 20px; display: flex; gap: 12px; z-index: 10; }
    .control-group { display: flex; gap: 4px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 12px; padding: 8px; }
    .control-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; border-radius: 8px; background: transparent; color: #94a3b8; cursor: pointer; }
    .control-btn:hover { background: #0f172a; color: #e2e8f0; }
    .control-btn.active { background: #4361ee; color: white; }
    .snap-label { font-size: 11px; color: #94a3b8; padding: 0 8px; display: flex; align-items: center; }
    .cursor-info { position: absolute; bottom: 20px; right: 20px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 12px; padding: 12px 16px; font-size: 12px; color: #94a3b8; z-index: 10; }
    .cursor-info span { color: #e2e8f0; font-weight: 600; font-family: monospace; }
    .save-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; background: #4361ee; border: none; border-radius: 12px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: auto; }
    .save-btn:hover:not(:disabled) { background: #3651d4; }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .dialog-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 28px; min-width: 360px; }
    .dialog h3 { margin: 0 0 20px; font-size: 18px; }
    .dialog input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: #e2e8f0; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; }
    .dialog label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
    .dialog-buttons { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
    .dialog-btn { padding: 10px 20px; border-radius: 10px; font-size: 14px; cursor: pointer; }
    .dialog-btn.cancel { background: transparent; border: 1px solid #475569; color: #94a3b8; }
    .dialog-btn.primary { background: #4361ee; border: none; color: white; }
    .dialog-btn.danger { background: #ef4444; border: none; color: white; }
    .furniture-grid { display: flex; flex-direction: column; gap: 8px; }
    .furniture-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .furniture-item:hover { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .furniture-item.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .furniture-item ha-icon { --mdc-icon-size: 24px; color: #94a3b8; }
    .furniture-item span { font-size: 13px; color: #e2e8f0; }
    .furniture-item small { font-size: 11px; color: #64748b; margin-left: auto; }
    .placed-furniture { margin-top: 16px; }
    .placed-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; margin-bottom: 6px; font-size: 12px; }
    .placed-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .placed-item ha-icon { --mdc-icon-size: 18px; color: #64748b; }
    .placed-item .name { flex: 1; color: #e2e8f0; }
    .placed-item .size { color: #64748b; }
    .placed-item .delete-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; }
    .setting-item { margin-bottom: 16px; }
    .setting-item label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
    .setting-item input[type="range"] { width: 100%; }
    .info-text { color: #64748b; font-size: 13px; line-height: 1.5; }
    .info-value { color: #e2e8f0; font-weight: 600; }
    .input-row { display: flex; gap: 12px; }
    .input-row > div { flex: 1; }
    @media (max-width: 1200px) { :host { grid-template-columns: 240px 1fr; } .sidebar-right { display: none; } }
    .view-toggle { display: flex; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
    .view-toggle-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: transparent; border: none; color: #94a3b8; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .view-toggle-btn:hover { background: rgba(67, 97, 238, 0.1); color: #4361ee; }
    .view-toggle-btn.active { background: linear-gradient(135deg, #4361ee, #3651d4); color: white; }
    .view-toggle-btn ha-icon { --mdc-icon-size: 18px; }
    .canvas3d { width: 100%; height: 100%; display: block; cursor: grab; }
    .canvas3d:active { cursor: grabbing; }
    .camera-controls { position: absolute; top: 60px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 10; }
    .camera-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 10px; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
    .camera-btn:hover { background: rgba(67, 97, 238, 0.2); border-color: #4361ee; color: #4361ee; }
    .camera-btn ha-icon { --mdc-icon-size: 20px; }
    .view-info { position: absolute; top: 60px; left: 20px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 10px; padding: 12px 16px; z-index: 10; }
    .view-info-title { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .view-info-value { font-size: 14px; color: #e2e8f0; font-weight: 600; }
  `,e([ge({attribute:!1})],we.prototype,"hass",void 0),e([ge({type:Array})],we.prototype,"rooms",void 0),e([ue()],we.prototype,"_selectedRoomId",void 0),e([ue()],we.prototype,"_roomPoints",void 0),e([ue()],we.prototype,"_toolMode",void 0),e([ue()],we.prototype,"_pendingStart",void 0),e([ue()],we.prototype,"_previewPoint",void 0),e([ue()],we.prototype,"_zoom",void 0),e([ue()],we.prototype,"_panOffset",void 0),e([ue()],we.prototype,"_snapGrid",void 0),e([ue()],we.prototype,"_cursorPos",void 0),e([ue()],we.prototype,"_saving",void 0),e([ue()],we.prototype,"_showNewRoomDialog",void 0),e([ue()],we.prototype,"_newRoomName",void 0),e([ue()],we.prototype,"_newRoomWidth",void 0),e([ue()],we.prototype,"_newRoomLength",void 0),e([ue()],we.prototype,"_isDragging",void 0),e([ue()],we.prototype,"_furniture",void 0),e([ue()],we.prototype,"_selectedFurnitureType",void 0),e([ue()],we.prototype,"_showFurnitureDialog",void 0),e([ue()],we.prototype,"_furnitureWidth",void 0),e([ue()],we.prototype,"_furnitureHeight",void 0),e([ue()],we.prototype,"_selectedFurnitureIndex",void 0),e([ue()],we.prototype,"_draggingFurnitureIndex",void 0),e([ue()],we.prototype,"_draggingPointIndex",void 0),e([ue()],we.prototype,"_draggingDoorIndex",void 0),e([ue()],we.prototype,"_draggingWindowIndex",void 0),e([ue()],we.prototype,"_wallHoverPreview",void 0),e([ue()],we.prototype,"_doorWindowPreview",void 0),e([ue()],we.prototype,"_editingDoorIndex",void 0),e([ue()],we.prototype,"_editingWindowIndex",void 0),e([ue()],we.prototype,"_doors",void 0),e([ue()],we.prototype,"_windows",void 0),e([ue()],we.prototype,"_showDoorDialog",void 0),e([ue()],we.prototype,"_showWindowDialog",void 0),e([ue()],we.prototype,"_selectedWallIndex",void 0),e([ue()],we.prototype,"_doorWidth",void 0),e([ue()],we.prototype,"_doorOpenDirection",void 0),e([ue()],we.prototype,"_doorOpenSide",void 0),e([ue()],we.prototype,"_windowWidth",void 0),e([ue()],we.prototype,"_windowHeight",void 0),e([ue()],we.prototype,"_windowType",void 0),e([_e("svg")],we.prototype,"_svg",void 0),e([_e("#canvas3d")],we.prototype,"_canvas3d",void 0),e([ue()],we.prototype,"_viewMode",void 0),we=e([ce("shs-room-builder-page")],we);const $e=800,ke=400,Pe={detection:4,exclusion:2,entry:2},ze={detection:{fill:"rgba(34, 197, 94, 0.2)",stroke:"#22c55e"},exclusion:{fill:"rgba(239, 68, 68, 0.2)",stroke:"#ef4444"},entry:{fill:"rgba(16, 185, 129, 0.25)",stroke:"#10b981"}},De={detection:{singular:"Detectie",plural:"Detectie",icon:"📍"},exclusion:{singular:"Exclusie",plural:"Exclusie",icon:"🚷"},entry:{singular:"Entry Lijn",plural:"Entry Lijnen",icon:"🚪"}};let Me=class extends le{constructor(){super(...arguments),this.rooms=[],this._selectedRoomId=null,this._roomPoints=[],this._furniture=[],this._doors=[],this._windows=[],this._sensorPos=null,this._sensorRotation=0,this._sensorRange=6e3,this._sensorFov=120,this._selectedDeviceId=null,this._draggingSensor=!1,this._zones=[],this._selectedZoneIndex=null,this._drawingZone=[],this._newZoneType="detection",this._showZoneTypePicker=!1,this._pendingZonePoints=[],this._draggingZonePointIndex=null,this._draggingDrawingPointIndex=null,this._draggingWholeZoneIndex=null,this._dragStartPos=null,this._zoneMidpointPreview=null,this._editingZoneIndex=null,this._liveTargets=[],this._entryExitEnabled=!1,this._assumedPresent=!1,this._pushingToSensor=!1,this._toolMode="select",this._zoom=1,this._panOffset={x:0,y:0},this._cursorPos=null,this._saving=!1,this._isDragging=!1,this._targetUpdateInterval=null,this._viewMode="2d",this._camera3d={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3},this._isDragging3D=!1,this._lastMouseX=0,this._lastMouseY=0,this.WALL_HEIGHT_3D=2500,this._pushingToESPHome=!1}connectedCallback(){super.connectedCallback(),this._loadRooms(),this._startTargetUpdates()}disconnectedCallback(){super.disconnectedCallback(),this._stopTargetUpdates()}_startTargetUpdates(){this._stopTargetUpdates(),this._targetUpdateInterval=window.setInterval(()=>this._updateTargets(),200)}_stopTargetUpdates(){this._targetUpdateInterval&&(clearInterval(this._targetUpdateInterval),this._targetUpdateInterval=null)}_updateTargets(){if(!this.hass||!this._selectedDeviceId)return;const e=[];for(let t=1;t<=3;t++){const i=`sensor.${this._selectedDeviceId}_target_${t}_x`,o=`sensor.${this._selectedDeviceId}_target_${t}_y`,n=this.hass.states[i],s=this.hass.states[o];if(n&&s){const t=parseFloat(n.state)||0,i=parseFloat(s.state)||0,o=0!==t||0!==i;e.push({x:t,y:i,active:o})}else if(1===t&&0===e.length){console.warn("Zones: Entity not found:",i,"exists:",!!n);const e=Object.keys(this.hass.states).filter(e=>e.includes(this._selectedDeviceId)||e.includes("target")).slice(0,5);console.warn("Zones: Sample matching entities:",e)}}const t=[...e];JSON.stringify(this._liveTargets)!==JSON.stringify(t)&&(this._liveTargets=t,this._updateTargetCirclesInDOM())}_getRadarDevices(){if(!this.hass)return[];const e=[],t=new Set;return Object.keys(this.hass.states).forEach(i=>{const o=i.match(/^sensor\.(.+)_target_1_x$/);if(o){const i=o[1];if(!t.has(i)){t.add(i);const o=i.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase());e.push({id:i,name:o})}}}),e}async _loadRooms(){try{const e=await this.hass.callWS({type:"smarthomeshop/rooms"});this.rooms=e.rooms||[],this.rooms.length>0&&!this._selectedRoomId&&this._selectRoom(this.rooms[0].id)}catch(e){console.error("Failed to load rooms:",e)}}_selectRoom(e){this._selectedRoomId=e;const t=this.rooms.find(t=>t.id===e);if(t){this._roomPoints=t.walls?.length>0?t.walls.map(e=>({x:e.x1,y:e.y1})):[],this._furniture=(t.furniture||[]).map(e=>({id:e.id,type:e.typeId||e.type||"unknown",name:e.name||"Meubel",x:e.x,y:e.y,width:e.width,height:e.height||e.depth||e.width,rotation:e.rotationDeg??e.rotation??0})),this._doors=t.doors||[],this._windows=t.windows||[];const e=t.sensor;console.log("Zones: Loading sensor from room:",e),e?(this._sensorPos={x:e.x,y:e.y},this._sensorRotation=e.rotation??0,this._sensorRange=e.range??6e3,this._sensorFov=e.fov??120,this._selectedDeviceId=e.deviceId??null,console.log("Zones: Sensor loaded - pos:",this._sensorPos,"deviceId:",this._selectedDeviceId)):(this._sensorPos=null,this._sensorRotation=0,this._sensorRange=6e3,this._sensorFov=120,this._selectedDeviceId=null),this._zones=t.zones||[],this._autoZoom()}this._toolMode="select",this._selectedZoneIndex=null,this._drawingZone=[]}async _saveRoom(){if(!this._selectedRoomId)return;this._saving=!0;const e=this.rooms.find(e=>e.id===this._selectedRoomId);if(!e)return;const t=this._sensorPos?{x:this._sensorPos.x,y:this._sensorPos.y,rotation:this._sensorRotation,range:this._sensorRange,fov:this._sensorFov,deviceId:this._selectedDeviceId}:null;try{const i={...e,sensor:t,zones:this._zones};await this.hass.callWS({type:"smarthomeshop/room/save",room:i}),this.rooms=this.rooms.map(e=>e.id===this._selectedRoomId?i:e)}catch(e){console.error("Failed to save room:",e)}finally{this._saving=!1}}async _pushToESPHome(){if(!this._selectedDeviceId)return console.warn("No device selected for push"),void alert("Selecteer eerst een sensor!");this._pushingToESPHome=!0;try{const e=this._selectedDeviceId;console.log("Using device name for ESPHome services:",e);const t=(await this.hass.callWS({type:"config/entity_registry/list"})).filter(t=>t.entity_id&&t.entity_id.includes(e));console.log("Matching entities found:",t.length),0===t.length&&console.warn("No matching entities found, but will try to push anyway");const i=this._zones.filter(e=>"detection"===e.type);for(let t=0;t<4;t++){const o=i[t],n=o?o.points.map(e=>`${Math.round(e.x)}:${Math.round(e.y)}`).join(";"):"";try{await this.hass.callService("esphome",`${e}_set_polygon_zone`,{zone_id:t+1,polygon:n}),console.log(`Pushed detection zone ${t+1}:`,n)}catch(t){console.warn(`Service ${e}_set_polygon_zone not found, skipping`)}}const o=this._zones.filter(e=>"exclusion"===e.type);for(let t=0;t<2;t++){const i=o[t],n=i?i.points.map(e=>`${Math.round(e.x)}:${Math.round(e.y)}`).join(";"):"";try{await this.hass.callService("esphome",`${e}_set_polygon_exclusion`,{zone_id:t+1,polygon:n}),console.log(`Pushed exclusion zone ${t+1}:`,n)}catch(t){console.warn(`Service ${e}_set_polygon_exclusion not found, skipping`)}}const n=this._zones.filter(e=>"entry"===e.type);for(let t=0;t<2;t++){const i=n[t];let o="";if(i&&2===i.points.length){const e=i.inDirection||"left";o=`${Math.round(i.points[0].x)}:${Math.round(i.points[0].y)};${Math.round(i.points[1].x)}:${Math.round(i.points[1].y)};${e}`}try{await this.hass.callService("esphome",`${e}_set_entry_line`,{line_id:t+1,line_data:o}),console.log(`Pushed entry line ${t+1}:`,o)}catch(t){console.warn(`Service ${e}_set_entry_line not found, skipping`)}}alert("Zones succesvol naar sensor gepusht!"),console.log("Successfully pushed all zones to ESPHome device")}catch(e){console.error("Failed to push to ESPHome:",e),alert(`Fout bij pushen naar sensor: ${e}`)}finally{this._pushingToESPHome=!1}}_autoZoom(){if(this._roomPoints.length<3)return this._zoom=1,void(this._panOffset={x:0,y:0});const e=this._roomPoints.map(e=>e.x),t=this._roomPoints.map(e=>e.y),i=Math.min(...e),o=Math.max(...e),n=Math.min(...t),s=Math.max(...t),r=o-i,a=s-n;this._zoom=Math.min(8500/Math.max(r,a),3);const l=(i+o)/2,d=(n+s)/2;this._panOffset={x:.08*-l*this._zoom,y:.08*-d*this._zoom}}_toCanvas(e){return{x:ke+e.x*$e/1e4*this._zoom+this._panOffset.x,y:ke+e.y*$e/1e4*this._zoom+this._panOffset.y}}_fromCanvas(e,t){return{x:(e-ke-this._panOffset.x)/this._zoom*1e4/$e,y:(t-ke-this._panOffset.y)/this._zoom*1e4/$e}}_getSvgPoint(e){if(!this._svg)return null;const t=this._svg.createSVGPoint();t.x=e.clientX,t.y=e.clientY;const i=this._svg.getScreenCTM();if(!i)return null;const o=t.matrixTransform(i.inverse());return{x:o.x,y:o.y}}_snapToGrid(e){const t=100;return{x:Math.round(e.x/t)*t,y:Math.round(e.y/t)*t}}_isPointInRoom(e){if(this._roomPoints.length<3)return!0;let t=!1;const i=this._roomPoints.length;for(let o=0,n=i-1;o<i;n=o++){const i=this._roomPoints[o].x,s=this._roomPoints[o].y,r=this._roomPoints[n].x,a=this._roomPoints[n].y;s>e.y!=a>e.y&&e.x<(r-i)*(e.y-s)/(a-s)+i&&(t=!t)}return t}_handleCanvasClick(e){if(0!==e.button)return;const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if("sensor"===this._toolMode&&!this._sensorPos){const e=this._snapToGrid(i);return void(this._isPointInRoom(e)&&(this._sensorPos=e))}if("zone"===this._toolMode){const e=this._snapToGrid(i);if(this._zoneMidpointPreview){if(-1===this._zoneMidpointPreview.zoneIndex){const e=[...this._drawingZone];e.splice(this._zoneMidpointPreview.segmentIndex+1,0,this._zoneMidpointPreview.point),this._drawingZone=e}else if(null!==this._selectedZoneIndex){const e=this._zones[this._selectedZoneIndex];if("entry"!==e.type){const t=[...e.points];t.splice(this._zoneMidpointPreview.segmentIndex+1,0,this._zoneMidpointPreview.point),this._zones=this._zones.map((e,i)=>i===this._selectedZoneIndex?{...e,points:t}:e)}}return void(this._zoneMidpointPreview=null)}if(0===this._drawingZone.length)return void(this._drawingZone=[e]);if(1===this._drawingZone.length)return this._drawingZone=[...this._drawingZone,e],this._pendingZonePoints=[...this._drawingZone],this._showZoneTypePicker=!0,void(this._drawingZone=[]);if(this._drawingZone.length>=3){const t=this._drawingZone[0];if(Math.hypot(e.x-t.x,e.y-t.y)<250)return this._pendingZonePoints=[...this._drawingZone],this._drawingZone=[],void(this._showZoneTypePicker=!0)}this._drawingZone=[...this._drawingZone,e]}}_handleContextMenu(e){e.preventDefault();const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if(this._drawingZone.length>0){const e=this._drawingZone.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==e)return void(this._drawingZone=this._drawingZone.filter((t,i)=>i!==e))}if(null!==this._selectedZoneIndex){const e=this._zones[this._selectedZoneIndex],t=e.points.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==t&&e.points.length>3){const i=e.points.filter((e,i)=>i!==t);this._zones=this._zones.map((e,t)=>t===this._selectedZoneIndex?{...e,points:i}:e)}}}_handleCanvasMove(e){const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if(this._cursorPos=i,this._draggingSensor&&this._sensorPos){const e=this._snapToGrid(i);return void(this._isPointInRoom(e)&&(this._sensorPos=e))}if(null!==this._draggingZonePointIndex&&null!==this._selectedZoneIndex){const e=this._snapToGrid(i),t=[...this._zones[this._selectedZoneIndex].points];return t[this._draggingZonePointIndex]=e,void(this._zones=this._zones.map((e,i)=>i===this._selectedZoneIndex?{...e,points:t}:e))}if(null!==this._draggingWholeZoneIndex&&this._dragStartPos){const e=i.x-this._dragStartPos.x,t=i.y-this._dragStartPos.y,o=this._zones[this._draggingWholeZoneIndex].points.map(i=>({x:i.x+e,y:i.y+t}));return this._zones=this._zones.map((e,t)=>t===this._draggingWholeZoneIndex?{...e,points:o}:e),void(this._dragStartPos=i)}if(null!==this._draggingDrawingPointIndex){const e=this._snapToGrid(i),t=[...this._drawingZone];return t[this._draggingDrawingPointIndex]=e,void(this._drawingZone=t)}if(this._zoneMidpointPreview=null,"zone"===this._toolMode&&this._drawingZone.length>=2)for(let e=0;e<this._drawingZone.length-1;e++){const t=this._drawingZone[e],o=this._drawingZone[e+1],n=(t.x+o.x)/2,s=(t.y+o.y)/2;if(Math.hypot(i.x-n,i.y-s)<200){this._zoneMidpointPreview={zoneIndex:-1,segmentIndex:e,point:{x:n,y:s}};break}}if("zone"===this._toolMode&&null!==this._selectedZoneIndex&&0===this._drawingZone.length&&!this._zoneMidpointPreview){const e=this._zones[this._selectedZoneIndex];for(let t=0;t<e.points.length;t++){const o=e.points[t],n=e.points[(t+1)%e.points.length],s=(o.x+n.x)/2,r=(o.y+n.y)/2;if(Math.hypot(i.x-s,i.y-r)<200){this._zoneMidpointPreview={zoneIndex:this._selectedZoneIndex,segmentIndex:t,point:{x:s,y:r}};break}}}this._isDragging&&(this._panOffset={x:this._panOffset.x+e.movementX,y:this._panOffset.y+e.movementY})}_handleCanvasDown(e){if(1===e.button||0===e.button&&e.altKey)return void(this._isDragging=!0);if(0!==e.button)return;const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if(this._sensorPos&&Math.hypot(i.x-this._sensorPos.x,i.y-this._sensorPos.y)<200)this._draggingSensor=!0;else{if(this._drawingZone.length>0){const e=this._drawingZone.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==e)return void(this._draggingDrawingPointIndex=e)}if(null!==this._selectedZoneIndex&&"zone"===this._toolMode){const e=this._zones[this._selectedZoneIndex],t=e.points.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==t)return void(this._draggingZonePointIndex=t);if("entry"===e.type&&2===e.points.length){const t=e.points[0],o=e.points[1],n=o.x-t.x,s=o.y-t.y,r=n*n+s*s;if(r>0){const e=Math.max(0,Math.min(1,((i.x-t.x)*n+(i.y-t.y)*s)/r)),o=t.x+e*n,a=t.y+e*s;if(Math.hypot(i.x-o,i.y-a)<200)return this._draggingWholeZoneIndex=this._selectedZoneIndex,void(this._dragStartPos=i)}}if(e.points.length>=3&&this._isPointInZone(i,e.points))return this._draggingWholeZoneIndex=this._selectedZoneIndex,void(this._dragStartPos=i)}}}_isPointInZone(e,t){if(t.length<3)return!1;let i=!1;for(let o=0,n=t.length-1;o<t.length;n=o++){const s=t[o].x,r=t[o].y,a=t[n].x,l=t[n].y;r>e.y!=l>e.y&&e.x<(a-s)*(e.y-r)/(l-r)+s&&(i=!i)}return i}_handleCanvasUp(){this._isDragging=!1,this._draggingSensor=!1,this._draggingZonePointIndex=null,this._draggingDrawingPointIndex=null,this._draggingWholeZoneIndex=null,this._dragStartPos=null}_handleWheel(e){e.preventDefault();const t=e.deltaY>0?.9:1.1;this._zoom=Math.max(.2,Math.min(5,this._zoom*t))}_deleteZone(e){this._zones=this._zones.filter((t,i)=>i!==e),this._selectedZoneIndex===e&&(this._selectedZoneIndex=null),this._editingZoneIndex===e&&(this._editingZoneIndex=null)}_updateZoneName(e,t){this._zones=this._zones.map((i,o)=>o===e?{...i,name:t}:i)}_updateZoneType(e,t){this._zones=this._zones.map((i,o)=>o===e?{...i,type:t}:i)}_getZoneCountByType(e){return this._zones.filter(t=>t.type===e).length}_canAddZone(e){return this._getZoneCountByType(e)<Pe[e]}_startDrawingZone(e){this._canAddZone(e)&&(this._newZoneType=e,this._drawingZone=[],this._toolMode="zone",this._selectedZoneIndex=null)}_startDrawingAnyZone(){const e=["detection","exclusion","entry"].some(e=>this._canAddZone(e));e&&(this._drawingZone=[],this._toolMode="zone",this._selectedZoneIndex=null)}_selectZoneType(e){if(!this._canAddZone(e))return;if("entry"===e){if(2!==this._pendingZonePoints.length)return;const t=this._zones.filter(t=>t.type===e).length+1;return this._zones=[...this._zones,{id:Date.now(),points:[...this._pendingZonePoints],type:e,name:`Entry Lijn ${t}`,inDirection:"left"}],this._showZoneTypePicker=!1,this._pendingZonePoints=[],this._selectedZoneIndex=this._zones.length-1,void(this._editingZoneIndex=this._zones.length-1)}if(this._pendingZonePoints.length<3)return;const t=this._zones.filter(t=>t.type===e).length+1,i=De[e];this._zones=[...this._zones,{id:Date.now(),points:[...this._pendingZonePoints],type:e,name:`${i.singular} Zone ${t}`}],this._showZoneTypePicker=!1,this._pendingZonePoints=[]}_continueDrawingPolygon(){this._drawingZone=[...this._pendingZonePoints],this._pendingZonePoints=[],this._showZoneTypePicker=!1}_cancelZoneTypePicker(){this._showZoneTypePicker=!1,this._pendingZonePoints=[]}_toggleEntryDirection(e){const t=this._zones[e];if("entry"!==t.type)return;const i="left"===t.inDirection?"right":"left";this._zones=this._zones.map((t,o)=>o===e?{...t,inDirection:i}:t)}_renderZoneEditForm(e,t){return this._editingZoneIndex!==t?"":"entry"===e.type?L`
        <div class="zone-edit-form">
          <label>Entry lijn naam</label>
          <input type="text" .value="${e.name}"
                 @input="${e=>this._updateZoneName(t,e.target.value)}"/>

          <label>IN/UIT richting</label>
          <div class="direction-toggle">
            <button class="${"left"===e.inDirection?"active in":""}"
                    @click="${()=>this._toggleEntryDirection(t)}"
                    title="IN richting links van de lijn">
              ⬅️ IN links
            </button>
            <button class="${"right"===e.inDirection?"active in":""}"
                    @click="${()=>this._toggleEntryDirection(t)}"
                    title="IN richting rechts van de lijn">
              IN rechts ➡️
            </button>
          </div>
          <p class="help-text">De groene "IN" pijl geeft aan welke kant de kamer ingaan is. De rode "UIT" pijl de uitgaande richting.</p>

          <div class="edit-actions">
            <button class="cancel-btn" @click="${()=>this._editingZoneIndex=null}">Sluiten</button>
          </div>
        </div>
      `:L`
      <div class="zone-edit-form">
        <label>Zone naam</label>
        <input type="text" .value="${e.name}"
               @input="${e=>this._updateZoneName(t,e.target.value)}"/>
        <label>Zone type</label>
        <div class="type-switch">
          <button class="${"detection"===e.type?"active":""}"
                  @click="${()=>this._updateZoneType(t,"detection")}">
            📍 Detectie
          </button>
          <button class="exclusion ${"exclusion"===e.type?"active":""}"
                  @click="${()=>this._updateZoneType(t,"exclusion")}">
            🚷 Exclusie
          </button>
        </div>
        <div class="edit-actions">
          <button class="cancel-btn" @click="${()=>this._editingZoneIndex=null}">Sluiten</button>
        </div>
      </div>
    `}_getInstructions(){switch(this._toolMode){case"select":return{title:"Selecteer",text:"Sleep de sensor of selecteer een zone om te bewerken."};case"sensor":return{title:"Sensor Plaatsen",text:this._sensorPos?"Sleep het blauwe bolletje om de sensor te verplaatsen.":"Klik op de kaart om de sensor te plaatsen."};case"zone":if(1===this._drawingZone.length)return{title:"Punt 2 plaatsen",text:"Klik voor het tweede punt. Na 2 punten kun je een Entry Lijn maken of doorgaan voor een polygon zone."};if(this._drawingZone.length>1)return{title:"Zone Tekenen",text:"Klik om punten toe te voegen. Klik bij groene punt om te sluiten. Sleep punten om te verplaatsen. Rechtermuisknop op punt om te verwijderen."};if(null!==this._selectedZoneIndex){const e=this._zones[this._selectedZoneIndex];return"entry"===e?.type?{title:"Entry Lijn Bewerken",text:"Sleep de eindpunten om de lijn te verplaatsen. Gebruik het edit menu om de IN/UIT richting te wijzigen."}:{title:"Zone Bewerken",text:"Sleep punten om te verplaatsen. Klik op groene midpoint om punt toe te voegen. Rechtermuisknop op punt om te verwijderen."}}return{title:"Zone Tekenen",text:"Klik om het eerste punt te plaatsen. 2 punten = Entry Lijn, 3+ punten = Detectie/Exclusie Zone."};default:return{title:"Zones Configureren",text:"Selecteer een gereedschap om te beginnen."}}}_project3D(e){const t=this._camera3d,i=t.azimuth*Math.PI/180,o=t.elevation*Math.PI/180,n=e.x-t.targetX,s=e.y-t.targetY,r=e.z-t.targetZ,a=n*Math.cos(i)-s*Math.sin(i),l=n*Math.sin(i)+s*Math.cos(i),d=r,c=l*Math.cos(o)-d*Math.sin(o),h=l*Math.sin(o)+d*Math.cos(o),p=1/Math.tan(60*Math.PI/360)*400,g=t.distance+c,u=g>50?p/g:p/50;return{x:400-a*u,y:300-h*u}}_render3DScene(){if(!this._canvas3d)return;const e=this._canvas3d.getContext("2d");if(!e)return;const t=this._canvas3d.width,i=this._canvas3d.height,o=e.createLinearGradient(0,0,0,i);o.addColorStop(0,"#1e293b"),o.addColorStop(1,"#0f172a"),e.fillStyle=o,e.fillRect(0,0,t,i),this._draw3DGrid(e),this._roomPoints.length>=3&&(this._draw3DRoom(e),this._draw3DFurniture(e),this._draw3DDoors(e),this._draw3DWindows(e),this._draw3DZones(e)),this._draw3DSensor(e),this._draw3DTargets(e)}_draw3DGrid(e){e.strokeStyle="rgba(71, 85, 105, 0.3)",e.lineWidth=1;const t=5e3;for(let i=-5e3;i<=t;i+=1e3){const o=this._project3D({x:i,y:-5e3,z:0}),n=this._project3D({x:i,y:t,z:0});e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(n.x,n.y),e.stroke();const s=this._project3D({x:-5e3,y:i,z:0}),r=this._project3D({x:t,y:i,z:0});e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(r.x,r.y),e.stroke()}}_draw3DRoom(e){const t=this._roomPoints;if(t.length<3)return;e.fillStyle="rgba(67, 97, 238, 0.08)",e.strokeStyle="rgba(67, 97, 238, 0.4)",e.lineWidth=2,e.beginPath();const i=this._project3D({x:t[0].x,y:t[0].y,z:0});e.moveTo(i.x,i.y);for(let i=1;i<t.length;i++){const o=this._project3D({x:t[i].x,y:t[i].y,z:0});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();const o=t.map((e,i)=>{const o=t[(i+1)%t.length],n=(e.x+o.x)/2,s=(e.y+o.y)/2;return{index:i,dist:Math.hypot(n-this._camera3d.targetX,s-this._camera3d.targetY)}}).sort((e,t)=>t.dist-e.dist);for(const{index:t}of o)this._draw3DWall(e,t)}_draw3DWall(e,t){const i=this._roomPoints,o=i[t],n=i[(t+1)%i.length],s=this._project3D({x:o.x,y:o.y,z:0}),r=this._project3D({x:n.x,y:n.y,z:0}),a=this._project3D({x:n.x,y:n.y,z:this.WALL_HEIGHT_3D}),l=this._project3D({x:o.x,y:o.y,z:this.WALL_HEIGHT_3D}),d=n.x-o.x,c=n.y-o.y,h=Math.atan2(c,d)+Math.PI/2,p=this._camera3d.azimuth*Math.PI/180,g=.3+.4*Math.abs(Math.cos(h-p)),u=e.createLinearGradient((s.x+r.x)/2,Math.max(s.y,r.y),(l.x+a.x)/2,Math.min(l.y,a.y));u.addColorStop(0,`rgba(71, 85, 105, ${.5*g})`),u.addColorStop(1,`rgba(71, 85, 105, ${.2*g})`),e.fillStyle=u,e.strokeStyle="#475569",e.lineWidth=2,e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(r.x,r.y),e.lineTo(a.x,a.y),e.lineTo(l.x,l.y),e.closePath(),e.fill(),e.stroke()}_draw3DFurniture(e){for(const t of this._furniture){const i=t.width/2,o=t.height/2,n=400,s=[{x:t.x-i,y:t.y-o,z:0},{x:t.x+i,y:t.y-o,z:0},{x:t.x+i,y:t.y+o,z:0},{x:t.x-i,y:t.y+o,z:0}],r=s.map(e=>({...e,z:n})),a=s.map(e=>this._project3D(e)),l=r.map(e=>this._project3D(e));e.fillStyle="rgba(148, 163, 184, 0.5)",e.strokeStyle="#64748b",e.lineWidth=1,e.beginPath(),e.moveTo(l[0].x,l[0].y);for(let t=1;t<4;t++)e.lineTo(l[t].x,l[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle="rgba(148, 163, 184, 0.25)",e.beginPath(),e.moveTo(a[t].x,a[t].y),e.lineTo(a[i].x,a[i].y),e.lineTo(l[i].x,l[i].y),e.lineTo(l[t].x,l[t].y),e.closePath(),e.fill(),e.stroke()}const d=this._project3D({x:t.x,y:t.y,z:n+100});e.fillStyle="#94a3b8",e.font="11px sans-serif",e.textAlign="center",e.fillText(t.name,d.x,d.y)}}_draw3DDoors(e){if(this._roomPoints.length<3)return;for(const t of this._doors){if(t.wallIndex>=this._roomPoints.length)continue;const i=this._roomPoints[t.wallIndex],o=this._roomPoints[(t.wallIndex+1)%this._roomPoints.length],n=i.x+(o.x-i.x)*t.position,s=i.y+(o.y-i.y)*t.position,r=Math.atan2(o.y-i.y,o.x-i.x),a=t.width/2,l=Math.cos(r),d=Math.sin(r),c=Math.cos(r+Math.PI/2),h=Math.sin(r+Math.PI/2),p=[{x:n-a*l-40*c,y:s-a*d-40*h},{x:n+a*l-40*c,y:s+a*d-40*h},{x:n+a*l+40*c,y:s+a*d+40*h},{x:n-a*l+40*c,y:s-a*d+40*h}],g=p.map(e=>this._project3D({...e,z:0})),u=p.map(e=>this._project3D({...e,z:2e3}));e.strokeStyle="#8b5a2b",e.lineWidth=1,e.fillStyle="rgba(139, 90, 43, 0.6)",e.beginPath(),e.moveTo(u[0].x,u[0].y);for(let t=1;t<4;t++)e.lineTo(u[t].x,u[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(139, 90, 43, 0.5)":"rgba(139, 90, 43, 0.35)",e.beginPath(),e.moveTo(g[t].x,g[t].y),e.lineTo(g[i].x,g[i].y),e.lineTo(u[i].x,u[i].y),e.lineTo(u[t].x,u[t].y),e.closePath(),e.fill(),e.stroke()}const _=this._project3D({x:n,y:s,z:2100});e.fillStyle="#d4a574",e.font="14px sans-serif",e.textAlign="center",e.fillText("🚪",_.x,_.y)}}_draw3DWindows(e){if(this._roomPoints.length<3)return;for(const t of this._windows){if(t.wallIndex>=this._roomPoints.length)continue;const i=this._roomPoints[t.wallIndex],o=this._roomPoints[(t.wallIndex+1)%this._roomPoints.length],n=i.x+(o.x-i.x)*t.position,s=i.y+(o.y-i.y)*t.position,r=Math.atan2(o.y-i.y,o.x-i.x),a=t.width/2,l=Math.cos(r),d=Math.sin(r),c=Math.cos(r+Math.PI/2),h=Math.sin(r+Math.PI/2),p=[{x:n-a*l-25*c,y:s-a*d-25*h},{x:n+a*l-25*c,y:s+a*d-25*h},{x:n+a*l+25*c,y:s+a*d+25*h},{x:n-a*l+25*c,y:s-a*d+25*h}],g=p.map(e=>this._project3D({...e,z:900})),u=p.map(e=>this._project3D({...e,z:2e3}));e.strokeStyle="#4a90a4",e.lineWidth=1,e.fillStyle="rgba(135, 206, 235, 0.4)",e.beginPath(),e.moveTo(u[0].x,u[0].y);for(let t=1;t<4;t++)e.lineTo(u[t].x,u[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(135, 206, 235, 0.35)":"rgba(135, 206, 235, 0.25)",e.beginPath(),e.moveTo(g[t].x,g[t].y),e.lineTo(g[i].x,g[i].y),e.lineTo(u[i].x,u[i].y),e.lineTo(u[t].x,u[t].y),e.closePath(),e.fill(),e.stroke()}}}_draw3DZones(e){const t=this.WALL_HEIGHT_3D;for(const i of this._zones){const o=ze[i.type],n=i.points;if("entry"===i.type&&2===n.length){const s=n[0],r=n[1],a=this._project3D({x:s.x,y:s.y,z:0}),l=this._project3D({x:r.x,y:r.y,z:0}),d=this._project3D({x:s.x,y:s.y,z:t}),c=this._project3D({x:r.x,y:r.y,z:t});e.fillStyle=o.fill.replace("0.25","0.4"),e.strokeStyle=o.stroke,e.lineWidth=3,e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(l.x,l.y),e.lineTo(c.x,c.y),e.lineTo(d.x,d.y),e.closePath(),e.fill(),e.stroke();const h=(s.x+r.x)/2,p=(s.y+r.y)/2,g=this._project3D({x:h,y:p,z:t/2});e.fillStyle=o.stroke,e.font="bold 14px sans-serif",e.textAlign="center",e.fillText("left"===i.inDirection?"← IN":"IN →",g.x,g.y)}else if(n.length>=3){e.fillStyle=o.fill,e.strokeStyle=o.stroke,e.lineWidth=2,e.beginPath();const s=this._project3D({x:n[0].x,y:n[0].y,z:10});e.moveTo(s.x,s.y);for(let t=1;t<n.length;t++){const i=this._project3D({x:n[t].x,y:n[t].y,z:10});e.lineTo(i.x,i.y)}e.closePath(),e.fill(),e.stroke(),e.fillStyle=o.fill.replace("0.2","0.15"),e.beginPath();const r=this._project3D({x:n[0].x,y:n[0].y,z:t});e.moveTo(r.x,r.y);for(let i=1;i<n.length;i++){const o=this._project3D({x:n[i].x,y:n[i].y,z:t});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();for(let i=0;i<n.length;i++){const s=n[i],r=n[(i+1)%n.length],a=this._project3D({x:s.x,y:s.y,z:10}),l=this._project3D({x:r.x,y:r.y,z:10}),d=this._project3D({x:r.x,y:r.y,z:t}),c=this._project3D({x:s.x,y:s.y,z:t});e.fillStyle=o.fill.replace("0.2","0.12"),e.strokeStyle=o.stroke,e.lineWidth=1,e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(l.x,l.y),e.lineTo(d.x,d.y),e.lineTo(c.x,c.y),e.closePath(),e.fill(),e.stroke()}const a=n.reduce((e,t)=>e+t.x,0)/n.length,l=n.reduce((e,t)=>e+t.y,0)/n.length,d=this._project3D({x:a,y:l,z:t/2});e.fillStyle=o.stroke,e.font="bold 12px sans-serif",e.textAlign="center",e.fillText(i.name,d.x,d.y)}}}_draw3DSensor(e){if(!this._sensorPos)return;const t=this._project3D({x:this._sensorPos.x,y:this._sensorPos.y,z:2e3}),i=this._sensorFov/2*Math.PI/180,o=(this._sensorRotation-90)*Math.PI/180,n=this._sensorRange,s=o-i,r=o+i,a=this._sensorPos.x+Math.cos(s)*n,l=this._sensorPos.y+Math.sin(s)*n,d=this._sensorPos.x+Math.cos(r)*n,c=this._sensorPos.y+Math.sin(r)*n,h=this._project3D({x:this._sensorPos.x,y:this._sensorPos.y,z:0}),p=this._project3D({x:a,y:l,z:0}),g=this._project3D({x:d,y:c,z:0});e.fillStyle="rgba(67, 97, 238, 0.15)",e.strokeStyle="#4361ee",e.lineWidth=2,e.beginPath(),e.moveTo(h.x,h.y),e.lineTo(p.x,p.y),e.lineTo(g.x,g.y),e.closePath(),e.fill(),e.stroke(),e.fillStyle="#4361ee",e.beginPath(),e.arc(t.x,t.y,12,0,2*Math.PI),e.fill(),e.fillStyle="white",e.font="bold 10px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText("📡",t.x,t.y)}_draw3DTargets(e){const t=this._liveTargets.filter(e=>e.active);if(!this._sensorPos)return;const i=(this._sensorRotation-90)*Math.PI/180;for(let o=0;o<t.length;o++){const n=t[o],s=this._sensorPos.x+n.y*Math.cos(i)-n.x*Math.sin(i),r=this._sensorPos.y+n.y*Math.sin(i)+n.x*Math.cos(i);e.save();const a=this._project3D({x:s+80,y:r+80,z:5});e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.ellipse(a.x,a.y,25,10,.3,0,2*Math.PI),e.fill(),this._draw3DCapsule(e,s-60,r,0,60,700,"#8b9299","#6b7280"),this._draw3DCapsule(e,s+60,r,0,60,700,"#8b9299","#6b7280"),this._draw3DCapsule(e,s-160,r,900,50,380,"#8b9299","#6b7280"),this._draw3DCapsule(e,s+160,r,900,50,380,"#8b9299","#6b7280"),this._draw3DCapsule(e,s,r,700,120,600,"#b8bfc7","#9ca3af"),this._draw3DSphere(e,s,r,1500,110);const l=this._project3D({x:s,y:r,z:1700});e.fillStyle="rgba(239, 68, 68, 0.95)",e.beginPath(),e.arc(l.x,l.y,14,0,2*Math.PI),e.fill(),e.strokeStyle="rgba(255, 255, 255, 0.6)",e.lineWidth=2,e.stroke(),e.fillStyle="white",e.font="bold 12px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText(`${o+1}`,l.x,l.y),e.restore()}}_draw3DCapsule(e,t,i,o,n,s,r,a){const l=.8*n,d=o+s,c=[];for(let e=0;e<8;e++){const s=e/8*Math.PI*2,r=(e+1)/8*Math.PI*2,a=t+Math.cos(s)*n,h=i+Math.sin(s)*l,p=t+Math.cos(r)*n,g=i+Math.sin(r)*l,u=this._project3D({x:a,y:h,z:o}),_=this._project3D({x:p,y:g,z:o}),x=this._project3D({x:p,y:g,z:d}),v=this._project3D({x:a,y:h,z:d}),m=(h+g)/2;c.push({points:[u,_,x,v],depth:m,isTop:!1,isSide:!0})}const h=[];for(let e=0;e<8;e++){const o=e/8*Math.PI*2,s=t+Math.cos(o)*n,r=i+Math.sin(o)*l;h.push(this._project3D({x:s,y:r,z:d}))}c.push({points:h,depth:-1e3,isTop:!0,isSide:!1}),c.sort((e,t)=>t.depth-e.depth);for(const t of c){e.beginPath(),e.moveTo(t.points[0].x,t.points[0].y);for(let i=1;i<t.points.length;i++)e.lineTo(t.points[i].x,t.points[i].y);if(e.closePath(),t.isTop)e.fillStyle=r;else{const i=t.depth>0?.85:1;e.fillStyle=this._shadeColor(r,i)}e.fill(),e.strokeStyle=a,e.lineWidth=.5,e.stroke()}}_draw3DSphere(e,t,i,o,n){const s=this._project3D({x:t,y:i,z:o}),r=this._project3D({x:t,y:i,z:o+n}),a=Math.abs(s.y-r.y),l=e.createRadialGradient(s.x-.35*a,s.y-.35*a,0,s.x,s.y,a);l.addColorStop(0,"#ffffff"),l.addColorStop(.3,"#e5e7eb"),l.addColorStop(.7,"#d1d5db"),l.addColorStop(1,"#9ca3af"),e.fillStyle=l,e.beginPath(),e.arc(s.x,s.y,a,0,2*Math.PI),e.fill(),e.strokeStyle="#6b7280",e.lineWidth=1,e.stroke()}_shadeColor(e,t){const i=e.replace("#","");return`rgb(${Math.round(parseInt(i.substr(0,2),16)*t)}, ${Math.round(parseInt(i.substr(2,2),16)*t)}, ${Math.round(parseInt(i.substr(4,2),16)*t)})`}_handle3DMouseDown(e){0===e.button&&(this._isDragging3D=!0,this._lastMouseX=e.clientX,this._lastMouseY=e.clientY)}_handle3DMouseMove(e){if(!this._isDragging3D)return;const t=e.clientX-this._lastMouseX,i=e.clientY-this._lastMouseY;this._camera3d={...this._camera3d,azimuth:(this._camera3d.azimuth-.5*t)%360,elevation:Math.max(5,Math.min(85,this._camera3d.elevation+.3*i))},this._lastMouseX=e.clientX,this._lastMouseY=e.clientY,this._render3DScene()}_handle3DMouseUp(){this._isDragging3D=!1}_handle3DWheel(e){e.preventDefault();const t=e.deltaY>0?1.1:.9;this._camera3d={...this._camera3d,distance:Math.max(2e3,Math.min(2e4,this._camera3d.distance*t))},this._render3DScene()}_reset3DCamera(){if(this._roomPoints.length>=3){const e=this._roomPoints.map(e=>e.x),t=this._roomPoints.map(e=>e.y),i=(Math.min(...e)+Math.max(...e))/2,o=(Math.min(...t)+Math.max(...t))/2,n=Math.max(Math.max(...e)-Math.min(...e),Math.max(...t)-Math.min(...t));this._camera3d={azimuth:45,elevation:35,distance:Math.max(4e3,1.5*n),targetX:i,targetY:o,targetZ:this.WALL_HEIGHT_3D/2}}else this._camera3d={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3};this._render3DScene()}_toggleViewMode(){this._viewMode="2d"===this._viewMode?"3d":"2d","3d"===this._viewMode&&(this._reset3DCamera(),requestAnimationFrame(()=>{this._canvas3d&&(this._canvas3d.width=this._canvas3d.offsetWidth,this._canvas3d.height=this._canvas3d.offsetHeight,this._render3DScene())}))}_renderGrid(){const e=[];for(let t=0;t<=20;t++){const i=40*t;e.push(U`<line class="grid-line" x1="${i}" y1="0" x2="${i}" y2="${$e}"/>`),e.push(U`<line class="grid-line" x1="0" y1="${i}" x2="${$e}" y2="${i}"/>`)}return e}_renderRoom(){if(this._roomPoints.length<2)return B;const e=[];for(let t=0;t<this._roomPoints.length;t++){const i=this._roomPoints[t],o=this._roomPoints[(t+1)%this._roomPoints.length],n=this._toCanvas(i),s=this._toCanvas(o);e.push(U`<line class="wall-line" x1="${n.x}" y1="${n.y}" x2="${s.x}" y2="${s.y}"/>`)}return e}_renderFurniture(){return this._furniture.map(e=>{const t=this._toCanvas({x:e.x,y:e.y}),i=.08*this._zoom,o=e.width*i,n=e.height*i;return U`
        <rect
          x="${t.x-o/2}" y="${t.y-n/2}"
          width="${o}" height="${n}"
          fill="#334155" stroke="#475569" stroke-width="1"
          transform="rotate(${e.rotation} ${t.x} ${t.y})"
          rx="3"
        />
      `})}_renderDoorsAndWindows(){const e=[],t=.08*this._zoom;return this._doors.forEach(i=>{if(i.wallIndex>=this._roomPoints.length)return;const o=this._roomPoints[i.wallIndex],n=this._roomPoints[(i.wallIndex+1)%this._roomPoints.length],s=o.x+(n.x-o.x)*i.position,r=o.y+(n.y-o.y)*i.position,a=this._toCanvas({x:s,y:r}),l=Math.atan2(n.y-o.y,n.x-o.x),d=i.width*t;e.push(U`
        <line
          x1="${a.x-Math.cos(l)*d/2}"
          y1="${a.y-Math.sin(l)*d/2}"
          x2="${a.x+Math.cos(l)*d/2}"
          y2="${a.y+Math.sin(l)*d/2}"
          stroke="#a855f7" stroke-width="4"
        />
      `)}),this._windows.forEach(i=>{if(i.wallIndex>=this._roomPoints.length)return;const o=this._roomPoints[i.wallIndex],n=this._roomPoints[(i.wallIndex+1)%this._roomPoints.length],s=o.x+(n.x-o.x)*i.position,r=o.y+(n.y-o.y)*i.position,a=this._toCanvas({x:s,y:r}),l=Math.atan2(n.y-o.y,n.x-o.x),d=i.width*t;e.push(U`
        <line
          x1="${a.x-Math.cos(l)*d/2}"
          y1="${a.y-Math.sin(l)*d/2}"
          x2="${a.x+Math.cos(l)*d/2}"
          y2="${a.y+Math.sin(l)*d/2}"
          stroke="#0ea5e9" stroke-width="4"
        />
      `)}),e}_renderZones(){const e=[];if(this._zones.forEach((t,i)=>{const o=ze[t.type],n=this._selectedZoneIndex===i;if("entry"===t.type&&2===t.points.length){const s=this._toCanvas(t.points[0]),r=this._toCanvas(t.points[1]),a=(s.x+r.x)/2,l=(s.y+r.y)/2,d=r.x-s.x,c=r.y-s.y,h=Math.sqrt(d*d+c*c),p=Math.atan2(c,d),g=-c/h,u=d/h,_="left"===(t.inDirection||"left")?1:-1;e.push(U`
          <line
            x1="${s.x}" y1="${s.y}"
            x2="${r.x}" y2="${r.y}"
            stroke="${o.stroke}"
            stroke-width="${n?4:3}"
            stroke-linecap="round"
            style="cursor: pointer;"
            @click="${e=>{e.stopPropagation(),this._selectedZoneIndex=i,this._toolMode="zone"}}"
          />
        `);const x=30,v=5,m=a+g*_*(x+v),y=l+u*_*(x+v),f=a-g*_*v,b=l-u*_*v;e.push(U`
          <line
            x1="${m}" y1="${y}"
            x2="${f}" y2="${b}"
            stroke="#22c55e" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrowhead-in)"
            style="pointer-events: none;"
          />
          <text
            x="${m+g*_*15}" y="${y+u*_*15+4}"
            fill="#22c55e" font-size="13" font-weight="700" text-anchor="middle"
            style="pointer-events: none;"
          >IN</text>
        `);const w=a-g*_*(x+v),$=l-u*_*(x+v),k=a+g*_*v,P=l+u*_*v;e.push(U`
          <line
            x1="${w}" y1="${$}"
            x2="${k}" y2="${P}"
            stroke="#ef4444" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrowhead-out)"
            style="pointer-events: none;"
          />
          <text
            x="${w-g*_*15}" y="${$-u*_*15+4}"
            fill="#ef4444" font-size="13" font-weight="700" text-anchor="middle"
            style="pointer-events: none;"
          >UIT</text>
        `);const z=(Math.hypot(t.points[1].x-t.points[0].x,t.points[1].y-t.points[0].y)/1e3).toFixed(2),D=180*p/Math.PI,M=D>90||D<-90?D+180:D;return e.push(U`
          <text
            x="${a}" y="${l-12}"
            fill="${o.stroke}"
            font-size="11" font-weight="600" text-anchor="middle"
            transform="rotate(${M} ${a} ${l-12})"
            style="pointer-events: none;"
          >${z}m</text>
        `),void(n&&e.push(U`
            <circle cx="${s.x}" cy="${s.y}" r="8" fill="${o.stroke}" stroke="white" stroke-width="2" style="cursor: grab;" />
            <circle cx="${r.x}" cy="${r.y}" r="8" fill="${o.stroke}" stroke="white" stroke-width="2" style="cursor: grab;" />
          `))}if(t.points.length<3)return;const s=t.points.map(e=>this._toCanvas(e)),r=`M ${s.map(e=>`${e.x} ${e.y}`).join(" L ")} Z`,a="exclusion"===t.type?"8 4":"none";if(e.push(U`
        <path
          d="${r}"
          fill="${o.fill}"
          stroke="${o.stroke}"
          stroke-width="${n?3:2}"
          stroke-dasharray="${a}"
          style="cursor: ${n&&"zone"===this._toolMode?"move":"pointer"};"
          @click="${e=>{e.stopPropagation(),this._selectedZoneIndex=i,this._toolMode="zone"}}"
        />
      `),n)for(let i=0;i<t.points.length;i++){const n=t.points[i],s=t.points[(i+1)%t.points.length],r=(Math.hypot(s.x-n.x,s.y-n.y)/1e3).toFixed(2),a=this._toCanvas(n),l=this._toCanvas(s),d=(a.x+l.x)/2,c=(a.y+l.y)/2,h=180*Math.atan2(l.y-a.y,l.x-a.x)/Math.PI,p=h>90||h<-90?h+180:h;e.push(U`
            <text
              x="${d}" y="${c-8}"
              fill="${o.stroke}"
              font-size="11"
              font-weight="600"
              text-anchor="middle"
              transform="rotate(${p} ${d} ${c-8})"
              style="pointer-events: none;"
            >${r}m</text>
          `)}if(n&&(t.points.forEach((t,i)=>{const n=this._toCanvas(t);e.push(U`
            <circle
              cx="${n.x}" cy="${n.y}" r="8"
              fill="${o.stroke}" stroke="white" stroke-width="2"
              style="cursor: ${"zone"===this._toolMode?"grab":"default"};"
            />
          `)}),"zone"===this._toolMode&&this._zoneMidpointPreview&&this._zoneMidpointPreview.zoneIndex===i)){const t=this._toCanvas(this._zoneMidpointPreview.point);e.push(U`
            <circle
              cx="${t.x}" cy="${t.y}" r="8"
              fill="#22c55e" stroke="white" stroke-width="2"
              style="cursor: pointer;"
            />
          `)}}),this._drawingZone.length>0){const t=ze[this._newZoneType],i=this._drawingZone.map(e=>this._toCanvas(e));for(let o=0;o<i.length-1;o++){e.push(U`
          <line
            x1="${i[o].x}" y1="${i[o].y}"
            x2="${i[o+1].x}" y2="${i[o+1].y}"
            stroke="${t.stroke}" stroke-width="2"
          />
        `);const n=this._drawingZone[o],s=this._drawingZone[o+1],r=(Math.hypot(s.x-n.x,s.y-n.y)/1e3).toFixed(2),a=(i[o].x+i[o+1].x)/2,l=(i[o].y+i[o+1].y)/2,d=180*Math.atan2(i[o+1].y-i[o].y,i[o+1].x-i[o].x)/Math.PI,c=d>90||d<-90?d+180:d;e.push(U`
          <text
            x="${a}" y="${l-8}"
            fill="${t.stroke}"
            font-size="11"
            font-weight="600"
            text-anchor="middle"
            transform="rotate(${c} ${a} ${l-8})"
            style="pointer-events: none;"
          >${r}m</text>
        `)}if(this._cursorPos){const o=i[i.length-1],n=this._toCanvas(this._cursorPos);e.push(U`
          <line
            x1="${o.x}" y1="${o.y}"
            x2="${n.x}" y2="${n.y}"
            stroke="${t.stroke}" stroke-width="2" stroke-dasharray="4 4"
          />
        `)}if(i.forEach((i,o)=>{const n=0===o&&this._drawingZone.length>=3;e.push(U`
          <circle
            cx="${i.x}" cy="${i.y}" r="8"
            fill="${n?"#22c55e":t.stroke}"
            stroke="white" stroke-width="2"
            style="cursor: grab;"
          />
        `)}),this._zoneMidpointPreview&&-1===this._zoneMidpointPreview.zoneIndex){const t=this._toCanvas(this._zoneMidpointPreview.point);e.push(U`
          <circle
            cx="${t.x}" cy="${t.y}" r="8"
            fill="#22c55e" stroke="white" stroke-width="2"
            style="cursor: pointer;"
          />
        `)}}return e}_renderSensorFOV(){if(!this._sensorPos)return B;const e=this._toCanvas(this._sensorPos),t=.08*this._zoom,i=this._sensorRange*t,o=(this._sensorRotation-90)*Math.PI/180,n=this._sensorFov*Math.PI/360,s=o-n,r=o+n,a=[];for(let t=0;t<=32;t++){const o=s+t/32*(r-s);a.push({x:e.x+Math.cos(o)*i,y:e.y+Math.sin(o)*i})}const l=`M ${e.x} ${e.y} L ${a.map(e=>`${e.x} ${e.y}`).join(" L ")} Z`;return U`<path d="${l}" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="1.5" style="pointer-events: none;"/>`}_renderSensorIcon(){if(!this._sensorPos)return B;const e=this._toCanvas(this._sensorPos),t=(this._sensorRotation-90)*Math.PI/180,i=e.x+25*Math.cos(t),o=e.y+25*Math.sin(t),n="sensor"===this._toolMode||"select"===this._toolMode,s=this._draggingSensor?"#22c55e":"#3b82f6",r=this._draggingSensor?"#16a34a":"#1d4ed8";return U`
      <circle
        cx="${e.x}" cy="${e.y}" r="18"
        fill="${s}" stroke="${r}" stroke-width="2"
        style="cursor: ${this._draggingSensor?"grabbing":n?"grab":"default"}"
        @mousedown="${e=>{n&&(e.stopPropagation(),e.preventDefault(),this._draggingSensor=!0)}}"
      />
      <line x1="${e.x}" y1="${e.y}" x2="${i}" y2="${o}" stroke="white" stroke-width="3" stroke-linecap="round"/>
    `}updated(e){super.updated(e),(e.has("_liveTargets")||e.has("_sensorPos"))&&this._updateTargetCirclesInDOM(),"3d"===this._viewMode&&this._canvas3d&&this._render3DScene()}_updateTargetCirclesInDOM(){const e=this.shadowRoot?.querySelector("svg");if(!e)return;if(e.querySelectorAll(".live-target").forEach(e=>e.remove()),!this._sensorPos)return;const t=this._liveTargets.filter(e=>e.active);if(0===t.length)return;const i=(this._sensorRotation-90)*Math.PI/180,o=["#ef4444","#4361ee","#eab308"];t.forEach((t,n)=>{const s=this._sensorPos.x+t.y*Math.cos(i)-t.x*Math.sin(i),r=this._sensorPos.y+t.y*Math.sin(i)+t.x*Math.cos(i),a=this._toCanvas({x:s,y:r}),l=o[n]||"#ef4444",d=document.createElementNS("http://www.w3.org/2000/svg","circle");d.setAttribute("class","live-target"),d.setAttribute("cx",a.x.toString()),d.setAttribute("cy",a.y.toString()),d.setAttribute("r","18"),d.setAttribute("fill",l),d.setAttribute("stroke","white"),d.setAttribute("stroke-width","4");const c=document.createElementNS("http://www.w3.org/2000/svg","animate");c.setAttribute("attributeName","r"),c.setAttribute("values","14;22;14"),c.setAttribute("dur","1s"),c.setAttribute("repeatCount","indefinite"),d.appendChild(c),e.appendChild(d);const h=document.createElementNS("http://www.w3.org/2000/svg","text");h.setAttribute("class","live-target"),h.setAttribute("x",a.x.toString()),h.setAttribute("y",(a.y+6).toString()),h.setAttribute("text-anchor","middle"),h.setAttribute("fill","white"),h.setAttribute("font-size","14"),h.setAttribute("font-weight","bold"),h.textContent=(n+1).toString(),e.appendChild(h)})}render(){const e=this.rooms.find(e=>e.id===this._selectedRoomId),t=this._getInstructions(),i=this._getRadarDevices(),o=this._liveTargets.filter(e=>e.active).length;return L`
      <div class="sidebar">
        <div>
          <div class="section-title">KAMER SELECTEREN</div>
          <div class="room-list">
            ${0===this.rooms.length?L`
              <p class="info-text">Geen kamers gevonden. Maak eerst een kamer aan in de Room Builder.</p>
            `:this.rooms.map(e=>L`
              <div class="room-item ${e.id===this._selectedRoomId?"selected":""}" @click="${()=>this._selectRoom(e.id)}">
                <div class="room-icon"><ha-icon icon="mdi:floor-plan"></ha-icon></div>
                <span class="room-name">${e.name}</span>
              </div>
            `)}
          </div>
        </div>

        <div>
          <div class="section-title">GEREEDSCHAPPEN</div>
          <div class="tool-grid">
            <button class="tool-btn ${"select"===this._toolMode?"active":""}" @click="${()=>this._toolMode="select"}">
              <ha-icon icon="mdi:cursor-default"></ha-icon><span>Selecteer</span>
            </button>
            <button class="tool-btn ${"sensor"===this._toolMode?"active":""}" @click="${()=>this._toolMode="sensor"}">
              <ha-icon icon="mdi:radar"></ha-icon><span>Sensor</span>
            </button>
            <button class="tool-btn ${"zone"===this._toolMode?"active":""}" @click="${()=>this._startDrawingAnyZone()}" style="grid-column: span 2;">
              <ha-icon icon="mdi:vector-polygon"></ha-icon><span>Zone Tekenen</span>
            </button>
          </div>
        </div>

        <div class="instructions">
          <div class="instructions-title">${t.title}</div>
          <div class="instructions-text">${t.text}</div>
        </div>
      </div>

      <div class="canvas-area" style="position: relative;">
          <div class="canvas-header">
          <span class="room-label">Kamer: <span>${e?.name||"Geen geselecteerd"}</span></span>
          ${e?L`
            <div class="view-toggle">
              <button class="view-toggle-btn ${"2d"===this._viewMode?"active":""}" @click="${()=>this._viewMode="2d"}">
                <ha-icon icon="mdi:floor-plan"></ha-icon>2D
              </button>
              <button class="view-toggle-btn ${"3d"===this._viewMode?"active":""}" @click="${this._toggleViewMode}">
                <ha-icon icon="mdi:cube-outline"></ha-icon>3D
              </button>
            </div>
          `:B}
          <button class="save-btn" @click="${this._saveRoom}" ?disabled="${this._saving||!e}">
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this._saving?"Opslaan...":"Opslaan"}
          </button>
          <button class="push-btn" @click="${this._pushToESPHome}" ?disabled="${this._pushingToESPHome||!this._selectedDeviceId||!e}">
            <ha-icon icon="mdi:upload"></ha-icon>
            ${this._pushingToESPHome?"Pushen...":"Push naar Sensor"}
          </button>
        </div>
        ${e?"2d"===this._viewMode?L`
          <svg viewBox="0 0 ${$e} ${$e}"
               @click="${this._handleCanvasClick}"
               @contextmenu="${this._handleContextMenu}"
               @mousemove="${this._handleCanvasMove}"
               @mousedown="${this._handleCanvasDown}"
               @mouseup="${this._handleCanvasUp}"
               @mouseleave="${this._handleCanvasUp}"
               @wheel="${this._handleWheel}"
               @contextmenu="${e=>e.preventDefault()}">
            <!-- Arrow markers voor entry lijnen -->
            <defs>
              <marker id="arrowhead-in" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
              </marker>
              <marker id="arrowhead-out" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
              </marker>
            </defs>
            ${this._renderGrid()}
            ${this._renderRoom()}
            ${this._renderDoorsAndWindows()}
            ${this._renderFurniture()}
            ${this._renderSensorFOV()}
            ${this._renderZones()}
            ${this._renderSensorIcon()}
          </svg>
          <div class="canvas-controls">
            <div class="control-group">
              <button class="control-btn" @click="${()=>this._zoom=Math.min(5,this._zoom+.2)}"><ha-icon icon="mdi:plus"></ha-icon></button>
              <button class="control-btn" @click="${()=>this._zoom=Math.max(.2,this._zoom-.2)}"><ha-icon icon="mdi:minus"></ha-icon></button>
              <button class="control-btn" @click="${this._autoZoom}"><ha-icon icon="mdi:fit-to-screen"></ha-icon></button>
            </div>
          </div>
        `:L`
          <canvas
            id="canvas3d"
            class="canvas3d"
            @mousedown="${this._handle3DMouseDown}"
            @mousemove="${this._handle3DMouseMove}"
            @mouseup="${this._handle3DMouseUp}"
            @mouseleave="${this._handle3DMouseUp}"
            @wheel="${this._handle3DWheel}"
          ></canvas>
          <div class="view3d-info">
            🎮 Sleep om te roteren • Scroll om te zoomen
          </div>
          <div class="camera-controls-3d">
            <button class="camera-btn-3d" @click="${this._reset3DCamera}" title="Reset camera">
              <ha-icon icon="mdi:camera-flip"></ha-icon>
            </button>
            <button class="camera-btn-3d" @click="${()=>{this._camera3d={...this._camera3d,elevation:85},this._render3DScene()}}" title="Bovenaanzicht">
              <ha-icon icon="mdi:arrow-down-circle"></ha-icon>
            </button>
            <button class="camera-btn-3d" @click="${()=>{this._camera3d={...this._camera3d,elevation:15},this._render3DScene()}}" title="Ooghoogte">
              <ha-icon icon="mdi:eye"></ha-icon>
            </button>
          </div>
        `:L`
          <div class="empty-state">
            <ha-icon icon="mdi:vector-polygon"></ha-icon>
            <h3>Zone Configuratie</h3>
            <p>Selecteer een kamer om sensor en zones te configureren</p>
          </div>
        `}
      </div>

      <div class="sidebar sidebar-right">
        ${"sensor"===this._toolMode?L`
          <div>
            <div class="section-title">SENSOR SELECTEREN</div>
            <div class="setting-item">
              <select @change="${e=>this._selectedDeviceId=e.target.value||null}">
                <option value="">-- Selecteer sensor --</option>
                ${i.map(e=>L`<option value="${e.id}" ?selected="${this._selectedDeviceId===e.id}">${e.name}</option>`)}
              </select>
            </div>

            ${this._selectedDeviceId?L`
              <div class="live-status" style="border-left: 3px solid ${o>0?"#22c55e":"#64748b"};">
                <div class="header">
                  <span class="dot ${o>0?"active":"inactive"}"></span>
                  <span style="font-weight: 600; color: #e2e8f0;">Live Tracking</span>
                </div>
                <div class="count" style="color: ${o>0?"#22c55e":"#64748b"};">
                  ${o} persoon${1!==o?"en":""}
                </div>
              </div>
            `:""}
          </div>

          <div>
            <div class="section-title">SENSOR INSTELLINGEN</div>
            <div class="setting-item">
              <label>Rotatie: ${this._sensorRotation}°</label>
              <input type="range" min="0" max="359" .value="${this._sensorRotation}"
                     @input="${e=>this._sensorRotation=parseInt(e.target.value)}"/>
            </div>
            <div class="setting-item">
              <label>Bereik: ${(this._sensorRange/1e3).toFixed(1)}m</label>
              <input type="range" min="1" max="10" step="0.5" .value="${this._sensorRange/1e3}"
                     @input="${e=>this._sensorRange=1e3*parseFloat(e.target.value)}"/>
            </div>
            <div class="setting-item">
              <label>FOV: ${this._sensorFov}°</label>
              <input type="range" min="30" max="180" .value="${this._sensorFov}"
                     @input="${e=>this._sensorFov=parseInt(e.target.value)}"/>
            </div>
          </div>
        `:"zone"===this._toolMode&&this._drawingZone.length>0?L`
            <div>
              <div class="section-title">HUIDIGE TEKENING</div>
              <p class="info-text">${this._drawingZone.length} punten getekend</p>
              <button class="tool-btn" style="width: 100%;" @click="${()=>this._drawingZone=[]}">
                <ha-icon icon="mdi:cancel"></ha-icon>
                <span>Annuleren</span>
              </button>
        </div>
        `:""}

        <!-- Detectie Zones Section -->
        <div>
          <div class="section-title" style="color: #22c55e;">📍 DETECTIE ZONES (${this._getZoneCountByType("detection")}/${Pe.detection})</div>
          ${0===this._zones.filter(e=>"detection"===e.type).length?L`
            <p class="info-text">Nog geen detectie zones. Teken een zone en kies "Detectie".</p>
          `:L`
            <div class="zone-list">
              ${this._zones.map((e,t)=>"detection"!==e.type?"":L`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex===t?"selected":""}"
                       @click="${()=>{this._selectedZoneIndex=t,this._editingZoneIndex=null,this._toolMode="zone"}}">
                    <div class="zone-color" style="background: ${ze[e.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${e.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" @click="${e=>{e.stopPropagation(),this._editingZoneIndex=this._editingZoneIndex===t?null:t,this._selectedZoneIndex=t}}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                      </button>
                      <button class="delete-btn" @click="${e=>{e.stopPropagation(),this._deleteZone(t)}}">
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  </div>
                  ${this._renderZoneEditForm(e,t)}
                </div>
              `)}
            </div>
          `}
        </div>

        <!-- Exclusie Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #f87171;">🚷 EXCLUSIE ZONES (${this._getZoneCountByType("exclusion")}/${Pe.exclusion})</div>
          ${0===this._zones.filter(e=>"exclusion"===e.type).length?L`
            <p class="info-text">Nog geen exclusie zones. Teken een zone en kies "Exclusie".</p>
          `:L`
            <div class="zone-list">
              ${this._zones.map((e,t)=>"exclusion"!==e.type?"":L`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex===t?"selected":""}"
                       @click="${()=>{this._selectedZoneIndex=t,this._editingZoneIndex=null,this._toolMode="zone"}}">
                    <div class="zone-color" style="background: ${ze[e.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${e.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" @click="${e=>{e.stopPropagation(),this._editingZoneIndex=this._editingZoneIndex===t?null:t,this._selectedZoneIndex=t}}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                      </button>
                      <button class="delete-btn" @click="${e=>{e.stopPropagation(),this._deleteZone(t)}}">
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  </div>
                  ${this._renderZoneEditForm(e,t)}
                </div>
              `)}
            </div>
          `}
        </div>

        <!-- Entry Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #10b981;">🚪 ENTRY LIJNEN (${this._getZoneCountByType("entry")}/${Pe.entry})</div>
          ${0===this._zones.filter(e=>"entry"===e.type).length?L`
            <p class="info-text">Nog geen entry lijnen. Teken 2 punten en kies "Entry Lijn" voor in/uit detectie bij deuren.</p>
          `:L`
            <div class="zone-list">
              ${this._zones.map((e,t)=>"entry"!==e.type?"":L`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex===t?"selected":""}"
                       @click="${()=>{this._selectedZoneIndex=t,this._editingZoneIndex=null,this._toolMode="zone"}}">
                    <div class="zone-color" style="background: ${ze[e.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${e.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" @click="${e=>{e.stopPropagation(),this._editingZoneIndex=this._editingZoneIndex===t?null:t,this._selectedZoneIndex=t}}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                      </button>
                      <button class="delete-btn" @click="${e=>{e.stopPropagation(),this._deleteZone(t)}}">
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  </div>
                  ${this._renderZoneEditForm(e,t)}
                </div>
              `)}
            </div>
          `}
        </div>

        ${this._selectedDeviceId?L`
          <div class="live-status" style="border-left: 3px solid ${o>0?"#22c55e":"#64748b"};">
            <div class="header">
              <span class="dot ${o>0?"active":"inactive"}"></span>
              <span style="font-weight: 600; color: #e2e8f0;">Live Tracking</span>
            </div>
            <div class="count" style="color: ${o>0?"#22c55e":"#64748b"};">
              ${o} persoon${1!==o?"en":""}
            </div>
            <!-- Individual target cards -->
            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
              ${[0,1,2].map(e=>{const t=this._liveTargets[e],i=t&&t.active,o=t?Math.sqrt(t.x*t.x+t.y*t.y)/1e3:0,n=["#ef4444","#4361ee","#eab308"][e];return L`
                  <div style="flex: 1; min-width: 70px; text-align: center; padding: 8px; background: ${i?"rgba(34, 197, 94, 0.1)":"#0f172a"}; border-radius: 8px; border: 1px solid ${i?n:"#334155"};">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${i?n:"#64748b"}; margin: 0 auto 4px;"></div>
                    <div style="font-size: 11px; color: ${i?"#e2e8f0":"#64748b"};">Persoon ${e+1}</div>
                    <div style="font-size: 13px; font-weight: 600; color: ${i?n:"#64748b"};">
                      ${i?o.toFixed(1)+"m":"-"}
                    </div>
                  </div>
                `})}
          </div>
          </div>
        `:""}
      </div>

      <!-- Zone Type Picker Dialog -->
      ${this._showZoneTypePicker?L`
        <div class="zone-type-picker" @click="${e=>{e.target===e.currentTarget&&this._cancelZoneTypePicker()}}">
          <div class="zone-type-picker-content">
            ${2===this._pendingZonePoints.length?L`
              <!-- 2 punten: Entry Lijn of doorgaan tekenen -->
              <h3>🚪 Entry Lijn aanmaken?</h3>
              <p>Je hebt 2 punten getekend. Wil je een Entry Lijn maken voor in/uit detectie?</p>
              <div class="zone-type-options">
                <div class="zone-type-option entry ${this._canAddZone("entry")?"":"disabled"}"
                     @click="${()=>this._canAddZone("entry")&&this._selectZoneType("entry")}">
                  <span class="icon">🚪</span>
                  <div class="info">
                    <div class="name">Entry Lijn</div>
                    <div class="desc">Detecteert of iemand IN of UIT loopt</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType("entry")}/${Pe.entry}</span>
                </div>
                <div class="zone-type-option continue" @click="${this._continueDrawingPolygon}">
                  <span class="icon">✏️</span>
                  <div class="info">
                    <div class="name">Doorgaan met tekenen</div>
                    <div class="desc">Voeg meer punten toe voor een polygon zone</div>
                  </div>
                  <span class="badge" style="background: rgba(100, 116, 139, 0.2); color: #94a3b8;">→</span>
                </div>
              </div>
            `:L`
              <!-- 3+ punten: Polygon zone types -->
              <h3>Kies zone type</h3>
              <p>Je polygon zone is getekend! Selecteer welk type deze zone moet zijn.</p>
              <div class="zone-type-options">
                <div class="zone-type-option detection ${this._canAddZone("detection")?"":"disabled"}"
                     @click="${()=>this._canAddZone("detection")&&this._selectZoneType("detection")}">
                  <span class="icon">📍</span>
                  <div class="info">
                    <div class="name">Detectie Zone</div>
                    <div class="desc">Detecteert beweging/aanwezigheid</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType("detection")}/${Pe.detection}</span>
                </div>
                <div class="zone-type-option exclusion ${this._canAddZone("exclusion")?"":"disabled"}"
                     @click="${()=>this._canAddZone("exclusion")&&this._selectZoneType("exclusion")}">
                  <span class="icon">🚷</span>
                  <div class="info">
                    <div class="name">Exclusie Zone</div>
                    <div class="desc">Negeert beweging in dit gebied</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType("exclusion")}/${Pe.exclusion}</span>
                </div>
              </div>
            `}
            <button class="zone-type-picker-cancel" @click="${this._cancelZoneTypePicker}">Annuleren</button>
          </div>
        </div>
      `:""}
    `}};Me.styles=r`
    :host { display: grid; grid-template-columns: 280px 1fr 280px; gap: 16px; padding: 20px; height: calc(100vh - 100px); box-sizing: border-box; background: #0f172a; }
    .sidebar { background: #1e293b; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
    .section-title { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .room-list { display: flex; flex-direction: column; gap: 6px; }
    .room-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .room-item:hover { border-color: #475569; }
    .room-item.selected { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .room-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #334155; border-radius: 6px; }
    .room-icon ha-icon { --mdc-icon-size: 18px; color: #94a3b8; }
    .room-name { flex: 1; font-size: 13px; color: #e2e8f0; font-weight: 500; }
    .tool-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .tool-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .tool-btn:hover { border-color: #475569; background: #1e293b; }
    .tool-btn.active { border-color: #4361ee; background: rgba(67, 97, 238, 0.15); }
    .tool-btn ha-icon { --mdc-icon-size: 24px; color: #94a3b8; }
    .tool-btn.active ha-icon { color: #4361ee; }
    .tool-btn span { font-size: 11px; color: #94a3b8; }
    .tool-btn.active span { color: #4361ee; }
    .canvas-area { background: #1e293b; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .canvas-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #0f172a; border-bottom: 1px solid #334155; }
    .room-label { font-size: 13px; color: #94a3b8; }
    .room-label span { color: #e2e8f0; font-weight: 600; }
    .save-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #22c55e; border: none; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; }
    .save-btn:disabled { background: #475569; cursor: not-allowed; }
    .push-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #3b82f6; border: none; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; margin-left: 8px; }
    .push-btn:disabled { background: #475569; cursor: not-allowed; }
    .push-btn:hover:not(:disabled) { background: #2563eb; }
    svg { flex: 1; background: #0a1628; cursor: crosshair; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; }
    .empty-state ha-icon { --mdc-icon-size: 64px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { margin: 0 0 8px 0; color: #94a3b8; }
    .grid-line { stroke: #1e293b; stroke-width: 0.5; }
    .wall-line { stroke: #475569; stroke-width: 3; stroke-linecap: round; }
    .canvas-controls { position: absolute; bottom: 16px; left: 16px; display: flex; gap: 8px; }
    .control-group { display: flex; background: #1e293b; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }
    .control-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: #94a3b8; cursor: pointer; }
    .control-btn:hover { background: #334155; color: #e2e8f0; }
    .instructions { background: #0f172a; border-radius: 10px; padding: 14px; }
    .instructions-title { font-size: 13px; font-weight: 600; color: #4361ee; margin-bottom: 6px; }
    .instructions-text { font-size: 12px; color: #94a3b8; line-height: 1.5; }
    .setting-item { margin-bottom: 12px; }
    .setting-item label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
    .setting-item input[type="range"] { width: 100%; }
    select { width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; font-size: 13px; }
    .info-text { color: #64748b; font-size: 12px; line-height: 1.5; }
    .live-status { margin: 12px 0; padding: 12px; background: #0f172a; border-radius: 8px; }
    .live-status .header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .live-status .dot { width: 10px; height: 10px; border-radius: 50%; }
    .live-status .dot.active { background: #22c55e; animation: pulse 1s infinite; }
    .live-status .dot.inactive { background: #64748b; }
    .live-status .count { font-size: 24px; font-weight: bold; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .zone-list { display: flex; flex-direction: column; gap: 6px; }
    .zone-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; cursor: pointer; }
    .zone-item:hover { border-color: #475569; }
    .zone-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .zone-color { width: 14px; height: 14px; border-radius: 4px; }
    .zone-info { flex: 1; }
    .zone-name { font-size: 13px; color: #e2e8f0; font-weight: 500; }
    .zone-type { font-size: 11px; color: #64748b; }
    .zone-actions { display: flex; gap: 4px; }
    .edit-btn { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 4px; }
    .edit-btn:hover { color: #60a5fa; }
    .delete-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; }
    .delete-btn:hover { color: #f87171; }
    .zone-edit-form { background: #0f172a; border: 1px solid #3b82f6; border-radius: 8px; padding: 12px; margin-top: 8px; }
    .zone-edit-form label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; }
    .zone-edit-form input { width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; font-size: 13px; margin-bottom: 10px; box-sizing: border-box; }
    .zone-edit-form input:focus { outline: none; border-color: #3b82f6; }
    .type-switch { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
    .type-switch button { flex: 1; min-width: 70px; padding: 6px 4px; border: 2px solid #334155; border-radius: 6px; background: #1e293b; color: #94a3b8; font-size: 11px; cursor: pointer; transition: all 0.15s; }
    .type-switch button.active { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .type-switch button.exclusion.active { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .type-switch button.entry.active { border-color: #10b981; background: rgba(16, 185, 129, 0.1); color: #10b981; }
    /* Direction toggle voor entry lijnen */
    .direction-toggle { display: flex; gap: 6px; margin-bottom: 12px; }
    .direction-toggle button { flex: 1; padding: 10px 8px; border: 2px solid #334155; border-radius: 8px; background: #1e293b; color: #94a3b8; font-size: 12px; cursor: pointer; transition: all 0.15s; }
    .direction-toggle button:hover { border-color: #475569; }
    .direction-toggle button.active.in { border-color: #22c55e; background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .help-text { font-size: 11px; color: #64748b; margin: 0 0 12px 0; line-height: 1.4; }
    /* Zone Type Picker Dialog */
    .zone-type-picker { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .zone-type-picker-content { background: #1e293b; border-radius: 16px; padding: 24px; max-width: 320px; width: 90%; border: 1px solid #334155; }
    .zone-type-picker h3 { margin: 0 0 8px 0; font-size: 16px; color: #e2e8f0; }
    .zone-type-picker p { margin: 0 0 20px 0; font-size: 13px; color: #94a3b8; }
    .zone-type-options { display: flex; flex-direction: column; gap: 10px; }
    .zone-type-option { display: flex; align-items: center; gap: 12px; padding: 14px; background: #0f172a; border: 2px solid #334155; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
    .zone-type-option:hover:not(.disabled) { border-color: #475569; background: #1e293b; }
    .zone-type-option.disabled { opacity: 0.4; cursor: not-allowed; }
    .zone-type-option .icon { font-size: 24px; }
    .zone-type-option .info { flex: 1; }
    .zone-type-option .name { font-size: 14px; font-weight: 600; color: #e2e8f0; }
    .zone-type-option .desc { font-size: 11px; color: #64748b; }
    .zone-type-option .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .zone-type-option.detection .badge { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .zone-type-option.exclusion .badge { background: rgba(248, 113, 113, 0.2); color: #f87171; }
    .zone-type-option.entry .badge { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
    .zone-type-option.disabled .badge { background: rgba(100, 116, 139, 0.2); color: #64748b; }
    .zone-type-picker-cancel { width: 100%; margin-top: 16px; padding: 12px; background: #334155; border: none; border-radius: 8px; color: #94a3b8; font-size: 13px; cursor: pointer; }
    .zone-type-picker-cancel:hover { background: #475569; color: #e2e8f0; }
    .edit-actions { display: flex; gap: 6px; }
    .edit-actions button { flex: 1; padding: 8px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; }
    .edit-actions .save-btn { background: #22c55e; color: white; }
    .edit-actions .cancel-btn { background: #334155; color: #94a3b8; }
    .zone-type-select { display: flex; gap: 8px; margin-bottom: 12px; }
    .zone-type-btn { flex: 1; padding: 10px; border: 2px solid #334155; border-radius: 8px; background: #0f172a; cursor: pointer; text-align: center; }
    .zone-type-btn.active { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .zone-type-btn span { display: block; font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .zone-type-btn.active span { color: #4361ee; }
    @media (max-width: 1200px) { :host { grid-template-columns: 240px 1fr; } .sidebar-right { display: none; } }
    .view-toggle { display: flex; background: #0f172a; border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
    .view-toggle-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: none; color: #94a3b8; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .view-toggle-btn:hover { background: rgba(67, 97, 238, 0.1); color: #4361ee; }
    .view-toggle-btn.active { background: linear-gradient(135deg, #4361ee, #3651d4); color: white; }
    .view-toggle-btn ha-icon { --mdc-icon-size: 16px; }
    .canvas3d { flex: 1; display: block; cursor: grab; background: #0a1628; }
    .canvas3d:active { cursor: grabbing; }
    .camera-controls-3d { position: absolute; top: 60px; right: 16px; display: flex; flex-direction: column; gap: 6px; z-index: 10; }
    .camera-btn-3d { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 8px; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
    .camera-btn-3d:hover { background: rgba(67, 97, 238, 0.2); border-color: #4361ee; color: #4361ee; }
    .camera-btn-3d ha-icon { --mdc-icon-size: 18px; }
    .view3d-info { position: absolute; bottom: 16px; left: 16px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; z-index: 10; font-size: 12px; color: #94a3b8; }
  `,e([ge({attribute:!1})],Me.prototype,"hass",void 0),e([ge({type:Array})],Me.prototype,"rooms",void 0),e([ue()],Me.prototype,"_selectedRoomId",void 0),e([ue()],Me.prototype,"_roomPoints",void 0),e([ue()],Me.prototype,"_furniture",void 0),e([ue()],Me.prototype,"_doors",void 0),e([ue()],Me.prototype,"_windows",void 0),e([ue()],Me.prototype,"_sensorPos",void 0),e([ue()],Me.prototype,"_sensorRotation",void 0),e([ue()],Me.prototype,"_sensorRange",void 0),e([ue()],Me.prototype,"_sensorFov",void 0),e([ue()],Me.prototype,"_selectedDeviceId",void 0),e([ue()],Me.prototype,"_draggingSensor",void 0),e([ue()],Me.prototype,"_zones",void 0),e([ue()],Me.prototype,"_selectedZoneIndex",void 0),e([ue()],Me.prototype,"_drawingZone",void 0),e([ue()],Me.prototype,"_newZoneType",void 0),e([ue()],Me.prototype,"_showZoneTypePicker",void 0),e([ue()],Me.prototype,"_pendingZonePoints",void 0),e([ue()],Me.prototype,"_draggingZonePointIndex",void 0),e([ue()],Me.prototype,"_draggingDrawingPointIndex",void 0),e([ue()],Me.prototype,"_draggingWholeZoneIndex",void 0),e([ue()],Me.prototype,"_dragStartPos",void 0),e([ue()],Me.prototype,"_zoneMidpointPreview",void 0),e([ue()],Me.prototype,"_editingZoneIndex",void 0),e([ue()],Me.prototype,"_liveTargets",void 0),e([ue()],Me.prototype,"_entryExitEnabled",void 0),e([ue()],Me.prototype,"_assumedPresent",void 0),e([ue()],Me.prototype,"_pushingToSensor",void 0),e([ue()],Me.prototype,"_toolMode",void 0),e([ue()],Me.prototype,"_zoom",void 0),e([ue()],Me.prototype,"_panOffset",void 0),e([ue()],Me.prototype,"_cursorPos",void 0),e([ue()],Me.prototype,"_saving",void 0),e([ue()],Me.prototype,"_isDragging",void 0),e([_e("svg")],Me.prototype,"_svg",void 0),e([_e("#canvas3d")],Me.prototype,"_canvas3d",void 0),e([ue()],Me.prototype,"_viewMode",void 0),e([ue()],Me.prototype,"_pushingToESPHome",void 0),Me=e([ce("shs-zones-page")],Me);let Se=class extends le{constructor(){super(...arguments),this._devices=[],this._entities=[],this._loading=!0}connectedCallback(){super.connectedCallback(),this._loadDevices()}async _loadDevices(){this._loading=!0;try{const e=await this.hass.callWS({type:"smarthomeshop/devices"});this._devices=e.devices.filter(e=>e.product_type?.includes("sensor")),this._devices.length>0&&await this._selectDevice(this._devices[0])}catch(e){console.error("Failed to load devices:",e)}this._loading=!1}async _selectDevice(e){this._selectedDevice=e,this.dispatchEvent(new CustomEvent("device-select",{detail:{deviceId:e.id}}));try{const t=await this.hass.callWS({type:"smarthomeshop/device/entities",device_id:e.id});this._entities=t.entities.filter(e=>["number","select","switch"].includes(e.domain))}catch(e){console.error("Failed to load entities:",e)}}render(){return this._loading?L`<div class="page-header"><h1 class="page-title">Device Settings</h1></div><div class="loading"><ha-circular-progress active></ha-circular-progress></div>`:L`
      <div class="page-header">
        <h1 class="page-title">Device Settings</h1>
        <p class="page-subtitle">Configure your SmartHomeShop sensor settings</p>
      </div>
      <div class="settings-layout">
        <div class="panel">
          <h3 class="panel-title"><ha-icon icon="mdi:devices"></ha-icon>Select Device</h3>
          <div class="device-list">
            ${this._devices.map(e=>L`
              <div class="device-item ${this._selectedDevice?.id===e.id?"selected":""}" @click=${()=>this._selectDevice(e)}>
                <div class="device-icon"><ha-icon icon="mdi:radar"></ha-icon></div>
                <div class="device-info">
                  <div class="device-name">${e.name}</div>
                  <div class="device-type">${e.product_name}</div>
                </div>
              </div>
            `)}
          </div>
        </div>
        <div class="settings-panel">
          ${this._selectedDevice?L`
            <div class="settings-group">
              <div class="group-header">
                <div class="group-icon"><ha-icon icon="mdi:tune"></ha-icon></div>
                <span class="group-title">Settings</span>
              </div>
              <div class="settings-list">
                ${this._entities.slice(0,10).map(e=>L`
                  <div class="setting-item">
                    <div>
                      <div class="setting-name">${e.name}</div>
                      <div class="setting-entity">${e.entity_id}</div>
                    </div>
                    <span class="setting-value">${e.state||"N/A"}</span>
                  </div>
                `)}
              </div>
            </div>
          `:L`
            <div class="empty-state">
              <ha-icon icon="mdi:radar"></ha-icon>
              <h3>No device selected</h3>
              <p>Select a device from the list to configure its settings</p>
            </div>
          `}
        </div>
      </div>
    `}};Se.styles=r`
    :host { display: block; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 28px; font-weight: 600; color: var(--primary-text-color); margin: 0 0 8px 0; }
    .page-subtitle { color: var(--secondary-text-color); margin: 0; }
    .settings-layout { display: grid; grid-template-columns: 300px 1fr; gap: 24px; }
    .panel { background: var(--card-background-color); border-radius: 16px; padding: 20px; box-shadow: var(--material-shadow-elevation-2dp); }
    .panel-title { font-size: 14px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
    .panel-title ha-icon { color: var(--shs-primary); --mdc-icon-size: 18px; }
    .device-list { display: flex; flex-direction: column; gap: 8px; }
    .device-item { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--secondary-background-color); border-radius: 12px; cursor: pointer; border: 2px solid transparent; }
    .device-item:hover { background: var(--primary-background-color); transform: translateX(4px); }
    .device-item.selected { border-color: var(--shs-primary); background: rgba(255, 107, 53, 0.1); }
    .device-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #9c27b0, #673ab7); color: white; }
    .device-info { flex: 1; }
    .device-name { font-weight: 500; color: var(--primary-text-color); }
    .device-type { font-size: 12px; color: var(--secondary-text-color); }
    .settings-panel { display: flex; flex-direction: column; gap: 20px; }
    .settings-group { background: var(--card-background-color); border-radius: 16px; overflow: hidden; box-shadow: var(--material-shadow-elevation-2dp); }
    .group-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: var(--secondary-background-color); border-bottom: 1px solid var(--divider-color); }
    .group-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--shs-primary); color: white; }
    .group-title { font-size: 16px; font-weight: 600; color: var(--primary-text-color); }
    .settings-list { padding: 8px; }
    .setting-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 10px; }
    .setting-item:hover { background: var(--secondary-background-color); }
    .setting-name { font-weight: 500; color: var(--primary-text-color); }
    .setting-entity { font-size: 11px; color: var(--secondary-text-color); font-family: monospace; }
    .setting-value { font-size: 14px; color: var(--secondary-text-color); }
    .empty-state { text-align: center; padding: 48px; }
    .empty-state ha-icon { --mdc-icon-size: 64px; color: var(--secondary-text-color); opacity: 0.3; margin-bottom: 16px; }
    .loading { display: flex; align-items: center; justify-content: center; padding: 48px; }
  `,e([ge({attribute:!1})],Se.prototype,"hass",void 0),e([ge()],Se.prototype,"selectedDeviceId",void 0),e([ue()],Se.prototype,"_devices",void 0),e([ue()],Se.prototype,"_selectedDevice",void 0),e([ue()],Se.prototype,"_entities",void 0),e([ue()],Se.prototype,"_loading",void 0),Se=e([ce("shs-settings-page")],Se);const Ie="3.5.0";let Te=class extends le{constructor(){super(...arguments),this.narrow=!1,this._currentPage="dashboard"}firstUpdated(e){console.log(`SmartHomeShop Panel v${Ie} initialized`)}_navigateTo(e){this._currentPage=e}_handleDeviceSelect(e){this._selectedDeviceId=e.detail.deviceId}_handleRoomSelect(e){this._selectedRoomId=e.detail.roomId}render(){return L`
      <div class="panel-header">
        <div class="header-left">
          <div class="logo">
            <div class="logo-icon" .innerHTML=${'\n<svg viewBox="0 0 772.9 607.6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n  <g>\n    <g>\n      <path d="M636.8,285.9c-0.5-10.6-11-15.9-18.8-21.6c-40.6-30.1-81.2-60.1-121.8-90.2c-34.5-25.6-69-51.1-103.5-76.7 c-3.2-2.4-9.4-2.4-12.6,0c-71.6,53.1-143.3,106.1-214.9,159.2c-5.8,4.3-11.6,8.6-17.4,12.9c-3.2,2.4-8.1,5.2-10.1,8.6 c-4.8,8.3-1.7,24.7-1.7,33.6c0,52.9,0,105.8,0,158.7c0,41.6,0,83.1,0,124.7c0,6.7,5.7,12.5,12.5,12.5c30.9,0,61.9,0,92.8,0 c16.1,0,16.1-25,0-25c-26.8,0-53.6,0-80.4,0c0-86.7,0-173.3,0-260c0-10.7,0-21.4,0-32c67.3-49.9,134.6-99.7,202-149.6 c7.8-5.8,15.6-11.6,23.5-17.4c67.3,49.8,134.6,99.7,201.8,149.5c7.9,5.8,15.7,11.6,23.6,17.5c0,88.8,0,177.5,0,266.3 c0,8.6,0,17.2,0,25.8c-26.8,0-53.6,0-80.4,0c-16.1,0-16.1,25,0,25c30.9,0,61.9,0,92.8,0c6.7,0,12.5-5.7,12.5-12.5 c0-89.3,0-178.7,0-268C636.8,313.4,637.4,299.6,636.8,285.9z"/>\n      <g>\n        <g>\n          <path d="M261.7,428.8c0,27.7,13.7,53.7,36,69.9c17.3,12.5,37.1,16,58,16c18.5,0,37,0,55.4,0c19.1,0,37.3-0.9,54.7-10.2 c27.6-14.6,45.4-44.5,45.4-75.7c0-16.1-25-16.1-25,0c0,29.1-21.2,54.6-49.8,60c-16,3-33.9,1-50,1c-16.1,0-34,2-50-1 c-28.6-5.4-49.8-30.9-49.8-60C286.6,412.8,261.7,412.7,261.7,428.8L261.7,428.8z"/>\n        </g>\n      </g>\n      <g>\n        <g>\n          <circle cx="310.9" cy="351.6" r="21.4"/>\n        </g>\n        <g>\n          <circle cx="462" cy="351.6" r="21.4"/>\n        </g>\n      </g>\n      <path d="M767.5,279.4c-42.2-31.3-84.5-62.6-126.7-93.8C573.5,135.7,506.3,85.9,439,36c-15.4-11.4-30.8-22.8-46.2-34.3 c-3.2-2.4-9.4-2.4-12.6,0c-42.2,31.3-84.5,62.6-126.7,93.8c-67.3,49.8-134.6,99.7-201.9,149.5C36.2,256.5,20.8,268,5.4,279.4 c-12.8,9.5-0.3,31.1,12.6,21.5c42.2-31.3,84.5-62.6,126.7-93.8c67.3-49.8,134.6-99.7,201.9-149.5c13.3-9.9,26.6-19.7,40-29.6 c40.1,29.7,80.3,59.4,120.4,89.2c67.3,49.8,134.6,99.7,201.9,149.5c15.4,11.4,30.8,22.8,46.2,34.3 C767.8,310.5,780.3,288.8,767.5,279.4z"/>\n    </g>\n  </g>\n</svg>\n'}></div>
            <div class="logo-text">
              <span class="logo-brand">SmartHomeShop.io</span>
              <span class="logo-tagline">Custom Integration</span>
            </div>
          </div>
        </div>
        <nav class="nav-tabs">
          <button class="nav-tab ${"dashboard"===this._currentPage?"active":""}" @click=${()=>this._navigateTo("dashboard")}>
            <ha-icon icon="mdi:view-dashboard"></ha-icon>Dashboard
          </button>
          <button class="nav-tab ${"room-builder"===this._currentPage?"active":""}" @click=${()=>this._navigateTo("room-builder")}>
            <ha-icon icon="mdi:floor-plan"></ha-icon>Room Builder
          </button>
          <button class="nav-tab ${"zones"===this._currentPage?"active":""}" @click=${()=>this._navigateTo("zones")}>
            <ha-icon icon="mdi:vector-polygon"></ha-icon>Zones
          </button>
          <button class="nav-tab ${"settings"===this._currentPage?"active":""}" @click=${()=>this._navigateTo("settings")}>
            <ha-icon icon="mdi:cog"></ha-icon>Settings
          </button>
        </nav>
        <div class="header-right">
          <span class="version-badge">v${Ie}</span>
        </div>
      </div>
      <div class="panel-content">${this._renderPage()}</div>
    `}_renderPage(){switch(this._currentPage){case"dashboard":return L`<shs-dashboard-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
          @device-select=${this._handleDeviceSelect}
          @navigate=${e=>this._navigateTo(e.detail.page)}
        ></shs-dashboard-page>`;case"room-builder":return L`<shs-room-builder-page
          .hass=${this.hass}
          .selectedRoomId=${this._selectedRoomId}
          .selectedDeviceId=${this._selectedDeviceId}
          @room-select=${this._handleRoomSelect}
        ></shs-room-builder-page>`;case"zones":return L`<shs-zones-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
        ></shs-zones-page>`;case"settings":return L`<shs-settings-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
          @device-select=${this._handleDeviceSelect}
        ></shs-settings-page>`;default:return L`<p>Page not found</p>`}}};Te.styles=r`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--primary-background-color);
      /* SmartHomeShop brand colors - Blue theme from website */
      --shs-primary: #4361ee;
      --shs-primary-light: #5a7bf7;
      --shs-primary-dark: #3651d4;
      --shs-accent: #3f37c9;
      --shs-gradient: linear-gradient(135deg, #4361ee 0%, #3f37c9 50%, #4cc9f0 100%);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
      border-bottom: none;
      box-shadow: 0 4px 20px rgba(67, 97, 238, 0.3);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .logo-icon svg {
      width: 100%;
      height: 100%;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .logo-brand {
      font-size: 18px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }

    .logo-tagline {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .nav-tabs {
      display: flex;
      gap: 4px;
      background: rgba(255, 255, 255, 0.1);
      padding: 4px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .nav-tab:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    .nav-tab.active {
      background: white;
      color: var(--shs-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .nav-tab ha-icon {
      --mdc-icon-size: 18px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .version-badge {
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .panel-content {
      flex: 1;
      overflow: auto;
      padding: 24px;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .panel-header {
        flex-wrap: wrap;
        gap: 16px;
        padding: 16px;
      }
      .nav-tabs {
        order: 3;
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
      }
      .nav-tab {
        padding: 8px 14px;
        font-size: 12px;
      }
    }
  `,e([ge({attribute:!1})],Te.prototype,"hass",void 0),e([ge({type:Boolean,reflect:!0})],Te.prototype,"narrow",void 0),e([ge({attribute:!1})],Te.prototype,"panel",void 0),e([ue()],Te.prototype,"_currentPage",void 0),e([ue()],Te.prototype,"_selectedDeviceId",void 0),e([ue()],Te.prototype,"_selectedRoomId",void 0),Te=e([ce("smarthomeshop-panel")],Te);export{Te as SmartHomeShopPanel};
