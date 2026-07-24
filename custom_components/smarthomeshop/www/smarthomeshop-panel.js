/* SmartHomeShop.io Panel v1.5.5 - Build: 2026-07-24T16:55:11.938Z */
function e(e,t,i,o){var s,r=arguments.length,n=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,o);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(r<3?s(n):r>3?s(t,i,n):s(t,i))||n);return r>3&&n&&Object.defineProperty(t,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap;let r=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=s.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(t,e))}return e}toString(){return this.cssText}};const n=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[o+1],e[0]);return new r(i,e,o)},a=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new r("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:c,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,g=globalThis,m=g.trustedTypes,v=m?m.emptyScript:"",_=g.reactiveElementPolyfillSupport,y=(e,t)=>e,x={toAttribute(e,t){switch(t){case Boolean:e=e?v:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},f=(e,t)=>!c(e,t),b={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:f};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=b){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(e,i,t);void 0!==o&&l(this.prototype,e,o)}}static getPropertyDescriptor(e,t,i){const{get:o,set:s}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const r=o?.call(this);s?.call(this,t),this.requestUpdate(e,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??b}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const e=u(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const e=this.properties,t=[...h(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(a(e))}else void 0!==e&&t.push(a(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(i)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of o){const o=document.createElement("style"),s=t.litNonce;void 0!==s&&o.setAttribute("nonce",s),o.textContent=i.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,i);if(void 0!==o&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:x).toAttribute(t,i.type);this._$Em=e,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$Em=null}}_$AK(e,t){const i=this.constructor,o=i._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=i.getPropertyOptions(o),s="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:x;this._$Em=o;const r=s.fromAttribute(t,e.type);this[o]=r??this._$Ej?.get(o)??r,this._$Em=null}}requestUpdate(e,t,i,o=!1,s){if(void 0!==e){const r=this.constructor;if(!1===o&&(s=this[e]),i??=r.getPropertyOptions(e),!((i.hasChanged??f)(s,t)||i.useDefault&&i.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:o,wrapped:s},r){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),!0!==s||void 0!==r)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,i,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[y("elementProperties")]=new Map,w[y("finalized")]=new Map,_?.({ReactiveElement:w}),(g.reactiveElementVersions??=[]).push("2.1.2");const $=globalThis,k=e=>e,S=$.trustedTypes,z=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,M="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,I="?"+P,C=`<${I}>`,T=document,D=()=>T.createComment(""),E=e=>null===e||"object"!=typeof e&&"function"!=typeof e,A=Array.isArray,N="[ \t\n\f\r]",W=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Z=/-->/g,F=/>/g,R=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),O=/'/g,L=/"/g,H=/^(?:script|style|textarea|title)$/i,j=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),U=j(1),B=j(2),q=Symbol.for("lit-noChange"),K=Symbol.for("lit-nothing"),V=new WeakMap,G=T.createTreeWalker(T,129);function Y(e,t){if(!A(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==z?z.createHTML(t):t}const X=(e,t)=>{const i=e.length-1,o=[];let s,r=2===t?"<svg>":3===t?"<math>":"",n=W;for(let t=0;t<i;t++){const i=e[t];let a,c,l=-1,d=0;for(;d<i.length&&(n.lastIndex=d,c=n.exec(i),null!==c);)d=n.lastIndex,n===W?"!--"===c[1]?n=Z:void 0!==c[1]?n=F:void 0!==c[2]?(H.test(c[2])&&(s=RegExp("</"+c[2],"g")),n=R):void 0!==c[3]&&(n=R):n===R?">"===c[0]?(n=s??W,l=-1):void 0===c[1]?l=-2:(l=n.lastIndex-c[2].length,a=c[1],n=void 0===c[3]?R:'"'===c[3]?L:O):n===L||n===O?n=R:n===Z||n===F?n=W:(n=R,s=void 0);const h=n===R&&e[t+1].startsWith("/>")?" ":"";r+=n===W?i+C:l>=0?(o.push(a),i.slice(0,l)+M+i.slice(l)+P+h):i+P+(-2===l?t:h)}return[Y(e,r+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class J{constructor({strings:e,_$litType$:t},i){let o;this.parts=[];let s=0,r=0;const n=e.length-1,a=this.parts,[c,l]=X(e,t);if(this.el=J.createElement(c,i),G.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=G.nextNode())&&a.length<n;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(M)){const t=l[r++],i=o.getAttribute(e).split(P),n=/([.?@])?(.*)/.exec(t);a.push({type:1,index:s,name:n[2],strings:i,ctor:"."===n[1]?oe:"?"===n[1]?se:"@"===n[1]?re:ie}),o.removeAttribute(e)}else e.startsWith(P)&&(a.push({type:6,index:s}),o.removeAttribute(e));if(H.test(o.tagName)){const e=o.textContent.split(P),t=e.length-1;if(t>0){o.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)o.append(e[i],D()),G.nextNode(),a.push({type:2,index:++s});o.append(e[t],D())}}}else if(8===o.nodeType)if(o.data===I)a.push({type:2,index:s});else{let e=-1;for(;-1!==(e=o.data.indexOf(P,e+1));)a.push({type:7,index:s}),e+=P.length-1}s++}}static createElement(e,t){const i=T.createElement("template");return i.innerHTML=e,i}}function Q(e,t,i=e,o){if(t===q)return t;let s=void 0!==o?i._$Co?.[o]:i._$Cl;const r=E(t)?void 0:t._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),void 0===r?s=void 0:(s=new r(e),s._$AT(e,i,o)),void 0!==o?(i._$Co??=[])[o]=s:i._$Cl=s),void 0!==s&&(t=Q(e,s._$AS(e,t.values),s,o)),t}class ee{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,o=(e?.creationScope??T).importNode(t,!0);G.currentNode=o;let s=G.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let t;2===a.type?t=new te(s,s.nextSibling,this,e):1===a.type?t=new a.ctor(s,a.name,a.strings,this,e):6===a.type&&(t=new ne(s,this,e)),this._$AV.push(t),a=i[++n]}r!==a?.index&&(s=G.nextNode(),r++)}return G.currentNode=T,o}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class te{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,o){this.type=2,this._$AH=K,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Q(this,e,t),E(e)?e===K||null==e||""===e?(this._$AH!==K&&this._$AR(),this._$AH=K):e!==this._$AH&&e!==q&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>A(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==K&&E(this._$AH)?this._$AA.nextSibling.data=e:this.T(T.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,o="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=J.createElement(Y(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new ee(o,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=V.get(e.strings);return void 0===t&&V.set(e.strings,t=new J(e)),t}k(e){A(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,o=0;for(const s of e)o===t.length?t.push(i=new te(this.O(D()),this.O(D()),this,this.options)):i=t[o],i._$AI(s),o++;o<t.length&&(this._$AR(i&&i._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=k(e).nextSibling;k(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ie{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,o,s){this.type=1,this._$AH=K,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=K}_$AI(e,t=this,i,o){const s=this.strings;let r=!1;if(void 0===s)e=Q(this,e,t,0),r=!E(e)||e!==this._$AH&&e!==q,r&&(this._$AH=e);else{const o=e;let n,a;for(e=s[0],n=0;n<s.length-1;n++)a=Q(this,o[i+n],t,n),a===q&&(a=this._$AH[n]),r||=!E(a)||a!==this._$AH[n],a===K?e=K:e!==K&&(e+=(a??"")+s[n+1]),this._$AH[n]=a}r&&!o&&this.j(e)}j(e){e===K?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class oe extends ie{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===K?void 0:e}}class se extends ie{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==K)}}class re extends ie{constructor(e,t,i,o,s){super(e,t,i,o,s),this.type=5}_$AI(e,t=this){if((e=Q(this,e,t,0)??K)===q)return;const i=this._$AH,o=e===K&&i!==K||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,s=e!==K&&(i===K||o);o&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ne{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Q(this,e)}}const ae=$.litHtmlPolyfillSupport;ae?.(J,te),($.litHtmlVersions??=[]).push("3.3.2");const ce=globalThis;class le extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const o=i?.renderBefore??t;let s=o._$litPart$;if(void 0===s){const e=i?.renderBefore??null;o._$litPart$=s=new te(t.insertBefore(D(),e),e,void 0,i??{})}return s._$AI(e),s})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}le._$litElement$=!0,le.finalized=!0,ce.litElementHydrateSupport?.({LitElement:le});const de=ce.litElementPolyfillSupport;de?.({LitElement:le}),(ce.litElementVersions??=[]).push("4.2.2");const he=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},pe={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:f},ue=(e=pe,t,i)=>{const{kind:o,metadata:s}=i;let r=globalThis.litPropertyMetadata.get(s);if(void 0===r&&globalThis.litPropertyMetadata.set(s,r=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),r.set(i.name,e),"accessor"===o){const{name:o}=i;return{set(i){const s=t.get.call(this);t.set.call(this,i),this.requestUpdate(o,s,e,!0,i)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=i;return function(i){const s=this[o];t.call(this,i),this.requestUpdate(o,s,e,!0,i)}}throw Error("Unsupported decorator location: "+o)};function ge(e){return(t,i)=>"object"==typeof i?ue(e,t,i):((e,t,i)=>{const o=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),o?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function me(e){return ge({...e,state:!0,attribute:!1})}function ve(e,t){return(t,i,o)=>((e,t,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,i),i))(t,i,{get(){return(t=>t.renderRoot?.querySelector(e)??null)(this)}})}const _e=[{key:"radar",title:"Radar & Presence",icon:"mdi:radar",match:/radar|presence|target|zone|polygon|entry|people|distance|mount|angle|occupancy|timeout|bluetooth|multi/i},{key:"voice",title:"Voice Assistant",icon:"mdi:microphone",match:/wake|assist|spraak|wekwoord|voice|speaker|volume|mute|sound|audio/i},{key:"air",title:"Air Quality & Climate",icon:"mdi:air-filter",match:/sps30|co2|voc|nox|pm|temperature|humidity|offset|calibrat|pressure|ambient/i},{key:"other",title:"Other",icon:"mdi:tune",match:/.*/}];let ye=class extends le{constructor(){super(...arguments),this.embedded=!1,this._devices=[],this._entities=[],this._loading=!0,this._filter="",this._expandedGroups=new Set,this._configFields=[],this._configValues={},this._productType="",this._savingConfig=!1,this._configSaved=!1,this._configError="",this._contractActive=!1,this._contractName=null}connectedCallback(){super.connectedCallback(),this.embedded&&this.selectedDeviceId?this._loadEmbedded():this._loadDevices()}async _loadDevices(){this._loading=!0;try{const e=await this.hass.callWS({type:"smarthomeshop/devices"});this._devices=e.devices.filter(e=>e.product_type?.includes("sensor")),this._devices.length>0&&await this._selectDevice(this._devices[0])}catch(e){console.error("Failed to load devices:",e)}this._loading=!1}async _loadEmbedded(){this._loading=!0,this._selectedDevice={id:this.selectedDeviceId,name:"",entity_count:0},await this._loadEntities(this.selectedDeviceId),this._loading=!1}async _selectDevice(e){this._selectedDevice=e,this._expandedGroups=new Set,this.dispatchEvent(new CustomEvent("device-select",{detail:{deviceId:e.id}})),await this._loadEntities(e.id)}async _loadEntities(e){try{const t=await this.hass.callWS({type:"smarthomeshop/device/entities",device_id:e});this._entities=t.entities.filter(e=>["number","select","switch","button"].includes(e.domain))}catch(e){console.error("Failed to load entities:",e)}await this._loadConfig(e)}async _loadConfig(e){try{const t=await this.hass.callWS({type:"smarthomeshop/device/config",device_id:e});this._configFields=t.fields||[],this._productType=t.product_type||"",this._contractActive=!!t.contract_active,this._contractName=t.contract_name||null;const i={};for(const e of this._configFields)i[e.key]=e.value;this._configValues=i}catch(e){console.error("Failed to load config:",e),this._configFields=[]}}async _saveConfig(){if(this._selectedDevice&&!this._savingConfig){this._savingConfig=!0,this._configSaved=!1;try{await this.hass.callWS({type:"smarthomeshop/device/config/set",device_id:this._selectedDevice.id,values:this._configValues}),this._configSaved=!0,this._configError="",window.setTimeout(()=>{this._configSaved=!1},2500)}catch(e){console.error("Failed to save config:",e),this._configError=`Could not save: ${e?.message||"unknown error"}`}this._savingConfig=!1}}_renderConfigField(e){const t=this._configValues[e.key],i=t=>{this._configValues={...this._configValues,[e.key]:t}};let o;if("number"===e.type)o=U`
        <input type="number" .value=${t??""} min=${e.min??K} max=${e.max??K} step=${e.step??K}
          @input=${e=>i(parseFloat(e.target.value))} />
        ${e.unit?U`<span class="cfg-unit">${e.unit}</span>`:K}`;else if("time"===e.type)o=U`<input type="time" .value=${t??""} @input=${e=>i(e.target.value)} />`;else if("entity"===e.type){const s=Array.isArray(e.domains)&&e.domains.length?e.domains:["input_boolean"];o=U`
        <ha-entity-picker
          .hass=${this.hass}
          .value=${t||""}
          .includeDomains=${s}
          .allowCustomEntity=${!1}
          @value-changed=${e=>i(e.detail?.value||"")}
        ></ha-entity-picker>`}else o=U`<input type="text" .value=${t??""} @input=${e=>i(e.target.value)} />`;return U`
      <div class="cfg-row">
        <div class="cfg-info">
          <div class="cfg-label">${e.label}</div>
          ${e.help?U`<div class="cfg-help">${e.help}</div>`:K}
        </div>
        <div class="cfg-control">${o}</div>
      </div>`}_renderConfigCard(){if(0===this._configFields.length)return K;const e=!!this.hass.user?.is_admin,t=this._configFields.filter(e=>!e.managed),i=this._contractActive&&t.length!==this._configFields.length;return U`
      <div class="settings-group cfg-card">
        <div class="group-header">
          <ha-icon icon="mdi:cog-outline"></ha-icon>
          <span class="group-title">Product settings</span>
        </div>
        ${i?U`
          <div class="cfg-note">
            <ha-icon icon="mdi:file-document-check-outline"></ha-icon>
            <span>Prices come from your connected energy contract${this._contractName?U` <strong>${this._contractName}</strong>`:K}. Manage or disconnect the global connection from the Energy tab to set prices manually.</span>
          </div>`:K}
        ${t.map(e=>this._renderConfigField(e))}
        <div class="cfg-foot">
          ${this._configSaved?U`<span class="cfg-saved"><ha-icon icon="mdi:check-circle"></ha-icon> Saved</span>`:K}
          ${this._configError?U`<span class="cfg-error">${this._configError}</span>`:K}
          <button class="cfg-save" ?disabled=${!e||this._savingConfig} @click=${this._saveConfig}>
            ${this._savingConfig?"Saving...":"Save settings"}
          </button>
        </div>
      </div>`}_groupEntities(){const e=this._filter.trim().toLowerCase(),t=new Map;for(const e of _e)t.set(e.key,[]);for(const i of this._entities){const o=`${i.name} ${i.entity_id}`;if(e&&!o.toLowerCase().includes(e))continue;const s=_e.find(e=>e.match.test(o));t.get(s.key).push(i)}for(const e of t.values())e.sort((e,t)=>e.name.localeCompare(t.name));return t}_callService(e,t,i,o={}){this.hass.callService(e,t,{entity_id:i,...o})}_renderControl(e){const t=this.hass.states[e.entity_id],i=t?.state,o=t?.attributes||{},s=!t||"unavailable"===i||"unknown"===i;if("switch"===e.domain){const t="on"===i;return U`
        <button class="toggle ${t?"on":""}" ?disabled=${s}
          @click=${()=>this._callService("switch",t?"turn_off":"turn_on",e.entity_id)}></button>
      `}if("select"===e.domain){const t=o.options||[];return U`
        <select ?disabled=${s}
          @change=${t=>this._callService("select","select_option",e.entity_id,{option:t.target.value})}>
          ${t.map(e=>U`<option value=${e} ?selected=${e===i}>${e}</option>`)}
        </select>
      `}if("number"===e.domain){const t=o.unit_of_measurement;return U`
        <input type="number" .value=${s?"":String(i)}
          min=${o.min??K} max=${o.max??K} step=${o.step??K}
          ?disabled=${s}
          @change=${t=>{const i=parseFloat(t.target.value);isNaN(i)||this._callService("number","set_value",e.entity_id,{value:i})}}/>
        ${t?U`<span class="unit">${t}</span>`:K}
      `}return"button"===e.domain?U`
        <button class="press-btn" ?disabled=${s}
          @click=${()=>this._callService("button","press",e.entity_id)}>Press</button>
      `:U`<span class="unit">${i??"-"}</span>`}_renderGroup(e,t){if(0===t.length)return K;const i=this._expandedGroups.has(e.key)||this._filter.trim().length>0?t:t.slice(0,12),o=t.length-i.length;return U`
      <div class="settings-group">
        <div class="group-header">
          <ha-icon icon=${e.icon}></ha-icon>
          <span class="group-title">${e.title}</span>
          <span class="group-count">${t.length}</span>
        </div>
        ${i.map(e=>{const t=this.hass.states[e.entity_id],i=!t||"unavailable"===t.state;return U`
            <div class="setting-item ${i?"unavailable":""}">
              <div class="setting-info">
                <div class="setting-name">${e.name}</div>
                <div class="setting-entity">${e.entity_id}</div>
              </div>
              <div class="setting-control">${this._renderControl(e)}</div>
            </div>
          `})}
        ${o>0?U`
          <button class="show-all" @click=${()=>{this._expandedGroups=new Set([...this._expandedGroups,e.key])}}>
            Show all (${o} more)
          </button>
        `:K}
      </div>
    `}render(){if(this._loading)return U`<div class="loading"><ha-circular-progress active></ha-circular-progress></div>`;const e=this._selectedDevice?this._groupEntities():null;return this.embedded?U`
        ${this._renderConfigCard()}
        ${this._selectedDevice&&e?U`
          <input type="search" class="search-box" placeholder="Search settings..."
            .value=${this._filter}
            @input=${e=>this._filter=e.target.value} />
          ${_e.map(t=>this._renderGroup(t,e.get(t.key)||[]))}
        `:U`
          <div class="empty-state">
            <ha-icon icon="mdi:tune"></ha-icon>
            <h3>No settings found</h3>
            <p>This device does not expose any configurable entities.</p>
          </div>
        `}
      `:U`
      <div class="page-header">
        <h1 class="page-title">Device Settings</h1>
        ${this._selectedDevice?U`
          <a class="ha-link" href="/config/devices/device/${this._selectedDevice.id}">
            Open in Home Assistant
            <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
        `:K}
      </div>
      <div class="settings-layout">
        <div class="panel">
          <h3 class="panel-title">Devices</h3>
          <div class="device-list">
            ${0===this._devices.length?U`
              <p class="device-type">No sensor devices found.</p>
            `:this._devices.map(e=>U`
              <div class="device-item ${this._selectedDevice?.id===e.id?"selected":""}" @click=${()=>this._selectDevice(e)}>
                <div class="device-icon"><ha-icon icon="mdi:radar"></ha-icon></div>
                <div>
                  <div class="device-name">${e.name}</div>
                  <div class="device-type">${e.product_name}</div>
                </div>
              </div>
            `)}
          </div>
        </div>
        <div>
          ${this._selectedDevice&&e?U`
            <input type="search" class="search-box" placeholder="Search settings..."
              .value=${this._filter}
              @input=${e=>this._filter=e.target.value} />
            ${_e.map(t=>this._renderGroup(t,e.get(t.key)||[]))}
          `:U`
            <div class="empty-state">
              <ha-icon icon="mdi:radar"></ha-icon>
              <h3>No device selected</h3>
              <p>Select a device on the left to configure its settings.</p>
            </div>
          `}
        </div>
      </div>
    `}};ye.styles=n`
    :host { display: block; max-width: 1100px; margin: 0 auto; --shs-primary: #4361ee; }
    .page-header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .page-title { font-size: 16px; font-weight: 600; color: var(--primary-text-color); margin: 0; }
    .ha-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--shs-primary); text-decoration: none; }
    .ha-link:hover { text-decoration: underline; }
    .ha-link ha-icon { --mdc-icon-size: 14px; }
    .settings-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; align-items: start; }
    .panel { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); padding: 16px; }
    .panel-title { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; }
    .device-list { display: flex; flex-direction: column; gap: 8px; }
    .device-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--divider-color); border-radius: 10px; cursor: pointer; }
    .device-item:hover, .device-item.selected { border-color: var(--shs-primary); }
    .device-item.selected { box-shadow: inset 0 0 0 1px var(--shs-primary); }
    .device-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(67, 97, 238, 0.12); color: #4361ee; flex-shrink: 0; }
    .device-icon ha-icon { --mdc-icon-size: 20px; }
    .device-name { font-size: 14px; font-weight: 500; color: var(--primary-text-color); }
    .device-type { font-size: 12px; color: var(--secondary-text-color); }
    .search-box { width: 100%; box-sizing: border-box; padding: 10px 12px; margin-bottom: 16px; border: 1px solid var(--divider-color); border-radius: 10px; background: var(--card-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .search-box:focus { outline: none; border-color: var(--shs-primary); }
    .settings-group { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden; margin-bottom: 16px; }
    .group-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--divider-color); }
    .group-header ha-icon { color: var(--shs-primary); --mdc-icon-size: 18px; }
    .group-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); flex: 1; }
    .group-count { font-size: 12px; color: var(--secondary-text-color); }
    .setting-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 16px; }
    .setting-item + .setting-item { border-top: 1px solid var(--divider-color); }
    .setting-item.unavailable { opacity: 0.45; }
    .setting-info { min-width: 0; }
    .setting-name { font-size: 13.5px; font-weight: 500; color: var(--primary-text-color); }
    .setting-entity { font-size: 11px; color: var(--secondary-text-color); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .setting-control { flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
    .setting-control select, .setting-control input[type="number"] {
      padding: 6px 10px; border: 1px solid var(--divider-color); border-radius: 8px;
      background: var(--card-background-color); color: var(--primary-text-color);
      font-size: 13px; font-family: inherit;
    }
    .setting-control input[type="number"] { width: 90px; text-align: right; }
    .setting-control select:focus, .setting-control input:focus { outline: none; border-color: var(--shs-primary); }
    .unit { font-size: 12px; color: var(--secondary-text-color); }
    .toggle { position: relative; width: 40px; height: 22px; border-radius: 11px; background: var(--divider-color); border: none; cursor: pointer; transition: background 0.15s ease; padding: 0; }
    .toggle.on { background: var(--shs-primary); }
    .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: white; transition: transform 0.15s ease; }
    .toggle.on::after { transform: translateX(18px); }
    .press-btn { padding: 6px 14px; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--shs-primary); font-size: 13px; font-family: inherit; cursor: pointer; }
    .press-btn:hover { border-color: var(--shs-primary); }
    .show-all { display: block; width: 100%; padding: 10px; border: none; border-top: 1px solid var(--divider-color); background: none; color: var(--shs-primary); font-size: 13px; font-family: inherit; cursor: pointer; }
    .show-all:hover { background: var(--secondary-background-color); }
    .empty-state { text-align: center; padding: 48px 24px; border: 1px dashed var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); }
    .empty-state ha-icon { --mdc-icon-size: 40px; color: var(--secondary-text-color); margin-bottom: 12px; }
    .empty-state h3 { font-size: 16px; color: var(--primary-text-color); margin: 0 0 8px 0; }
    .empty-state p { font-size: 13.5px; color: var(--secondary-text-color); margin: 0; }
    .loading { display: flex; align-items: center; justify-content: center; padding: 48px; }
    @media (max-width: 900px) {
      .settings-layout { grid-template-columns: 1fr; }
    }

    /* Product settings (config entry options) */
    .cfg-card { margin-bottom: 20px; }
    .cfg-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; }
    .cfg-row + .cfg-row { border-top: 1px solid var(--divider-color); }
    .cfg-info { min-width: 0; }
    .cfg-label { font-size: 13.5px; font-weight: 500; color: var(--primary-text-color); }
    .cfg-help { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 2px; line-height: 1.4; }
    .cfg-note { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px; font-size: 12.5px; line-height: 1.5; color: var(--secondary-text-color); background: var(--shs-primary-10, rgba(3, 169, 244, 0.08)); border-bottom: 1px solid var(--divider-color); }
    .cfg-note ha-icon { --mdc-icon-size: 18px; color: var(--shs-primary); flex-shrink: 0; margin-top: 1px; }
    .cfg-note strong { color: var(--primary-text-color); }
    .cfg-control { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .cfg-control input, .cfg-control select {
      padding: 7px 10px; border: 1px solid var(--divider-color); border-radius: 8px;
      background: var(--card-background-color); color: var(--primary-text-color);
      font-size: 13px; font-family: inherit;
    }
    .cfg-control input[type="number"] { width: 90px; text-align: right; }
    .cfg-control input:focus, .cfg-control select:focus { outline: none; border-color: var(--shs-primary); }
    .cfg-control ha-entity-picker { display: block; width: min(320px, 46vw); --mdc-theme-primary: var(--shs-primary); }
    .cfg-unit { font-size: 12px; color: var(--secondary-text-color); min-width: 34px; }
    .cfg-foot { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--divider-color); }
    .cfg-saved { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: #22c55e; }
    .cfg-error { font-size: 12.5px; color: #ef4444; }
    .cfg-saved ha-icon { --mdc-icon-size: 15px; }
    .cfg-save { padding: 9px 18px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .cfg-save:disabled { opacity: 0.5; cursor: default; }
  `,e([ge({attribute:!1})],ye.prototype,"hass",void 0),e([ge()],ye.prototype,"selectedDeviceId",void 0),e([ge({type:Boolean})],ye.prototype,"embedded",void 0),e([me()],ye.prototype,"_devices",void 0),e([me()],ye.prototype,"_selectedDevice",void 0),e([me()],ye.prototype,"_entities",void 0),e([me()],ye.prototype,"_loading",void 0),e([me()],ye.prototype,"_filter",void 0),e([me()],ye.prototype,"_expandedGroups",void 0),e([me()],ye.prototype,"_configFields",void 0),e([me()],ye.prototype,"_configValues",void 0),e([me()],ye.prototype,"_productType",void 0),e([me()],ye.prototype,"_savingConfig",void 0),e([me()],ye.prototype,"_configSaved",void 0),e([me()],ye.prototype,"_configError",void 0),e([me()],ye.prototype,"_contractActive",void 0),e([me()],ye.prototype,"_contractName",void 0),ye=e([he("shs-settings-page")],ye);const xe=e=>e.split(".")[0],fe=e=>`shs_sched_${e.slice(0,8)}`,be=(e,t)=>({service:`${xe(e)}.${t?"turn_on":"turn_off"}`,target:{entity_id:e}});let we=class extends le{constructor(){super(...arguments),this.deviceId="",this.deviceName="",this.deviceEntities=[],this._pricesOk=!1,this._loaded=!1,this._schedules=[],this._modal=!1,this._busy=!1,this._error="",this._editId="",this._name="",this._target="",this._hours=4,this._readyBy="07:00",this._earliest="",this._interruptible=!0,this._guard=!1,this._loadPower=2e3}connectedCallback(){super.connectedCallback(),this._load()}async _load(){if(this.hass){try{const e=await this.hass.callWS({type:"smarthomeshop/account"});this._pricesOk="ok"===e.status,this._pricesOk&&await this._loadSchedules()}catch(e){console.error("energy-schedules: load failed",e)}this._loaded=!0}}async _loadSchedules(){const e=await this.hass.callWS({type:"smarthomeshop/schedules"});this._schedules=e.schedules||[]}_switchAllowed(e){const t="string"==typeof e?e:e.entity_id||"",i=xe(t);if("switch"!==i&&"input_boolean"!==i)return!1;const o=new Set(this._schedules.filter(e=>e.id!==this._editId).map(e=>e.target_entity));return!o.has(t)||t===this._target}_openModal(e){this._error="",this._editId=e?.id||"",this._name=e?.name||"",this._target=e?.target_entity||"",this._hours=e?.hours??4,this._readyBy=e?.ready_by||"07:00",this._earliest=e?.earliest||"",this._interruptible=e?.interruptible??!0,this._guard=e?.guard??!1,this._loadPower=e?.load_power??2e3,this._modal=!0}_availableEntity(){const e=this.deviceEntities.find(e=>e.entity_id.includes("available_grid_power"))?.entity_id||Object.keys(this.hass.states||{}).find(e=>e.includes("available_grid_power"));if(!e)return;const t=this.hass.states[e];return t&&Number.isFinite(Number(t.state))?e:void 0}async _save(){if(this._busy)return;if(!this.hass.user?.is_admin)return void(this._error="Administrator required.");const e=Math.round(this._hours);if(this._name.trim())if(this._target)if(/^([01]?\d|2[0-3]):[0-5]\d$/.test(this._readyBy))if(!Number.isFinite(e)||e<1||e>24)this._error="Hours needed must be 1-24.";else{this._busy=!0,this._error="";try{const t=this._availableEntity(),i=this._guard&&!!t,o=(await this.hass.callWS({type:"smarthomeshop/schedules/set",...this._editId?{schedule_id:this._editId}:{},name:this._name.trim(),target_entity:this._target,hours:e,ready_by:this._readyBy,earliest:this._earliest||null,interruptible:this._interruptible,guard:i,load_power:Number.isFinite(this._loadPower)&&this._loadPower>0?Math.max(1,Math.round(this._loadPower)):null})).schedule;this._editId=o.id;let s=o.entity_id;for(let e=0;e<8&&!s;e++)await new Promise(e=>window.setTimeout(e,400)),await this._loadSchedules(),s=this._schedules.find(e=>e.id===o.id)?.entity_id;if(!s)return this._error="Schedule saved, but its sensor is not ready yet. Reopen and save again to create the automation.",await this._loadSchedules(),void(this._busy=!1);const r=i&&t?{available:t,loadPower:Math.max(1,Math.round(this._loadPower))}:null;await this.hass.callApi("POST",`config/automation/config/${fe(o.id)}`,function(e,t,i,o,s){const r=[{platform:"state",entity_id:t,to:"on",id:"edge_on"},{platform:"state",entity_id:t,to:"off",id:"edge_off"},{platform:"homeassistant",event:"start",id:"boot"},{platform:"state",entity_id:i,to:"on",for:{hours:o},id:"watchdog"}],n=[{conditions:[{condition:"trigger",id:"watchdog"}],sequence:[be(i,!1)]},{conditions:[{condition:"state",entity_id:t,state:"off"}],sequence:[be(i,!1)]}];return s?(r.push({platform:"numeric_state",entity_id:s.available,above:s.loadPower-1,id:"headroom"}),n.push({conditions:[{condition:"state",entity_id:t,state:"on"},{condition:"state",entity_id:i,state:"on"}],sequence:[be(i,!0)]}),n.push({conditions:[{condition:"state",entity_id:t,state:"on"},{condition:"state",entity_id:i,state:"off"},{condition:"numeric_state",entity_id:s.available,above:s.loadPower-1}],sequence:[be(i,!0)]})):n.push({conditions:[{condition:"state",entity_id:t,state:"on"}],sequence:[be(i,!0)]}),{alias:e,description:"Created with the SmartHomeShop.io panel · smart schedule",mode:"restart",trigger:r,condition:[],action:[{choose:n}]}}(`${this.deviceName||"Schedule"} - ${o.name}`,s,this._target,e+2,r)),await this._loadSchedules(),this._modal=!1}catch(e){console.error("energy-schedules: save failed",e),this._error=`Could not save. ${e?.message||""}`}this._busy=!1}else this._error="Enter a valid ready-by time.";else this._error="Pick a device to run.";else this._error="Give the schedule a name."}async _delete(e){if(this.hass.user?.is_admin&&window.confirm(`Delete "${e.name}" and its automation?`))try{await this.hass.callWS({type:"smarthomeshop/schedules/delete",schedule_id:e.id});try{await this.hass.callApi("DELETE",`config/automation/config/${fe(e.id)}`)}catch{}await this._loadSchedules()}catch(e){console.error("energy-schedules: delete failed",e),this._error="Could not delete the schedule. Administrator rights are required."}}_live(e){const t=e.entity_id?this.hass.states[e.entity_id]:void 0;return t?{active:"on"===t.state,next_start:t.attributes?.next_start,forced:t.attributes?.forced}:{active:!!e.active,next_start:e.next_start,forced:e.forced}}_hm(e){if(!e)return"";try{const t=this.hass.config?.time_zone;return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",...t?{timeZone:t}:{}})}catch{return""}}_targetName(e){return this.hass.states[e]?.attributes?.friendly_name||e}_renderItem(e,t){const i=this._live(e),o="on"===this.hass.states[e.target_entity]?.state,s=!!e.guard&&i.active&&!o?U`<span class="badge forced">Waiting for capacity</span>`:i.active?i.forced?U`<span class="badge forced">Running (deadline)</span>`:U`<span class="badge on">Running now</span>`:U`<span class="badge off">${i.next_start?`Next ${this._hm(i.next_start)}`:"Waiting"}</span>`;return U`
      <div class="item">
        <div class="item-icon"><ha-icon icon="mdi:calendar-clock"></ha-icon></div>
        <div class="item-main">
          <div class="item-name">${e.name}</div>
          <div class="item-meta">${this._targetName(e.target_entity)} · ${e.hours}h · ready by ${e.ready_by}${e.earliest?` · from ${e.earliest}`:""}${!1===e.interruptible?" · one block":""}${e.guard?" · fuse-safe":""}</div>
        </div>
        ${s}
        ${t?U`
          <button class="iconbtn" title="Edit" @click=${()=>this._openModal(e)}><ha-icon icon="mdi:pencil-outline"></ha-icon></button>
          <button class="iconbtn del" title="Delete" @click=${()=>this._delete(e)}><ha-icon icon="mdi:trash-can-outline"></ha-icon></button>
        `:K}
      </div>`}_renderModal(){return this._modal?U`
      <div class="modal-backdrop" @click=${()=>{this._modal=!1}}>
        <div class="modal" @click=${e=>e.stopPropagation()}>
          <div class="modal-head">
            <div class="item-icon"><ha-icon icon="mdi:calendar-clock"></ha-icon></div>
            <div class="modal-title">${this._editId?"Edit schedule":"New deadline schedule"}</div>
            <button class="modal-x" @click=${()=>{this._modal=!1}}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label class="f">Name</label>
              <input type="text" placeholder="e.g. Car ready in the morning" .value=${this._name}
                @input=${e=>{this._name=e.target.value}} />
            </div>
            <div class="field">
              <label class="f">Device to run</label>
              <ha-entity-picker
                .hass=${this.hass}
                .value=${this._target}
                .includeDomains=${["switch","input_boolean"]}
                .entityFilter=${e=>this._switchAllowed(e)}
                .allowCustomEntity=${!1}
                @value-changed=${e=>{this._target=e.detail?.value||""}}
              ></ha-entity-picker>
              <div class="help">A switch or smart plug (EV charger, appliance). It is fully controlled by this schedule. Devices already used by another schedule are hidden.</div>
            </div>
            <div class="two">
              <div class="field">
                <label class="f">Hours needed</label>
                <input type="number" min="1" max="24" step="1" .value=${String(this._hours)}
                  @input=${e=>{this._hours=parseFloat(e.target.value)}} />
              </div>
              <div class="field">
                <label class="f">Ready by</label>
                <input type="time" .value=${this._readyBy}
                  @input=${e=>{this._readyBy=e.target.value}} />
              </div>
            </div>
            <div class="field">
              <label class="f">Not before (optional)</label>
              <input type="time" .value=${this._earliest}
                @input=${e=>{this._earliest=e.target.value}} />
              <div class="help">Leave empty to allow starting any time before the deadline. The deadline is always met while prices are available.</div>
            </div>
            <div class="field">
              <label class="check">
                <input type="checkbox" ?checked=${!this._interruptible}
                  @change=${e=>{this._interruptible=!e.target.checked}} />
                Run in one continuous block (for loads that can't pause, e.g. a dishwasher)
              </label>
            </div>
            <div class="field">
              <label class="f">This load draws about (optional)</label>
              <div class="row"><input type="number" min="100" max="25000" step="100" .value=${String(this._loadPower)}
                @input=${e=>{this._loadPower=parseFloat(e.target.value)}} /><span style="font-size:12px;color:var(--secondary-text-color);">W</span></div>
              <div class="help">Used for the smart-savings estimate and the fuse guard below.</div>
            </div>
            ${this._availableEntity()?U`
              <div class="field">
                <label class="check">
                  <input type="checkbox" ?checked=${this._guard}
                    @change=${e=>{this._guard=e.target.checked}} />
                  Don't start if it would overload my main fuse
                </label>
                ${this._guard?U`
                  <div class="help">The schedule waits for enough free capacity on your P1 connection before switching this on. A load that is already running is never cut off. If there is never enough capacity, fuse safety wins and the deadline can be delayed or missed.</div>`:K}
              </div>
            `:K}
            ${this._error?U`<div class="warn">${this._error}</div>`:K}
          </div>
          <div class="modal-foot">
            <button class="btn-ghost" @click=${()=>{this._modal=!1}}>Cancel</button>
            <button class="create-btn" ?disabled=${this._busy} @click=${this._save}>
              <ha-icon icon="mdi:check"></ha-icon> ${this._busy?"Saving...":this._editId?"Save schedule":"Create schedule"}
            </button>
          </div>
        </div>
      </div>`:K}render(){if(!this._loaded||!this._pricesOk)return K;const e=!!this.hass.user?.is_admin;return U`
      <div class="head">
        <span class="head-title">Deadline schedules</span>
        ${e?U`<button class="add-btn" @click=${()=>this._openModal()}><ha-icon icon="mdi:plus"></ha-icon> Add schedule</button>`:K}
      </div>
      <div class="sub">
        Have a load finished by a set time in the cheapest hours - e.g. "car ready by 07:00, needs 4 hours".
        The deadline is met whenever the price feed is available (unless the optional fuse guard is waiting for free capacity).
      </div>
      ${this._error&&!this._modal?U`<div class="warn">${this._error}</div>`:K}
      ${0===this._schedules.length?U`<div class="empty">No schedules yet. Add one to charge or run a device by a deadline in the cheapest hours.</div>`:this._schedules.map(t=>this._renderItem(t,e))}
      ${this._renderModal()}
    `}};we.styles=n`
    :host { display: block; --shs-primary: #4361ee; margin-top: 24px; }
    .head { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
    .head-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .add-btn { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .add-btn ha-icon { --mdc-icon-size: 15px; }
    .sub { font-size: 12.5px; color: var(--secondary-text-color); line-height: 1.5; margin: -4px 0 12px; }
    .item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 10px; margin-bottom: 8px; }
    .item-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(14,165,233,.12); color: #0ea5e9; flex-shrink: 0; }
    .item-main { flex: 1; min-width: 0; }
    .item-name { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
    .item-meta { font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
    .badge { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }
    .badge.on { background: rgba(34,197,94,.15); color: #16a34a; }
    .badge.off { background: var(--secondary-background-color); color: var(--secondary-text-color); }
    .badge.forced { background: rgba(245,158,11,.15); color: #b45309; }
    .iconbtn { background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .iconbtn:hover { color: var(--primary-text-color); }
    .iconbtn.del:hover { color: #ef4444; }
    .iconbtn ha-icon { --mdc-icon-size: 18px; }
    .empty { font-size: 13px; color: var(--secondary-text-color); }
    .warn { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); border-radius: 10px; padding: 12px 14px; margin: 8px 0; font-size: 13px; color: var(--primary-text-color); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
    .modal { width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    .modal-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--divider-color); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .modal-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .modal-body { padding: 18px 20px; }
    .field { margin-bottom: 14px; }
    label.f { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .4px; margin: 0 0 6px; }
    .field .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; line-height: 1.4; }
    select, input[type="text"], input[type="number"], input[type="time"] { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    ha-entity-picker { display: block; width: 100%; --mdc-theme-primary: var(--shs-primary); }
    select:focus, input:focus { outline: none; border-color: var(--shs-primary); }
    .two { display: flex; gap: 10px; }
    .two > div { flex: 1; }
    .check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--primary-text-color); }
    .check input { width: auto; }
    .row { display: flex; align-items: center; gap: 8px; }
    .row input { max-width: 140px; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--divider-color); }
    .btn-ghost { padding: 9px 16px; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--primary-text-color); font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; }
    .create-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .create-btn:disabled { opacity: .5; cursor: default; }
  `,e([ge({attribute:!1})],we.prototype,"hass",void 0),e([ge()],we.prototype,"deviceId",void 0),e([ge()],we.prototype,"deviceName",void 0),e([ge({attribute:!1})],we.prototype,"deviceEntities",void 0),e([me()],we.prototype,"_pricesOk",void 0),e([me()],we.prototype,"_loaded",void 0),e([me()],we.prototype,"_schedules",void 0),e([me()],we.prototype,"_modal",void 0),e([me()],we.prototype,"_busy",void 0),e([me()],we.prototype,"_error",void 0),e([me()],we.prototype,"_editId",void 0),e([me()],we.prototype,"_name",void 0),e([me()],we.prototype,"_target",void 0),e([me()],we.prototype,"_hours",void 0),e([me()],we.prototype,"_readyBy",void 0),e([me()],we.prototype,"_earliest",void 0),e([me()],we.prototype,"_interruptible",void 0),e([me()],we.prototype,"_guard",void 0),e([me()],we.prototype,"_loadPower",void 0),we=e([he("shs-energy-schedules")],we);const $e=["p1meterkit","waterp1meterkit"];function ke(e,t){if(0!==e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();const i=`/config/automation/edit/${encodeURIComponent(t)}`;window.history.pushState(null,"",i),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}const Se={ultimatesensor:["climate"],ultimatesensor_mini:["climate"],ceilsense:["climate"],waterp1meterkit:["water","energy"],watermeterkit:["water"],waterflowkit:["water"],p1meterkit:["energy"]},ze=[{key:"co2_high",group:"climate",title:"High CO₂",color:"#22c55e",desc:"Notify when CO₂ stays too high - time to ventilate.",icon:"mdi:molecule-co2",match:{domain:"sensor",suffix:["scd41_co2","scd4x_co2","co2"],excl:["calibrat","manual","offset","target"]},kind:"above",threshold:1e3,unit:"ppm",forMin:5,msgTitle:"High CO₂ in {room}",msg:"CO₂ is {value} ppm. Open a window to get some fresh air."},{key:"pm25_high",group:"climate",title:"Poor air quality (PM2.5)",color:"#f59e0b",desc:"Notify when fine dust rises above a healthy level.",icon:"mdi:air-filter",match:{domain:"sensor",suffix:["pm_2_5mm_weight_concentration","pm_2_5um_weight_concentration","pm_2_5","pm2_5","pm25"],excl:["number","count"]},kind:"above",threshold:35,unit:"µg/m³",forMin:5,msgTitle:"Poor air quality in {room}",msg:"Fine dust (PM2.5) is {value} µg/m³."},{key:"voc_high",group:"climate",title:"High VOC",color:"#a855f7",desc:"Notify when chemical pollutants (VOC) rise.",icon:"mdi:scent",match:{domain:"sensor",suffix:["voc_index","voc"],excl:["calibrat"]},kind:"above",threshold:250,unit:"",forMin:5,msgTitle:"High VOC in {room}",msg:"VOC index is {value}. Ventilate the room."},{key:"humid_high",group:"climate",title:"Too humid",color:"#0096c7",desc:"Notify at high humidity (risk of mould).",icon:"mdi:water-percent",match:{domain:"sensor",suffix:["scd41_humidity","scd4x_humidity","sht4x_humidity","bme280_humidity","humidity"],excl:["offset","calibrat"]},kind:"above",threshold:70,unit:"%",forMin:15,msgTitle:"High humidity in {room}",msg:"Humidity is {value}%. Ventilate to prevent mould."},{key:"humid_low",group:"climate",title:"Too dry",color:"#94a3b8",desc:"Notify when the air gets very dry.",icon:"mdi:water-off",match:{domain:"sensor",suffix:["scd41_humidity","scd4x_humidity","sht4x_humidity","bme280_humidity","humidity"],excl:["offset","calibrat"]},kind:"below",threshold:30,unit:"%",forMin:15,msgTitle:"Dry air in {room}",msg:"Humidity is only {value}%."},{key:"temp_high",group:"climate",title:"Too warm",color:"#ef4444",desc:"Notify when the temperature climbs too high.",icon:"mdi:thermometer-high",match:{domain:"sensor",suffix:["scd41_temperature","scd4x_temperature","sht4x_temperature","bme280_temperature","temperature"],excl:["offset","calibrat","cpu","esp32","chip_temp","internal_temp","board_temp","bmp"]},kind:"above",threshold:27,unit:"°C",forMin:10,msgTitle:"It is warm in {room}",msg:"Temperature is {value}°C."},{key:"temp_low",group:"climate",title:"Too cold",color:"#38bdf8",desc:"Notify when it gets cold in the room.",icon:"mdi:thermometer-low",match:{domain:"sensor",suffix:["scd41_temperature","scd4x_temperature","sht4x_temperature","bme280_temperature","temperature"],excl:["offset","calibrat","cpu","esp32","chip_temp","internal_temp","board_temp","bmp"]},kind:"below",threshold:16,unit:"°C",forMin:10,msgTitle:"It is cold in {room}",msg:"Temperature is {value}°C."},{key:"presence_on",group:"climate",title:"Motion detected",color:"#4361ee",desc:"Notify on presence - handy as an away alarm.",icon:"mdi:motion-sensor",match:{domain:"binary_sensor",suffix:["occupancy","presence"],excl:["zone"]},kind:"to_on",msgTitle:"Motion in {room}",msg:"{room} detected presence."},{key:"vacant",group:"climate",title:"Room became empty",color:"#64748b",desc:"Notify when nobody has been present for a while.",icon:"mdi:motion-sensor-off",match:{domain:"binary_sensor",suffix:["occupancy","presence"],excl:["zone"]},kind:"to_off",forMin:10,msgTitle:"{room} is empty",msg:"No presence in {room} for {min} minutes."},{key:"leak_alarm",group:"water",title:"Possible water leak",color:"#ef4444",desc:"Notify when smart leak detection flags unusual usage.",icon:"mdi:water-alert",match:{domain:"binary_sensor",suffix:["leak_alarm_cc","smart_leak_detection_cc"]},kind:"to_on",msgTitle:"Possible water leak ({room})",msg:"Smart leak detection flagged unusual water usage."},{key:"hw_leak",group:"water",title:"Water leak sensor wet",color:"#dc2626",desc:"Notify the moment the hardware leak sensor detects water.",icon:"mdi:water",match:{domain:"binary_sensor",suffix:["water_leak_sensor","water_leak"]},kind:"to_on",msgTitle:"💧 Water detected!",msg:"The water leak sensor is wet - check immediately."},{key:"night_usage",group:"water",title:"Night-time water usage",color:"#6366f1",desc:"Notify when water is used during the night.",icon:"mdi:weather-night",match:{domain:"binary_sensor",suffix:["night_usage_cc"]},kind:"to_on",msgTitle:"Night-time water usage ({room})",msg:"Water is being used during the night."},{key:"continuous",group:"water",title:"Continuous water flow",color:"#f59e0b",desc:"Notify when water flows non-stop (running tap or leak).",icon:"mdi:water-pump",match:{domain:"binary_sensor",suffix:["continuous_flow_leak_cc","continuous_flow_cc"]},kind:"to_on",msgTitle:"Continuous water flow ({room})",msg:"Water has been flowing non-stop - possible leak or running tap."},{key:"usage_high",group:"water",title:"High water usage today",color:"#0096c7",desc:"Notify when the water usage today passes a limit.",icon:"mdi:cup-water",match:{domain:"sensor",suffix:["usage_today_cc"]},kind:"above",threshold:500,unit:"L",msgTitle:"High water usage today ({room})",msg:"You have used {value} L today."},{key:"energy_today_high",group:"energy",title:"High electricity usage today",color:"#ef476f",desc:"Notify when today's electricity use passes a limit.",icon:"mdi:counter",match:{domain:"sensor",suffix:["energy_used_today_cc"]},kind:"above",threshold:10,unit:"kWh",msgTitle:"High electricity usage",msg:"{room} has used {value} kWh of electricity today."},{key:"night_power_high",group:"energy",title:"Unusual night-time power usage",color:"#6c63ff",desc:"Notify when power stays above a limit between midnight and 06:00.",icon:"mdi:weather-night",match:{domain:"sensor",suffix:["grid_import_power_cc"]},kind:"above",threshold:500,unit:"W",forMin:15,timeWindow:{after:"00:00:00",before:"06:00:00"},msgTitle:"High night-time power use",msg:"{room} is using {value} W during the night for at least {min} minutes."},{key:"solar_export_high",group:"energy",title:"High solar export",color:"#f59e0b",desc:"Notify when solar export stays above a chosen limit.",icon:"mdi:solar-power-variant",match:{domain:"sensor",suffix:["grid_export_power_cc"]},kind:"above",threshold:1e3,unit:"W",forMin:5,msgTitle:"High solar export",msg:"{room} is exporting {value} W for at least {min} minutes."},{key:"phase_imbalance",group:"energy",title:"Phase imbalance detected",color:"#e63946",desc:"Notify when the difference between the highest and lowest phase current is too large.",icon:"mdi:current-ac",match:{domain:"sensor",suffix:["phase_imbalance_cc"]},kind:"above",threshold:10,unit:"A",forMin:5,msgTitle:"Phase imbalance detected",msg:"{room} has a phase current difference of {value} A for at least {min} minutes."},{key:"power_high",group:"energy",title:"High power usage",color:"#f72585",desc:"Notify when power draw stays above a limit.",icon:"mdi:flash-alert",match:{domain:"sensor",suffix:["power_consumed"],excl:["phase"]},kind:"above",threshold:3500,unit:"W",forMin:5,msgTitle:"High power usage",msg:"You are drawing {value} W right now."},{key:"fuse_near",group:"energy",title:"Close to fuse limit",color:"#e11d48",desc:"Notify when a phase gets close to your main fuse.",icon:"mdi:gauge-full",match:{domain:"sensor",suffix:["highest_phase_load_cc"]},kind:"above",threshold:80,unit:"%",forMin:1,msgTitle:"Close to fuse limit",msg:"Phase load is at {value}% of your main fuse."}];let Me=class extends le{constructor(){super(...arguments),this.deviceName="",this.productType="",this._entities=[],this._related=[],this._loading=!0,this._notifyTarget="persistent_notification.create",this._thresholds={},this._created={},this._busy="",this._error="",this._modalScenario=null,this._modalEntityId=""}connectedCallback(){super.connectedCallback(),this._load()}async _load(){this._loading=!0;try{const e=await this.hass.callWS({type:"smarthomeshop/device/entities",device_id:this.deviceId});this._entities=e.entities||[]}catch(e){console.error("automations: failed to load entities",e)}await this._loadRelated(),this._loading=!1}async _loadRelated(){try{const e=await this.hass.callWS({type:"search/related",item_type:"device",item_id:this.deviceId});this._related=e.automation||[]}catch(e){console.error("automations: search/related failed",e),this._related=[]}}_notifyOptions(){const e=[{value:"persistent_notification.create",label:"Home Assistant notification"}],t=this.hass.services?.notify||{};for(const i of Object.keys(t).sort()){if("persistent_notification"===i)continue;const t=i.replace(/^mobile_app_/,"📱 ").replace(/_/g," ");e.push({value:`notify.${i}`,label:`Notify: ${t}`})}return e}_findEntity(e){const t=e.match.excl||[],i=this._entities.filter(i=>i.entity_id.startsWith(e.match.domain+".")&&!t.some(e=>i.entity_id.toLowerCase().includes(e))).sort((e,t)=>e.entity_id.localeCompare(t.entity_id));for(const t of e.match.suffix){const e=i.find(e=>e.entity_id.toLowerCase().endsWith(`_${t}`));if(e)return e.entity_id}for(const t of e.match.suffix){const e=i.find(e=>e.entity_id.toLowerCase().includes(`_${t}`));if(e)return e.entity_id}return null}_threshold(e){const t=this._thresholds[e.key];return Number.isFinite(t)?t:e.threshold??0}_buildConfig(e,t){const i=this.deviceName||"the room",o=`{{ states('${t}') }}`,s=e.forMin??0,r=e=>e.replace(/{room}/g,i).replace(/{value}/g,o).replace(/{min}/g,String(s));let n;"above"===e.kind||"below"===e.kind?(n={platform:"numeric_state",entity_id:t,[e.kind]:this._threshold(e)},e.forMin&&(n.for={minutes:e.forMin})):(n={platform:"state",entity_id:t,to:"to_on"===e.kind?"on":"off"},e.forMin&&(n.for={minutes:e.forMin}));const[a,c]=this._notifyTarget.split("."),l={service:`${a}.${c}`,data:{title:r(e.msgTitle),message:r(e.msg)}},d=e.timeWindow?[{condition:"time",after:e.timeWindow.after,before:e.timeWindow.before}]:[];return{alias:`${i} - ${e.title}`,description:"Created with the SmartHomeShop.io panel",mode:"single",trigger:[n],condition:d,action:[l]}}_openModal(e,t){this._error="",this._modalScenario=e,this._modalEntityId=t}_closeModal(){this._modalScenario=null,this._modalEntityId=""}async _create(e,t){if(!this.hass.user?.is_admin)return!1;this._busy=e.key,this._error="";const i=`shs_${this.deviceId.slice(0,6)}_${e.key}_${Date.now()}`;let o=!1;try{await this.hass.callApi("POST",`config/automation/config/${i}`,this._buildConfig(e,t)),this._created={...this._created,[e.key]:i},window.setTimeout(()=>this._loadRelated(),1200),o=!0}catch(t){console.error("automations: create failed",t),this._error=`Could not create "${e.title}". ${t?.message||""}`}return this._busy="",o}async _confirmModal(){if(!this._modalScenario)return;await this._create(this._modalScenario,this._modalEntityId)&&this._closeModal()}_existingAutomations(){const e=[];for(const t of this._related){const i=this.hass.states[t];i&&e.push({entityId:t,name:i.attributes?.friendly_name||t,on:"on"===i.state,id:i.attributes?.id})}return e.sort((e,t)=>e.name.localeCompare(t.name))}_scenarioAutomationId(e){const t=`${this.deviceName||"the room"} - ${e.title}`;for(const e of this._related){const i=this.hass.states[e];if(i&&i.attributes?.friendly_name===t)return i.attributes?.id||void 0}return this._created[e.key]}_renderScenario(e){const t=this._findEntity(e);if(!t)return K;const i=this._scenarioAutomationId(e),o=!!this.hass.user?.is_admin;return U`
      <div class="card">
        <div class="card-head">
          <div class="card-icon" style="background: ${e.color}1f; color: ${e.color};">
            <ha-icon icon=${e.icon}></ha-icon>
          </div>
          <div>
            <div class="card-title">${e.title}</div>
            <div class="card-desc">${e.desc}</div>
          </div>
        </div>
        <div class="card-foot">
          ${i?U`
            <span class="created">
              <ha-icon icon="mdi:check-circle" style="--mdc-icon-size: 15px;"></ha-icon>
              Created · <a href="/config/automation/edit/${i}" @click=${e=>ke(e,i)}>Edit</a>
            </span>
          `:U`
            <button class="create-btn" ?disabled=${!o}
              @click=${()=>this._openModal(e,t)}>
              <ha-icon icon="mdi:plus"></ha-icon>
              Create
            </button>
          `}
        </div>
      </div>
    `}_renderModal(){const e=this._modalScenario;if(!e)return K;const t="above"===e.kind||"below"===e.kind,i=this.deviceName||"this device",o=e.forMin?` for ${e.forMin} min`:"";let s;return s=t?`When it goes ${"above"===e.kind?"above":"below"} ${this._threshold(e)} ${e.unit}${o}`:"to_on"===e.kind?`When it triggers${o}`:`When it clears${o}`,U`
      <div class="modal-backdrop" @click=${this._closeModal}>
        <div class="modal" @click=${e=>e.stopPropagation()}>
          <div class="modal-head">
            <div class="card-icon" style="background: ${e.color}1f; color: ${e.color};">
              <ha-icon icon=${e.icon}></ha-icon>
            </div>
            <div>
              <div class="modal-title">${e.title}</div>
              <div class="modal-sub">${i}</div>
            </div>
            <button class="modal-x" @click=${this._closeModal}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>

          <div class="modal-body">
            <p class="modal-desc">${e.desc}</p>

            ${t?U`
              <label class="modal-label">Trigger threshold</label>
              <div class="modal-thresh">
                <span>${"above"===e.kind?"Above":"Below"}</span>
                <input type="number" .value=${String(this._threshold(e))}
                  @input=${t=>{this._thresholds={...this._thresholds,[e.key]:parseFloat(t.target.value)}}} />
                <span class="modal-unit">${e.unit||""}</span>
              </div>
            `:K}

            <label class="modal-label">Send notification to</label>
            <select class="modal-select"
              @change=${e=>{this._notifyTarget=e.target.value}}>
              ${this._notifyOptions().map(e=>U`<option value=${e.value} ?selected=${e.value===this._notifyTarget}>${e.label}</option>`)}
            </select>

            <div class="modal-when"><ha-icon icon="mdi:flash"></ha-icon> ${s}</div>
            ${this._error?U`<div class="warn" style="margin-top: 12px;">${this._error}</div>`:K}
          </div>

          <div class="modal-foot">
            <button class="btn-ghost" @click=${this._closeModal}>Cancel</button>
            <button class="create-btn" ?disabled=${this._busy===e.key} @click=${this._confirmModal}>
              <ha-icon icon="mdi:plus"></ha-icon>
              ${this._busy===e.key?"Creating...":"Create automation"}
            </button>
          </div>
        </div>
      </div>
    `}_openGlobalEnergySettings(){this.dispatchEvent(new CustomEvent("open-energy-settings",{detail:{focus:"solar-control"},bubbles:!0,composed:!0}))}render(){if(this._loading)return U`<div class="loading"><ha-circular-progress active></ha-circular-progress></div>`;const e=Se[this.productType]||[],t=!!this.hass.user?.is_admin,i=this._existingAutomations(),o={climate:"Air quality & climate",water:"Water",energy:"Energy"},s=e.some(e=>ze.some(t=>t.group===e&&this._findEntity(t)));return U`
      <div class="intro">
        One-click automations for this device - pick the ones you want and choose where the
        notification goes. Each becomes a normal Home Assistant automation you can fine-tune
        later in the automation editor.
      </div>

      ${t?K:U`
        <div class="warn">You need an administrator account to create automations.</div>
      `}
      ${this._error&&!this._modalScenario?U`<div class="warn">${this._error}</div>`:K}

      ${$e.includes(this.productType)?U`
        <shs-energy-schedules
          .hass=${this.hass}
          .deviceId=${this.deviceId}
          .deviceName=${this.deviceName}
          .deviceEntities=${this._entities}
        ></shs-energy-schedules>
        <div class="energy-global-note">
          <ha-icon icon="mdi:lightning-bolt-outline"></ha-icon>
          <div class="energy-global-copy">Dynamic prices, solar, battery, EV and inverter automations are configured once for the whole home under Energy settings.</div>
          <button class="energy-global-button" @click=${this._openGlobalEnergySettings}>
            <ha-icon icon="mdi:cog-outline"></ha-icon>
            Open Energy settings
          </button>
        </div>
      `:K}

      ${s?e.map(e=>{const t=ze.filter(t=>t.group===e&&this._findEntity(t));return 0===t.length?K:U`
          <div class="group-title">${o[e]}</div>
          <div class="cards">${t.map(e=>this._renderScenario(e))}</div>
        `}):U`
        <div class="empty">No quick automations available for this device type yet.</div>
      `}

      ${i.length>0?U`
        <div class="existing">
          <div class="group-title">Automations for this device</div>
          ${i.map(e=>U`
            <div class="existing-item">
              <button class="toggle ${e.on?"on":""}"
                @click=${()=>this.hass.callService("automation",e.on?"turn_off":"turn_on",{entity_id:e.entityId})}></button>
              <span class="existing-name">${e.name}</span>
              ${e.id?U`<a href="/config/automation/edit/${e.id}" @click=${t=>ke(t,e.id)}>Edit</a>`:K}
            </div>
          `)}
        </div>
      `:K}

      ${s?U`
        <div class="config-hint">
          A new automation doesn't appear under <b>Settings → Automations</b>? Make sure your
          <code>configuration.yaml</code> contains <code>automation: !include automations.yaml</code>
          (standard on a normal Home Assistant install).
        </div>
      `:K}

      ${this._renderModal()}
    `}};Me.styles=n`
    :host { display: block; --shs-primary: #4361ee; }
    .intro { font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; margin-bottom: 20px; }
    .warn { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--primary-text-color); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; }
    .group-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); margin: 20px 0 12px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .card { display: flex; flex-direction: column; gap: 10px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 14px; }
    .card-head { display: flex; align-items: flex-start; gap: 10px; }
    .card-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .card-icon ha-icon { --mdc-icon-size: 20px; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
    .card-desc { font-size: 12px; color: var(--secondary-text-color); line-height: 1.4; margin-top: 2px; }
    .card-foot { display: flex; align-items: center; gap: 8px; margin-top: auto; }
    .create-btn { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .create-btn:disabled { opacity: 0.5; cursor: default; }
    .create-btn ha-icon { --mdc-icon-size: 15px; }
    .created { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #22c55e; }
    .created a { color: var(--shs-primary); text-decoration: none; }
    .created a:hover { text-decoration: underline; }
    .existing { margin-top: 28px; }
    .existing-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 10px; margin-bottom: 8px; }
    .existing-name { flex: 1; font-size: 13.5px; color: var(--primary-text-color); }
    .existing-item a { font-size: 12.5px; color: var(--shs-primary); text-decoration: none; }
    .toggle { position: relative; width: 40px; height: 22px; border-radius: 11px; background: var(--divider-color); border: none; cursor: pointer; flex-shrink: 0; }
    .toggle.on { background: var(--shs-primary); }
    .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: white; transition: transform 0.15s; }
    .toggle.on::after { transform: translateX(18px); }
    .empty { font-size: 13px; color: var(--secondary-text-color); }
    .energy-global-note { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin: 18px 0 6px; padding: 11px 13px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--secondary-text-color); font-size: 12.5px; line-height: 1.45; }
    .energy-global-note ha-icon { --mdc-icon-size: 17px; flex: none; margin-top: 1px; color: var(--shs-primary); }
    .energy-global-copy { flex: 1; min-width: 220px; }
    .energy-global-button { display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 8px; padding: 8px 11px; background: var(--shs-primary); color: #fff; cursor: pointer; font: inherit; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
    .energy-global-button ha-icon { --mdc-icon-size: 16px; color: inherit; margin: 0; }
    .config-hint { margin-top: 24px; font-size: 12px; color: var(--secondary-text-color); line-height: 1.5; opacity: 0.8; }
    .config-hint code { background: var(--secondary-background-color); padding: 1px 5px; border-radius: 4px; font-size: 11.5px; }
    .loading { padding: 40px; text-align: center; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
    .modal { width: 100%; max-width: 440px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); overflow: hidden; }
    .modal-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--divider-color); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .modal-sub { font-size: 12.5px; color: var(--secondary-text-color); margin-top: 1px; }
    .modal-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .modal-x ha-icon { --mdc-icon-size: 20px; }
    .modal-body { padding: 18px 20px; }
    .modal-desc { font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; margin: 0 0 16px; }
    .modal-label { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .modal-thresh { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .modal-thresh span { font-size: 13px; color: var(--secondary-text-color); }
    .modal-thresh input { flex: 1; max-width: 120px; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; text-align: right; }
    .modal-thresh input:focus { outline: none; border-color: var(--shs-primary); }
    .modal-unit { min-width: 30px; }
    .modal-select { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .modal-select:focus { outline: none; border-color: var(--shs-primary); }
    .modal-when { display: flex; align-items: center; gap: 6px; margin-top: 16px; font-size: 12.5px; color: var(--secondary-text-color); }
    .modal-when ha-icon { --mdc-icon-size: 15px; color: var(--shs-primary); }
    .modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--divider-color); }
    .btn-ghost { padding: 9px 16px; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--primary-text-color); font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--secondary-text-color); }
    .modal-foot .create-btn { margin-left: 0; }
  `,e([ge({attribute:!1})],Me.prototype,"hass",void 0),e([ge()],Me.prototype,"deviceId",void 0),e([ge()],Me.prototype,"deviceName",void 0),e([ge()],Me.prototype,"productType",void 0),e([me()],Me.prototype,"_entities",void 0),e([me()],Me.prototype,"_related",void 0),e([me()],Me.prototype,"_loading",void 0),e([me()],Me.prototype,"_notifyTarget",void 0),e([me()],Me.prototype,"_thresholds",void 0),e([me()],Me.prototype,"_created",void 0),e([me()],Me.prototype,"_busy",void 0),e([me()],Me.prototype,"_error",void 0),e([me()],Me.prototype,"_modalScenario",void 0),e([me()],Me.prototype,"_modalEntityId",void 0),Me=e([he("shs-automations-page")],Me);const Pe={energy_sources:[],device_consumption:[],device_consumption_water:[]};let Ie=class extends le{constructor(){super(...arguments),this.deviceId="",this.deviceName="",this.deviceEntities=[],this.compact=!1,this._prefs={...Pe},this._loading=!0,this._busy=!1,this._reviewConflicts=!1,this._message="",this._error=""}connectedCallback(){super.connectedCallback(),this._load()}updated(e){(e.has("deviceId")||e.has("deviceEntities"))&&this._load()}async refresh(){await this._load()}async _load(){if(this.hass&&this.deviceId){this._loading=!0,this._error="";try{this._prefs=await this.hass.callWS({type:"energy/get_prefs"})}catch(e){"not_found"===e?.code||/no prefs/i.test(e?.message||"")?this._prefs={...Pe}:this._error=`Could not read HA Energy settings. ${e?.message||""}`.trim()}this._loading=!1}else this._loading=!1}_entity(...e){const t=this.deviceEntities||[],i=e.map(e=>e.toLowerCase());return t.find(e=>{const t=`${e.entity_id} ${e.name}`.toLowerCase();return i.some(e=>t.includes(e))})?.entity_id}_priceEntity(e){const t=`sensor.smarthomeshop_energy_prices_${e}`,i=e=>{const t=this.hass.states[e]?.state;return!!t&&"unavailable"!==t&&"unknown"!==t};return i(t)?t:Object.keys(this.hass.states).find(t=>t.startsWith("sensor.")&&t.includes(`energy_prices_${e}`)&&i(t))}_target(){const e=this._entity("grid_import_energy_cc","grid import energy (cc)"),t=this._entity("grid_export_energy_cc","grid export energy (cc)"),i=this._entity("grid_import_power_cc","grid import power (cc)","_power_consumed"),o=this._entity("grid_export_power_cc","grid export power (cc)","_power_produced"),s=this._entity("_gas_consumed"),r=this._entity("_water_total_consumption"),n=this._priceEntity("electricity_price"),a=this._priceEntity("electricity_feed_in_price"),c=this._priceEntity("gas_price"),l=`SmartHomeShop - ${this.deviceName||"P1 meter"}`,d=[];if(e){const s={type:"grid",stat_energy_from:e,stat_energy_to:t||null,stat_cost:null,entity_energy_price:n||null,number_energy_price:null,stat_compensation:null,entity_energy_price_export:a||null,number_energy_price_export:null,cost_adjustment_day:0,name:l};i&&o&&(s.power_config={stat_rate_from:i,stat_rate_to:o}),d.push(s)}s&&d.push({type:"gas",stat_energy_from:s,stat_cost:null,entity_energy_price:c||null,number_energy_price:null,name:l}),r&&d.push({type:"water",stat_energy_from:r,stat_cost:null,entity_energy_price:null,number_energy_price:null,name:l});return{sources:d,items:[{label:"Electricity imported",entity:e},{label:"Electricity returned",entity:t,optional:!0},{label:"Live grid power",entity:i&&o?`${i} + ${o}`:void 0,optional:!0},{label:"Dynamic import price",entity:n,optional:!0},{label:"Dynamic feed-in price",entity:a,optional:!0},{label:"Gas",entity:s,optional:!0},{label:"Water",entity:r,optional:!0}],missing:e?[]:["Combined grid import energy sensor"]}}_sourceKey(e){return e.type,String(e.stat_energy_from||"")}_sameTarget(e,t){return e.type===t.type&&!!this._sourceKey(t)&&this._sourceKey(e)===this._sourceKey(t)}_conflicts(e=this._target()){return e.sources.flatMap(e=>{const t=this._prefs.energy_sources.filter(t=>t.type===e.type);return t.some(t=>this._sameTarget(t,e))?[]:t})}_isInSync(e=this._target()){return!(!e.sources.length||e.missing.length)&&e.sources.every(e=>{const t=this._prefs.energy_sources.find(t=>this._sameTarget(t,e));if(!t)return!1;return("grid"===e.type?["stat_energy_from","stat_energy_to","entity_energy_price","entity_energy_price_export","power_config"]:["stat_energy_from","entity_energy_price"]).every(i=>JSON.stringify(t[i]??null)===JSON.stringify(e[i]??null))})}_mergeToHa(e){const t=this._target().sources;let i=[...this._prefs.energy_sources||[]];for(const o of t){const t=i.findIndex(e=>this._sameTarget(e,o));t>=0?i[t]={...i[t],...o}:(e&&(i=i.filter(e=>e.type!==o.type)),i.push(o))}return i}async _syncToHa(e=!1){if(this._busy||!this.hass.user?.is_admin)return;const t=this._target();if(t.missing.length)return void(this._error="The combined P1 energy sensors are not available yet. Restart Home Assistant after updating the integration.");if(this._conflicts(t).length&&!e)return this._reviewConflicts=!0,void(this._message="");this._busy=!0,this._error="",this._message="";try{const t=this._mergeToHa(e);this._prefs=await this.hass.callWS({type:"energy/save_prefs",energy_sources:t}),await this.hass.callWS({type:"smarthomeshop/energy_sources/set",config:{p1_device:this.deviceId}}),this._reviewConflicts=!1,this._message="HA Energy is now linked to this P1 meter. Existing solar, battery and device sources were kept.",this.dispatchEvent(new CustomEvent("ha-energy-synced",{bubbles:!0,composed:!0}))}catch(e){this._error=`Could not update HA Energy. ${e?.message||""}`.trim()}this._busy=!1}async _syncFromHa(){if(!this._busy&&this.hass.user?.is_admin){this._busy=!0,this._error="",this._message="";try{const e={...(await this.hass.callWS({type:"smarthomeshop/energy_sources"})).sources||{},p1_device:this.deviceId},t=this._prefs.energy_sources.find(e=>"solar"===e.type),i=this._prefs.energy_sources.find(e=>"battery"===e.type);t?.stat_rate&&this.hass.states[t.stat_rate]&&(e.solar_power=t.stat_rate,e.solar_invert=!1),i?.stat_rate&&this.hass.states[i.stat_rate]&&(e.battery_power=i.stat_rate,e.battery_invert=!1),i?.stat_soc&&this.hass.states[i.stat_soc]&&(e.battery_soc=i.stat_soc),await this.hass.callWS({type:"smarthomeshop/energy_sources/set",config:e}),this._message=t||i?"Compatible P1, solar and battery mappings were imported from HA Energy. Your SmartHomeShop contract remains the price source.":"This P1 meter is now selected for Smart Energy. HA Energy has no compatible solar or battery power mappings to import.",this.dispatchEvent(new CustomEvent("ha-energy-synced",{bubbles:!0,composed:!0}))}catch(e){this._error=`Could not import HA Energy settings. ${e?.message||""}`.trim()}this._busy=!1}}_status(e=this._target()){return e.missing.length?{label:"Restart required",kind:"warn",icon:"mdi:restart-alert"}:this._isInSync(e)?{label:"In sync",kind:"good",icon:"mdi:check-circle"}:this._prefs.energy_sources.length?this._conflicts(e).length?{label:"Review required",kind:"warn",icon:"mdi:alert-circle-outline"}:{label:"Ready to sync",kind:"",icon:"mdi:sync"}:{label:"Not configured",kind:"",icon:"mdi:circle-outline"}}render(){if(this._loading)return U`<div class="shell"><div class="loading"><ha-circular-progress active></ha-circular-progress>Checking HA Energy...</div></div>`;const e=this._target(),t=this._status(e),i=this._isInSync(e),o=this._conflicts(e),s=!!this.hass.user?.is_admin;return this.compact?U`
        <div class="shell compact">
          <div class="head">
            <div class="head-icon"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></div>
            <div class="head-copy">
              <div class="title-row">
                <div class="title">Home Assistant Energy Dashboard</div>
                <span class="status ${t.kind}"><ha-icon icon=${t.icon}></ha-icon>${t.label}</span>
              </div>
              <div class="sub">Use this P1 meter for grid import, return, live power${this._entity("_gas_consumed")?", gas":""}${this._entity("_water_total_consumption")?" and water":""}.</div>
            </div>
          </div>
          <div class="body">
            <div class="compact-line">
              <div class="compact-copy">
                ${i?"The Energy Dashboard already uses the recommended SmartHomeShop entities.":o.length?"HA Energy already has another meter. Review before replacing it.":"SmartHomeShop chooses the correct cumulative sensors and keeps other Energy Dashboard sources."}
              </div>
              ${i?U`
                <a class="link-btn" href="/config/energy"><ha-icon icon="mdi:open-in-new"></ha-icon>Open HA Energy</a>
              `:U`
                <button class="primary" ?disabled=${!s||this._busy||!!e.missing.length}
                  @click=${()=>this._syncToHa(!1)}>
                  <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
                  ${this._busy?"Setting up...":o.length?"Review setup":"Set up in HA Energy"}
                </button>
              `}
            </div>
            ${this._reviewConflicts?U`
              <div class="notice"><ha-icon icon="mdi:alert-outline"></ha-icon>
                HA Energy already has ${o.map(e=>e.type).join(", ")} configured. Solar, battery and individual device sources will stay untouched.
              </div>
              <div class="actions">
                <button class="danger" ?disabled=${this._busy} @click=${()=>this._syncToHa(!0)}>Replace matching meter sources</button>
                <button @click=${()=>{this._reviewConflicts=!1}}>Cancel</button>
              </div>
            `:K}
            ${this._message?U`<div class="notice success"><ha-icon icon="mdi:check-circle"></ha-icon>${this._message}</div>`:K}
            ${this._error?U`<div class="notice error"><ha-icon icon="mdi:alert-circle"></ha-icon>${this._error}</div>`:K}
          </div>
        </div>
      `:U`
      <div class="shell">
        <div class="head">
          <div class="head-icon"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></div>
          <div class="head-copy">
            <div class="title-row">
              <div class="title">Home Assistant Energy Dashboard</div>
              <span class="status ${t.kind}"><ha-icon icon=${t.icon}></ha-icon>${t.label}</span>
            </div>
            <div class="sub">Keep HA Energy and Smart Energy aligned without overwriting unrelated solar, battery or device sources.</div>
          </div>
          <a class="link-btn" href="/config/energy"><ha-icon icon="mdi:open-in-new"></ha-icon>Open HA Energy</a>
        </div>
        <div class="body">
          <div class="map">
            <div class="side">
              <div class="side-kicker">SmartHomeShop</div>
              <div class="side-title">${this.deviceName||"Selected P1 meter"}</div>
              <div class="side-copy">Recommended cumulative meters, live grid power and connected contract prices.</div>
            </div>
            <div class="bridge"><ha-icon icon="mdi:swap-horizontal"></ha-icon></div>
            <div class="side">
              <div class="side-kicker">Home Assistant</div>
              <div class="side-title">${this._prefs.energy_sources.length?`${this._prefs.energy_sources.length} energy source${1===this._prefs.energy_sources.length?"":"s"}`:"Energy Dashboard not configured"}</div>
              <div class="side-copy">The sync changes only compatible grid, gas and water sources. Other sources stay in place.</div>
            </div>
          </div>
          <div class="rows">
            ${e.items.filter(e=>e.entity||!e.optional).map(e=>U`
              <div class="row">
                <ha-icon icon=${e.entity?"mdi:check-circle-outline":"mdi:alert-circle-outline"}></ha-icon>
                <span class="row-label">${e.label}</span>
                <span class="row-entity" title=${e.entity||""}>${e.entity||"Not available"}</span>
                ${e.entity?U`<span class="row-state"><ha-icon icon="mdi:check"></ha-icon>Ready</span>`:K}
              </div>
            `)}
          </div>
          ${this._reviewConflicts?U`
            <div class="notice"><ha-icon icon="mdi:alert-outline"></ha-icon>
              HA Energy already has ${o.map(e=>e.type).join(", ")} configured.
              Replacing affects only those meter source types; solar, batteries and individual devices remain unchanged.
            </div>
          `:K}
          ${e.missing.length?U`
            <div class="notice"><ha-icon icon="mdi:restart-alert"></ha-icon>
              Restart Home Assistant once to create the combined import and export sensors needed by the Energy Dashboard.
            </div>
          `:K}
          ${this._message?U`<div class="notice success"><ha-icon icon="mdi:check-circle"></ha-icon>${this._message}</div>`:K}
          ${this._error?U`<div class="notice error"><ha-icon icon="mdi:alert-circle"></ha-icon>${this._error}</div>`:K}
          <div class="actions">
            <button class="primary" ?disabled=${!s||this._busy||!!e.missing.length||i}
              @click=${()=>this._syncToHa(this._reviewConflicts)}>
              <ha-icon icon="mdi:arrow-right"></ha-icon>
              ${this._busy?"Syncing...":i?"Already in sync":this._reviewConflicts?"Replace and sync to HA Energy":"Sync to HA Energy"}
            </button>
            <button ?disabled=${!s||this._busy||!this._prefs.energy_sources.length}
              @click=${this._syncFromHa}>
              <ha-icon icon="mdi:arrow-left"></ha-icon>
              Import compatible setup from HA
            </button>
            ${this._reviewConflicts?U`
              <button @click=${()=>{this._reviewConflicts=!1}}>Cancel review</button>
            `:o.length?U`
              <button @click=${()=>{this._reviewConflicts=!0}}>Review ${o.length} conflict${1===o.length?"":"s"}</button>
            `:K}
          </div>
        </div>
      </div>
    `}};var Ce;Ie.styles=n`
    :host { display: block; --sync-blue: var(--shs-blue, var(--shs-primary, #4361ee)); }
    .shell {
      overflow: hidden;
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color);
    }
    .head {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 18px;
      border-bottom: 1px solid var(--divider-color);
    }
    .head-icon {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 10px;
      color: var(--sync-blue);
      background: color-mix(in srgb, var(--sync-blue) 11%, var(--card-background-color));
    }
    .head-icon ha-icon { --mdc-icon-size: 21px; }
    .head-copy { flex: 1; min-width: 0; }
    .title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .title { color: var(--primary-text-color); font-size: 14.5px; font-weight: 700; }
    .sub { margin-top: 3px; color: var(--secondary-text-color); font-size: 12.5px; line-height: 1.45; }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 999px;
      color: var(--secondary-text-color);
      background: var(--secondary-background-color);
      font-size: 11px;
      font-weight: 650;
    }
    .status.good { color: #16864b; background: color-mix(in srgb, #22c55e 12%, var(--card-background-color)); }
    .status.warn { color: #a65a00; background: color-mix(in srgb, #f59e0b 13%, var(--card-background-color)); }
    .status ha-icon { --mdc-icon-size: 14px; }
    .body { padding: 16px 18px 18px; }
    .map { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 12px; align-items: stretch; }
    .side { min-width: 0; padding: 14px; border-radius: 10px; background: var(--secondary-background-color); }
    .side-kicker { color: var(--secondary-text-color); font-size: 10.5px; font-weight: 700; letter-spacing: .55px; text-transform: uppercase; }
    .side-title { margin-top: 5px; color: var(--primary-text-color); font-size: 13.5px; font-weight: 700; }
    .side-copy { margin-top: 4px; color: var(--secondary-text-color); font-size: 11.8px; line-height: 1.45; }
    .bridge { display: grid; place-items: center; color: var(--secondary-text-color); }
    .bridge ha-icon { --mdc-icon-size: 22px; }
    .rows { margin-top: 14px; border-top: 1px solid var(--divider-color); }
    .row { display: flex; align-items: center; gap: 10px; min-height: 38px; border-bottom: 1px solid var(--divider-color); font-size: 12.5px; }
    .row ha-icon { --mdc-icon-size: 17px; color: var(--sync-blue); }
    .row-label { flex: 1; min-width: 0; color: var(--primary-text-color); }
    .row-entity { max-width: 55%; overflow: hidden; color: var(--secondary-text-color); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
    .row-state { display: inline-flex; align-items: center; gap: 4px; color: #16864b; font-size: 11.5px; }
    .row-state ha-icon { --mdc-icon-size: 14px; color: currentColor; }
    .notice {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      margin-top: 14px;
      padding: 11px 12px;
      border-radius: 9px;
      color: var(--secondary-text-color);
      background: color-mix(in srgb, #f59e0b 10%, var(--card-background-color));
      font-size: 12px;
      line-height: 1.45;
    }
    .notice.error { color: var(--error-color, #d32f2f); background: color-mix(in srgb, #ef4444 8%, var(--card-background-color)); }
    .notice.success { color: #16864b; background: color-mix(in srgb, #22c55e 9%, var(--card-background-color)); }
    .notice ha-icon { --mdc-icon-size: 17px; flex: 0 0 auto; margin-top: 1px; }
    .actions { display: flex; align-items: center; gap: 9px; margin-top: 16px; flex-wrap: wrap; }
    button, .link-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 38px;
      padding: 8px 14px;
      border: 1px solid var(--divider-color);
      border-radius: 9px;
      background: transparent;
      color: var(--primary-text-color);
      font: 650 12.5px/1 inherit;
      text-decoration: none;
      cursor: pointer;
    }
    button.primary { border-color: var(--sync-blue); background: var(--sync-blue); color: #fff; }
    button.danger { border-color: color-mix(in srgb, #ef4444 45%, var(--divider-color)); color: var(--error-color, #d32f2f); }
    button:disabled { opacity: .5; cursor: default; }
    button:not(:disabled):hover, .link-btn:hover { border-color: var(--sync-blue); }
    button ha-icon, .link-btn ha-icon { --mdc-icon-size: 16px; }
    .loading { display: flex; align-items: center; gap: 10px; padding: 18px; color: var(--secondary-text-color); font-size: 12.5px; }
    .loading ha-circular-progress { width: 22px; height: 22px; }

    .shell.compact .head { border-bottom: 0; padding-bottom: 12px; }
    .shell.compact .body { padding-top: 0; }
    .compact-line { display: flex; align-items: center; gap: 12px; }
    .compact-copy { flex: 1; min-width: 0; color: var(--secondary-text-color); font-size: 12.5px; line-height: 1.45; }

    @media (max-width: 680px) {
      .map { grid-template-columns: 1fr; }
      .bridge { transform: rotate(90deg); min-height: 20px; }
      .row { align-items: flex-start; padding: 9px 0; flex-wrap: wrap; }
      .row-entity { max-width: calc(100% - 28px); margin-left: 27px; }
      .compact-line { align-items: stretch; flex-direction: column; }
      button, .link-btn { min-height: 42px; }
    }
  `,e([ge({attribute:!1})],Ie.prototype,"hass",void 0),e([ge()],Ie.prototype,"deviceId",void 0),e([ge()],Ie.prototype,"deviceName",void 0),e([ge({attribute:!1})],Ie.prototype,"deviceEntities",void 0),e([ge({type:Boolean})],Ie.prototype,"compact",void 0),e([me()],Ie.prototype,"_prefs",void 0),e([me()],Ie.prototype,"_loading",void 0),e([me()],Ie.prototype,"_busy",void 0),e([me()],Ie.prototype,"_reviewConflicts",void 0),e([me()],Ie.prototype,"_message",void 0),e([me()],Ie.prototype,"_error",void 0),Ie=e([he("shs-ha-energy-sync")],Ie);const Te="/smarthomeshop_files/product-icons",De={ultimatesensor:{asset:`${Te}/icon-ultimatesensor.svg`,icon:"mdi:radar",category:"sensor",color:"#4361ee"},ultimatesensor_mini:{asset:`${Te}/icon-ultimatesensor-mini.svg`,icon:"mdi:radar",category:"sensor",color:"#4361ee"},waterp1meterkit:{asset:`${Te}/icon-waterp1meterkit.svg`,icon:"mdi:water-pump",category:"water",color:"#0096c7"},watermeterkit:{asset:`${Te}/icon-watermeterkit.svg`,icon:"mdi:water-circle",category:"water",color:"#0096c7"},waterflowkit:{asset:`${Te}/icon-waterflowkit.svg`,icon:"mdi:waves",category:"water",color:"#0096c7"},p1meterkit:{asset:`${Te}/icon-p1meterkit.svg`,icon:"mdi:flash",category:"energy",color:"#f59e0b"},ceilsense:{asset:`${Te}/icon-ceilsense.svg`,icon:"mdi:ceiling-light",category:"sensor",color:"#7209b7"}};let Ee=Ce=class extends le{constructor(){super(...arguments),this._devices=[],this._loading=!0,this._detailDevice=null,this._insights=null,this._showMeterForm=!1,this._meterInput="",this._detailTab="overview",this._linking=!1,this._linkError="",this._toggleMeterForm=()=>{if(this._showMeterForm=!this._showMeterForm,this._showMeterForm){const e=this._insights?.water?.meter_total;this._meterInput=e>0?e.toFixed(3):""}}}connectedCallback(){super.connectedCallback(),this._loadDevices()}async _loadDevices(){this._loading=!0;try{const e=await this.hass.callWS({type:"smarthomeshop/devices"}),t=await Promise.all(e.devices.map(async e=>{try{const t=await this.hass.callWS({type:"smarthomeshop/device/entities",device_id:e.id});return{...e,entities:t.entities}}catch{return{...e,entities:[]}}}));this._devices=t}catch(e){console.error("Failed to load devices:",e)}this._loading=!1}_selectDevice(e){this.dispatchEvent(new CustomEvent("device-select",{detail:{deviceId:e.id}}))}_navigateTo(e){this.dispatchEvent(new CustomEvent("navigate",{detail:{page:e}}))}_openDetail(e){this._detailDevice=e,this._insights=null,this._detailTab="overview",this._linking=!1,this._linkError="",this._fetchInsights(),this._insightsTimer=window.setInterval(()=>this._fetchInsights(),5e3)}_closeDetail(){this._detailDevice=null,this._insights=null,this._showMeterForm=!1,this._meterInput="",this._insightsTimer&&(clearInterval(this._insightsTimer),this._insightsTimer=void 0)}disconnectedCallback(){super.disconnectedCallback(),this._insightsTimer&&clearInterval(this._insightsTimer)}async _fetchInsights(){if(this._detailDevice)try{this._insights=await this.hass.callWS({type:"smarthomeshop/device/insights",device_id:this._detailDevice.id})}catch(e){console.error("Failed to load insights:",e)}}async _linkDevice(){const e=this._detailDevice;if(!e||this._linking)return;const t=e.id;this._linking=!0,this._linkError="";try{await this.hass.callWS({type:"smarthomeshop/device/link",device_id:t}),this._detailDevice?.id===t&&await this._fetchInsights()}catch(e){this._detailDevice?.id===t&&(this._linkError=e?.message||"Could not link this device. Check the Home Assistant logs.")}finally{this._detailDevice?.id===t&&(this._linking=!1)}}_meterInputValid(){const e=parseFloat(this._meterInput.replace(",","."));return!isNaN(e)&&e>=0}async _saveMeterReading(e){if(!e||!this._meterInputValid())return;const t=parseFloat(this._meterInput.replace(",","."));await this.hass.callService("number","set_value",{entity_id:e,value:t}),this._showMeterForm=!1,this._meterInput="",this._fetchInsights()}_fmtTime(e){if(!e)return"";try{return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}catch{return""}}_relativeTime(e){if(!e)return"";const t=Date.now()-new Date(e).getTime(),i=Math.floor(t/6e4);if(i<1)return"just now";if(i<60)return`${i} min ago`;const o=Math.floor(i/60);if(o<24)return`${o} hour${1===o?"":"s"} ago`;const s=Math.floor(o/24);return`${s} day${1===s?"":"s"} ago`}_statusClass(e){if(!e)return"";return["excellent","good","ideal"].includes(e)?"ok":["moderate","fair","elevated","cool","warm","fairly dry","fairly humid"].includes(e)?"warn":"unknown"===e?"":"alert"}_scoreClass(e){return e>=60?"bad":e>=30?"warn":""}_niceCeil(e){if(e<=0)return 1;const t=Math.pow(10,Math.floor(Math.log10(e))),i=e/t;return(i<=1?1:i<=2?2:i<=5?5:10)*t}_fmtChartValue(e,t,i){return"W"===t&&e>=1e3?`${(e/1e3).toFixed(1)} kW`:`${e.toFixed(i)} ${t}`}_renderLineChart(e,t,i,o,s=1){const r=Date.now()/1e3,n=[...e||[],[r,t]].filter(e=>r-e[0]<=1200);if(n.length<2)return U`<div class="spark-empty">Collecting data...</div>`;const a=600,c=this._niceCeil(Math.max(...n.map(e=>e[1]))),l=e=>(e-(r-1200))/1200*a,d=e=>104-e/c*98;let h=`M ${l(n[0][0]).toFixed(1)} ${d(n[0][1]).toFixed(1)}`;for(let e=1;e<n.length;e++){const t=l(n[e-1][0]),i=d(n[e-1][1]),o=l(n[e][0]),s=d(n[e][1]),r=((t+o)/2).toFixed(1);h+=` C ${r} ${i.toFixed(1)}, ${r} ${s.toFixed(1)}, ${o.toFixed(1)} ${s.toFixed(1)}`}const p=n[n.length-1],u=`${h} L ${l(p[0]).toFixed(1)} ${104..toFixed(1)} L 0 ${104..toFixed(1)} Z`,g=`chart-grad-${i.replace("#","")}`,m=[d(c),d(c/2)];return U`
      <div class="chart-wrap">
        <svg class="chart-svg" viewBox="0 0 ${a} ${110}" preserveAspectRatio="none">
          <defs>
            <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${i}" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="${i}" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          <line x1="0" y1="${m[0]}" x2="${a}" y2="${m[0]}" stroke="rgba(148, 163, 184, 0.12)" stroke-width="1"/>
          <line x1="0" y1="${m[1]}" x2="${a}" y2="${m[1]}" stroke="rgba(148, 163, 184, 0.12)" stroke-width="1"/>
          <path d="${u}" fill="url(#${g})"/>
          <path d="${h}" fill="none" stroke="${i}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          <circle cx="${l(p[0])}" cy="${d(p[1])}" r="7" fill="${i}" opacity="0.18"/>
          <circle cx="${l(p[0])}" cy="${d(p[1])}" r="3.5" fill="${i}"/>
        </svg>
        <span class="chart-ylabel" style="top: 0;">${this._fmtChartValue(c,o,s)}</span>
        <span class="chart-ylabel" style="top: calc(50% - 8px);">${this._fmtChartValue(c/2,o,s)}</span>
        <div class="chart-axis">
          <span>20 min ago</span>
          <span>10 min ago</span>
          <span>now</span>
        </div>
      </div>
    `}_renderDetail(){const e=this._detailDevice,t=this._getProductConfig(e.product_type),i=this._insights,o=i?.water,s=i?.energy,r=o?.leak_score,n=o?.baseline,a=["waterp1meterkit","p1meterkit"].includes(e.product_type||""),c=i?!1===i.online:!1===e.online,l=(i?i.last_seen:e.last_seen)||null;return U`
      <div class="detail-header">
        <button class="back-btn" @click=${this._closeDetail}>
          <ha-icon icon="mdi:arrow-left" style="--mdc-icon-size: 16px;"></ha-icon>
          Back
        </button>
        <div class="detail-title">
          <div class="detail-name">
            ${e.name}
            ${c?U`<span class="offline-badge" style="vertical-align: 2px; margin-left: 6px;">Offline</span>`:K}
          </div>
          <div class="detail-sub">
            ${e.product_name}${c&&l?U` · Last seen ${this._relativeTime(l)}`:K}
          </div>
        </div>
        <a class="shop-link" href="/config/devices/device/${e.id}">
          Open in Home Assistant
          <ha-icon icon="mdi:open-in-new"></ha-icon>
        </a>
      </div>

      ${i&&!1===i.configured?i.entry_exists?U`
        <div class="not-configured">
          ${i.entry_disabled?U`
            This device is linked, but its SmartHomeShop entry is disabled.
            Enable it via <a href="/config/integrations/integration/smarthomeshop">Settings, Devices &amp; Services</a> to bring back ${this._integrationFeatures(e.product_type)}.
          `:U`
            This device is linked, but the SmartHomeShop entry is not loaded yet.
            It is usually still starting; if this does not resolve, check the Home Assistant logs.
          `}
        </div>
      `:U`
        <div class="not-configured">
          <div class="not-configured-row">
            <div style="flex: 1; min-width: 0;">
              This device is not linked to the SmartHomeShop integration yet.
              ${this.hass.user?.is_admin?U`
                Link it to unlock ${this._integrationFeatures(e.product_type)}.
                Sensors are detected automatically and you can tune everything afterwards in the Settings tab.
              `:U`
                Ask a Home Assistant administrator to link it and unlock ${this._integrationFeatures(e.product_type)}.
              `}
            </div>
            ${this.hass.user?.is_admin?U`
              <button class="designer-btn" style="flex-shrink: 0;" ?disabled=${this._linking} @click=${this._linkDevice}>
                <ha-icon icon="mdi:link-variant" style="--mdc-icon-size: 16px;"></ha-icon>
                ${this._linking?"Linking...":"Link now"}
              </button>
            `:K}
          </div>
          ${this._linkError?U`<div class="link-error">${this._linkError}</div>`:K}
        </div>
      `:K}

      <div class="detail-tabs">
        <button class="detail-tab ${"overview"===this._detailTab?"active":""}" @click=${()=>{this._detailTab="overview"}}>
          <ha-icon icon="mdi:view-dashboard-outline"></ha-icon>
          Overview
        </button>
        <button class="detail-tab ${"automations"===this._detailTab?"active":""}" @click=${()=>{this._detailTab="automations"}}>
          <ha-icon icon="mdi:robot-outline"></ha-icon>
          Automations
        </button>
        <button class="detail-tab ${"settings"===this._detailTab?"active":""}" @click=${()=>{this._detailTab="settings"}}>
          <ha-icon icon="mdi:tune"></ha-icon>
          Settings
        </button>
      </div>

      ${"overview"===this._detailTab&&a?U`
        <shs-ha-energy-sync
          .hass=${this.hass}
          .deviceId=${e.id}
          .deviceName=${e.name}
          .deviceEntities=${e.entities||[]}
          compact>
        </shs-ha-energy-sync>
        <div style="height: 16px;"></div>
      `:K}

      ${"automations"===this._detailTab?U`
        <shs-automations-page
          .hass=${this.hass}
          .deviceId=${e.id}
          .deviceName=${e.name}
          .productType=${e.product_type||""}
          @open-device-settings=${()=>{this._detailTab="settings"}}
        ></shs-automations-page>
      `:"settings"===this._detailTab?U`
        <shs-settings-page .hass=${this.hass} .selectedDeviceId=${e.id} embedded></shs-settings-page>
      `:c?U`
        <div class="insight-card offline-detail-card">
          <ha-icon icon="mdi:lan-disconnect"></ha-icon>
          <div style="flex: 1; min-width: 0;">
            <div class="offline-detail-title">Device is offline</div>
            <div class="offline-detail-sub">
              Live insights resume automatically when it reconnects.
              ${l?U`Last seen ${this._relativeTime(l)}. `:K}
              Check the power supply and Wi-Fi connection.
            </div>
          </div>
          <a class="designer-btn" style="text-decoration: none; flex-shrink: 0;" href="/config/devices/device/${e.id}">
            <ha-icon icon="mdi:open-in-new" style="--mdc-icon-size: 16px;"></ha-icon>
            Open device
          </a>
        </div>
        ${"sensor"===t.category?U`
          <div class="insight-card" style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: var(--primary-text-color);">Room Designer</div>
              <div style="font-size: 12.5px; color: var(--secondary-text-color); margin-top: 2px;">Draw the room, place sensors and configure zones and entry lines for this device.</div>
            </div>
            <button class="designer-btn" @click=${()=>this.dispatchEvent(new CustomEvent("navigate",{detail:{page:"zones"}}))}>
              <ha-icon icon="mdi:floor-plan" style="--mdc-icon-size: 16px;"></ha-icon>
              Open
            </button>
          </div>
        `:K}
      `:U`

      ${o?U`
        <div class="section-heading"><ha-icon icon="mdi:water" style="color: #0096c7;"></ha-icon>Water</div>
        <div class="chips-row">
          <div class="chip-card">
            <div class="chip-label">Flow now</div>
            <div class="chip-value ${o.flow_rate>.2?"good":""}">${(o.flow_rate??0).toFixed(1)} <span class="unit">L/min</span></div>
          </div>
          <div class="chip-card">
            <div class="chip-label">Today</div>
            <div class="chip-value">${Math.round(o.today_usage??0)} <span class="unit">L</span></div>
          </div>
          ${null!=o.water_cost_today?U`
            <div class="chip-card">
              <div class="chip-label">Cost today</div>
              <div class="chip-value">€ ${o.water_cost_today.toFixed(2)}</div>
            </div>
          `:K}
          ${null!=o.usage_vs_average?U`
            <div class="chip-card">
              <div class="chip-label">vs 7-day average</div>
              <div class="chip-value ${o.usage_vs_average>25?"warn":o.usage_vs_average<0?"good":""}">${o.usage_vs_average>0?"+":""}${o.usage_vs_average} <span class="unit">%</span></div>
            </div>
          `:K}
        </div>

        <div class="insight-card">
          <div class="insight-title">
            Live flow <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color);">last 20 min</span>
          </div>
          ${this._renderLineChart(o.flow_history,o.flow_rate??0,"#0096c7","L/min",1)}
        </div>

        <div class="detail-grid">
          <div class="insight-card">
            <div class="insight-title">
              Leak detection
              ${r?.is_leak_likely?U`<span class="insight-badge alert">Possible leak</span>`:U`<span class="insight-badge ok">No leak</span>`}
            </div>
            ${r?U`
              ${[["Continuous flow",r.continuous_flow_score],["Night usage",r.night_usage_score],["Micro leak",r.micro_leak_score],["Pattern anomaly",r.pattern_anomaly_score]].map(([e,t])=>U`
                <div class="score-row">
                  <span class="score-label">${e}</span>
                  <div class="score-track"><div class="score-fill ${this._scoreClass(Number(t))}" style="width: ${Math.min(100,Number(t))}%"></div></div>
                  <span class="score-value">${Math.round(Number(t))}</span>
                </div>
              `)}
              <div class="score-row" style="margin-top: 10px;">
                <span class="score-label" style="font-weight: 600; color: var(--primary-text-color);">Total score</span>
                <div class="score-track"><div class="score-fill ${this._scoreClass(r.total_score)}" style="width: ${Math.min(100,r.total_score)}%"></div></div>
                <span class="score-value">${Math.round(r.total_score)}/100</span>
              </div>
              <div class="leak-footnote">
                Each signal scores 0-100: how strongly the current water usage matches that
                leak pattern. Occasional spikes are normal - the alarm only triggers when
                the total score stays above <b>60</b>.
              </div>
            `:U`<div class="spark-empty">No leak data yet</div>`}
          </div>

          <div class="insight-card">
            <div class="insight-title">
              Baseline learning
              ${n?.is_ready?U`<span class="insight-badge ok">Ready</span>`:U`<span class="insight-badge" style="background: rgba(67, 97, 238, 0.12); color: #4361ee;">Learning</span>`}
            </div>
            ${n?U`
              <div class="score-row">
                <span class="score-label">Days learned</span>
                <div class="score-track"><div class="score-fill" style="width: ${Math.min(100,n.learning_days/Math.max(1,n.min_days_required)*100)}%"></div></div>
                <span class="score-value">${n.learning_days}/${n.min_days_required}</span>
              </div>
              <div class="session-row"><ha-icon icon="mdi:water"></ha-icon><span class="session-name">Average daily usage</span><span class="session-meta">${Math.round(n.avg_daily_usage_liters??0)} L</span></div>
            `:U`<div class="spark-empty">No baseline data yet</div>`}
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-title">
            Meter reading
            ${o.meter_initial_entity?U`
              <button class="meter-set-btn" @click=${this._toggleMeterForm}>
                <ha-icon icon="mdi:pencil" style="--mdc-icon-size: 14px;"></ha-icon>
                ${this._showMeterForm?"Cancel":"Set reading"}
              </button>
            `:K}
          </div>
          <div class="meter-reading-value">
            ${(o.meter_total??0).toFixed(3)} <span class="unit">m³</span>
          </div>
          ${o.meter_initial_entity?K:U`
            <div class="meter-form-help" style="margin-top: 8px;">
              Setting the meter reading is done on the device itself and requires
              the latest firmware. Update the firmware of your kit (via
              <b>Settings → Devices &amp; Services → ESPHome</b> or the update entity),
              then the <b>Set reading</b> button appears here.
            </div>
          `}
          ${this._showMeterForm?U`
            <div class="meter-form">
              <div class="meter-form-help">
                Enter the reading shown on your physical water meter (in m³, e.g. 123.456).
                It is stored on the device itself and the meter keeps counting from there -
                you only need to do this once, or when the values drift apart.
              </div>
              <div class="meter-form-row">
                <input
                  type="number"
                  inputmode="decimal"
                  step="0.001"
                  min="0"
                  placeholder="123.456"
                  .value=${this._meterInput}
                  @input=${e=>{this._meterInput=e.target.value}}
                />
                <span class="meter-form-unit">m³</span>
                <button class="meter-form-save" ?disabled=${!this._meterInputValid()} @click=${()=>this._saveMeterReading(o.meter_initial_entity)}>
                  Save
                </button>
              </div>
            </div>
          `:K}
        </div>

        ${(o.recent_sessions||[]).length>0?U`
          <div class="insight-card">
            <div class="insight-title">Recent water sessions</div>
            ${o.recent_sessions.map(e=>U`
              <div class="session-row">
                <ha-icon icon="mdi:water"></ha-icon>
                <span class="session-name">${this._fmtTime(e.ended)}</span>
                <span class="session-meta">${e.liters} L · ${e.duration_min} min</span>
              </div>
            `)}
          </div>
        `:K}
      `:K}

      ${s?U`
        <div class="section-heading"><ha-icon icon="mdi:flash" style="color: #f59e0b;"></ha-icon>Energy</div>
        <div class="chips-row">
          ${null!=s.power_w?U`
            <div class="chip-card">
              <div class="chip-label">Power now</div>
              <div class="chip-value">${Math.round(s.power_w)} <span class="unit">W</span></div>
            </div>
          `:K}
          ${null!=s.cost_today?U`
            <div class="chip-card">
              <div class="chip-label">Energy cost today</div>
              <div class="chip-value">€ ${s.cost_today.toFixed(2)}</div>
            </div>
          `:K}
          ${null!=s.cost_month?U`
            <div class="chip-card">
              <div class="chip-label">This month</div>
              <div class="chip-value">€ ${s.cost_month.toFixed(2)}</div>
            </div>
          `:K}
          ${null!=s.month_peak_kw?U`
            <div class="chip-card">
              <div class="chip-label">Month peak</div>
              <div class="chip-value">${s.month_peak_kw.toFixed(2)} <span class="unit">kW</span></div>
            </div>
          `:K}
        </div>

        <div class="insight-card">
          <div class="insight-title">
            Live power <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color);">last 20 min</span>
          </div>
          ${this._renderLineChart(s.power_history,s.power_w??0,"#f59e0b","W",0)}
        </div>

        <div class="detail-grid">
          <div class="insight-card">
            <div class="insight-title">Standby power</div>
            ${null!=s.standby_w?U`
              <div class="session-row"><ha-icon icon="mdi:power-sleep"></ha-icon><span class="session-name">Always-on usage</span><span class="session-meta">${s.standby_w} W</span></div>
              ${null!=s.standby_cost_year?U`
                <div class="session-row"><ha-icon icon="mdi:currency-eur"></ha-icon><span class="session-name">Estimated cost per year</span><span class="session-meta">€ ${Math.round(s.standby_cost_year)}</span></div>
              `:K}
            `:U`<div class="spark-empty">Measured tonight between 02:00 and 05:00</div>`}
          </div>

          <div class="insight-card">
            <div class="insight-title">Phase load</div>
            ${s.phase_currents&&Object.keys(s.phase_currents).length>0?U`
              ${Object.entries(s.phase_currents).map(([e,t])=>U`
                <div class="score-row">
                  <span class="score-label">${e}</span>
                  <div class="score-track"><div class="score-fill ${Number(t)>20?"warn":""}" style="width: ${Math.min(100,Number(t)/25*100)}%"></div></div>
                  <span class="score-value">${Number(t).toFixed(1)}A</span>
                </div>
              `)}
              ${null!=s.phase_max_load_pct?U`
                <div class="session-row" style="margin-top: 8px;"><ha-icon icon="mdi:speedometer"></ha-icon><span class="session-name">Highest load vs main fuse</span><span class="session-meta">${s.phase_max_load_pct}%</span></div>
              `:K}
            `:U`<div class="spark-empty">No phase data available</div>`}
          </div>
        </div>
      `:K}

      ${i?.flows?Object.entries(i.flows).map(([e,t],i)=>{const o=t.leak_score;return U`
          <div class="section-heading"><ha-icon icon="mdi:water" style="color: #0096c7;"></ha-icon>Water line ${i+1}</div>
          <div class="chips-row">
            <div class="chip-card">
              <div class="chip-label">Flow now</div>
              <div class="chip-value ${Number(t.flow_rate)>.2?"good":""}">${null!=t.flow_rate?Number(t.flow_rate).toFixed(1):"-"} <span class="unit">L/min</span></div>
            </div>
            ${null!=t.today_usage?U`
              <div class="chip-card">
                <div class="chip-label">Today</div>
                <div class="chip-value">${Math.round(t.today_usage)} <span class="unit">L</span></div>
              </div>
            `:K}
            <div class="chip-card">
              <div class="chip-label">Total</div>
              <div class="chip-value">${null!=t.total?Number(t.total).toFixed(2):"-"} <span class="unit">m³</span></div>
            </div>
          </div>

          <div class="insight-card">
            <div class="insight-title">
              Live flow <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color);">last 20 min</span>
            </div>
            ${this._renderLineChart(t.flow_history,t.flow_rate??0,"#0096c7","L/min",1)}
          </div>

          <div class="detail-grid">
            <div class="insight-card">
              <div class="insight-title">
                Leak detection
                ${o?.is_leak_likely?U`<span class="insight-badge alert">Possible leak</span>`:U`<span class="insight-badge ok">No leak</span>`}
              </div>
              ${o?U`
                <div class="score-row">
                  <span class="score-label" style="font-weight: 600; color: var(--primary-text-color);">Total score</span>
                  <div class="score-track"><div class="score-fill ${this._scoreClass(o.total_score)}" style="width: ${Math.min(100,o.total_score)}%"></div></div>
                  <span class="score-value">${Math.round(o.total_score)}/100</span>
                </div>
                <div class="leak-footnote">
                  How strongly this line's usage matches a leak pattern right now -
                  the alarm only triggers above <b>60</b>.
                </div>
              `:U`<div class="spark-empty">No leak data yet</div>`}
            </div>

            <div class="insight-card">
              <div class="insight-title">
                Baseline learning
                ${t.baseline?.is_ready?U`<span class="insight-badge ok">Ready</span>`:U`<span class="insight-badge" style="background: rgba(67, 97, 238, 0.12); color: #4361ee;">Learning</span>`}
              </div>
              ${t.baseline?U`
                <div class="score-row">
                  <span class="score-label">Days learned</span>
                  <div class="score-track"><div class="score-fill" style="width: ${Math.min(100,t.baseline.learning_days/Math.max(1,t.baseline.min_days_required)*100)}%"></div></div>
                  <span class="score-value">${t.baseline.learning_days}/${t.baseline.min_days_required}</span>
                </div>
                ${t.last_session?U`
                  <div class="session-row"><ha-icon icon="mdi:water"></ha-icon><span class="session-name">Last session ${this._fmtTime(t.last_session.ended)}</span><span class="session-meta">${t.last_session.liters} L · ${t.last_session.duration_min} min</span></div>
                `:K}
              `:U`<div class="spark-empty">No baseline data yet</div>`}
            </div>
          </div>
        `}):K}

      ${i?.room&&this._hasRoomReadings(i.room)?U`
        <div class="detail-grid">
          <div class="insight-card">
            <div class="insight-title">
              Room quality
              ${null!=i.room.score?U`
                <span class="status-badge" style="background: ${i.room.color}22; color: ${i.room.color};">${i.room.label}</span>
              `:K}
            </div>
            ${null!=i.room.score?U`
              <div class="room-score-big">
                <span class="room-score-num" style="color: ${i.room.color};">${Number(i.room.score).toFixed(1)}</span>
                <span class="session-meta">/ 10 · ${i.room.score_percentage}%</span>
              </div>
            `:U`
              <div class="session-meta" style="margin: 8px 0;">
                ${(i.room.sensors_present||[]).length?"No readings right now, so there is no score. It returns when the sensors report again.":"This model has no air-quality sensors, so there is no score to show."}
              </div>
            `}
            ${null==i.room.score?K:(i.room.recommendations||[]).length>0?i.room.recommendations.map(e=>U`
                  <div class="reco-row"><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon>${e}</div>
                `):U`
                  <div class="reco-row" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">
                    <ha-icon icon="mdi:check-circle" style="color: #22c55e;"></ha-icon>All values optimal
                  </div>
                `}
          </div>

          <div class="insight-card">
            <div class="insight-title">Climate breakdown</div>
            ${(i.room.metrics||[]).filter(e=>null!=e.value).map(e=>U`
              <div class="metric-row">
                <span class="metric-label">${e.label}</span>
                <span class="metric-value">${Number(e.value).toFixed("temperature"===e.key?1:0)} ${e.unit}</span>
                <span class="status-badge ${this._statusClass(e.status)}">${e.status}</span>
              </div>
            `)}
            ${null!=i.room.illuminance?U`
              <div class="metric-row">
                <span class="metric-label">Illuminance</span>
                <span class="metric-value">${Math.round(i.room.illuminance)} lx</span>
                <span class="status-badge"></span>
              </div>
            `:K}
          </div>
        </div>
      `:K}

      ${i?.radar?U`
        <div class="chips-row">
          ${void 0!==i.radar.presence?U`
            <div class="chip-card">
              <div class="chip-label">Presence</div>
              <div class="chip-value ${i.radar.presence?"good":""}">${i.radar.presence?"Detected":"Clear"}</div>
            </div>
          `:K}
          ${null!=i.radar.target_count?U`
            <div class="chip-card">
              <div class="chip-label">Targets</div>
              <div class="chip-value">${Math.round(i.radar.target_count)}</div>
            </div>
          `:K}
          ${null!=i.radar.people_count?U`
            <div class="chip-card">
              <div class="chip-label">People count</div>
              <div class="chip-value">${Math.round(i.radar.people_count)}</div>
            </div>
          `:K}
          ${i.radar.last_crossing&&"none"!==i.radar.last_crossing?U`
            <div class="chip-card">
              <div class="chip-label">Last crossing</div>
              <div class="chip-value ${"in"===i.radar.last_crossing?"good":""}">${"in"===i.radar.last_crossing?"In":"Out"}</div>
            </div>
          `:K}
        </div>

        ${(i.radar.zones||[]).length>0?U`
          <div class="insight-card">
            <div class="insight-title">LD2450 zones</div>
            ${i.radar.zones.map(e=>{const t=[null!=e.target_count?`${Math.round(e.target_count)} total`:"",null!=e.still_target_count?`${Math.round(e.still_target_count)} still`:"",null!=e.moving_target_count?`${Math.round(e.moving_target_count)} moving`:""].filter(Boolean).join(" / ");return U`
                <div class="metric-row">
                  <span class="metric-label">Zone ${e.zone}</span>
                  <span class="metric-value">${t}</span>
                  <span class="status-badge ${e.occupied?"ok":""}">${e.occupied?"Occupied":"Empty"}</span>
                </div>
              `})}
          </div>
        `:K}

        <div class="insight-card" style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div>
            <div style="font-size: 14px; font-weight: 600; color: var(--primary-text-color);">Room Designer</div>
            <div style="font-size: 12.5px; color: var(--secondary-text-color); margin-top: 2px;">Draw the room, place sensors and configure zones and entry lines for this device.</div>
          </div>
          <button class="designer-btn" @click=${()=>this.dispatchEvent(new CustomEvent("navigate",{detail:{page:"zones"}}))}>
            <ha-icon icon="mdi:floor-plan" style="--mdc-icon-size: 16px;"></ha-icon>
            Open
          </button>
        </div>
      `:K}

      ${o||s||i?.room||i?.radar||i?.flows&&Object.keys(i.flows).length>0||!i||!1===i.configured?K:U`
        <div class="insight-card">
          <div class="insight-title">Live values</div>
          ${this._renderDeviceSensors(e)}
        </div>
      `}
      `}
    `}_getProductConfig(e){return De[e||""]||{icon:"mdi:devices",category:"other",color:"#4361ee"}}_renderProductIcon(e){return e.asset?U`<span class="product-icon" style="--product-icon: url('${e.asset}')" aria-hidden="true"></span>`:U`<ha-icon icon="${e.icon}"></ha-icon>`}_integrationFeatures(e){switch(e){case"waterp1meterkit":return"water monitoring, leak detection, energy costs and insights";case"watermeterkit":case"waterflowkit":return"water monitoring, leak detection and usage insights";case"p1meterkit":return"energy monitoring, dynamic tariffs, costs and smart schedules";case"ultimatesensor":case"ultimatesensor_mini":case"ceilsense":return"device insights and automations";default:return"product insights and automations"}}_hasRoomReadings(e){return null!=e.score||null!=e.illuminance||(e.metrics||[]).some(e=>null!=e.value)}_getSensorEntity(e,t){if(!e)return;const i=e.filter(e=>(e.entity_id.startsWith("sensor.")||e.entity_id.startsWith("binary_sensor."))&&!Ce.NON_MEASUREMENT_WORDS.some(t=>e.entity_id.toLowerCase().includes(t))).sort((e,t)=>{const i=e=>e.startsWith("sensor.")?0:1;return i(e.entity_id)-i(t.entity_id)||e.entity_id.localeCompare(t.entity_id)});for(const e of t){const t=e.toLowerCase(),o=i.find(e=>e.entity_id.toLowerCase().endsWith(`_${t}`));if(o)return o}for(const e of t){const t=e.toLowerCase(),o=i.find(e=>e.entity_id.toLowerCase().includes(`_${t}`));if(o)return o}}_getSensorValue(e,t){const i=this._getSensorEntity(e,Array.isArray(t)?t:[t]);return i&&i.state&&"unavailable"!==i.state&&"unknown"!==i.state?i.state:null}_getSensorNumber(e,t){const i=this._getSensorEntity(e,t);if(!i||!i.state||"unavailable"===i.state||"unknown"===i.state)return null;const o=Number(i.state);return Number.isFinite(o)?o:null}_getPowerWatts(e,t){const i=this._getSensorEntity(e,t);if(!i||!i.state||"unavailable"===i.state||"unknown"===i.state)return null;const o=Number(i.state);if(!Number.isFinite(o))return null;const s=String(i.attributes?.unit_of_measurement||"").toLowerCase();return"mw"===s?1e6*o:"kw"===s?1e3*o:o}_formatPowerMetric(e){if(null===e)return"-";const t=Math.abs(e);return t>=1e3?`${(t/1e3).toFixed(t>=1e4?1:2)} kW`:`${Math.round(t)} W`}_formatEnergyMetric(e){if(null===e)return"-";const t=Math.abs(e)>=100?0:Math.abs(e)>=10?1:2;return`${e.toFixed(t)} kWh`}_sumAvailable(e){const t=e.filter(e=>null!==e);return t.length?t.reduce((e,t)=>e+t,0):null}_formatValue(e,t,i=1){if(null===e)return"-";const o=parseFloat(e);return isNaN(o)?e:`${o.toFixed(i)}${t}`}_renderDeviceSensors(e){const t=this._getProductConfig(e.product_type),i=e.entities||[];if("waterp1meterkit"===e.product_type){const e=this._getSensorValue(i,["current_water_usage_cc","water_current_usage","current_flow_rate","flow_rate"]),t=this._getSensorValue(i,["usage_today_cc","water_daily_cc","today_usage","water_daily"]),o=this._getPowerWatts(i,["net_grid_power_cc","net_grid_power"]),s=this._getPowerWatts(i,["power_consumed"]),r=this._getPowerWatts(i,["power_produced"]),n=o??(null===s&&null===r?null:(s||0)-(r||0)),a=this._sumAvailable([this._getSensorNumber(i,["energy_daily_t1_cc"]),this._getSensorNumber(i,["energy_daily_t2_cc"])]),c=this._sumAvailable([this._getSensorNumber(i,["energy_consumed_tariff_1"]),this._getSensorNumber(i,["energy_consumed_tariff_2"])]),l=a??c;return U`
        <div class="sensor-grid combined">
          <div class="sensor-item water-metric">
            <ha-icon class="sensor-icon" icon="mdi:water"></ha-icon>
            <span class="sensor-value">${this._formatValue(e," L/m")}</span>
            <div class="sensor-label">Flow</div>
          </div>
          <div class="sensor-item water-metric">
            <ha-icon class="sensor-icon" icon="mdi:calendar-today"></ha-icon>
            <span class="sensor-value">${this._formatValue(t," L",0)}</span>
            <div class="sensor-label">Water today</div>
          </div>
          <div class="sensor-item energy-metric">
            <ha-icon class="sensor-icon" icon=${null!==n&&n<0?"mdi:transmission-tower-export":"mdi:transmission-tower-import"}></ha-icon>
            <span class="sensor-value">${this._formatPowerMetric(n)}</span>
            <div class="sensor-label">${null!==n&&n<0?"Export now":"Import now"}</div>
          </div>
          <div class="sensor-item energy-metric">
            <ha-icon class="sensor-icon" icon="mdi:lightning-bolt"></ha-icon>
            <span class="sensor-value">${this._formatEnergyMetric(l)}</span>
            <div class="sensor-label">${null!==a?"Energy today":"Energy total"}</div>
          </div>
        </div>
      `}if("water"===t.category){const e=this._getSensorValue(i,["current_water_usage_cc","water_current_usage","flow_rate","flow"]),t=this._getSensorValue(i,["water_meter_total","water_total_consumption","total_consumption","total"]),o=this._getSensorValue(i,["water_daily_cc","usage_today_cc","daily"]);return U`
        <div class="sensor-grid">
          <div class="sensor-item water-metric">
            <ha-icon class="sensor-icon" icon="mdi:water"></ha-icon>
            <span class="sensor-value">${this._formatValue(e," L/m")}</span>
            <div class="sensor-label">Flow</div>
          </div>
          <div class="sensor-item water-metric">
            <ha-icon class="sensor-icon" icon="mdi:counter"></ha-icon>
            <span class="sensor-value">${this._formatValue(t," L",0)}</span>
            <div class="sensor-label">Total</div>
          </div>
          <div class="sensor-item water-metric">
            <ha-icon class="sensor-icon" icon="mdi:calendar-today"></ha-icon>
            <span class="sensor-value">${this._formatValue(o," L",0)}</span>
            <div class="sensor-label">Today</div>
          </div>
        </div>
      `}if("sensor"===t.category){const t=this._getSensorValue(i,["scd41_temperature","scd4x_temperature","sht4x_temperature","bme280_temperature","temperature"]),o=this._getSensorValue(i,["scd41_humidity","scd4x_humidity","sht4x_humidity","bme280_humidity","humidity"]),s=this._getSensorValue(i,["scd41_co2","scd4x_co2","co2"]),r=this._getSensorValue(i,["bh1750_illuminance","illuminance","lux"]),n=this._getSensorValue(i,"presence")||this._getSensorValue(i,"occupancy"),a=[];t&&a.push({icon:"mdi:thermometer",value:this._formatValue(t,"°C"),label:"Temp",metricClass:"temperature-metric"}),o&&a.push({icon:"mdi:water-percent",value:this._formatValue(o,"%",0),label:"Humidity",metricClass:"humidity-metric"}),s&&a.push({icon:"mdi:molecule-co2",value:this._formatValue(s," ppm",0),label:"CO₂",metricClass:"air-metric"}),r&&a.push({icon:"mdi:brightness-6",value:this._formatValue(r," lx",0),label:"Light",metricClass:"light-metric"}),n&&a.push({icon:"mdi:motion-sensor",value:"on"===n?"Yes":"No",label:"Motion",metricClass:"presence-metric"});const c=a.slice(0,3);return 0===c.length?U`
          <div class="sensor-grid">
            <div class="sensor-item" style="grid-column: span 3;">
              <span class="sensor-value">${e.entity_count}</span>
              <div class="sensor-label">Entities</div>
            </div>
          </div>
        `:U`
        <div class="sensor-grid">
          ${c.map(e=>U`
            <div class="sensor-item ${e.metricClass}">
              <ha-icon class="sensor-icon" icon="${e.icon}"></ha-icon>
              <span class="sensor-value">${e.value}</span>
              <div class="sensor-label">${e.label}</div>
            </div>
          `)}
        </div>
      `}if("energy"===t.category){const e=this._getSensorValue(i,["power_consumed","net_grid_power_cc","power"]),t=this._getSensorValue(i,["energy_consumed_tariff_1","energy_consumed","energy"])||this._getSensorValue(i,["water_total_consumption","total_consumption","total"]),o=this._getSensorValue(i,["voltage_phase_1","voltage"]);return U`
        <div class="sensor-grid">
          <div class="sensor-item energy-metric">
            <ha-icon class="sensor-icon" icon="mdi:flash"></ha-icon>
            <span class="sensor-value">${this._formatValue(e," W",0)}</span>
            <div class="sensor-label">Power</div>
          </div>
          <div class="sensor-item energy-metric">
            <ha-icon class="sensor-icon" icon="mdi:lightning-bolt"></ha-icon>
            <span class="sensor-value">${this._formatValue(t," kWh")}</span>
            <div class="sensor-label">Energy</div>
          </div>
          <div class="sensor-item voltage-metric">
            <ha-icon class="sensor-icon" icon="mdi:sine-wave"></ha-icon>
            <span class="sensor-value">${this._formatValue(o," V",0)}</span>
            <div class="sensor-label">Voltage</div>
          </div>
        </div>
      `}return U`
      <div class="sensor-grid">
        <div class="sensor-item" style="grid-column: span 3;">
          <span class="sensor-value">${e.entity_count}</span>
          <div class="sensor-label">Entities</div>
        </div>
      </div>
    `}render(){return this._loading?U`
        <div class="loading">
          <ha-circular-progress active></ha-circular-progress>
          <span class="loading-text">Loading devices...</span>
        </div>
      `:this._detailDevice?this._renderDetail():U`
      ${0===this._devices.length?U`
        <div class="empty-state">
          <ha-icon icon="mdi:package-variant"></ha-icon>
          <h3>No SmartHomeShop devices found</h3>
          <p>Connect your SmartHomeShop.io devices via ESPHome, then add this integration via Settings → Devices & Services</p>
        </div>
      `:U`
        <!-- Devices Section -->
        <div class="section-header">
          <h2 class="section-title">
            Devices
            <span class="section-count">${this._devices.length}</span>
          </h2>
          <a href="https://smarthomeshop.io" target="_blank" rel="noopener" class="shop-link">
            smarthomeshop.io
            <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
        </div>

        <div class="devices-grid">
          ${this._devices.map(e=>{const t=this._getProductConfig(e.product_type);return U`
              <div
                class="device-card ${this.selectedDeviceId===e.id?"selected":""} ${!1===e.online?"offline":""}"
                @click=${()=>{this._selectDevice(e),this._openDetail(e)}}
              >
                <div class="device-header">
                  <div class="device-icon" style="background: ${t.color}1f; color: ${t.color}">
                    ${this._renderProductIcon(t)}
                  </div>
                  <div class="device-info">
                    <h3 class="device-name">${e.name}</h3>
                    <div class="device-type">
                      <span class="device-type-badge ${t.category}">${t.category}</span>
                      ${"waterp1meterkit"===e.product_type?U`
                        <span class="device-type-badge energy">energy</span>
                      `:K}
                      ${e.product_name||"Unknown"}
                    </div>
                  </div>
                  ${!1===e.online?U`
                    <div style="text-align: right;">
                      <span class="offline-badge">Offline</span>
                      ${e.last_seen?U`
                        <div class="last-seen" title=${new Date(e.last_seen).toLocaleString()}>
                          ${this._relativeTime(e.last_seen)}
                        </div>
                      `:K}
                    </div>
                  `:U`<span class="online-dot" title="Online"></span>`}
                </div>
                ${this._renderDeviceSensors(e)}
              </div>
            `})}
        </div>
      `}

      <!-- Tools -->
      <div class="section-header">
        <h2 class="section-title">Tools</h2>
      </div>
      <div class="tools-list">
        <button class="tool-row" @click=${()=>this._navigateTo("zones")}>
          <span class="tool-icon"><ha-icon icon="mdi:floor-plan"></ha-icon></span>
          <span class="tool-text">
            <span class="tool-title">Room Designer</span>
            <p class="tool-desc">Draw your room, place sensors and configure zones and entry lines</p>
          </span>
          <ha-icon class="tool-chevron" icon="mdi:chevron-right"></ha-icon>
        </button>
        <button class="tool-row" @click=${()=>this._navigateTo("energy")}>
          <span class="tool-icon energy"><ha-icon icon="mdi:lightning-bolt"></ha-icon></span>
          <span class="tool-text">
            <span class="tool-title">Energy</span>
            <p class="tool-desc">Monitor live energy, dynamic prices, solar, batteries and smart control</p>
          </span>
          <ha-icon class="tool-chevron" icon="mdi:chevron-right"></ha-icon>
        </button>
      </div>
    `}};Ee.styles=n`
    :host {
      display: block;
      max-width: 1100px;
      margin: 0 auto;
      --shs-primary: #4361ee;
    }

    /* Section Headers */
    .section-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin: 0 0 12px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 0;
    }

    .section-count {
      font-size: 13px;
      font-weight: 400;
      color: var(--secondary-text-color);
      margin-left: 8px;
    }

    .shop-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--shs-primary);
      text-decoration: none;
    }

    .shop-link:hover {
      text-decoration: underline;
    }

    .shop-link ha-icon {
      --mdc-icon-size: 14px;
    }

    /* Device Grid */
    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    /* Device Card */
    .device-card {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
      cursor: pointer;
    }

    .device-card:hover,
    .device-card.selected {
      border-color: var(--shs-primary);
    }

    .device-card.selected {
      box-shadow: inset 0 0 0 1px var(--shs-primary);
    }

    .device-header {
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .device-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .device-icon ha-icon {
      --mdc-icon-size: 22px;
    }

    .product-icon {
      display: block;
      width: 24px;
      height: 24px;
      background: currentColor;
      -webkit-mask: var(--product-icon) center / contain no-repeat;
      mask: var(--product-icon) center / contain no-repeat;
    }

    .device-info {
      flex: 1;
      min-width: 0;
    }

    .device-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 0 0 3px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .device-type {
      font-size: 12.5px;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .device-type-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .device-type-badge.water {
      background: rgba(0, 150, 199, 0.12);
      color: #0096c7;
    }

    .device-type-badge.sensor {
      background: rgba(67, 97, 238, 0.12);
      color: #4361ee;
    }

    .device-type-badge.energy {
      background: rgba(247, 37, 133, 0.12);
      color: #f72585;
    }

    .online-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
    }

    .offline-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
    }

    .last-seen {
      font-size: 11.5px;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .device-card.offline .device-icon,
    .device-card.offline .sensor-grid {
      filter: grayscale(1);
      opacity: 0.55;
    }

    /* Sensor Data Grid */
    .sensor-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: var(--divider-color);
      border-top: 1px solid var(--divider-color);
    }

    .sensor-grid.combined {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .sensor-item {
      background: var(--card-background-color);
      padding: 12px 8px;
      text-align: center;
    }

    .sensor-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text-color);
      display: block;
    }

    .sensor-label {
      font-size: 10px;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }

    .sensor-icon {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }

    .sensor-item.water-metric .sensor-icon,
    .sensor-item.humidity-metric .sensor-icon { color: #0096c7; }
    .sensor-item.energy-metric .sensor-icon,
    .sensor-item.temperature-metric .sensor-icon { color: #e58b0a; }
    .sensor-item.air-metric .sensor-icon { color: #16a06b; }
    .sensor-item.light-metric .sensor-icon { color: #d6a20d; }
    .sensor-item.presence-metric .sensor-icon { color: #7c5bd6; }
    .sensor-item.voltage-metric .sensor-icon { color: #4361ee; }


    /* Tools */
    .tools-list {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
    }

    .tool-row {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 14px 16px;
      border: none;
      background: none;
      text-align: left;
      font-family: inherit;
      cursor: pointer;
    }

    .tool-row + .tool-row {
      border-top: 1px solid var(--divider-color);
    }

    .tool-row:hover {
      background: var(--secondary-background-color);
    }

    .tool-icon {
      display: flex;
      color: var(--shs-primary);
      --mdc-icon-size: 22px;
      flex-shrink: 0;
    }

    .tool-icon.energy {
      color: #e58b0a;
    }

    .tool-text {
      flex: 1;
      min-width: 0;
    }

    .tool-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color);
      margin: 0 0 2px 0;
    }

    .tool-desc {
      font-size: 12.5px;
      color: var(--secondary-text-color);
      margin: 0;
    }

    .tool-chevron {
      color: var(--secondary-text-color);
      --mdc-icon-size: 20px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      border: 1px dashed var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      margin-bottom: 32px;
    }

    .empty-state ha-icon {
      --mdc-icon-size: 40px;
      color: var(--secondary-text-color);
      margin-bottom: 12px;
    }

    .empty-state h3 {
      font-size: 16px;
      color: var(--primary-text-color);
      margin: 0 0 8px 0;
    }

    .empty-state p {
      color: var(--secondary-text-color);
      margin: 0 auto;
      font-size: 13.5px;
      max-width: 460px;
      line-height: 1.5;
    }

    /* Device detail */
    .detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .back-btn { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid var(--divider-color); border-radius: 10px; background: none; color: var(--primary-text-color); font-size: 13px; font-family: inherit; cursor: pointer; }
    .back-btn:hover { border-color: var(--shs-primary); }
    .detail-title { flex: 1; min-width: 0; }
    .detail-name { font-size: 17px; font-weight: 600; color: var(--primary-text-color); }
    .detail-sub { font-size: 12.5px; color: var(--secondary-text-color); }
    .chips-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .chip-card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); padding: 12px 14px; }
    .chip-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--secondary-text-color); }
    .chip-value { margin-top: 4px; font-size: 20px; font-weight: 600; color: var(--primary-text-color); }
    .chip-value .unit { font-size: 12px; font-weight: 500; color: var(--secondary-text-color); }
    .chip-value.good { color: #22c55e; }
    .chip-value.warn { color: #f59e0b; }
    .chip-value.bad { color: #ef4444; }
    .insight-card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); padding: 16px; margin-bottom: 16px; }
    .insight-title { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 600; color: var(--primary-text-color); margin-bottom: 12px; }
    .insight-badge { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; }
    .meter-set-btn { display: inline-flex; align-items: center; gap: 4px; background: none; border: 1px solid var(--divider-color); border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 500; color: var(--shs-primary, #4361ee); cursor: pointer; }
    .meter-set-btn:hover { border-color: var(--shs-primary, #4361ee); }
    .meter-reading-value { font-size: 28px; font-weight: 700; color: var(--primary-text-color); font-variant-numeric: tabular-nums; }
    .meter-reading-value .unit { font-size: 14px; font-weight: 400; color: var(--secondary-text-color); }
    .meter-form { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--divider-color); }
    .meter-form-help { font-size: 12.5px; line-height: 1.5; color: var(--secondary-text-color); margin-bottom: 10px; }
    .meter-form-row { display: flex; align-items: center; gap: 8px; }
    .meter-form-row input { flex: 1; min-width: 0; background: var(--secondary-background-color); border: 1px solid var(--divider-color); border-radius: 8px; padding: 10px 12px; font-size: 15px; color: var(--primary-text-color); outline: none; }
    .meter-form-row input:focus { border-color: var(--shs-primary, #4361ee); }
    .meter-form-unit { font-size: 13px; color: var(--secondary-text-color); }
    .meter-form-save { background: var(--shs-primary, #4361ee); color: #fff; border: none; border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .meter-form-save:disabled { opacity: 0.4; cursor: not-allowed; }
    .insight-badge.ok { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
    .insight-badge.alert { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
    .score-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .score-label { width: 130px; font-size: 12.5px; color: var(--secondary-text-color); }
    .score-track { flex: 1; height: 6px; border-radius: 3px; background: var(--divider-color); overflow: hidden; }
    .score-fill { height: 100%; border-radius: 3px; background: #22c55e; transition: width 0.4s ease; }
    .score-fill.warn { background: #f59e0b; }
    .score-fill.bad { background: #ef4444; }
    .score-value { width: 34px; text-align: right; font-size: 12px; font-weight: 600; color: var(--primary-text-color); }
    .spark-empty { font-size: 12.5px; color: var(--secondary-text-color); padding: 20px 0; text-align: center; }
    .chart-wrap { position: relative; }
    .chart-svg { width: 100%; height: 110px; display: block; }
    .chart-ylabel { position: absolute; right: 4px; font-size: 10px; color: var(--secondary-text-color); background: color-mix(in srgb, var(--card-background-color) 80%, transparent); padding: 0 4px; border-radius: 4px; pointer-events: none; }
    .chart-axis { display: flex; justify-content: space-between; font-size: 10.5px; color: var(--secondary-text-color); margin-top: 6px; }
    .section-heading { display: flex; align-items: center; gap: 8px; margin: 24px 0 12px; font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .section-heading:first-of-type { margin-top: 0; }
    .section-heading ha-icon { --mdc-icon-size: 16px; }
    .section-heading::after { content: ''; flex: 1; height: 1px; background: var(--divider-color); }
    .leak-footnote { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--divider-color); font-size: 11.5px; color: var(--secondary-text-color); line-height: 1.45; }
    .session-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-top: 1px solid var(--divider-color); font-size: 13px; }
    .session-row:first-of-type { border-top: none; }
    .session-row ha-icon { --mdc-icon-size: 18px; color: var(--shs-primary); }
    .session-name { flex: 1; color: var(--primary-text-color); text-transform: capitalize; }
    .session-meta { color: var(--secondary-text-color); font-size: 12.5px; }
    .detail-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
    @media (min-width: 900px) { .detail-grid { grid-template-columns: 1fr 1fr; } }
    .not-configured { border: 1px dashed var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); padding: 16px; font-size: 13.5px; color: var(--secondary-text-color); margin-bottom: 16px; }
    .not-configured-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .not-configured .designer-btn:disabled { opacity: 0.6; cursor: default; }
    .link-error { color: var(--error-color, #ef4444); font-size: 12.5px; margin-top: 10px; }
    .status-badge { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; background: var(--secondary-background-color); color: var(--secondary-text-color); text-transform: capitalize; }
    .status-badge.ok { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
    .status-badge.warn { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
    .status-badge.alert { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
    .metric-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-top: 1px solid var(--divider-color); font-size: 13px; }
    .metric-row:first-of-type { border-top: none; }
    .metric-label { flex: 1; color: var(--primary-text-color); }
    .metric-value { font-weight: 600; color: var(--primary-text-color); }
    .reco-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; background: rgba(245, 158, 11, 0.08); color: #b45309; font-size: 13px; margin-bottom: 6px; }
    .reco-row ha-icon { --mdc-icon-size: 16px; color: #f59e0b; }
    .room-score-big { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
    .room-score-num { font-size: 38px; font-weight: 700; line-height: 1; }
    .designer-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid var(--shs-primary); border-radius: 10px; background: transparent; color: var(--shs-primary); font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .designer-btn:hover { background: rgba(67, 97, 238, 0.08); }
    .detail-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--divider-color); margin-bottom: 16px; }
    .detail-tab { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border: none; border-bottom: 2px solid transparent; background: none; color: var(--secondary-text-color); font-size: 13.5px; font-weight: 500; font-family: inherit; cursor: pointer; margin-bottom: -1px; }
    .detail-tab ha-icon { --mdc-icon-size: 16px; }
    .detail-tab:hover { color: var(--primary-text-color); }
    .detail-tab.active { color: var(--shs-primary); border-bottom-color: var(--shs-primary); }
    .offline-detail-card { display: flex; align-items: center; gap: 14px; }
    .offline-detail-card ha-icon { --mdc-icon-size: 28px; color: var(--secondary-text-color); opacity: 0.6; flex-shrink: 0; margin-top: 2px; }
    .offline-detail-title { font-size: 14.5px; font-weight: 600; color: var(--primary-text-color); margin-bottom: 4px; }
    .offline-detail-sub { font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; }

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
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .devices-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .sensor-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .sensor-grid.combined {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,Ee.NON_MEASUREMENT_WORDS=["offset","calibrat","cpu","esp32","chip_temp","internal_temp","board_temp","bmp"],e([ge({attribute:!1})],Ee.prototype,"hass",void 0),e([ge()],Ee.prototype,"selectedDeviceId",void 0),e([me()],Ee.prototype,"_devices",void 0),e([me()],Ee.prototype,"_loading",void 0),e([me()],Ee.prototype,"_detailDevice",void 0),e([me()],Ee.prototype,"_insights",void 0),e([me()],Ee.prototype,"_showMeterForm",void 0),e([me()],Ee.prototype,"_meterInput",void 0),e([me()],Ee.prototype,"_detailTab",void 0),e([me()],Ee.prototype,"_linking",void 0),e([me()],Ee.prototype,"_linkError",void 0),Ee=Ce=e([he("shs-dashboard-page")],Ee);const Ae=["Front-left","Front-right","Back-right","Back-left"];let Ne=class extends le{constructor(){super(...arguments),this.targets=[],this.initialCorners=[],this.range=6e3,this.fov=120,this.sensorName="Selected sensor",this.mountingMode="wall",this._activeCorner=0,this._corners=[null,null,null,null],this._capturing=!1,this._capturePaused=!1,this._captureProgress=0,this._captureFrame=null,this._captureCancelled=!1,this._initialized=!1,this._hasInteracted=!1,this._initialCornersKey="",this._handleKeydown=e=>{"Escape"===e.key&&(e.preventDefault(),this._capturing?this._cancelCapture():this._cancel())}}connectedCallback(){super.connectedCallback(),this._initialized||(this._initialized=!0,this._loadInitialCorners()),window.addEventListener("keydown",this._handleKeydown)}updated(e){e.has("initialCorners")&&!this._hasInteracted&&this._loadInitialCorners()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._handleKeydown),this._cancelCapture()}get _activeTargets(){return this.targets.filter(e=>e.active&&Number.isFinite(e.x)&&Number.isFinite(e.y))}_loadInitialCorners(){const e=JSON.stringify(this.initialCorners||[]);if(e===this._initialCornersKey)return;this._initialCornersKey=e,this._corners=[0,1,2,3].map(e=>{const t=this.initialCorners[e];return t?{...t}:null});const t=this._corners.findIndex(e=>null===e);this._activeCorner=-1===t?0:t}_selectCorner(e){this._capturing||(this._hasInteracted=!0,this._activeCorner=e)}_median(e){const t=[...e].sort((e,t)=>e-t),i=Math.floor(t.length/2);return t.length%2?t[i]:(t[i-1]+t[i])/2}_startCapture(){if(1!==this._activeTargets.length||this._capturing)return;this._hasInteracted=!0,this._capturing=!0,this._capturePaused=!1,this._captureProgress=0,this._captureCancelled=!1;const e=[];let t=0,i=performance.now();const o=s=>{if(this._captureCancelled)return;const r=Math.min(250,s-i);i=s;const n=this._activeTargets;if(this._capturePaused=1!==n.length,1===n.length&&(t+=r,e.push({x:n[0].x,y:n[0].y})),this._captureProgress=Math.min(1,t/5e3),t<5e3)return void(this._captureFrame=requestAnimationFrame(o));if(this._captureFrame=null,this._capturing=!1,this._capturePaused=!1,!e.length)return;const a={x:this._median(e.map(e=>e.x)),y:this._median(e.map(e=>e.y))},c=[...this._corners];c[this._activeCorner]=a,this._corners=c;const l=c.findIndex((e,t)=>t>this._activeCorner&&null===e);if(-1!==l)this._activeCorner=l;else{const e=c.findIndex(e=>null===e);-1!==e&&(this._activeCorner=e)}};this._captureFrame=requestAnimationFrame(o)}_cancelCapture(){this._captureCancelled=!0,this._capturing=!1,this._capturePaused=!1,this._captureProgress=0,null!==this._captureFrame&&(cancelAnimationFrame(this._captureFrame),this._captureFrame=null)}_cancel(){this.dispatchEvent(new CustomEvent("calibration-cancel",{bubbles:!0,composed:!0}))}_save(){this._hasValidShape()&&this.dispatchEvent(new CustomEvent("calibration-save",{detail:{corners:this._corners.map(e=>({...e}))},bubbles:!0,composed:!0}))}_plotPoint(e){const t=Math.max(1e3,this.range);if("ceiling"===this.mountingMode)return{x:300+e.x/t*132,y:160+e.y/t*132};return{x:300+e.x/t*138,y:42+Math.max(0,e.y)/t*238}}_hasValidShape(){if(!this._corners.every(e=>null!==e))return!1;const e=this._corners;for(let t=0;t<e.length;t++)for(let i=t+1;i<e.length;i++)if(Math.hypot(e[t].x-e[i].x,e[t].y-e[i].y)<200)return!1;return Math.abs(e.reduce((t,i,o)=>{const s=e[(o+1)%e.length];return t+i.x*s.y-s.x*i.y},0))>=2e5}_renderCoveragePlot(){const e=Math.min(85,Math.max(20,this.fov/2)),t=(90+e)*Math.PI/180,i=(90-e)*Math.PI/180,o=250,s="ceiling"===this.mountingMode?{x:300,y:160}:{x:300,y:32},r=s.x+Math.cos(t)*o,n=s.y+Math.sin(t)*o,a=s.x+Math.cos(i)*o,c=s.y+Math.sin(i)*o,l=this._corners.map((e,t)=>e?{point:this._plotPoint(e),index:t}:null).filter(e=>null!==e),d=4===l.length?l.map(e=>`${e.point.x},${e.point.y}`).join(" "):"";return U`
      <div class="coverage-plot" aria-label="Live sensor coverage preview">
        <svg viewBox="0 0 600 320" role="img">
          ${"ceiling"===this.mountingMode?B`
            <circle cx="300" cy="160" r="136" class="fov" />
            <circle cx="300" cy="160" r="52" class="range-line" />
            <circle cx="300" cy="160" r="94" class="range-line" />
          `:B`
            <path
              d="M ${s.x} ${s.y} L ${r} ${n} A ${o} ${o} 0 0 0 ${a} ${c} Z"
              class="fov"
            />
            <path d="M 300 32 A 92 92 0 0 0 208 124" class="range-line" />
            <path d="M 300 32 A 170 170 0 0 0 130 202" class="range-line" />
          `}
          ${d?B`<polygon points="${d}" class="calibration-shape" />`:K}
          ${l.map(e=>B`
            <g class="marked-point">
              <circle cx="${e.point.x}" cy="${e.point.y}" r="9" />
              <text x="${e.point.x}" y="${e.point.y+4}">${e.index+1}</text>
            </g>
          `)}
          ${this._activeTargets.map(e=>{const t=this._plotPoint(e);return B`
              <g class="live-point">
                <circle cx="${t.x}" cy="${t.y}" r="11" />
                <circle cx="${t.x}" cy="${t.y}" r="19" class="pulse" />
              </g>
            `})}
          <g class="sensor-marker">
            <circle cx="${s.x}" cy="${s.y}" r="10" />
            <path d="M 294 31 L 300 38 L 306 31" />
          </g>
        </svg>
        <div class="plot-legend">
          <span><i class="legend-dot live"></i>Live target</span>
          <span><i class="legend-dot marked"></i>Saved point</span>
        </div>
      </div>
    `}render(){const e=this._activeTargets,t=this._corners.every(e=>null!==e),i=this._hasValidShape(),o=1===e.length&&!this._capturing,s=0===e.length?"No target detected. Stand where the sensor can see you.":e.length>1?"Multiple targets detected. Only one person can be in view while measuring.":`One target detected by ${this.sensorName}.`;return U`
      <div class="overlay" @mousedown="${e=>{e.target!==e.currentTarget||this._capturing||this._cancel()}}">
        <section class="wizard" role="dialog" aria-modal="true" aria-labelledby="coverage-title">
          <header>
            <div>
              <p class="eyebrow">ROOM DESIGNER</p>
              <h2 id="coverage-title">Calibrate sensor coverage</h2>
              <p class="intro">
                Walk to each edge of the area the sensor can reliably detect. Stand still and select Mark.
                Your position is averaged over 5 seconds.
              </p>
            </div>
            <button class="close-button" @click="${this._cancel}" ?disabled="${this._capturing}" aria-label="Close">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </header>

          <div class="range-notice">
            <ha-icon icon="mdi:radar"></ha-icon>
            <div>
              <strong>You are measuring the sensor, not the room</strong>
              <span>
                LD2450 and LD2460 sensors have a limited range. Mark the furthest reliable position
                the selected sensor can still see in each direction. The four points define its usable
                detection area and do not need to touch the room walls.
              </span>
            </div>
          </div>

          <div class="corner-progress" aria-label="Calibration points">
            ${Ae.map((e,t)=>U`
              <button
                class="corner-chip ${this._corners[t]?"done":""} ${this._activeCorner===t?"active":""}"
                @click="${()=>this._selectCorner(t)}"
                ?disabled="${this._capturing}"
                aria-current="${this._activeCorner===t?"step":"false"}"
              >
                <span class="corner-number">${this._corners[t]?"✓":t+1}</span>
                ${e}
              </button>
              ${t<3?U`<ha-icon class="step-arrow" icon="mdi:chevron-right"></ha-icon>`:K}
            `)}
          </div>

          <p class="current-step">
            Point ${this._activeCorner+1} of 4:
            <strong>${Ae[this._activeCorner]}</strong>
            <span>Names follow the direction shown in Room Designer.</span>
          </p>

          ${this._renderCoveragePlot()}

          <div class="target-status ${1===e.length?"ready":"warning"}" role="status">
            <span class="status-dot"></span>
            <span>${s}</span>
          </div>

          ${this._capturing?U`
            <div class="capture-panel" aria-live="polite">
              <div class="capture-copy">
                <strong>${this._capturePaused?"Measurement paused":"Stand still"}</strong>
                <span>
                  ${this._capturePaused?"Exactly one visible target is needed. The timer will continue automatically.":`Measuring ${Ae[this._activeCorner]}...`}
                </span>
              </div>
              <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"
                   aria-valuenow="${Math.round(100*this._captureProgress)}">
                <span style="transform: scaleX(${this._captureProgress})"></span>
              </div>
              <button class="text-button" @click="${this._cancelCapture}">Cancel measurement</button>
            </div>
          `:K}

          ${t?U`
            <p class="save-help">
              ${i?"All four points are ready. Select a point above to measure it again, or save this detection area.":"The measured points overlap or do not form a usable area. Select a point above and measure it again."}
            </p>
          `:K}

          <footer>
            <button class="button secondary" @click="${this._cancel}" ?disabled="${this._capturing}">Cancel</button>
            ${t?U`
              <button class="button primary" @click="${this._save}" ?disabled="${!i}">
                <ha-icon icon="mdi:content-save-outline"></ha-icon>
                Save detection area
              </button>
            `:U`
              <button class="button primary" @click="${this._startCapture}" ?disabled="${!o}">
                <ha-icon icon="mdi:map-marker-radius"></ha-icon>
                Mark ${Ae[this._activeCorner]}
              </button>
            `}
          </footer>
        </section>
      </div>
    `}};Ne.styles=n`
    :host {
      --calibration-blue: var(--primary-color, #4361ee);
      --calibration-green: #22a35a;
      --calibration-amber: #d97706;
      color: var(--primary-text-color, #172033);
    }
    * { box-sizing: border-box; }
    button { font: inherit; }
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: grid;
      place-items: center;
      padding: 24px;
      overflow-y: auto;
      background: rgba(9, 14, 25, 0.72);
    }
    .wizard {
      width: min(780px, 100%);
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      padding: clamp(22px, 4vw, 38px);
      border: 1px solid var(--divider-color, #d9dee8);
      border-radius: 18px;
      background: var(--card-background-color, #fbfcfe);
      box-shadow: 0 24px 70px rgba(4, 11, 27, 0.28);
    }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
    }
    .eyebrow {
      margin: 0 0 7px;
      color: var(--calibration-blue);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 0.09em;
    }
    h2 {
      margin: 0;
      color: var(--primary-text-color, #172033);
      font-size: clamp(23px, 4vw, 30px);
      line-height: 1.15;
      letter-spacing: -0.025em;
    }
    .intro {
      max-width: 650px;
      margin: 12px 0 0;
      color: var(--secondary-text-color, #5f6878);
      font-size: 15px;
      line-height: 1.55;
    }
    .close-button {
      display: grid;
      flex: 0 0 40px;
      width: 40px;
      height: 40px;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color, #5f6878);
      cursor: pointer;
    }
    .close-button:hover { background: var(--secondary-background-color, #eef1f6); }
    .close-button:disabled { opacity: 0.4; cursor: not-allowed; }
    .close-button ha-icon { --mdc-icon-size: 22px; }
    .range-notice {
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 13px;
      margin: 24px 0;
      padding: 15px 17px;
      border: 1px solid color-mix(in srgb, var(--calibration-amber) 34%, transparent);
      border-radius: 12px;
      background: color-mix(in srgb, var(--calibration-amber) 9%, var(--card-background-color, #fbfcfe));
    }
    .range-notice > ha-icon {
      --mdc-icon-size: 23px;
      color: var(--calibration-amber);
      margin-top: 1px;
    }
    .range-notice strong,
    .range-notice span { display: block; }
    .range-notice strong { margin-bottom: 4px; font-size: 13px; }
    .range-notice span {
      color: var(--secondary-text-color, #5f6878);
      font-size: 12.5px;
      line-height: 1.5;
    }
    .corner-progress {
      display: flex;
      align-items: center;
      gap: 7px;
      overflow-x: auto;
      padding: 2px 2px 8px;
      scrollbar-width: thin;
    }
    .corner-chip {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 7px;
      min-height: 38px;
      padding: 7px 12px 7px 8px;
      border: 1px solid var(--divider-color, #d9dee8);
      border-radius: 999px;
      background: var(--card-background-color, #fbfcfe);
      color: var(--secondary-text-color, #5f6878);
      font-size: 12px;
      font-weight: 650;
      cursor: pointer;
    }
    .corner-chip:hover { border-color: var(--calibration-blue); }
    .corner-chip.active {
      border-color: var(--calibration-blue);
      color: var(--calibration-blue);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--calibration-blue) 16%, transparent);
    }
    .corner-chip.done {
      border-color: color-mix(in srgb, var(--calibration-green) 42%, transparent);
      background: color-mix(in srgb, var(--calibration-green) 11%, var(--card-background-color, #fbfcfe));
      color: var(--calibration-green);
    }
    .corner-chip.done.active { border-color: var(--calibration-blue); color: var(--calibration-blue); }
    .corner-chip:disabled { cursor: not-allowed; }
    .corner-number {
      display: grid;
      width: 22px;
      height: 22px;
      place-items: center;
      border-radius: 50%;
      background: var(--secondary-background-color, #eef1f6);
      font-size: 11px;
    }
    .corner-chip.done .corner-number {
      background: var(--calibration-green);
      color: white;
    }
    .step-arrow {
      --mdc-icon-size: 17px;
      flex: 0 0 auto;
      color: var(--disabled-text-color, #9aa2af);
    }
    .current-step {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin: 8px 0 14px;
      color: var(--secondary-text-color, #5f6878);
      font-size: 13px;
    }
    .current-step strong { color: var(--primary-text-color, #172033); }
    .current-step span { width: 100%; font-size: 11.5px; }
    .coverage-plot {
      overflow: hidden;
      border: 1px solid var(--divider-color, #d9dee8);
      border-radius: 14px;
      background: var(--secondary-background-color, #10182b);
    }
    .coverage-plot svg {
      display: block;
      width: 100%;
      height: clamp(230px, 36vw, 330px);
    }
    .fov {
      fill: rgba(50, 106, 184, 0.18);
      stroke: #2f6fa9;
      stroke-width: 2;
    }
    .range-line {
      fill: none;
      stroke: rgba(180, 200, 229, 0.21);
      stroke-width: 2;
      stroke-dasharray: 6 7;
    }
    .calibration-shape {
      fill: rgba(245, 158, 11, 0.09);
      stroke: #f59e0b;
      stroke-width: 2;
      stroke-dasharray: 7 5;
    }
    .marked-point circle { fill: #f59e0b; stroke: white; stroke-width: 3; }
    .marked-point text {
      fill: #172033;
      font-size: 9px;
      font-weight: 800;
      text-anchor: middle;
      pointer-events: none;
    }
    .live-point circle:first-child { fill: #3498eb; stroke: white; stroke-width: 3; }
    .live-point .pulse {
      fill: none;
      stroke: #3498eb;
      stroke-width: 2;
      opacity: 0.45;
    }
    .sensor-marker circle { fill: #3498eb; stroke: white; stroke-width: 3; }
    .sensor-marker path { fill: none; stroke: white; stroke-width: 2; stroke-linecap: round; }
    .plot-legend {
      display: flex;
      gap: 18px;
      padding: 10px 14px;
      border-top: 1px solid rgba(180, 200, 229, 0.12);
      color: #b8c2d4;
      font-size: 11px;
    }
    .plot-legend span { display: inline-flex; align-items: center; gap: 6px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .legend-dot.live { background: #3498eb; }
    .legend-dot.marked { background: #f59e0b; }
    .target-status {
      display: flex;
      align-items: center;
      gap: 9px;
      min-height: 40px;
      margin-top: 12px;
      color: var(--secondary-text-color, #5f6878);
      font-size: 12.5px;
    }
    .status-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--calibration-amber); }
    .target-status.ready .status-dot { background: var(--calibration-green); }
    .capture-panel {
      margin-top: 8px;
      padding: 15px;
      border-radius: 12px;
      background: var(--secondary-background-color, #eef1f6);
    }
    .capture-copy { display: flex; justify-content: space-between; gap: 14px; font-size: 12px; }
    .capture-copy span { color: var(--secondary-text-color, #5f6878); text-align: right; }
    .progress-track {
      height: 7px;
      margin: 12px 0 8px;
      overflow: hidden;
      border-radius: 999px;
      background: color-mix(in srgb, var(--divider-color, #d9dee8) 70%, transparent);
    }
    .progress-track span {
      display: block;
      width: 100%;
      height: 100%;
      transform-origin: left;
      border-radius: inherit;
      background: var(--calibration-blue);
    }
    .text-button {
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--calibration-blue);
      font-size: 12px;
      font-weight: 650;
      cursor: pointer;
    }
    .save-help {
      margin: 13px 0 0;
      color: var(--secondary-text-color, #5f6878);
      font-size: 12px;
      line-height: 1.45;
    }
    footer {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 24px;
      padding-top: 19px;
      border-top: 1px solid var(--divider-color, #d9dee8);
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 43px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .button ha-icon { --mdc-icon-size: 18px; }
    .button.secondary {
      border: 1px solid var(--divider-color, #d9dee8);
      background: transparent;
      color: var(--secondary-text-color, #5f6878);
    }
    .button.primary {
      border: 1px solid var(--calibration-blue);
      background: var(--calibration-blue);
      color: white;
    }
    .button:disabled { opacity: 0.45; cursor: not-allowed; }
    @media (max-width: 640px) {
      .overlay { align-items: start; padding: 0; }
      .wizard {
        min-height: 100vh;
        max-height: none;
        border: 0;
        border-radius: 0;
        padding: 22px 16px 20px;
      }
      .range-notice { grid-template-columns: 28px minmax(0, 1fr); padding: 13px; }
      .corner-progress { margin-inline: -2px; }
      .step-arrow { display: none; }
      .coverage-plot svg { height: 245px; }
      .capture-copy { flex-direction: column; gap: 4px; }
      .capture-copy span { text-align: left; }
      footer { position: sticky; bottom: -20px; margin-inline: -16px; padding: 14px 16px 20px; background: var(--card-background-color, #fbfcfe); }
      .button.primary { flex: 1; }
    }
    @media (prefers-reduced-motion: no-preference) {
      .live-point .pulse { animation: target-pulse 1.5s ease-out infinite; }
      @keyframes target-pulse {
        from { transform: scale(0.65); transform-origin: center; opacity: 0.7; }
        to { transform: scale(1.35); transform-origin: center; opacity: 0; }
      }
    }
  `,e([ge({type:Array})],Ne.prototype,"targets",void 0),e([ge({type:Array})],Ne.prototype,"initialCorners",void 0),e([ge({type:Number})],Ne.prototype,"range",void 0),e([ge({type:Number})],Ne.prototype,"fov",void 0),e([ge({type:String})],Ne.prototype,"sensorName",void 0),e([ge({type:String})],Ne.prototype,"mountingMode",void 0),e([me()],Ne.prototype,"_activeCorner",void 0),e([me()],Ne.prototype,"_corners",void 0),e([me()],Ne.prototype,"_capturing",void 0),e([me()],Ne.prototype,"_capturePaused",void 0),e([me()],Ne.prototype,"_captureProgress",void 0),Ne=e([he("shs-sensor-coverage-calibration")],Ne);const We=800,Ze=400,Fe=[{id:"bed",name:"Bed",icon:"mdi:bed-double",defaultWidth:1600,defaultHeight:2e3},{id:"sofa",name:"Sofa",icon:"mdi:sofa",defaultWidth:2e3,defaultHeight:900},{id:"chair",name:"Chair",icon:"mdi:chair-rolling",defaultWidth:500,defaultHeight:500},{id:"table",name:"Table",icon:"mdi:table-furniture",defaultWidth:1200,defaultHeight:800},{id:"cabinet",name:"Cabinet",icon:"mdi:wardrobe",defaultWidth:1e3,defaultHeight:600}],Re={detection:4,exclusion:2,entry:2,interference:2},Oe={detection:{fill:"rgba(34, 197, 94, 0.2)",stroke:"#22c55e"},exclusion:{fill:"rgba(239, 68, 68, 0.2)",stroke:"#ef4444"},entry:{fill:"rgba(16, 185, 129, 0.25)",stroke:"#10b981"},interference:{fill:"rgba(245, 158, 11, 0.2)",stroke:"#f59e0b"}},Le={detection:{singular:"Detection",plural:"Detection",icon:"📍"},exclusion:{singular:"Exclusion",plural:"Exclusion",icon:"🚷"},entry:{singular:"Entry Line",plural:"Entry Lines",icon:"🚪"},interference:{singular:"Interference",plural:"Interference",icon:"⚡"}},He={default:{preset:"default",enterDelayMs:0,leaveDelayMs:1500,minDwellMs:0,minTargets:1},bed:{preset:"bed",enterDelayMs:500,leaveDelayMs:15e3,minDwellMs:1e3,minTargets:1},seating:{preset:"seating",enterDelayMs:300,leaveDelayMs:8e3,minDwellMs:750,minTargets:1},transit:{preset:"transit",enterDelayMs:0,leaveDelayMs:750,minDwellMs:0,minTargets:1}},je={enabled:!1,corners:[],gridSizeMm:100,snapToGrid:!0},Ue={smoothingEnabled:!0,smoothingAlpha:.35,maxJumpMm:1200,trackHoldMs:1200,crossZoneTracking:!0},Be=e=>{const t=e.parts?.filter(e=>Array.isArray(e)&&e.length>=3)||[];return t.length?t:e.points.length?[e.points]:[]};let qe=class extends le{constructor(){super(...arguments),this.rooms=[],this._selectedRoomId=null,this._roomPoints=[],this._furniture=[],this._doors=[],this._windows=[],this._sensors=[],this._selectedSensorIndex=null,this._draggingSensorIndex=null,this._zones=[],this._selectedZoneIndex=null,this._selectedZonePartIndex=0,this._appendToZoneIndex=null,this._calibration={...je,corners:[]},this._showCoverageCalibration=!1,this._tracking={...Ue},this._drawingZone=[],this._newZoneType="detection",this._showZoneTypePicker=!1,this._pendingZonePoints=[],this._draggingZonePointIndex=null,this._draggingDrawingPointIndex=null,this._draggingWholeZoneIndex=null,this._dragStartPos=null,this._zoneMidpointPreview=null,this._editingZoneIndex=null,this._liveTargets={},this._entryExitEnabled=!1,this._assumedPresent=!1,this._pushingToSensor=!1,this._toolMode="select",this._zoom=1,this._panOffset={x:0,y:0},this._cursorPos=null,this._saving=!1,this._isDragging=!1,this._dirty=!1,this._designMode="layout",this._pendingStart=null,this._previewPoint=null,this._wallHoverPreview=null,this._draggingPointIndex=null,this._selectedFurnitureType=null,this._showFurnitureDialog=!1,this._furnitureWidth=1e3,this._furnitureHeight=1e3,this._selectedFurnitureIndex=null,this._draggingFurnitureIndex=null,this._draggingDoorIndex=null,this._draggingWindowIndex=null,this._doorWindowPreview=null,this._showDoorDialog=!1,this._showWindowDialog=!1,this._editingDoorIndex=null,this._editingWindowIndex=null,this._selectedWallIndex=null,this._doorWidth=900,this._doorOpenDirection="inward",this._doorOpenSide="left",this._windowWidth=1200,this._windowHeight=1e3,this._windowType="open",this._showNewRoomDialog=!1,this._newRoomName="",this._newRoomWidth=0,this._newRoomLength=0,this._targetTrails={},this._targetUpdateInterval=null,this._viewMode="2d",this._camera3d={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3},this._isDragging3D=!1,this._lastMouseX=0,this._lastMouseY=0,this.WALL_HEIGHT_3D=2500,this._handleKeyDown=e=>{const t=e.composedPath()[0];if(!t||!["INPUT","SELECT","TEXTAREA"].includes(t.tagName))if("Escape"===e.key){if(this._showZoneTypePicker)return void this._cancelZoneTypePicker();if(this._showDoorDialog)return void this._hideDoorDialog();if(this._showWindowDialog)return void this._hideWindowDialog();if(this._showFurnitureDialog)return void(this._showFurnitureDialog=!1);if(this._showNewRoomDialog)return void(this._showNewRoomDialog=!1);if(this._drawingZone.length>0)return void(this._drawingZone=[]);if(this._pendingStart)return this._pendingStart=null,void(this._previewPoint=null);this._selectedZoneIndex=null,this._editingZoneIndex=null,this._selectedFurnitureIndex=null,this._selectedFurnitureType=null}else"Delete"!==e.key&&"Backspace"!==e.key||null===this._selectedFurnitureIndex?"Delete"!==e.key&&"Backspace"!==e.key||null===this._selectedZoneIndex?(e.metaKey||e.ctrlKey)&&"z"===e.key.toLowerCase()&&this._drawingZone.length>0?(e.preventDefault(),this._drawingZone=this._drawingZone.slice(0,-1)):(e.metaKey||e.ctrlKey)&&"z"===e.key.toLowerCase()&&"walls"===this._toolMode?(e.preventDefault(),this._undoLastWallPoint()):"r"===e.key.toLowerCase()&&null!==this._selectedFurnitureIndex&&this._rotateFurniture(this._selectedFurnitureIndex):(e.preventDefault(),this._deleteZone(this._selectedZoneIndex)):(e.preventDefault(),this._deleteFurniture(this._selectedFurnitureIndex))},this._pushingToESPHome=!1,this._pal3d={deep:"#0f172a",panel:"#1e293b",dim:"#64748b",dimRgb:[100,116,139]}}get isDirty(){return this._dirty}connectedCallback(){super.connectedCallback(),this._loadRooms(),this._startTargetUpdates(),window.addEventListener("keydown",this._handleKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this._stopTargetUpdates(),window.removeEventListener("keydown",this._handleKeyDown)}_markDirty(){this._dirty=!0}get _selectedSensor(){return null!==this._selectedSensorIndex?this._sensors[this._selectedSensorIndex]??null:null}_sensorLabel(e,t){return e.deviceId?e.deviceId.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase()):`Sensor ${t+1}`}_sensorColor(e){const t=["#3b82f6","#a855f7","#f59e0b","#14b8a6"];return t[e%t.length]}_updateSensor(e,t){this._sensors=this._sensors.map((i,o)=>o===e?{...i,...t}:i),this._markDirty()}_radarIdentity(e){if(!e||!this.hass)return"";const t=[e];return Object.entries(this.hass.states).forEach(([i,o])=>{i.includes(`.${e}_`)&&t.push(String(o?.attributes?.friendly_name||""))}),t.join(" ").toLowerCase()}_radarProductFamily(e){const t=this._radarIdentity(e);return/ceil[\s_-]*sense|ceilsense/.test(t)?"ceilsense":/ultimate[\s_-]*sensor|ultimatesensor/.test(t)?"ultimate-sensor":"unknown"}_recommendedMountingMode(e){return"ceilsense"===this._radarProductFamily(e)?"ceiling":"wall"}_coverageRadius(e){if("ceiling"!==e.mountingMode)return e.range;const t=Math.min(85,Math.max(15,e.fov/2))*Math.PI/180,i=e.heightMm*Math.tan(t);return Math.min(e.range,Math.max(500,i))}_selectRadarDevice(e,t){const i=this._recommendedMountingMode(t);this._updateSensor(e,{deviceId:t,mountingMode:i,heightMm:"ceiling"===i?Math.max(this._sensors[e]?.heightMm||0,2400):Math.min(this._sensors[e]?.heightMm||1500,2200)})}_setSensorMountingMode(e,t){const i=this._sensors[e];i&&this._updateSensor(e,{mountingMode:t,heightMm:"ceiling"===t?Math.max(i.heightMm||0,2400):Math.min(i.heightMm||1500,2200)})}_addSensor(){let e=0,t=0;this._roomPoints.length>=3&&(e=this._roomPoints.reduce((e,t)=>e+t.x,0)/this._roomPoints.length,t=this._roomPoints.reduce((e,t)=>e+t.y,0)/this._roomPoints.length);const i={id:`sensor_${Date.now()}`,deviceId:null,x:100*Math.round(e/100),y:100*Math.round(t/100),rotation:0,range:6e3,fov:120,heightMm:1500,mountingMode:"wall"};this._sensors=[...this._sensors,i],this._selectedSensorIndex=this._sensors.length-1,this._toolMode="sensor",this._markDirty()}_removeSensor(e){const t=this._sensors[e];if(this._sensors=this._sensors.filter((t,i)=>i!==e),t){delete this._targetTrails[t.id];const e={...this._liveTargets};delete e[t.id],this._liveTargets=e,this._zones=this._zones.map(e=>e.sensorId===t.id?{...e,sensorId:void 0}:e)}this._selectedSensorIndex=this._sensors.length>0?0:null,this._markDirty()}_setDesignMode(e){this._designMode!==e&&(this._designMode=e,this._toolMode="select",this._resetTransientState())}_setToolMode(e){this._toolMode=e,this._resetTransientState()}_resetTransientState(){this._pendingStart=null,this._previewPoint=null,this._wallHoverPreview=null,this._doorWindowPreview=null,this._selectedFurnitureType=null,this._selectedFurnitureIndex=null,this._drawingZone=[],this._zoneMidpointPreview=null}_undoLastWallPoint(){this._roomPoints.length>0&&(this._roomPoints=this._roomPoints.slice(0,-1),this._pendingStart=this._roomPoints.length>0?this._roomPoints[this._roomPoints.length-1]:null,this._markDirty())}_clearWalls(){confirm("Clear all walls of this room?")&&(this._roomPoints=[],this._pendingStart=null,this._previewPoint=null,this._markDirty())}_addPointOnWall(e,t,i=!1){if(e>=this._roomPoints.length)return;const o=this._roomPoints[e],s=this._roomPoints[(e+1)%this._roomPoints.length],r=this._snapToGrid({x:o.x+(s.x-o.x)*t,y:o.y+(s.y-o.y)*t}),n=[...this._roomPoints];n.splice(e+1,0,r),this._roomPoints=n,this._markDirty(),i&&(this._draggingPointIndex=e+1),this._wallHoverPreview=null}_deleteWallPoint(e){this._roomPoints.length<=3||(this._roomPoints=this._roomPoints.filter((t,i)=>i!==e),this._draggingPointIndex=null,this._markDirty())}_findNearestWall(e){if(this._roomPoints.length<3)return null;let t=-1,i=1/0,o=0;for(let s=0;s<this._roomPoints.length;s++){const r=this._roomPoints[s],n=this._roomPoints[(s+1)%this._roomPoints.length],a=n.x-r.x,c=n.y-r.y,l=Math.hypot(a,c);if(0===l)continue;const d=Math.max(.05,Math.min(.95,((e.x-r.x)*a+(e.y-r.y)*c)/(l*l))),h=r.x+d*a,p=r.y+d*c,u=Math.hypot(e.x-h,e.y-p);u<i&&(i=u,t=s,o=d)}return t>=0?{wallIndex:t,position:o,distance:i}:null}_calculateArea(){if(this._roomPoints.length<3)return 0;let e=0;for(let t=0;t<this._roomPoints.length;t++){const i=(t+1)%this._roomPoints.length;e+=this._roomPoints[t].x*this._roomPoints[i].y,e-=this._roomPoints[i].x*this._roomPoints[t].y}return Math.abs(e/2)/1e6}_placeFurniture(){this._selectedFurnitureType&&this._pendingStart&&(this._furniture=[...this._furniture,{id:`furniture_${Date.now()}`,type:this._selectedFurnitureType.id,name:this._selectedFurnitureType.name,x:this._pendingStart.x,y:this._pendingStart.y,width:this._furnitureWidth,height:this._furnitureHeight,rotation:0}],this._markDirty(),this._showFurnitureDialog=!1,this._pendingStart=null)}_deleteFurniture(e){this._furniture=this._furniture.filter((t,i)=>i!==e),this._selectedFurnitureIndex=null,this._markDirty()}_rotateFurniture(e){this._furniture=this._furniture.map((t,i)=>i===e?{...t,rotation:((t.rotation||0)+90)%360}:t),this._markDirty()}_updateSelectedFurniture(e){null!==this._selectedFurnitureIndex&&(this._furniture=this._furniture.map((t,i)=>i===this._selectedFurnitureIndex?{...t,...e}:t),this._markDirty())}_addDoor(){null!==this._selectedWallIndex&&this._pendingStart&&(this._doors=[...this._doors,{id:"door_"+Date.now(),wallIndex:this._selectedWallIndex,position:this._pendingStart.x,width:this._doorWidth,openDirection:this._doorOpenDirection,openSide:this._doorOpenSide}],this._markDirty(),this._hideDoorDialog())}_hideDoorDialog(){this._showDoorDialog=!1,this._selectedWallIndex=null,this._pendingStart=null,this._editingDoorIndex=null}_deleteDoor(e){this._doors=this._doors.filter((t,i)=>i!==e),this._markDirty()}_editDoor(e){const t=this._doors[e];t&&(this._editingDoorIndex=e,this._doorWidth=t.width,this._doorOpenDirection=t.openDirection,this._doorOpenSide=t.openSide,this._showDoorDialog=!0)}_saveDoorEdit(){null!==this._editingDoorIndex&&(this._doors=this._doors.map((e,t)=>t===this._editingDoorIndex?{...e,width:this._doorWidth,openDirection:this._doorOpenDirection,openSide:this._doorOpenSide}:e),this._markDirty(),this._editingDoorIndex=null,this._showDoorDialog=!1)}_addWindow(){null!==this._selectedWallIndex&&this._pendingStart&&(this._windows=[...this._windows,{id:"window_"+Date.now(),wallIndex:this._selectedWallIndex,position:this._pendingStart.x,width:this._windowWidth,height:this._windowHeight,windowType:this._windowType}],this._markDirty(),this._hideWindowDialog())}_hideWindowDialog(){this._showWindowDialog=!1,this._selectedWallIndex=null,this._pendingStart=null,this._editingWindowIndex=null}_deleteWindow(e){this._windows=this._windows.filter((t,i)=>i!==e),this._markDirty()}_editWindow(e){const t=this._windows[e];t&&(this._editingWindowIndex=e,this._windowWidth=t.width,this._windowHeight=t.height,this._windowType=t.windowType,this._showWindowDialog=!0)}_saveWindowEdit(){null!==this._editingWindowIndex&&(this._windows=this._windows.map((e,t)=>t===this._editingWindowIndex?{...e,width:this._windowWidth,height:this._windowHeight,windowType:this._windowType}:e),this._markDirty(),this._editingWindowIndex=null,this._showWindowDialog=!1)}async _createNewRoom(){if(!this._newRoomName.trim())return;let e=[];if(this._newRoomWidth>0&&this._newRoomLength>0){const t=10*this._newRoomWidth/2,i=10*this._newRoomLength/2;e=[{x1:-t,y1:-i,x2:t,y2:-i},{x1:t,y1:-i,x2:t,y2:i},{x1:t,y1:i,x2:-t,y2:i},{x1:-t,y1:i,x2:-t,y2:-i}]}const t={id:"room_"+Date.now(),name:this._newRoomName.trim(),walls:e,furniture:[],devices:[],zones:[]};try{await this.hass.callWS({type:"smarthomeshop/room/save",room:t}),this.rooms=[...this.rooms,t],this._selectRoom(t.id),this._showNewRoomDialog=!1}catch(e){console.error("Failed to create room:",e),window.alert("Could not create the room. Administrator rights are required and the name must be filled in.")}}_startTargetUpdates(){this._stopTargetUpdates(),this._targetUpdateInterval=window.setInterval(()=>this._updateTargets(),200)}_stopTargetUpdates(){this._targetUpdateInterval&&(clearInterval(this._targetUpdateInterval),this._targetUpdateInterval=null)}_updateTargets(){if(!this.hass)return;let e=!1;const t={};for(const i of this._sensors){if(!i.deviceId)continue;const o=[];let s=this._targetTrails[i.id];s||(s=Array.from({length:5},()=>[]),this._targetTrails[i.id]=s);for(let e=1;e<=5;e++){const t=this._findTargetEntity(i.deviceId,e,"x"),r=this._findTargetEntity(i.deviceId,e,"y");if(!t||!r)continue;const n=this._targetCoordinateMm(t),a=this._targetCoordinateMm(r),c=0!==n||0!==a;o.push({x:n,y:a,active:c});const l=s[e-1];if(c){const e=l[l.length-1];(!e||Math.hypot(n-e.x,a-e.y)>30)&&(l.push({x:n,y:a}),l.length>60&&l.shift())}else l.length>0&&(s[e-1]=[])}t[i.id]=o,JSON.stringify(o)!==JSON.stringify(this._liveTargets[i.id]||[])&&(e=!0)}(e||Object.keys(t).length!==Object.keys(this._liveTargets).length)&&(this._liveTargets=t,this._updateTargetCirclesInDOM())}_targetEntityIds(e,t,i){return[`sensor.${e}_target_${t}_${i}`,`sensor.${e}_target${t}_${i}`,`sensor.${e}_tracking_target_${t}_${i}`,`sensor.${e}_tracking_target${t}_${i}`]}_findTargetEntity(e,t,i){for(const o of this._targetEntityIds(e,t,i)){const e=this.hass.states[o];if(e)return e}}_targetCoordinateMm(e){const t=Number.parseFloat(e?.state);if(!Number.isFinite(t))return 0;const i=String(e?.attributes?.unit_of_measurement||"").trim().toLowerCase();return"m"===i?1e3*t:"cm"===i?10*t:t}_getRadarCapabilities(e){if(!e)return{targetCount:0,coordinateMode:"unknown",polygonZones:!1,entryLines:!1,zoneProfiles:!1,interferenceZones:!1,smoothing:!1,crossZoneTracking:!1};let t=0;for(let i=1;i<=5;i++)this._findTargetEntity(e,i,"x")&&this._findTargetEntity(e,i,"y")&&t++;return{targetCount:t,coordinateMode:this._entityExists(`sensor.${e}_tracking_target_1_x`)||this._entityExists(`sensor.${e}_tracking_target1_x`)?"tracking-target":this._entityExists(`sensor.${e}_target_1_x`)||this._entityExists(`sensor.${e}_target1_x`)?"target":"unknown",polygonZones:this._entityExists(`text.${e}_polygon_zone_1`),entryLines:this._entityExists(`text.${e}_entry_line_1`),zoneProfiles:this._entityExists(`text.${e}_zone_profile_1`),interferenceZones:this._entityExists(`text.${e}_interference_zone_1`),smoothing:this._entityExists(`switch.${e}_target_smoothing_enabled`)||this._entityExists(`number.${e}_target_smoothing`),crossZoneTracking:this._entityExists(`switch.${e}_cross_zone_tracking`)}}_getRadarDevices(){if(!this.hass)return[];const e=[],t=new Set;return Object.keys(this.hass.states).forEach(i=>{const o=i.match(/^sensor\.(.+)_tracking_target_?1_x$/)||i.match(/^sensor\.(.+)_target_?1_x$/);if(o){const i=o[1];if(!t.has(i)){t.add(i);const o=i.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase()),s=this._radarProductFamily(i);e.push({id:i,name:o,capabilities:this._getRadarCapabilities(i),productFamily:s,recommendedMountingMode:"ceilsense"===s?"ceiling":"wall"})}}}),e.sort((e,t)=>e.name.localeCompare(t.name))}async _loadRooms(){try{const e=await this.hass.callWS({type:"smarthomeshop/rooms"});this.rooms=e.rooms||[],this.rooms.length>0&&!this._selectedRoomId&&this._selectRoom(this.rooms[0].id)}catch(e){console.error("Failed to load rooms:",e)}}_selectRoom(e){if(this._dirty&&this._selectedRoomId&&e!==this._selectedRoomId&&!confirm("You have unsaved changes. Discard them?"))return;this._dirty=!1,this._targetTrails={},this._liveTargets={},this._selectedRoomId=e;const t=this.rooms.find(t=>t.id===e);if(t){this._roomPoints=t.walls?.length>0?t.walls.map(e=>({x:e.x1,y:e.y1})):[],this._furniture=(t.furniture||[]).map(e=>({id:e.id,type:e.typeId||e.type||"unknown",name:e.name||"Furniture",x:e.x,y:e.y,width:e.width,height:e.height||e.depth||e.width,rotation:e.rotationDeg??e.rotation??0})),this._doors=t.doors||[],this._windows=t.windows||[];const e=t.sensors,i=t.sensor;e&&e.length>0?this._sensors=e.map((e,t)=>({id:e.id||`sensor_${t+1}`,deviceId:e.deviceId??null,x:e.x,y:e.y,rotation:e.rotation??0,range:e.range??6e3,fov:e.fov??120,heightMm:e.heightMm??2e3,mountingMode:e.mountingMode??this._recommendedMountingMode(e.deviceId??null)})):this._sensors=i?[{id:"sensor_1",deviceId:i.deviceId??null,x:i.x,y:i.y,rotation:i.rotation??0,range:i.range??6e3,fov:i.fov??120,heightMm:i.heightMm??2e3,mountingMode:i.mountingMode??this._recommendedMountingMode(i.deviceId??null)}]:[],this._selectedSensorIndex=this._sensors.length>0?0:null,this._zones=Array.isArray(t.zones)?t.zones.map((e,t)=>((e,t)=>{const i=Array.isArray(e.parts)?e.parts.filter(e=>Array.isArray(e)&&e.length>=3):[],o=Array.isArray(e.points)?e.points:[],s=i.length?i:o.length>=3?[o]:[],r=["detection","exclusion","entry","interference"].includes(e.type||"")?e.type:"detection",n=e.profile?.preset||"default",a="custom"===n?He.default:He[n]||He.default;return{id:Number.isFinite(Number(e.id))?Number(e.id):Date.now()+t,name:e.name||`${Le[r].singular} ${t+1}`,type:r,points:"entry"===r?o.slice(0,2):s[0]||o,parts:"entry"===r?void 0:s,inDirection:e.inDirection,sensorId:e.sensorId,profile:"detection"===r?{...a,...e.profile,preset:n}:void 0}})(e||{},t)):[];const o=t.calibration||{};this._calibration={enabled:Boolean(o.enabled),corners:Array.isArray(o.corners)?o.corners.filter(e=>Number.isFinite(e?.x)&&Number.isFinite(e?.y)).slice(0,4):[],gridSizeMm:300===o.gridSizeMm?300:100,snapToGrid:!1!==o.snapToGrid,sensorId:"string"==typeof o.sensorId?o.sensorId:void 0};const s=t.tracking||{};this._tracking={smoothingEnabled:!1!==s.smoothingEnabled,smoothingAlpha:Math.min(1,Math.max(.05,Number(s.smoothingAlpha)||Ue.smoothingAlpha)),maxJumpMm:Math.max(100,Number(s.maxJumpMm)||Ue.maxJumpMm),trackHoldMs:Math.max(0,Number(s.trackHoldMs)||Ue.trackHoldMs),crossZoneTracking:!1!==s.crossZoneTracking},this._autoZoom()}this._toolMode="select",this._selectedZoneIndex=null,this._selectedZonePartIndex=0,this._drawingZone=[]}async _saveRoom(){if(!this._selectedRoomId)return;const e=this.rooms.find(e=>e.id===this._selectedRoomId);if(!e)return;this._saving=!0;const t=this._sensors[0],i=t?{x:t.x,y:t.y,rotation:t.rotation,range:t.range,fov:t.fov,deviceId:t.deviceId,heightMm:t.heightMm,mountingMode:t.mountingMode}:null;try{const t=this._roomPoints.map((e,t)=>{const i=this._roomPoints[(t+1)%this._roomPoints.length];return{x1:e.x,y1:e.y,x2:i.x,y2:i.y}}),o=this._furniture.map(e=>({id:e.id,typeId:e.type,x:e.x,y:e.y,width:e.width,height:e.height,rotationDeg:e.rotation})),s={...e,walls:t,furniture:o,doors:this._doors,windows:this._windows,sensor:i,sensors:this._sensors,zones:this._zones,calibration:this._calibration,tracking:this._tracking};await this.hass.callWS({type:"smarthomeshop/room/save",room:s}),this.rooms=this.rooms.map(e=>e.id===this._selectedRoomId?s:e),this._dirty=!1}catch(e){console.error("Failed to save room:",e),window.alert("Could not save the room. Check that you are an administrator and try again.")}finally{this._saving=!1}}_entityExists(e){return!!this.hass?.states?.[e]}async _setTextEntityIfPresent(e,t){if(!this._entityExists(e))return!1;if(t.length>255)throw new Error(`${e} value is ${t.length} characters; LD2450 text entities allow 255 characters`);return await this.hass.callService("text","set_value",{entity_id:e,value:t}),!0}async _turnOnSwitchIfPresent(e){return!!this._entityExists(e)&&(await this.hass.callService("switch","turn_on",{entity_id:e}),!0)}async _setSwitchIfPresent(e,t){return!!this._entityExists(e)&&(await this.hass.callService("switch",t?"turn_on":"turn_off",{entity_id:e}),!0)}async _setNumberIfPresent(e,t){return!!this._entityExists(e)&&(await this.hass.callService("number","set_value",{entity_id:e,value:t}),!0)}async _pushToESPHome(){const e=this._sensors.filter(e=>e.deviceId);if(0===e.length)return void alert("Add a sensor and link it to a device first!");this._pushingToESPHome=!0;const t=this._zones.filter(e=>"detection"===e.type),i=this._zones.filter(e=>"exclusion"===e.type),o=this._zones.filter(e=>"interference"===e.type),s=this._zones.filter(e=>"entry"===e.type),r=e[0].id,n=[];let a=0,c=0;try{for(const l of e){const e=l.deviceId,d=(l.rotation-90)*Math.PI/180,h=e=>{const t=e.x-l.x,i=e.y-l.y;return{x:-t*Math.sin(d)+i*Math.cos(d),y:t*Math.cos(d)+i*Math.sin(d)}},p=e=>e.map(e=>{const t=h(e);return`${Math.round(t.x)}:${Math.round(t.y)}`}).join(";"),u=(t,i,o)=>{const s=t.flatMap(e=>Be(e).map(t=>({zone:e,polygon:p(t)})));return s.length>i&&n.push(`${e}: ${o} uses ${s.length} polygon parts, but this firmware supports ${i}; only the first ${i} were pushed`),s.slice(0,i)},g=u(t,4,"detection zones"),m=u(i,2,"exclusion zones"),v=e=>{const t=e?.profile||He.default;return`${t.enterDelayMs},${t.leaveDelayMs},${t.minDwellMs},${t.minTargets}`};if(["polygon_zone_1","polygon_exclusion_1","entry_line_1"].some(t=>this._entityExists(`text.${e}_${t}`))){await this._turnOnSwitchIfPresent(`switch.${e}_polygon_zones_enabled`);for(let t=0;t<4;t++){const i=g[t],o=`text.${e}_polygon_zone_${t+1}`;await this._setTextEntityIfPresent(o,i?.polygon||"")||n.push(`${e}: missing ${o}`),await this._setTextEntityIfPresent(`text.${e}_zone_profile_${t+1}`,v(i?.zone))}for(let t=0;t<2;t++){const i=m[t],o=`text.${e}_polygon_exclusion_${t+1}`;await this._setTextEntityIfPresent(o,i?.polygon||"")||n.push(`${e}: missing ${o}`)}for(let t=0;t<2;t++){const i=o[t],s=`text.${e}_interference_zone_${t+1}`,r=i?p(Be(i)[0]||[]):"",a=await this._setTextEntityIfPresent(s,r);i&&!a&&n.push(`${e}: update firmware to use interference zones`)}await this._setSwitchIfPresent(`switch.${e}_target_smoothing_enabled`,this._tracking.smoothingEnabled),await this._setSwitchIfPresent(`switch.${e}_cross_zone_tracking`,this._tracking.crossZoneTracking),await this._setNumberIfPresent(`number.${e}_target_smoothing`,this._tracking.smoothingAlpha),await this._setNumberIfPresent(`number.${e}_tracking_max_jump`,this._tracking.maxJumpMm),await this._setNumberIfPresent(`number.${e}_tracking_hold_time`,this._tracking.trackHoldMs/1e3);const t=s.filter(e=>(e.sensorId||r)===l.id);for(let i=0;i<2;i++){const o=t[i];let s="";if(o&&2===o.points.length){const e=o.inDirection||"left",t=h(o.points[0]),i=h(o.points[1]);s=`${Math.round(t.x)}:${Math.round(t.y)};${Math.round(i.x)}:${Math.round(i.y)};${e}`}const r=`text.${e}_entry_line_${i+1}`;await this._setTextEntityIfPresent(r,s)||n.push(`${e}: missing ${r}`)}a+=1;continue}n.push(`${e}: native LD2450 text entities not found; used legacy services`);for(let t=0;t<4;t++){const i=g[t];try{await this.hass.callService("esphome",`${e}_set_polygon_zone`,{zone_id:t+1,polygon:i?.polygon||""})}catch(t){n.push(`${e}: set_polygon_zone not available`);break}}for(let t=0;t<2;t++){const i=m[t];try{await this.hass.callService("esphome",`${e}_set_polygon_exclusion`,{zone_id:t+1,polygon:i?.polygon||""})}catch(t){n.push(`${e}: set_polygon_exclusion not available`);break}}const _=s.filter(e=>(e.sensorId||r)===l.id);for(let t=0;t<2;t++){const i=_[t];let o="";if(i&&2===i.points.length){const e=i.inDirection||"left",t=h(i.points[0]),s=h(i.points[1]);o=`${Math.round(t.x)}:${Math.round(t.y)};${Math.round(s.x)}:${Math.round(s.y)};${e}`}try{await this.hass.callService("esphome",`${e}_set_entry_line`,{line_id:t+1,line_data:o})}catch(t){n.push(`${e}: set_entry_line not available`);break}}c+=1}if(n.length>0)alert(`Push finished with warnings:\n${[...new Set(n)].join("\n")}`);else{const t=a>0?"native LD2450 entity set":"sensor",i=a||c||e.length;alert(`Zones successfully pushed to ${i} ${t}${1!==i?"s":""}!`)}}catch(e){console.error("Failed to push zones:",e),alert(`Failed to push zones: ${e}`)}finally{this._pushingToESPHome=!1}}_autoZoom(){if(this._roomPoints.length<3)return this._zoom=1,void(this._panOffset={x:0,y:0});const e=this._roomPoints.map(e=>e.x),t=this._roomPoints.map(e=>e.y),i=Math.min(...e),o=Math.max(...e),s=Math.min(...t),r=Math.max(...t),n=o-i,a=r-s;this._zoom=Math.min(8500/Math.max(n,a),3);const c=(i+o)/2,l=(s+r)/2;this._panOffset={x:.08*-c*this._zoom,y:.08*-l*this._zoom}}_toCanvas(e){return{x:Ze+e.x*We/1e4*this._zoom+this._panOffset.x,y:Ze+e.y*We/1e4*this._zoom+this._panOffset.y}}_fromCanvas(e,t){return{x:(e-Ze-this._panOffset.x)/this._zoom*1e4/We,y:(t-Ze-this._panOffset.y)/this._zoom*1e4/We}}_getSvgPoint(e){if(!this._svg)return null;const t=this._svg.createSVGPoint();t.x=e.clientX,t.y=e.clientY;const i=this._svg.getScreenCTM();if(!i)return null;const o=t.matrixTransform(i.inverse());return{x:o.x,y:o.y}}_calibrationPolygon(){return this._calibration.enabled&&4===this._calibration.corners.length?this._calibration.corners:[]}_isPointInPolygon(e,t){if(t.length<3)return!0;let i=!1;for(let o=0,s=t.length-1;o<t.length;s=o++){const r=t[o],n=t[s];r.y>e.y!=n.y>e.y&&e.x<(n.x-r.x)*(e.y-r.y)/(n.y-r.y)+r.x&&(i=!i)}return i}_nearestPointOnSegment(e,t,i){const o=i.x-t.x,s=i.y-t.y,r=o*o+s*s;if(0===r)return{...t};const n=Math.max(0,Math.min(1,((e.x-t.x)*o+(e.y-t.y)*s)/r));return{x:t.x+n*o,y:t.y+n*s}}_constrainToCalibration(e){const t=this._calibrationPolygon();if(t.length<3||this._isPointInPolygon(e,t))return e;let i=e,o=1/0;return t.forEach((s,r)=>{const n=t[(r+1)%t.length],a=this._nearestPointOnSegment(e,s,n),c=Math.hypot(a.x-e.x,a.y-e.y);c<o&&(i=a,o=c)}),i}_snapToGrid(e,t=!1){const i=this._calibration.snapToGrid?{x:Math.round(e.x/this._calibration.gridSizeMm)*this._calibration.gridSizeMm,y:Math.round(e.y/this._calibration.gridSizeMm)*this._calibration.gridSizeMm}:e;return t?this._constrainToCalibration(i):i}_activeZonePart(e){const t=Be(e);return t[Math.max(0,Math.min(this._selectedZonePartIndex,t.length-1))]||e.points}_updateZonePart(e,t,i){this._zones=this._zones.map((o,s)=>{if(s!==e)return o;const r=Be(o).map(e=>[...e]);return r[t]=i,{...o,points:r[0],parts:r}}),this._markDirty()}_selectZone(e,t=0){this._selectedZoneIndex=e,this._selectedZonePartIndex=t,this._toolMode="zone"}_startAddingZonePart(e){const t=this._zones[e];t&&"entry"!==t.type&&(this._appendToZoneIndex=e,this._selectedZoneIndex=e,this._selectedZonePartIndex=Be(t).length,this._drawingZone=[],this._pendingZonePoints=[],this._toolMode="zone")}_removeZonePart(e,t){const i=this._zones[e];if(!i)return;const o=Be(i);if(o.length<=1)return;const s=o.filter((e,i)=>i!==t);this._zones=this._zones.map((t,i)=>i===e?{...t,points:s[0],parts:s}:t),this._selectedZonePartIndex=Math.max(0,Math.min(t,s.length-1)),this._markDirty()}_isPointInRoom(e){if(this._roomPoints.length<3)return!0;let t=!1;const i=this._roomPoints.length;for(let o=0,s=i-1;o<i;s=o++){const i=this._roomPoints[o].x,r=this._roomPoints[o].y,n=this._roomPoints[s].x,a=this._roomPoints[s].y;r>e.y!=a>e.y&&e.x<(n-i)*(e.y-r)/(a-r)+i&&(t=!t)}return t}_handleCanvasClick(e){if(0!==e.button)return;const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if("sensor"===this._toolMode&&null!==this._selectedSensorIndex){const e=this._snapToGrid(i,!0);return void(this._isPointInRoom(e)&&this._updateSensor(this._selectedSensorIndex,{x:e.x,y:e.y}))}if("furniture"===this._toolMode&&this._selectedFurnitureType)return this._furnitureWidth=this._selectedFurnitureType.defaultWidth,this._furnitureHeight=this._selectedFurnitureType.defaultHeight,this._pendingStart=this._snapToGrid(i),void(this._showFurnitureDialog=!0);if("door"!==this._toolMode&&"window"!==this._toolMode){if("walls"===this._toolMode){const e=this._snapToGrid(i);if(this._roomPoints.length>=3)return;if(!this._pendingStart)return void(this._pendingStart=e);const t=this._roomPoints[0];return t&&this._roomPoints.length>=2&&Math.hypot(e.x-t.x,e.y-t.y)<250?(this._pendingStart=null,void(this._previewPoint=null)):(0===this._roomPoints.length?this._roomPoints=[this._pendingStart,e]:this._roomPoints=[...this._roomPoints,e],this._pendingStart=e,void this._markDirty())}if("zone"===this._toolMode){const e=this._snapToGrid(i,!0);if(this._zoneMidpointPreview){if(-1===this._zoneMidpointPreview.zoneIndex){const e=[...this._drawingZone];e.splice(this._zoneMidpointPreview.segmentIndex+1,0,this._zoneMidpointPreview.point),this._drawingZone=e}else if(null!==this._selectedZoneIndex){const e=this._zones[this._selectedZoneIndex];if("entry"!==e.type){const t=[...this._activeZonePart(e)];t.splice(this._zoneMidpointPreview.segmentIndex+1,0,this._zoneMidpointPreview.point),this._updateZonePart(this._selectedZoneIndex,this._selectedZonePartIndex,t)}}return void(this._zoneMidpointPreview=null)}if(0===this._drawingZone.length)return void(this._drawingZone=[e]);if(1===this._drawingZone.length){if(this._drawingZone=[...this._drawingZone,e],null!==this._appendToZoneIndex)return;return this._pendingZonePoints=[...this._drawingZone],this._showZoneTypePicker=!0,void(this._drawingZone=[])}if(this._drawingZone.length>=3){const t=this._drawingZone[0];if(Math.hypot(e.x-t.x,e.y-t.y)<250){if(null!==this._appendToZoneIndex){const e=this._appendToZoneIndex,t=this._zones[e],i=[...Be(t),[...this._drawingZone]];return this._zones=this._zones.map((t,o)=>o===e?{...t,points:i[0],parts:i}:t),this._selectedZoneIndex=e,this._selectedZonePartIndex=i.length-1,this._appendToZoneIndex=null,this._drawingZone=[],void this._markDirty()}return this._pendingZonePoints=[...this._drawingZone],this._drawingZone=[],void(this._showZoneTypePicker=!0)}}this._drawingZone=[...this._drawingZone,e]}}}_handleContextMenu(e){e.preventDefault(),e.stopPropagation();const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if("layout"===this._designMode&&("walls"===this._toolMode||"select"===this._toolMode)){const e=this._roomPoints.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==e)return void this._deleteWallPoint(e)}if(this._drawingZone.length>0){const e=this._drawingZone.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==e)return void(this._drawingZone=this._drawingZone.filter((t,i)=>i!==e))}if(null!==this._selectedZoneIndex){const e=this._zones[this._selectedZoneIndex],t=this._activeZonePart(e),o=t.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);-1!==o&&t.length>3&&this._updateZonePart(this._selectedZoneIndex,this._selectedZonePartIndex,t.filter((e,t)=>t!==o))}}_handleCanvasMove(e){const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if(this._cursorPos=i,null!==this._draggingSensorIndex){const e=this._snapToGrid(i,!0);return void(this._isPointInRoom(e)&&this._updateSensor(this._draggingSensorIndex,{x:e.x,y:e.y}))}if(null!==this._draggingFurnitureIndex){const e=this._snapToGrid(i);return this._furniture=this._furniture.map((t,i)=>i===this._draggingFurnitureIndex?{...t,x:e.x,y:e.y}:t),void this._markDirty()}if(null!==this._draggingPointIndex){const e=this._snapToGrid(i);return this._roomPoints=this._roomPoints.map((t,i)=>i===this._draggingPointIndex?e:t),void this._markDirty()}if(null!==this._draggingDoorIndex){const e=this._doors[this._draggingDoorIndex];if(e&&e.wallIndex<this._roomPoints.length){const t=this._roomPoints[e.wallIndex],o=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],s=o.x-t.x,r=o.y-t.y,n=Math.hypot(s,r);if(n>0){const e=Math.max(.05,Math.min(.95,((i.x-t.x)*s+(i.y-t.y)*r)/(n*n)));this._doors=this._doors.map((t,i)=>i===this._draggingDoorIndex?{...t,position:e}:t),this._markDirty()}}return}if(null!==this._draggingWindowIndex){const e=this._windows[this._draggingWindowIndex];if(e&&e.wallIndex<this._roomPoints.length){const t=this._roomPoints[e.wallIndex],o=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],s=o.x-t.x,r=o.y-t.y,n=Math.hypot(s,r);if(n>0){const e=Math.max(.05,Math.min(.95,((i.x-t.x)*s+(i.y-t.y)*r)/(n*n)));this._windows=this._windows.map((t,i)=>i===this._draggingWindowIndex?{...t,position:e}:t),this._markDirty()}}return}if("walls"===this._toolMode&&this._pendingStart&&(this._previewPoint=this._snapToGrid(i)),"layout"===this._designMode&&("walls"===this._toolMode||"select"===this._toolMode)&&this._roomPoints.length>=3){const e=this._findNearestWall(i);if(e&&e.distance<400){const t=this._roomPoints[e.wallIndex],i=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length];this._wallHoverPreview={wallIndex:e.wallIndex,position:.5,point:{x:t.x+.5*(i.x-t.x),y:t.y+.5*(i.y-t.y)}}}else this._wallHoverPreview=null}else this._wallHoverPreview=null;if(("door"===this._toolMode||"window"===this._toolMode)&&this._roomPoints.length>=3){const e=this._findNearestWall(i);if(e){const t=this._roomPoints[e.wallIndex],i=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length];this._doorWindowPreview={wallIndex:e.wallIndex,position:e.position,point:{x:t.x+(i.x-t.x)*e.position,y:t.y+(i.y-t.y)*e.position},type:this._toolMode}}else this._doorWindowPreview=null}else this._doorWindowPreview=null;if(null!==this._draggingZonePointIndex&&null!==this._selectedZoneIndex){const e=this._snapToGrid(i,!0),t=this._zones[this._selectedZoneIndex],o=[...this._activeZonePart(t)];return o[this._draggingZonePointIndex]=e,void this._updateZonePart(this._selectedZoneIndex,this._selectedZonePartIndex,o)}if(null!==this._draggingWholeZoneIndex&&this._dragStartPos){const e=i.x-this._dragStartPos.x,t=i.y-this._dragStartPos.y,o=this._zones[this._draggingWholeZoneIndex],s=Be(o).map(i=>i.map(i=>({x:i.x+e,y:i.y+t}))),r=this._calibrationPolygon();if(r.length>0&&s.some(e=>e.some(e=>!this._isPointInPolygon(e,r))))return;return this._zones=this._zones.map((e,t)=>t===this._draggingWholeZoneIndex?{...e,points:s[0],parts:s}:e),this._dragStartPos=i,void this._markDirty()}if(null!==this._draggingDrawingPointIndex){const e=this._snapToGrid(i,!0),t=[...this._drawingZone];return t[this._draggingDrawingPointIndex]=e,void(this._drawingZone=t)}if(this._zoneMidpointPreview=null,"zone"===this._toolMode&&this._drawingZone.length>=2)for(let e=0;e<this._drawingZone.length-1;e++){const t=this._drawingZone[e],o=this._drawingZone[e+1],s=(t.x+o.x)/2,r=(t.y+o.y)/2;if(Math.hypot(i.x-s,i.y-r)<200){this._zoneMidpointPreview={zoneIndex:-1,segmentIndex:e,point:{x:s,y:r}};break}}if("zone"===this._toolMode&&null!==this._selectedZoneIndex&&0===this._drawingZone.length&&!this._zoneMidpointPreview){const e=this._zones[this._selectedZoneIndex],t=this._activeZonePart(e);for(let e=0;e<t.length;e++){const o=t[e],s=t[(e+1)%t.length],r=(o.x+s.x)/2,n=(o.y+s.y)/2;if(Math.hypot(i.x-r,i.y-n)<200){this._zoneMidpointPreview={zoneIndex:this._selectedZoneIndex,segmentIndex:e,point:{x:r,y:n}};break}}}this._isDragging&&(this._panOffset={x:this._panOffset.x+e.movementX,y:this._panOffset.y+e.movementY})}_handleCanvasDown(e){if(1===e.button||0===e.button&&e.altKey)return void(this._isDragging=!0);if(0!==e.button)return;const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if("layout"===this._designMode&&("walls"===this._toolMode||"select"===this._toolMode)){const e=this._roomPoints.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==e)return void(this._draggingPointIndex=e)}for(let e=0;e<this._sensors.length;e++){const t=this._sensors[e];if(Math.hypot(i.x-t.x,i.y-t.y)<200)return this._selectedSensorIndex=e,void(this._draggingSensorIndex=e)}if(this._drawingZone.length>0){const e=this._drawingZone.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==e)return void(this._draggingDrawingPointIndex=e)}if(null!==this._selectedZoneIndex&&"zone"===this._toolMode){const e=this._zones[this._selectedZoneIndex],t=this._activeZonePart(e).findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==t)return void(this._draggingZonePointIndex=t);if("entry"===e.type&&2===e.points.length){const t=e.points[0],o=e.points[1],s=o.x-t.x,r=o.y-t.y,n=s*s+r*r;if(n>0){const e=Math.max(0,Math.min(1,((i.x-t.x)*s+(i.y-t.y)*r)/n)),o=t.x+e*s,a=t.y+e*r;if(Math.hypot(i.x-o,i.y-a)<200)return this._draggingWholeZoneIndex=this._selectedZoneIndex,void(this._dragStartPos=i)}}const o=Be(e).findIndex(e=>this._isPointInZone(i,e));if(-1!==o)return this._selectedZonePartIndex=o,this._draggingWholeZoneIndex=this._selectedZoneIndex,void(this._dragStartPos=i)}}_isPointInZone(e,t){if(t.length<3)return!1;let i=!1;for(let o=0,s=t.length-1;o<t.length;s=o++){const r=t[o].x,n=t[o].y,a=t[s].x,c=t[s].y;n>e.y!=c>e.y&&e.x<(a-r)*(e.y-n)/(c-n)+r&&(i=!i)}return i}_handleCanvasUp(){this._isDragging=!1,this._draggingSensorIndex=null,this._draggingFurnitureIndex=null,this._draggingPointIndex=null,this._draggingDoorIndex=null,this._draggingWindowIndex=null,this._draggingZonePointIndex=null,this._draggingDrawingPointIndex=null,this._draggingWholeZoneIndex=null,this._dragStartPos=null}_handleWheel(e){e.preventDefault();const t=e.deltaY>0?.9:1.1,i=Math.max(.2,Math.min(5,this._zoom*t)),o=this._getSvgPoint(e);if(o){const e=this._fromCanvas(o.x,o.y),t=.08;this._panOffset={x:o.x-Ze-e.x*t*i,y:o.y-Ze-e.y*t*i}}this._zoom=i}_deleteZone(e){this._zones=this._zones.filter((t,i)=>i!==e),this._markDirty(),this._selectedZoneIndex===e?(this._selectedZoneIndex=null,this._selectedZonePartIndex=0):null!==this._selectedZoneIndex&&this._selectedZoneIndex>e&&(this._selectedZoneIndex-=1),this._editingZoneIndex===e?this._editingZoneIndex=null:null!==this._editingZoneIndex&&this._editingZoneIndex>e&&(this._editingZoneIndex-=1),this._appendToZoneIndex===e?this._appendToZoneIndex=null:null!==this._appendToZoneIndex&&this._appendToZoneIndex>e&&(this._appendToZoneIndex-=1)}_updateZoneName(e,t){this._zones=this._zones.map((i,o)=>o===e?{...i,name:t}:i),this._markDirty()}_updateZoneType(e,t){this._zones=this._zones.map((i,o)=>o===e?{...i,type:t,profile:"detection"===t?i.profile||{...He.default}:i.profile}:i),this._markDirty()}_getZoneCountByType(e){return this._zones.filter(t=>t.type===e).length}_canAddZone(e){return this._getZoneCountByType(e)<Re[e]}_startDrawingZone(e){this._canAddZone(e)&&(this._newZoneType=e,this._drawingZone=[],this._pendingZonePoints=[],this._appendToZoneIndex=null,this._toolMode="zone",this._selectedZoneIndex=null,this._selectedZonePartIndex=0)}_startDrawingAnyZone(){const e=["detection","exclusion","entry","interference"].some(e=>this._canAddZone(e));e&&(this._drawingZone=[],this._pendingZonePoints=[],this._appendToZoneIndex=null,this._toolMode="zone",this._selectedZoneIndex=null,this._selectedZonePartIndex=0)}_selectZoneType(e){if(!this._canAddZone(e))return;if("entry"===e){if(2!==this._pendingZonePoints.length)return;const t=this._zones.filter(t=>t.type===e).length+1;return this._zones=[...this._zones,{id:Date.now(),points:[...this._pendingZonePoints],type:e,name:`Entry Line ${t}`,inDirection:"left"}],this._showZoneTypePicker=!1,this._pendingZonePoints=[],this._markDirty(),this._selectedZoneIndex=this._zones.length-1,void(this._editingZoneIndex=this._zones.length-1)}if(this._pendingZonePoints.length<3)return;const t=this._zones.filter(t=>t.type===e).length+1,i=Le[e],o=[...this._pendingZonePoints];this._zones=[...this._zones,{id:Date.now(),points:o,parts:[o],type:e,name:`${i.singular} Zone ${t}`,profile:"detection"===e?{...He.default}:void 0}],this._showZoneTypePicker=!1,this._pendingZonePoints=[],this._markDirty()}_continueDrawingPolygon(){this._drawingZone=[...this._pendingZonePoints],this._pendingZonePoints=[],this._showZoneTypePicker=!1}_cancelZoneTypePicker(){this._showZoneTypePicker=!1,this._pendingZonePoints=[]}_toggleEntryDirection(e){const t=this._zones[e];if("entry"!==t.type)return;const i="left"===t.inDirection?"right":"left";this._zones=this._zones.map((t,o)=>o===e?{...t,inDirection:i}:t),this._markDirty()}_applyZoneProfile(e,t){const i=He["custom"===t?"default":t];this._zones=this._zones.map((o,s)=>s===e?{...o,profile:"custom"===t?{...o.profile||He.default,preset:t}:{...i}}:o),this._markDirty()}_updateZoneProfile(e,t){this._zones=this._zones.map((i,o)=>o===e?{...i,profile:{...i.profile||He.default,...t,preset:"custom"}}:i),this._markDirty()}_updateCalibration(e){this._calibration={...this._calibration,...e},this._markDirty()}_sensorLocalToWorld(e,t){const i=(e.rotation-90)*Math.PI/180;return{x:e.x+t.y*Math.cos(i)-t.x*Math.sin(i),y:e.y+t.y*Math.sin(i)+t.x*Math.cos(i)}}_worldToSensorLocal(e,t){const i=(e.rotation-90)*Math.PI/180,o=t.x-e.x,s=t.y-e.y;return{x:-o*Math.sin(i)+s*Math.cos(i),y:o*Math.cos(i)+s*Math.sin(i)}}_openCoverageCalibration(){this._selectedSensor?.deviceId&&(this._showCoverageCalibration=!0)}_saveCoverageCalibration(e){const t=this._selectedSensor;if(!t)return;const i=e.detail.corners.map(e=>this._sensorLocalToWorld(t,e));this._updateCalibration({enabled:!0,corners:i,sensorId:t.id}),this._showCoverageCalibration=!1}_updateTracking(e){this._tracking={...this._tracking,...e},this._markDirty()}_renderZoneEditForm(e,t){if(this._editingZoneIndex!==t)return"";if("entry"===e.type)return U`
        <div class="zone-edit-form">
          <label>Entry line name</label>
          <input type="text" .value="${e.name}"
                 @input="${e=>this._updateZoneName(t,e.target.value)}"/>

          <label>IN/OUT direction</label>
          <div class="direction-toggle">
            <button class="${"left"===e.inDirection?"active in":""}"
                    @click="${()=>this._toggleEntryDirection(t)}"
                    title="IN direction on the left of the line">
              ⬅️ IN left
            </button>
            <button class="${"right"===e.inDirection?"active in":""}"
                    @click="${()=>this._toggleEntryDirection(t)}"
                    title="IN direction on the right of the line">
              IN right ➡️
            </button>
          </div>
          <p class="help-text">The green "IN" arrow shows the direction into the room, the red "OUT" arrow the direction out.</p>

          ${this._sensors.length>1?U`
            <label>Counting sensor</label>
            <select @change="${e=>{const i=e.target.value;this._zones=this._zones.map((e,o)=>o===t?{...e,sensorId:i||void 0}:e),this._markDirty()}}">
              ${this._sensors.map((t,i)=>U`<option value="${t.id}" ?selected="${(e.sensorId||this._sensors[0]?.id)===t.id}">${this._sensorLabel(t,i)}</option>`)}
            </select>
            <p class="help-text">Only this sensor counts crossings on this line, so people are not counted twice.</p>
          `:K}

          <div class="edit-actions">
            <button class="cancel-btn" @click="${()=>this._editingZoneIndex=null}">Close</button>
          </div>
        </div>
      `;const i=Be(e),o=e.profile||He.default;return U`
      <div class="zone-edit-form">
        <label>Zone name</label>
        <input type="text" .value="${e.name}"
               @input="${e=>this._updateZoneName(t,e.target.value)}"/>
        <label>Zone type</label>
        <div class="type-switch">
          <button class="${"detection"===e.type?"active":""}"
                  @click="${()=>this._updateZoneType(t,"detection")}">
            📍 Detection
          </button>
          <button class="exclusion ${"exclusion"===e.type?"active":""}"
                  @click="${()=>this._updateZoneType(t,"exclusion")}">
            🚷 Exclusion
          </button>
          <button class="interference ${"interference"===e.type?"active":""}"
                  @click="${()=>this._updateZoneType(t,"interference")}">
            ⚡ Interference
          </button>
        </div>

        <label>Zone parts</label>
        <div class="direction-toggle">
          ${i.map((e,i)=>U`
            <button class="${this._selectedZonePartIndex===i?"active":""}"
                    @click="${()=>this._selectZone(t,i)}">
              Part ${i+1}
            </button>
          `)}
        </div>
        <div class="edit-actions" style="justify-content: flex-start;">
          <button class="cancel-btn" @click="${()=>this._startAddingZonePart(t)}">
            <ha-icon icon="mdi:vector-polygon-plus"></ha-icon> Add separate part
          </button>
          ${i.length>1?U`
            <button class="delete-btn" @click="${()=>this._removeZonePart(t,this._selectedZonePartIndex)}">
              <ha-icon icon="mdi:delete-outline"></ha-icon> Remove part
            </button>
          `:K}
        </div>
        <p class="help-text">Separate parts belong to the same zone and share its presence state.</p>

        ${"detection"===e.type?U`
          <label>Detection profile</label>
          <select .value="${o.preset}" @change="${e=>this._applyZoneProfile(t,e.target.value)}">
            <option value="default">Default</option>
            <option value="bed">Bed / sleeping</option>
            <option value="seating">Seating area</option>
            <option value="transit">Transit / hallway</option>
            <option value="custom">Custom</option>
          </select>
          <div class="input-row">
            <div>
              <label>Enter delay (ms)</label>
              <input type="number" min="0" step="100" .value="${String(o.enterDelayMs)}"
                     @change="${e=>this._updateZoneProfile(t,{enterDelayMs:Math.max(0,Number(e.target.value)||0)})}"/>
            </div>
            <div>
              <label>Leave delay (ms)</label>
              <input type="number" min="0" step="250" .value="${String(o.leaveDelayMs)}"
                     @change="${e=>this._updateZoneProfile(t,{leaveDelayMs:Math.max(0,Number(e.target.value)||0)})}"/>
            </div>
          </div>
          <div class="input-row">
            <div>
              <label>Minimum dwell (ms)</label>
              <input type="number" min="0" step="100" .value="${String(o.minDwellMs)}"
                     @change="${e=>this._updateZoneProfile(t,{minDwellMs:Math.max(0,Number(e.target.value)||0)})}"/>
            </div>
            <div>
              <label>Minimum targets</label>
              <input type="number" min="1" max="3" .value="${String(o.minTargets)}"
                     @change="${e=>this._updateZoneProfile(t,{minTargets:Math.max(1,Math.min(3,Number(e.target.value)||1))})}"/>
            </div>
          </div>
        `:K}
        <div class="edit-actions">
          <button class="cancel-btn" @click="${()=>this._editingZoneIndex=null}">Close</button>
        </div>
      </div>
    `}_getInstructions(){switch(this._toolMode){case"select":return{title:"Select",text:"Drag a sensor or select a zone to edit it."};case"sensor":return{title:"Sensors",text:this._sensors.length>0?"Drag a sensor to move it, click one to select it. Manage sensors on the right.":"Add a sensor on the right, then drag it into position."};case"zone":if(1===this._drawingZone.length)return{title:"Place point 2",text:"Click for the second point. After 2 points you can create an entry line or continue for a polygon zone."};if(this._drawingZone.length>1)return{title:"Draw Zone",text:"Click to add points. Click the green point to close. Drag points to move them. Right-click a point to delete it."};if(null!==this._selectedZoneIndex){const e=this._zones[this._selectedZoneIndex];return"entry"===e?.type?{title:"Edit Entry Line",text:"Drag the endpoints to move the line. Use the edit menu to change the IN/OUT direction."}:{title:"Edit Zone",text:"Drag points to move them. Click a green midpoint to add a point. Right-click a point to delete it."}}return{title:"Draw Zone",text:"Click to place the first point. 2 points = entry line, 3+ points = detection/exclusion zone."};case"walls":return{title:"Draw Walls",text:this._roomPoints.length>=3?"Hover a wall for the green add-point handle. Drag corners to move, right-click to delete.":this._pendingStart?"Click to add corners. Click the first point to close the room. Esc cancels, Ctrl+Z undoes.":"Click to place the first corner of the room."};case"door":return{title:"Add Door",text:"Hover a wall for the purple preview and click to place. Drag existing doors along their wall."};case"window":return{title:"Add Window",text:"Hover a wall for the blue preview and click to place. Drag existing windows along their wall."};case"furniture":return{title:"Place Furniture",text:this._selectedFurnitureType?`Click the canvas to place the ${this._selectedFurnitureType.name.toLowerCase()}.`:"Pick a furniture type on the right, or drag existing furniture. R rotates, Delete removes."};default:return{title:"Room Designer",text:"Pick a tool to get started."}}}_project3D(e){const t=this._camera3d,i=t.azimuth*Math.PI/180,o=t.elevation*Math.PI/180,s=e.x-t.targetX,r=e.y-t.targetY,n=e.z-t.targetZ,a=s*Math.cos(i)-r*Math.sin(i),c=s*Math.sin(i)+r*Math.cos(i),l=n,d=c*Math.cos(o)-l*Math.sin(o),h=c*Math.sin(o)+l*Math.cos(o),p=1/Math.tan(60*Math.PI/360)*400,u=t.distance+d,g=u>50?p/u:p/50;return{x:400-a*g,y:300-h*g}}_refresh3DPalette(){const e=getComputedStyle(this),t=(t,i)=>e.getPropertyValue(t).trim()||i,i=t("--rd-dim","#64748b");this._pal3d={deep:t("--rd-deep","#0f172a"),panel:t("--rd-panel","#1e293b"),dim:i,dimRgb:((e,t)=>{const i=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(i){let e=i[1];return 3===e.length&&(e=e.split("").map(e=>e+e).join("")),[parseInt(e.slice(0,2),16),parseInt(e.slice(2,4),16),parseInt(e.slice(4,6),16)]}const o=e.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);return o?[Number(o[1]),Number(o[2]),Number(o[3])]:t})(i,[100,116,139])}}_dim3d(e){const[t,i,o]=this._pal3d.dimRgb;return`rgba(${t}, ${i}, ${o}, ${e})`}_render3DScene(){if(!this._canvas3d)return;const e=this._canvas3d.getContext("2d");if(!e)return;this._refresh3DPalette();const t=this._canvas3d.width,i=this._canvas3d.height,o=e.createLinearGradient(0,0,0,i);o.addColorStop(0,this._pal3d.panel),o.addColorStop(1,this._pal3d.deep),e.fillStyle=o,e.fillRect(0,0,t,i),this._draw3DGrid(e),this._roomPoints.length>=3&&(this._draw3DRoom(e),this._draw3DFurniture(e),this._draw3DDoors(e),this._draw3DWindows(e),this._draw3DZones(e)),this._draw3DSensor(e),this._draw3DTargets(e)}_draw3DGrid(e){e.strokeStyle=this._dim3d(.3),e.lineWidth=1;const t=5e3;for(let i=-5e3;i<=t;i+=1e3){const o=this._project3D({x:i,y:-5e3,z:0}),s=this._project3D({x:i,y:t,z:0});e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(s.x,s.y),e.stroke();const r=this._project3D({x:-5e3,y:i,z:0}),n=this._project3D({x:t,y:i,z:0});e.beginPath(),e.moveTo(r.x,r.y),e.lineTo(n.x,n.y),e.stroke()}}_draw3DRoom(e){const t=this._roomPoints;if(t.length<3)return;e.fillStyle="rgba(67, 97, 238, 0.08)",e.strokeStyle="rgba(67, 97, 238, 0.4)",e.lineWidth=2,e.beginPath();const i=this._project3D({x:t[0].x,y:t[0].y,z:0});e.moveTo(i.x,i.y);for(let i=1;i<t.length;i++){const o=this._project3D({x:t[i].x,y:t[i].y,z:0});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();const o=t.map((e,i)=>{const o=t[(i+1)%t.length],s=(e.x+o.x)/2,r=(e.y+o.y)/2;return{index:i,dist:Math.hypot(s-this._camera3d.targetX,r-this._camera3d.targetY)}}).sort((e,t)=>t.dist-e.dist);for(const{index:t}of o)this._draw3DWall(e,t)}_draw3DWall(e,t){const i=this._roomPoints,o=i[t],s=i[(t+1)%i.length],r=this._project3D({x:o.x,y:o.y,z:0}),n=this._project3D({x:s.x,y:s.y,z:0}),a=this._project3D({x:s.x,y:s.y,z:this.WALL_HEIGHT_3D}),c=this._project3D({x:o.x,y:o.y,z:this.WALL_HEIGHT_3D}),l=s.x-o.x,d=s.y-o.y,h=Math.atan2(d,l)+Math.PI/2,p=this._camera3d.azimuth*Math.PI/180,u=.3+.4*Math.abs(Math.cos(h-p)),g=e.createLinearGradient((r.x+n.x)/2,Math.max(r.y,n.y),(c.x+a.x)/2,Math.min(c.y,a.y));g.addColorStop(0,this._dim3d(.5*u)),g.addColorStop(1,this._dim3d(.2*u)),e.fillStyle=g,e.strokeStyle=this._dim3d(.8),e.lineWidth=2,e.beginPath(),e.moveTo(r.x,r.y),e.lineTo(n.x,n.y),e.lineTo(a.x,a.y),e.lineTo(c.x,c.y),e.closePath(),e.fill(),e.stroke()}_draw3DFurniture(e){for(const t of this._furniture){const i=t.width/2,o=t.height/2,s=400,r=[{x:t.x-i,y:t.y-o,z:0},{x:t.x+i,y:t.y-o,z:0},{x:t.x+i,y:t.y+o,z:0},{x:t.x-i,y:t.y+o,z:0}],n=r.map(e=>({...e,z:s})),a=r.map(e=>this._project3D(e)),c=n.map(e=>this._project3D(e));e.fillStyle=this._dim3d(.5),e.strokeStyle=this._pal3d.dim,e.lineWidth=1,e.beginPath(),e.moveTo(c[0].x,c[0].y);for(let t=1;t<4;t++)e.lineTo(c[t].x,c[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=this._dim3d(.25),e.beginPath(),e.moveTo(a[t].x,a[t].y),e.lineTo(a[i].x,a[i].y),e.lineTo(c[i].x,c[i].y),e.lineTo(c[t].x,c[t].y),e.closePath(),e.fill(),e.stroke()}const l=this._project3D({x:t.x,y:t.y,z:s+100});e.fillStyle=this._pal3d.dim,e.font="11px sans-serif",e.textAlign="center",e.fillText(t.name,l.x,l.y)}}_draw3DDoors(e){if(this._roomPoints.length<3)return;for(const t of this._doors){if(t.wallIndex>=this._roomPoints.length)continue;const i=this._roomPoints[t.wallIndex],o=this._roomPoints[(t.wallIndex+1)%this._roomPoints.length],s=i.x+(o.x-i.x)*t.position,r=i.y+(o.y-i.y)*t.position,n=Math.atan2(o.y-i.y,o.x-i.x),a=t.width/2,c=Math.cos(n),l=Math.sin(n),d=Math.cos(n+Math.PI/2),h=Math.sin(n+Math.PI/2),p=[{x:s-a*c-40*d,y:r-a*l-40*h},{x:s+a*c-40*d,y:r+a*l-40*h},{x:s+a*c+40*d,y:r+a*l+40*h},{x:s-a*c+40*d,y:r-a*l+40*h}],u=p.map(e=>this._project3D({...e,z:0})),g=p.map(e=>this._project3D({...e,z:2e3}));e.strokeStyle="#8b5a2b",e.lineWidth=1,e.fillStyle="rgba(139, 90, 43, 0.6)",e.beginPath(),e.moveTo(g[0].x,g[0].y);for(let t=1;t<4;t++)e.lineTo(g[t].x,g[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(139, 90, 43, 0.5)":"rgba(139, 90, 43, 0.35)",e.beginPath(),e.moveTo(u[t].x,u[t].y),e.lineTo(u[i].x,u[i].y),e.lineTo(g[i].x,g[i].y),e.lineTo(g[t].x,g[t].y),e.closePath(),e.fill(),e.stroke()}const m=this._project3D({x:s,y:r,z:2100});e.fillStyle="#d4a574",e.font="14px sans-serif",e.textAlign="center",e.fillText("🚪",m.x,m.y)}}_draw3DWindows(e){if(this._roomPoints.length<3)return;for(const t of this._windows){if(t.wallIndex>=this._roomPoints.length)continue;const i=this._roomPoints[t.wallIndex],o=this._roomPoints[(t.wallIndex+1)%this._roomPoints.length],s=i.x+(o.x-i.x)*t.position,r=i.y+(o.y-i.y)*t.position,n=Math.atan2(o.y-i.y,o.x-i.x),a=t.width/2,c=Math.cos(n),l=Math.sin(n),d=Math.cos(n+Math.PI/2),h=Math.sin(n+Math.PI/2),p=[{x:s-a*c-25*d,y:r-a*l-25*h},{x:s+a*c-25*d,y:r+a*l-25*h},{x:s+a*c+25*d,y:r+a*l+25*h},{x:s-a*c+25*d,y:r-a*l+25*h}],u=p.map(e=>this._project3D({...e,z:900})),g=p.map(e=>this._project3D({...e,z:2e3}));e.strokeStyle="#4a90a4",e.lineWidth=1,e.fillStyle="rgba(135, 206, 235, 0.4)",e.beginPath(),e.moveTo(g[0].x,g[0].y);for(let t=1;t<4;t++)e.lineTo(g[t].x,g[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(135, 206, 235, 0.35)":"rgba(135, 206, 235, 0.25)",e.beginPath(),e.moveTo(u[t].x,u[t].y),e.lineTo(u[i].x,u[i].y),e.lineTo(g[i].x,g[i].y),e.lineTo(g[t].x,g[t].y),e.closePath(),e.fill(),e.stroke()}}}_draw3DZones(e){const t=this.WALL_HEIGHT_3D;for(const i of this._zones){const o=Oe[i.type],s=i.points;if("entry"===i.type&&2===s.length){const r=s[0],n=s[1],a=this._project3D({x:r.x,y:r.y,z:0}),c=this._project3D({x:n.x,y:n.y,z:0}),l=this._project3D({x:r.x,y:r.y,z:t}),d=this._project3D({x:n.x,y:n.y,z:t});e.fillStyle=o.fill.replace("0.25","0.4"),e.strokeStyle=o.stroke,e.lineWidth=3,e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(c.x,c.y),e.lineTo(d.x,d.y),e.lineTo(l.x,l.y),e.closePath(),e.fill(),e.stroke();const h=(r.x+n.x)/2,p=(r.y+n.y)/2,u=this._project3D({x:h,y:p,z:t/2});e.fillStyle=o.stroke,e.font="bold 14px sans-serif",e.textAlign="center",e.fillText("left"===i.inDirection?"← IN":"IN →",u.x,u.y)}else if(s.length>=3){e.fillStyle=o.fill,e.strokeStyle=o.stroke,e.lineWidth=2,e.beginPath();const r=this._project3D({x:s[0].x,y:s[0].y,z:10});e.moveTo(r.x,r.y);for(let t=1;t<s.length;t++){const i=this._project3D({x:s[t].x,y:s[t].y,z:10});e.lineTo(i.x,i.y)}e.closePath(),e.fill(),e.stroke(),e.fillStyle=o.fill.replace("0.2","0.15"),e.beginPath();const n=this._project3D({x:s[0].x,y:s[0].y,z:t});e.moveTo(n.x,n.y);for(let i=1;i<s.length;i++){const o=this._project3D({x:s[i].x,y:s[i].y,z:t});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();for(let i=0;i<s.length;i++){const r=s[i],n=s[(i+1)%s.length],a=this._project3D({x:r.x,y:r.y,z:10}),c=this._project3D({x:n.x,y:n.y,z:10}),l=this._project3D({x:n.x,y:n.y,z:t}),d=this._project3D({x:r.x,y:r.y,z:t});e.fillStyle=o.fill.replace("0.2","0.12"),e.strokeStyle=o.stroke,e.lineWidth=1,e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(c.x,c.y),e.lineTo(l.x,l.y),e.lineTo(d.x,d.y),e.closePath(),e.fill(),e.stroke()}const a=s.reduce((e,t)=>e+t.x,0)/s.length,c=s.reduce((e,t)=>e+t.y,0)/s.length,l=this._project3D({x:a,y:c,z:t/2});e.fillStyle=o.stroke,e.font="bold 12px sans-serif",e.textAlign="center",e.fillText(i.name,l.x,l.y)}}}_draw3DSensor(e){for(const t of this._sensors){const i=t.heightMm??2e3,o=this._project3D({x:t.x,y:t.y,z:i}),s=this._project3D({x:t.x,y:t.y,z:0});if("ceiling"===t.mountingMode){const i=this._coverageRadius(t),s=Array.from({length:33},(e,o)=>{const s=o/32*Math.PI*2;return this._project3D({x:t.x+Math.cos(s)*i,y:t.y+Math.sin(s)*i,z:0})});e.fillStyle="rgba(67, 97, 238, 0.13)",e.strokeStyle="#4361ee",e.lineWidth=2,e.beginPath(),s.forEach((t,i)=>0===i?e.moveTo(t.x,t.y):e.lineTo(t.x,t.y)),e.closePath(),e.fill(),e.stroke(),e.strokeStyle="rgba(67, 97, 238, 0.35)",e.lineWidth=1;for(let t=0;t<32;t+=8)e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(s[t].x,s[t].y),e.stroke()}else{const i=t.fov/2*Math.PI/180,o=(t.rotation-90)*Math.PI/180,r=o-i,n=o+i,a=t.x+Math.cos(r)*t.range,c=t.y+Math.sin(r)*t.range,l=t.x+Math.cos(n)*t.range,d=t.y+Math.sin(n)*t.range,h=this._project3D({x:a,y:c,z:0}),p=this._project3D({x:l,y:d,z:0});e.fillStyle="rgba(67, 97, 238, 0.15)",e.strokeStyle="#4361ee",e.lineWidth=2,e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(h.x,h.y),e.lineTo(p.x,p.y),e.closePath(),e.fill(),e.stroke()}e.strokeStyle="rgba(67, 97, 238, 0.5)",e.lineWidth=1,e.setLineDash([4,4]),e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(s.x,s.y),e.stroke(),e.setLineDash([]),e.fillStyle="#4361ee",e.beginPath(),e.arc(o.x,o.y,12,0,2*Math.PI),e.fill(),e.fillStyle="white",e.font="bold 10px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText("📡",o.x,o.y)}}_draw3DTargets(e){const t=[];for(const e of this._sensors){const i=(e.rotation-90)*Math.PI/180;for(const o of this._liveTargets[e.id]||[])o.active&&t.push({x:e.x+o.y*Math.cos(i)-o.x*Math.sin(i),y:e.y+o.y*Math.sin(i)+o.x*Math.cos(i)})}for(let i=0;i<t.length;i++){const o=t[i].x,s=t[i].y;e.save();const r=this._project3D({x:o+80,y:s+80,z:5});e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.ellipse(r.x,r.y,25,10,.3,0,2*Math.PI),e.fill(),this._draw3DCapsule(e,o-60,s,0,60,700,"#8b9299","#6b7280"),this._draw3DCapsule(e,o+60,s,0,60,700,"#8b9299","#6b7280"),this._draw3DCapsule(e,o-160,s,900,50,380,"#8b9299","#6b7280"),this._draw3DCapsule(e,o+160,s,900,50,380,"#8b9299","#6b7280"),this._draw3DCapsule(e,o,s,700,120,600,"#b8bfc7","#9ca3af"),this._draw3DSphere(e,o,s,1500,110);const n=this._project3D({x:o,y:s,z:1700});e.fillStyle="rgba(239, 68, 68, 0.95)",e.beginPath(),e.arc(n.x,n.y,14,0,2*Math.PI),e.fill(),e.strokeStyle="rgba(255, 255, 255, 0.6)",e.lineWidth=2,e.stroke(),e.fillStyle="white",e.font="bold 12px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText(`${i+1}`,n.x,n.y),e.restore()}}_draw3DCapsule(e,t,i,o,s,r,n,a){const c=.8*s,l=o+r,d=[];for(let e=0;e<8;e++){const r=e/8*Math.PI*2,n=(e+1)/8*Math.PI*2,a=t+Math.cos(r)*s,h=i+Math.sin(r)*c,p=t+Math.cos(n)*s,u=i+Math.sin(n)*c,g=this._project3D({x:a,y:h,z:o}),m=this._project3D({x:p,y:u,z:o}),v=this._project3D({x:p,y:u,z:l}),_=this._project3D({x:a,y:h,z:l}),y=(h+u)/2;d.push({points:[g,m,v,_],depth:y,isTop:!1,isSide:!0})}const h=[];for(let e=0;e<8;e++){const o=e/8*Math.PI*2,r=t+Math.cos(o)*s,n=i+Math.sin(o)*c;h.push(this._project3D({x:r,y:n,z:l}))}d.push({points:h,depth:-1e3,isTop:!0,isSide:!1}),d.sort((e,t)=>t.depth-e.depth);for(const t of d){e.beginPath(),e.moveTo(t.points[0].x,t.points[0].y);for(let i=1;i<t.points.length;i++)e.lineTo(t.points[i].x,t.points[i].y);if(e.closePath(),t.isTop)e.fillStyle=n;else{const i=t.depth>0?.85:1;e.fillStyle=this._shadeColor(n,i)}e.fill(),e.strokeStyle=a,e.lineWidth=.5,e.stroke()}}_draw3DSphere(e,t,i,o,s){const r=this._project3D({x:t,y:i,z:o}),n=this._project3D({x:t,y:i,z:o+s}),a=Math.abs(r.y-n.y),c=e.createRadialGradient(r.x-.35*a,r.y-.35*a,0,r.x,r.y,a);c.addColorStop(0,"#ffffff"),c.addColorStop(.3,"#e5e7eb"),c.addColorStop(.7,"#d1d5db"),c.addColorStop(1,"#9ca3af"),e.fillStyle=c,e.beginPath(),e.arc(r.x,r.y,a,0,2*Math.PI),e.fill(),e.strokeStyle="#6b7280",e.lineWidth=1,e.stroke()}_shadeColor(e,t){const i=e.replace("#","");return`rgb(${Math.round(parseInt(i.substr(0,2),16)*t)}, ${Math.round(parseInt(i.substr(2,2),16)*t)}, ${Math.round(parseInt(i.substr(4,2),16)*t)})`}_handle3DMouseDown(e){0===e.button&&(this._isDragging3D=!0,this._lastMouseX=e.clientX,this._lastMouseY=e.clientY)}_handle3DMouseMove(e){if(!this._isDragging3D)return;const t=e.clientX-this._lastMouseX,i=e.clientY-this._lastMouseY;this._camera3d={...this._camera3d,azimuth:(this._camera3d.azimuth-.5*t)%360,elevation:Math.max(5,Math.min(85,this._camera3d.elevation+.3*i))},this._lastMouseX=e.clientX,this._lastMouseY=e.clientY,this._render3DScene()}_handle3DMouseUp(){this._isDragging3D=!1}_handle3DWheel(e){e.preventDefault();const t=e.deltaY>0?1.1:.9;this._camera3d={...this._camera3d,distance:Math.max(2e3,Math.min(2e4,this._camera3d.distance*t))},this._render3DScene()}_reset3DCamera(){if(this._roomPoints.length>=3){const e=this._roomPoints.map(e=>e.x),t=this._roomPoints.map(e=>e.y),i=(Math.min(...e)+Math.max(...e))/2,o=(Math.min(...t)+Math.max(...t))/2,s=Math.max(Math.max(...e)-Math.min(...e),Math.max(...t)-Math.min(...t));this._camera3d={azimuth:45,elevation:35,distance:Math.max(4e3,1.5*s),targetX:i,targetY:o,targetZ:this.WALL_HEIGHT_3D/2}}else this._camera3d={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3};this._render3DScene()}_toggleViewMode(){this._viewMode="2d"===this._viewMode?"3d":"2d","3d"===this._viewMode&&(this._reset3DCamera(),requestAnimationFrame(()=>{this._canvas3d&&(this._canvas3d.width=this._canvas3d.offsetWidth,this._canvas3d.height=this._canvas3d.offsetHeight,this._render3DScene())}))}_renderGrid(){const e=[],t=this._calibration.gridSizeMm,i=300===t?900:1e3;for(let o=-1e4;o<=1e4;o+=t){const t=o%i===0,s=this._toCanvas({x:o,y:-1e4}),r=this._toCanvas({x:o,y:1e4}),n=this._toCanvas({x:-1e4,y:o}),a=this._toCanvas({x:1e4,y:o});e.push(B`<line class="grid-line ${t?"major":""}" x1="${s.x}" y1="${s.y}" x2="${r.x}" y2="${r.y}"/>`),e.push(B`<line class="grid-line ${t?"major":""}" x1="${n.x}" y1="${n.y}" x2="${a.x}" y2="${a.y}"/>`)}const o=this._calibrationPolygon();if(o.length<3)return e;const s=o.map((e,t)=>{const i=this._toCanvas(e);return`${0===t?"M":"L"} ${i.x} ${i.y}`}).join(" ")+" Z";return B`
      <defs>
        <clipPath id="room-calibration-clip">
          <path d="${s}"></path>
        </clipPath>
      </defs>
      <g clip-path="url(#room-calibration-clip)">${e}</g>
    `}_renderRoom(){if(this._roomPoints.length<2)return K;const e=[],t=this._roomPoints.map((e,t)=>{const i=this._toCanvas(e);return(0===t?"M":"L")+` ${i.x} ${i.y}`}).join(" ")+(this._roomPoints.length>=3?" Z":"");this._roomPoints.length>=3&&e.push(B`<path d="${t}" fill="rgba(67, 97, 238, 0.06)" style="pointer-events: none;"/>`);for(let t=0;t<this._roomPoints.length;t++){const i=this._roomPoints[t],o=this._roomPoints[(t+1)%this._roomPoints.length];if(this._roomPoints.length<3&&t===this._roomPoints.length-1)break;const s=this._toCanvas(i),r=this._toCanvas(o);if(e.push(B`<line class="wall-line" x1="${s.x}" y1="${s.y}" x2="${r.x}" y2="${r.y}"/>`),"layout"===this._designMode){const t=(Math.hypot(o.x-i.x,o.y-i.y)/1e3).toFixed(2),n=(s.x+r.x)/2,a=(s.y+r.y)/2,c=180*Math.atan2(r.y-s.y,r.x-s.x)/Math.PI,l=c>90||c<-90?c+180:c,d=(c+90)*Math.PI/180,h=14*Math.cos(d),p=14*Math.sin(d);e.push(B`
          <text x="${n+h}" y="${a+p}" text-anchor="middle" dominant-baseline="middle"
            transform="rotate(${l}, ${n+h}, ${a+p})"
            fill="#7c93f5" font-size="11" font-weight="600"
            stroke="var(--rd-deep)" stroke-width="3" paint-order="stroke"
            style="pointer-events: none;">${t}m</text>
        `)}}if("layout"===this._designMode&&this._roomPoints.length>=3){let t=0,i=0,o=0;for(let e=0;e<this._roomPoints.length;e++){const s=this._roomPoints[e],r=this._roomPoints[(e+1)%this._roomPoints.length],n=s.x*r.y-r.x*s.y;o+=n,t+=(s.x+r.x)*n,i+=(s.y+r.y)*n}if(Math.abs(o)>1e-6){o/=2,t/=6*o,i/=6*o;const s=this._toCanvas({x:t,y:i});e.push(B`<text x="${s.x}" y="${s.y}" text-anchor="middle" dominant-baseline="middle" fill="var(--rd-dim)" font-size="15" font-weight="600" style="pointer-events: none;">${this._calculateArea().toFixed(1)} m²</text>`)}}if("layout"===this._designMode&&("walls"===this._toolMode||"select"===this._toolMode)&&(this._roomPoints.forEach((t,i)=>{const o=this._toCanvas(t),s=i===this._draggingPointIndex;e.push(B`
          <circle cx="${o.x}" cy="${o.y}" r="7"
            fill="${s?"#22c55e":"#4361ee"}" stroke="white" stroke-width="2"
            style="cursor: ${s?"grabbing":"grab"};"
            @mousedown="${e=>{e.stopPropagation(),e.preventDefault(),this._draggingPointIndex=i}}"
          />
        `)}),this._wallHoverPreview)){const t=this._toCanvas(this._wallHoverPreview.point);e.push(B`
          <g style="cursor: pointer;"
             @mousedown="${e=>{e.stopPropagation(),e.preventDefault(),this._addPointOnWall(this._wallHoverPreview.wallIndex,this._wallHoverPreview.position,!0)}}">
            <circle cx="${t.x}" cy="${t.y}" r="11" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="2" stroke-dasharray="4 2"/>
            <circle cx="${t.x}" cy="${t.y}" r="4" fill="#22c55e"/>
          </g>
        `)}return e}_renderWallDrawPreview(){if("walls"!==this._toolMode||!this._pendingStart||!this._previewPoint)return K;const e=this._toCanvas(this._pendingStart),t=this._toCanvas(this._previewPoint),i=this._roomPoints[0],o=i&&this._roomPoints.length>=2&&Math.hypot(this._previewPoint.x-i.x,this._previewPoint.y-i.y)<250,s=i?this._toCanvas(i):null;return B`
      ${o&&s?B`<circle cx="${s.x}" cy="${s.y}" r="18" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="1"/>`:K}
      <line x1="${e.x}" y1="${e.y}" x2="${t.x}" y2="${t.y}" stroke="#22c55e" stroke-width="2" stroke-dasharray="8 4"/>
      <circle cx="${t.x}" cy="${t.y}" r="5" fill="#22c55e" stroke="white" stroke-width="2"/>
    `}_renderFurnitureGhost(){if("furniture"!==this._toolMode||!this._selectedFurnitureType||!this._cursorPos)return K;const e=this._snapToGrid(this._cursorPos),t=this._toCanvas(e),i=.08*this._zoom,o=this._selectedFurnitureType.defaultWidth*i,s=this._selectedFurnitureType.defaultHeight*i;return B`<rect x="${t.x-o/2}" y="${t.y-s/2}" width="${o}" height="${s}" rx="4"
      fill="rgba(34, 197, 94, 0.12)" stroke="#22c55e" stroke-width="2" stroke-dasharray="6 3" pointer-events="none"/>`}_renderDoorWindowPreview(){if(!this._doorWindowPreview)return K;const e=this._doorWindowPreview,t=this._roomPoints[e.wallIndex],i=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],o=this._toCanvas(e.point),s=Math.atan2(i.y-t.y,i.x-t.x),r=.08*this._zoom,n=("door"===e.type?this._doorWidth:this._windowWidth)*r,a="door"===e.type,c=a?"#a855f7":"#0ea5e9",l=o.x-Math.cos(s)*n/2,d=o.y-Math.sin(s)*n/2,h=o.x+Math.cos(s)*n/2,p=o.y+Math.sin(s)*n/2;return B`
      <g style="cursor: pointer;"
         @mousedown="${t=>{t.stopPropagation(),t.preventDefault(),this._selectedWallIndex=e.wallIndex,this._pendingStart={x:e.position,y:0},a?this._showDoorDialog=!0:this._showWindowDialog=!0}}">
        <line x1="${l}" y1="${d}" x2="${h}" y2="${p}" stroke="${c}" stroke-width="6" stroke-dasharray="8 4" opacity="0.8"/>
        <circle cx="${o.x}" cy="${o.y}" r="10" fill="rgba(168, 85, 247, 0.25)" stroke="${c}" stroke-width="2"/>
      </g>
    `}_renderFurniture(){const e="layout"===this._designMode&&("furniture"===this._toolMode||"select"===this._toolMode);return this._furniture.map((t,i)=>{const o=this._toCanvas({x:t.x,y:t.y}),s=.08*this._zoom,r=t.width*s,n=t.height*s,a=i===this._selectedFurnitureIndex,c=i===this._draggingFurnitureIndex;return B`
        <g @mousedown="${t=>{e&&(t.stopPropagation(),t.preventDefault(),this._selectedFurnitureIndex=i,this._draggingFurnitureIndex=i)}}"
           style="cursor: ${c?"grabbing":e?"grab":"default"};">
          <rect
            x="${o.x-r/2}" y="${o.y-n/2}"
            width="${r}" height="${n}"
            fill="${c?"rgba(34, 197, 94, 0.3)":a?"rgba(59, 130, 246, 0.3)":"var(--rd-line)"}"
            stroke="${c?"#22c55e":a?"#3b82f6":"var(--rd-line-strong)"}"
            stroke-width="${c||a?2:1}"
            transform="rotate(${t.rotation||0} ${o.x} ${o.y})"
            rx="3"
          />
          ${"layout"===this._designMode?B`
            <text x="${o.x}" y="${o.y+4}" text-anchor="middle"
              fill="${c?"#22c55e":a?"#3b82f6":"var(--rd-dim2)"}"
              font-size="11" font-weight="500" style="pointer-events: none;">${t.name}</text>
          `:K}
        </g>
      `})}_renderDoorsAndWindows(){const e=[],t=.08*this._zoom,i="layout"===this._designMode&&("door"===this._toolMode||"window"===this._toolMode||"select"===this._toolMode);return this._doors.forEach((o,s)=>{if(o.wallIndex>=this._roomPoints.length)return;const r=this._roomPoints[o.wallIndex],n=this._roomPoints[(o.wallIndex+1)%this._roomPoints.length],a=r.x+(n.x-r.x)*o.position,c=r.y+(n.y-r.y)*o.position,l=this._toCanvas({x:a,y:c}),d=Math.atan2(n.y-r.y,n.x-r.x),h=d+("inward"===o.openDirection?Math.PI/2:-Math.PI/2),p=o.width*t,u=s===this._draggingDoorIndex,g=u?"#22c55e":"#a855f7";e.push(B`
        <g style="cursor: ${u?"grabbing":i?"grab":"default"};"
           @mousedown="${e=>{i&&(e.stopPropagation(),e.preventDefault(),this._draggingDoorIndex=s)}}">
          <circle cx="${l.x}" cy="${l.y}" r="15" fill="transparent"/>
          <line
            x1="${l.x-Math.cos(d)*p/2}"
            y1="${l.y-Math.sin(d)*p/2}"
            x2="${l.x+Math.cos(d)*p/2}"
            y2="${l.y+Math.sin(d)*p/2}"
            stroke="var(--rd-deep)" stroke-width="6"
          />
          <line
            x1="${l.x}" y1="${l.y}"
            x2="${l.x+Math.cos(h)*p*.9}"
            y2="${l.y+Math.sin(h)*p*.9}"
            stroke="${g}" stroke-width="3"
          />
          <path
            d="M ${l.x+Math.cos(h)*p*.9} ${l.y+Math.sin(h)*p*.9} A ${.9*p} ${.9*p} 0 0 ${"left"===o.openSide?1:0} ${l.x+Math.cos(d+("left"===o.openSide?-1:1)*Math.PI/2)*p*.9} ${l.y+Math.sin(d+("left"===o.openSide?-1:1)*Math.PI/2)*p*.9}"
            fill="none" stroke="${g}" stroke-width="1" stroke-dasharray="4 2" opacity="0.5"
          />
          ${"layout"===this._designMode?B`<circle cx="${l.x}" cy="${l.y}" r="6" fill="${g}" stroke="white" stroke-width="2"/>`:K}
        </g>
      `)}),this._windows.forEach((o,s)=>{if(o.wallIndex>=this._roomPoints.length)return;const r=this._roomPoints[o.wallIndex],n=this._roomPoints[(o.wallIndex+1)%this._roomPoints.length],a=r.x+(n.x-r.x)*o.position,c=r.y+(n.y-r.y)*o.position,l=this._toCanvas({x:a,y:c}),d=Math.atan2(n.y-r.y,n.x-r.x),h=o.width*t,p=s===this._draggingWindowIndex,u=p?"#22c55e":"#0ea5e9",g=l.x-Math.cos(d)*h/2,m=l.y-Math.sin(d)*h/2,v=l.x+Math.cos(d)*h/2,_=l.y+Math.sin(d)*h/2;e.push(B`
        <g style="cursor: ${p?"grabbing":i?"grab":"default"};"
           @mousedown="${e=>{i&&(e.stopPropagation(),e.preventDefault(),this._draggingWindowIndex=s)}}">
          <circle cx="${l.x}" cy="${l.y}" r="15" fill="transparent"/>
          <line x1="${g}" y1="${m}" x2="${v}" y2="${_}" stroke="${u}" stroke-width="6"/>
          <line x1="${g}" y1="${m}" x2="${v}" y2="${_}" stroke="${p?"#4ade80":"#38bdf8"}" stroke-width="3"/>
          ${"layout"===this._designMode?B`<circle cx="${l.x}" cy="${l.y}" r="6" fill="${u}" stroke="white" stroke-width="2"/>`:K}
        </g>
      `)}),e}_renderZones(){const e=[];if(this._calibration.enabled&&4===this._calibration.corners.length){const t=this._calibration.corners.map(e=>this._toCanvas(e)),i=`M ${t.map(e=>`${e.x} ${e.y}`).join(" L ")} Z`;e.push(B`
        <g style="pointer-events: none;">
          <path
            d="${i}"
            fill="rgba(14, 165, 233, 0.04)"
            stroke="#0ea5e9"
            stroke-width="2"
            stroke-dasharray="5 5"
          />
          ${t.map((e,t)=>B`
            <circle cx="${e.x}" cy="${e.y}" r="7" fill="#0ea5e9" stroke="white" stroke-width="2" />
            <text x="${e.x}" y="${e.y-12}" fill="#0284c7" font-size="10" font-weight="700" text-anchor="middle">
              C${t+1}
            </text>
          `)}
        </g>
      `)}if(this._zones.forEach((t,i)=>{const o=Oe[t.type],s=this._selectedZoneIndex===i;if("entry"===t.type&&2===t.points.length){const r=this._toCanvas(t.points[0]),n=this._toCanvas(t.points[1]),a=(r.x+n.x)/2,c=(r.y+n.y)/2,l=n.x-r.x,d=n.y-r.y,h=Math.sqrt(l*l+d*d),p=Math.atan2(d,l),u=-d/h,g=l/h,m="left"===(t.inDirection||"left")?1:-1;e.push(B`
          <line
            x1="${r.x}" y1="${r.y}"
            x2="${n.x}" y2="${n.y}"
            stroke="${o.stroke}"
            stroke-width="${s?4:3}"
            stroke-linecap="round"
            style="cursor: pointer;"
            @click="${e=>{e.stopPropagation(),this._selectZone(i),this._toolMode="zone"}}"
          />
        `);const v=30,_=5,y=a+u*m*(v+_),x=c+g*m*(v+_),f=a-u*m*_,b=c-g*m*_;e.push(B`
          <line
            x1="${y}" y1="${x}"
            x2="${f}" y2="${b}"
            stroke="#22c55e" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrowhead-in)"
            style="pointer-events: none;"
          />
          <text
            x="${y+u*m*15}" y="${x+g*m*15+4}"
            fill="#22c55e" font-size="13" font-weight="700" text-anchor="middle"
            style="pointer-events: none;"
          >IN</text>
        `);const w=a-u*m*(v+_),$=c-g*m*(v+_),k=a+u*m*_,S=c+g*m*_;e.push(B`
          <line
            x1="${w}" y1="${$}"
            x2="${k}" y2="${S}"
            stroke="#ef4444" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrowhead-out)"
            style="pointer-events: none;"
          />
          <text
            x="${w-u*m*15}" y="${$-g*m*15+4}"
            fill="#ef4444" font-size="13" font-weight="700" text-anchor="middle"
            style="pointer-events: none;"
          >OUT</text>
        `);const z=(Math.hypot(t.points[1].x-t.points[0].x,t.points[1].y-t.points[0].y)/1e3).toFixed(2),M=180*p/Math.PI,P=M>90||M<-90?M+180:M;return e.push(B`
          <text
            x="${a}" y="${c-12}"
            fill="${o.stroke}"
            font-size="11" font-weight="600" text-anchor="middle"
            transform="rotate(${P} ${a} ${c-12})"
            style="pointer-events: none;"
          >${z}m</text>
        `),void(s&&e.push(B`
            <circle cx="${r.x}" cy="${r.y}" r="8" fill="${o.stroke}" stroke="white" stroke-width="2" style="cursor: grab;" />
            <circle cx="${n.x}" cy="${n.y}" r="8" fill="${o.stroke}" stroke="white" stroke-width="2" style="cursor: grab;" />
          `))}Be(t).forEach((r,n)=>{if(r.length<3)return;const a=s&&this._selectedZonePartIndex===n,c=`M ${r.map(e=>this._toCanvas(e)).map(e=>`${e.x} ${e.y}`).join(" L ")} Z`,l="exclusion"===t.type?"8 4":"interference"===t.type?"3 4":"none";if(e.push(B`
          <path
            d="${c}"
            fill="${o.fill}"
            stroke="${o.stroke}"
            stroke-width="${a?3:2}"
            stroke-dasharray="${l}"
            style="cursor: ${a&&"zone"===this._toolMode?"move":"pointer"};"
            @click="${e=>{e.stopPropagation(),this._selectZone(i,n)}}"
          />
        `),a){for(let t=0;t<r.length;t++){const i=r[t],s=r[(t+1)%r.length],n=Math.hypot(s.x-i.x,s.y-i.y),a=this._toCanvas(i),c=this._toCanvas(s),l=(a.x+c.x)/2,d=(a.y+c.y)/2,h=180*Math.atan2(c.y-a.y,c.x-a.x)/Math.PI,p=h>90||h<-90?h+180:h;e.push(B`
            <text
              x="${l}" y="${d-8}"
              fill="${o.stroke}"
              font-size="11"
              font-weight="600"
              text-anchor="middle"
              transform="rotate(${p} ${l} ${d-8})"
              style="pointer-events: none;"
            >${(n/1e3).toFixed(2)}m</text>
          `)}if(r.forEach(t=>{const i=this._toCanvas(t);e.push(B`
            <circle
              cx="${i.x}" cy="${i.y}" r="8"
              fill="${o.stroke}" stroke="white" stroke-width="2"
              style="cursor: ${"zone"===this._toolMode?"grab":"default"};"
            />
          `)}),"zone"===this._toolMode&&this._zoneMidpointPreview?.zoneIndex===i){const t=this._toCanvas(this._zoneMidpointPreview.point);e.push(B`
            <circle
              cx="${t.x}" cy="${t.y}" r="8"
              fill="#22c55e" stroke="white" stroke-width="2"
              style="cursor: pointer;"
            />
          `)}}})}),this._drawingZone.length>0){const t=Oe[this._newZoneType],i=this._drawingZone.map(e=>this._toCanvas(e));for(let o=0;o<i.length-1;o++){e.push(B`
          <line
            x1="${i[o].x}" y1="${i[o].y}"
            x2="${i[o+1].x}" y2="${i[o+1].y}"
            stroke="${t.stroke}" stroke-width="2"
          />
        `);const s=this._drawingZone[o],r=this._drawingZone[o+1],n=(Math.hypot(r.x-s.x,r.y-s.y)/1e3).toFixed(2),a=(i[o].x+i[o+1].x)/2,c=(i[o].y+i[o+1].y)/2,l=180*Math.atan2(i[o+1].y-i[o].y,i[o+1].x-i[o].x)/Math.PI,d=l>90||l<-90?l+180:l;e.push(B`
          <text
            x="${a}" y="${c-8}"
            fill="${t.stroke}"
            font-size="11"
            font-weight="600"
            text-anchor="middle"
            transform="rotate(${d} ${a} ${c-8})"
            style="pointer-events: none;"
          >${n}m</text>
        `)}if(this._cursorPos){const o=i[i.length-1],s=this._toCanvas(this._cursorPos);e.push(B`
          <line
            x1="${o.x}" y1="${o.y}"
            x2="${s.x}" y2="${s.y}"
            stroke="${t.stroke}" stroke-width="2" stroke-dasharray="4 4"
          />
        `)}if(i.forEach((i,o)=>{const s=0===o&&this._drawingZone.length>=3;e.push(B`
          <circle
            cx="${i.x}" cy="${i.y}" r="8"
            fill="${s?"#22c55e":t.stroke}"
            stroke="white" stroke-width="2"
            style="cursor: grab;"
          />
        `)}),this._zoneMidpointPreview&&-1===this._zoneMidpointPreview.zoneIndex){const t=this._toCanvas(this._zoneMidpointPreview.point);e.push(B`
          <circle
            cx="${t.x}" cy="${t.y}" r="8"
            fill="#22c55e" stroke="white" stroke-width="2"
            style="cursor: pointer;"
          />
        `)}}return e}_renderSensorFOV(){if(0===this._sensors.length)return K;const e=.08*this._zoom,t=[];return this._sensors.forEach((i,o)=>{const s=o===this._selectedSensorIndex,r=this._toCanvas({x:i.x,y:i.y}),n=this._coverageRadius(i),a=n*e,c=(i.rotation-90)*Math.PI/180,l=s?1:.45;if("ceiling"===i.mountingMode){if(t.push(B`
          <circle cx="${r.x}" cy="${r.y}" r="${a}"
            fill="rgba(34, 197, 94, ${.1*l})" stroke="#22c55e"
            stroke-opacity="${l}" stroke-width="1.5" style="pointer-events: none;"/>
        `),s)for(let i=1e3;i<=n;i+=1e3){const o=i*e;t.push(B`<circle cx="${r.x}" cy="${r.y}" r="${o}" fill="none" stroke="rgba(34, 197, 94, 0.25)" stroke-width="1" style="pointer-events: none;"/>`),t.push(B`<text x="${r.x}" y="${r.y-o-4}" fill="rgba(34, 197, 94, 0.65)" font-size="9" text-anchor="middle" style="pointer-events: none;">${i/1e3}m</text>`)}return}const d=i.fov*Math.PI/360,h=c-d,p=c+d,u=[];for(let e=0;e<=32;e++){const t=h+e/32*(p-h);u.push({x:r.x+Math.cos(t)*a,y:r.y+Math.sin(t)*a})}const g=`M ${r.x} ${r.y} L ${u.map(e=>`${e.x} ${e.y}`).join(" L ")} Z`;if(t.push(B`<path d="${g}" fill="rgba(34, 197, 94, ${.12*l})" stroke="#22c55e" stroke-opacity="${l}" stroke-width="1.5" style="pointer-events: none;"/>`),s){for(let o=1e3;o<=i.range;o+=1e3){const i=o*e,s=[];for(let e=0;e<=24;e++){const t=h+e/24*(p-h);s.push({x:r.x+Math.cos(t)*i,y:r.y+Math.sin(t)*i})}const n=`M ${s.map(e=>`${e.x} ${e.y}`).join(" L ")}`;t.push(B`<path d="${n}" fill="none" stroke="rgba(34, 197, 94, 0.25)" stroke-width="1" style="pointer-events: none;"/>`);const a=r.x+Math.cos(c)*i,l=r.y+Math.sin(c)*i;t.push(B`<text x="${a}" y="${l-4}" fill="rgba(34, 197, 94, 0.6)" font-size="9" text-anchor="middle" style="pointer-events: none;">${o/1e3}m</text>`)}for(let e=-180;e<=180;e+=30){if(Math.abs(e)>i.fov/2)continue;const o=c+e*Math.PI/180;t.push(B`<line x1="${r.x}" y1="${r.y}" x2="${r.x+Math.cos(o)*a}" y2="${r.y+Math.sin(o)*a}" stroke="rgba(34, 197, 94, 0.15)" stroke-width="1" style="pointer-events: none;"/>`)}}}),B`${t}`}_renderSensorIcon(){if(0===this._sensors.length)return K;const e="sensor"===this._toolMode||"select"===this._toolMode;return B`${this._sensors.map((t,i)=>{const o=this._toCanvas({x:t.x,y:t.y}),s=(t.rotation-90)*Math.PI/180,r="ceiling"===t.mountingMode?13:25,n=o.x+Math.cos(s)*r,a=o.y+Math.sin(s)*r,c=this._draggingSensorIndex===i,l=this._selectedSensorIndex===i,d=c?"#22c55e":this._sensorColor(i);return B`
        ${l?B`<circle cx="${o.x}" cy="${o.y}" r="25" fill="none" stroke="${d}" stroke-width="2" stroke-dasharray="4 3" style="pointer-events: none;"/>`:K}
        ${"ceiling"===t.mountingMode?B`<circle cx="${o.x}" cy="${o.y}" r="22" fill="none" stroke="white" stroke-opacity="0.65" stroke-width="1" style="pointer-events: none;"/>`:K}
        <circle
          cx="${o.x}" cy="${o.y}" r="18"
          fill="${d}" stroke="white" stroke-width="2"
          style="cursor: ${c?"grabbing":e?"grab":"default"}"
          @mousedown="${t=>{e&&(t.stopPropagation(),t.preventDefault(),this._selectedSensorIndex=i,this._draggingSensorIndex=i)}}"
        />
        <line x1="${o.x}" y1="${o.y}" x2="${n}" y2="${a}" stroke="white" stroke-width="3" stroke-linecap="round" style="pointer-events: none;"/>
        <text x="${o.x}" y="${o.y+4}" text-anchor="middle" fill="white" font-size="11" font-weight="700" style="pointer-events: none;">${i+1}</text>
      `})}`}updated(e){super.updated(e),(e.has("_liveTargets")||e.has("_sensors"))&&this._updateTargetCirclesInDOM(),"3d"===this._viewMode&&this._canvas3d&&this._render3DScene()}_updateTargetCirclesInDOM(){const e=this.shadowRoot?.querySelector("svg");if(!e)return;e.querySelectorAll(".live-target").forEach(e=>e.remove());const t=[["#ef4444","#4361ee","#eab308","#22c55e","#a855f7"],["#f97316","#8b5cf6","#06b6d4","#84cc16","#ec4899"],["#ec4899","#22c55e","#94a3b8","#f59e0b","#3b82f6"]];this._sensors.forEach((i,o)=>{const s=(i.rotation-90)*Math.PI/180,r=e=>({x:i.x+e.y*Math.cos(s)-e.x*Math.sin(s),y:i.y+e.y*Math.sin(s)+e.x*Math.cos(s)}),n=t[o%t.length],a=this._liveTargets[i.id]||[],c=this._targetTrails[i.id]||[];a.forEach((t,i)=>{if(!t.active)return;const o=r(t),s=this._toCanvas(o),a=n[i]||"#ef4444",l=c[i]||[];if(l.length>1){const t=l.map(e=>{const t=this._toCanvas(r(e));return`${t.x},${t.y}`}).join(" "),i=document.createElementNS("http://www.w3.org/2000/svg","polyline");i.setAttribute("class","live-target"),i.setAttribute("points",t),i.setAttribute("fill","none"),i.setAttribute("stroke",a),i.setAttribute("stroke-width","2"),i.setAttribute("stroke-opacity","0.35"),i.setAttribute("stroke-linecap","round"),i.setAttribute("stroke-linejoin","round"),e.appendChild(i)}const d=document.createElementNS("http://www.w3.org/2000/svg","circle");d.setAttribute("class","live-target"),d.setAttribute("cx",s.x.toString()),d.setAttribute("cy",s.y.toString()),d.setAttribute("r","18"),d.setAttribute("fill",a),d.setAttribute("stroke","white"),d.setAttribute("stroke-width","4");const h=document.createElementNS("http://www.w3.org/2000/svg","animate");h.setAttribute("attributeName","r"),h.setAttribute("values","14;22;14"),h.setAttribute("dur","1s"),h.setAttribute("repeatCount","indefinite"),d.appendChild(h),e.appendChild(d);const p=document.createElementNS("http://www.w3.org/2000/svg","text");p.setAttribute("class","live-target"),p.setAttribute("x",s.x.toString()),p.setAttribute("y",(s.y+6).toString()),p.setAttribute("text-anchor","middle"),p.setAttribute("fill","white"),p.setAttribute("font-size","14"),p.setAttribute("font-weight","bold"),p.textContent=(i+1).toString(),e.appendChild(p)})})}_renderSelectedFurniturePanel(){const e=this._selectedFurnitureIndex;if(null===e||!this._furniture[e])return K;const t=this._furniture[e];return U`
      <div class="selected-panel">
        <div class="section-title">SELECTED: ${t.name.toUpperCase()}</div>
        <div class="input-row">
          <div>
            <label>Width (cm)</label>
            <input type="number" min="10" max="500" .value="${String(t.width/10)}"
              @input="${e=>this._updateSelectedFurniture({width:10*(parseInt(e.target.value)||10)})}"/>
          </div>
          <div>
            <label>Depth (cm)</label>
            <input type="number" min="10" max="500" .value="${String(t.height/10)}"
              @input="${e=>this._updateSelectedFurniture({height:10*(parseInt(e.target.value)||10)})}"/>
          </div>
        </div>
        <div class="panel-btn-row">
          <button class="panel-btn" @click="${()=>this._rotateFurniture(e)}" title="Shortcut: R">
            <ha-icon icon="mdi:rotate-right"></ha-icon>Rotate ${t.rotation||0}°
          </button>
          <button class="panel-btn danger" @click="${()=>this._deleteFurniture(e)}" title="Shortcut: Delete">
            <ha-icon icon="mdi:delete"></ha-icon>Delete
          </button>
        </div>
      </div>
    `}_renderLayoutSidebar(){if("furniture"===this._toolMode)return U`
        ${this._renderSelectedFurniturePanel()}
        <div>
          <div class="section-title">FURNITURE</div>
          <p class="info-text" style="margin-bottom: 10px;">Pick a type, then click the canvas to place it.</p>
          <div class="furniture-grid">
            ${Fe.map(e=>U`
              <div class="furniture-item ${this._selectedFurnitureType?.id===e.id?"selected":""}"
                   @click="${()=>{this._selectedFurnitureType=e,this._selectedFurnitureIndex=null}}">
                <ha-icon icon="${e.icon}"></ha-icon>
                <span>${e.name}</span>
                <small>${e.defaultWidth/10}×${e.defaultHeight/10}cm</small>
              </div>
            `)}
          </div>
        </div>
        ${this._furniture.length>0?U`
          <div>
            <div class="section-title">PLACED FURNITURE</div>
            ${this._furniture.map((e,t)=>U`
              <div class="placed-item ${this._selectedFurnitureIndex===t?"selected":""}" @click="${()=>this._selectedFurnitureIndex=t}">
                <ha-icon icon="${Fe.find(t=>t.id===e.type)?.icon||"mdi:square"}"></ha-icon>
                <span class="name">${e.name}</span>
                <span class="size">${e.width/10}×${e.height/10}</span>
                <button class="icon-btn" title="Rotate 90°" @click="${e=>{e.stopPropagation(),this._rotateFurniture(t)}}">
                  <ha-icon icon="mdi:rotate-right"></ha-icon>
                </button>
                <button class="delete-btn" title="Delete" @click="${e=>{e.stopPropagation(),this._deleteFurniture(t)}}">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `)}
          </div>
        `:K}
      `;if("door"===this._toolMode)return U`
        <div>
          <div class="section-title">DOORS</div>
          <p class="info-text" style="margin-bottom: 10px;">Hover a wall and click the preview to add a door.</p>
          ${0===this._doors.length?U`
            <p class="info-text" style="color: var(--rd-dim);">No doors added yet.</p>
          `:this._doors.map((e,t)=>U`
            <div class="placed-item">
              <ha-icon icon="mdi:door"></ha-icon>
              <span class="name">Door ${t+1}</span>
              <span class="size">${e.width/10}cm</span>
              <button class="icon-btn" title="Edit" @click="${()=>this._editDoor(t)}">
                <ha-icon icon="mdi:pencil"></ha-icon>
              </button>
              <button class="delete-btn" title="Delete" @click="${()=>this._deleteDoor(t)}">
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
          `)}
        </div>
      `;if("window"===this._toolMode)return U`
        <div>
          <div class="section-title">WINDOWS</div>
          <p class="info-text" style="margin-bottom: 10px;">Hover a wall and click the preview to add a window.</p>
          ${0===this._windows.length?U`
            <p class="info-text" style="color: var(--rd-dim);">No windows added yet.</p>
          `:this._windows.map((e,t)=>U`
            <div class="placed-item">
              <ha-icon icon="mdi:window-closed-variant"></ha-icon>
              <span class="name">${"fixed"===e.windowType?"Fixed":"tilt"===e.windowType?"Tilt":"Casement"}</span>
              <span class="size">${e.width/10}×${e.height/10}cm</span>
              <button class="icon-btn" title="Edit" @click="${()=>this._editWindow(t)}">
                <ha-icon icon="mdi:pencil"></ha-icon>
              </button>
              <button class="delete-btn" title="Delete" @click="${()=>this._deleteWindow(t)}">
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
          `)}
        </div>
      `;const e=this._calculateArea();return U`
      ${this._renderSelectedFurniturePanel()}
      <div>
        <div class="section-title">ROOM INFO</div>
        <div class="info-text">
          ${this._roomPoints.length>=3?U`
            <p>Area: <span class="info-value">${e.toFixed(1)} m²</span></p>
            <p>Corners: <span class="info-value">${this._roomPoints.length}</span></p>
            <p>Furniture: <span class="info-value">${this._furniture.length}</span></p>
            <p>Doors: <span class="info-value">${this._doors.length}</span> · Windows: <span class="info-value">${this._windows.length}</span></p>
            <p>Sensors: <span class="info-value">${this._sensors.length}</span> · Zones: <span class="info-value">${this._zones.length}</span></p>
          `:U`<p>Draw walls to see measurements. Use the Walls tool to start.</p>`}
        </div>
      </div>
    `}render(){const e=this.rooms.find(e=>e.id===this._selectedRoomId),t=this._getInstructions(),i=this._getRadarDevices(),o=i.find(e=>e.id===this._selectedSensor?.deviceId),s=this._getRadarCapabilities(this._selectedSensor?.deviceId??null),r=Object.values(this._liveTargets).reduce((e,t)=>e+t.filter(e=>e.active).length,0),n=this._sensors.find(e=>e.id===this._calibration.sensorId);return U`
      <div class="sidebar">
        <div>
          <div class="section-title">SELECT ROOM</div>
          <div class="room-list">
            ${0===this.rooms.length?U`
              <p class="info-text">No rooms yet. Create your first room with "Add Room" below.</p>
            `:this.rooms.map(e=>U`
              <div class="room-item ${e.id===this._selectedRoomId?"selected":""}" @click="${()=>this._selectRoom(e.id)}">
                <div class="room-icon"><ha-icon icon="mdi:floor-plan"></ha-icon></div>
                <span class="room-name">${e.name}</span>
              </div>
            `)}
            <button class="add-room-btn" @click="${()=>{this._newRoomName="",this._newRoomWidth=0,this._newRoomLength=0,this._showNewRoomDialog=!0}}">
              <ha-icon icon="mdi:plus"></ha-icon>Add Room
            </button>
          </div>
        </div>

        <div>
          <div class="section-title">TOOLS</div>
          ${"layout"===this._designMode?U`
            <div class="tool-grid">
              <button class="tool-btn ${"select"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("select")}">
                <ha-icon icon="mdi:cursor-default"></ha-icon><span>Select</span>
              </button>
              <button class="tool-btn ${"walls"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("walls")}">
                <ha-icon icon="mdi:wall"></ha-icon><span>Walls</span>
              </button>
              <button class="tool-btn ${"door"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("door")}">
                <ha-icon icon="mdi:door"></ha-icon><span>Door</span>
              </button>
              <button class="tool-btn ${"window"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("window")}">
                <ha-icon icon="mdi:window-closed-variant"></ha-icon><span>Window</span>
              </button>
              <button class="tool-btn ${"furniture"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("furniture")}" style="grid-column: span 2;">
                <ha-icon icon="mdi:sofa"></ha-icon><span>Furniture</span>
              </button>
            </div>
          `:U`
            <div class="tool-grid">
              <button class="tool-btn ${"select"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("select")}">
                <ha-icon icon="mdi:cursor-default"></ha-icon><span>Select</span>
              </button>
              <button class="tool-btn ${"sensor"===this._toolMode?"active":""}" @click="${()=>this._setToolMode("sensor")}">
                <ha-icon icon="mdi:radar"></ha-icon><span>Sensors</span>
              </button>
              <button class="tool-btn ${"zone"===this._toolMode?"active":""}" @click="${()=>this._startDrawingAnyZone()}" style="grid-column: span 2;">
                <ha-icon icon="mdi:vector-polygon"></ha-icon><span>Draw Zone</span>
              </button>
            </div>
          `}
        </div>

        <div class="instructions">
          <div class="instructions-title">${t.title}</div>
          <div class="instructions-text">${t.text}</div>
        </div>
      </div>

      <div class="canvas-area" style="position: relative;">
          <div class="canvas-header">
          <div class="header-group">
            ${e?U`
              <div class="mode-toggle">
                <button class="mode-btn ${"layout"===this._designMode?"active":""}" @click="${()=>this._setDesignMode("layout")}">
                  <ha-icon icon="mdi:floor-plan"></ha-icon>Layout
                </button>
                <button class="mode-btn ${"sensors"===this._designMode?"active":""}" @click="${()=>this._setDesignMode("sensors")}">
                  <ha-icon icon="mdi:radar"></ha-icon>Sensors & Zones
                </button>
              </div>
            `:U`<span class="room-label">No room selected</span>`}
          </div>
          <div class="header-group">
            ${e?U`
              <div class="view-toggle">
                <button class="view-toggle-btn ${"2d"===this._viewMode?"active":""}" @click="${()=>this._viewMode="2d"}" title="2D floor plan">
                  <ha-icon icon="mdi:floor-plan"></ha-icon>2D
                </button>
                <button class="view-toggle-btn ${"3d"===this._viewMode?"active":""}" @click="${this._toggleViewMode}" title="3D view">
                  <ha-icon icon="mdi:cube-outline"></ha-icon>3D
                </button>
              </div>
              ${"sensors"===this._designMode?U`
                <button class="push-btn" @click="${this._pushToESPHome}" ?disabled="${this._pushingToESPHome||!this._sensors.some(e=>e.deviceId)}"
                        title="Push zones and entry lines to the linked sensors">
                  <ha-icon icon="mdi:upload"></ha-icon>
                  ${this._pushingToESPHome?"Pushing...":"Push"}
                </button>
              `:K}
              <button class="save-btn ${this._dirty?"dirty":""}" @click="${this._saveRoom}" ?disabled="${this._saving||!this._dirty}">
                <ha-icon icon="mdi:content-save"></ha-icon>
                ${this._saving?"Saving...":this._dirty?"Save":"Saved"}
              </button>
            `:K}
          </div>
        </div>
        ${e?"2d"===this._viewMode?U`
          <svg viewBox="0 0 ${We} ${We}"
               @click="${this._handleCanvasClick}"
               @contextmenu="${this._handleContextMenu}"
               @mousemove="${this._handleCanvasMove}"
               @mousedown="${this._handleCanvasDown}"
               @mouseup="${this._handleCanvasUp}"
               @mouseleave="${this._handleCanvasUp}"
               @wheel="${this._handleWheel}">
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
            ${this._renderFurnitureGhost()}
            ${this._renderSensorFOV()}
            ${this._renderZones()}
            ${this._renderWallDrawPreview()}
            ${this._renderDoorWindowPreview()}
            ${this._renderSensorIcon()}
          </svg>
          <div class="canvas-controls">
            <div class="control-group">
              <button class="control-btn" @click="${()=>this._zoom=Math.min(5,1.25*this._zoom)}"><ha-icon icon="mdi:plus"></ha-icon></button>
              <button class="control-btn" @click="${()=>this._zoom=Math.max(.2,this._zoom/1.25)}"><ha-icon icon="mdi:minus"></ha-icon></button>
              <button class="control-btn" @click="${this._autoZoom}"><ha-icon icon="mdi:fit-to-screen"></ha-icon></button>
            </div>
            ${"walls"===this._toolMode?U`
              <div class="control-group">
                <button class="control-btn" @click="${this._undoLastWallPoint}" title="Undo last corner"><ha-icon icon="mdi:undo"></ha-icon></button>
                <button class="control-btn" @click="${this._clearWalls}" title="Clear walls"><ha-icon icon="mdi:delete"></ha-icon></button>
              </div>
            `:K}
          </div>
        `:U`
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
            🎮 Drag to rotate • Scroll to zoom
          </div>
        `:U`
          <div class="empty-state">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <h3>Room Designer</h3>
            <p>Select or create a room to draw the layout, place sensors and configure zones</p>
          </div>
        `}
      </div>

      <div class="sidebar sidebar-right">
        ${"layout"===this._designMode?this._renderLayoutSidebar():U`
        ${"sensor"===this._toolMode?U`
          <div>
            <div class="section-title">SENSORS (${this._sensors.length})</div>
            <div class="sensor-list">
              ${this._sensors.map((e,t)=>U`
                <div class="sensor-item ${this._selectedSensorIndex===t?"selected":""}" @click="${()=>this._selectedSensorIndex=t}">
                  <span class="sensor-dot" style="background: ${this._sensorColor(t)};">${t+1}</span>
                  <div class="sensor-item-info">
                    <div class="sensor-item-name">${this._sensorLabel(e,t)}</div>
                    <div class="sensor-item-sub">
                      ${e.deviceId?("ceiling"===e.mountingMode?"Ceiling":"Wall")+" mounted · Linked":"No device linked"}
                    </div>
                  </div>
                  <button class="delete-btn" title="Remove sensor" @click="${e=>{e.stopPropagation(),this._removeSensor(t)}}">
                    <ha-icon icon="mdi:delete"></ha-icon>
                  </button>
                </div>
              `)}
              <button class="add-sensor-btn" @click="${this._addSensor}">
                <ha-icon icon="mdi:plus"></ha-icon>Add sensor
              </button>
            </div>
          </div>

          ${this._selectedSensor?U`
            <div>
              <div class="section-title">SENSOR ${this._selectedSensorIndex+1} SETTINGS</div>
              <div class="setting-item">
                <label>Device</label>
                <select @change="${e=>this._selectRadarDevice(this._selectedSensorIndex,e.target.value||null)}">
                  <option value="">-- Select device --</option>
                  ${i.map(e=>U`
                    <option value="${e.id}" ?selected="${this._selectedSensor?.deviceId===e.id}">
                      ${e.name}${"ceilsense"===e.productFamily?" · CeilSense LD2450":""}
                    </option>
                  `)}
                </select>
                ${this._selectedSensor.deviceId?U`
                  <div class="firmware-status">
                    <div class="firmware-status-row">
                      <span>Live tracking</span>
                      <span class="firmware-status-value">
                        ${s.targetCount>0?`${s.targetCount} target${1===s.targetCount?"":"s"}`:"Not detected"}
                      </span>
                    </div>
                    <div class="firmware-status-row">
                      <span>Zone sync</span>
                      <span class="firmware-status-value">
                        ${s.zoneProfiles||s.interferenceZones||s.smoothing?"Advanced":s.polygonZones?"Base LD2450":"Visualization only"}
                      </span>
                    </div>
                    ${s.polygonZones?s.zoneProfiles&&s.interferenceZones&&s.smoothing?U`
                      <p class="firmware-status-note">All Room Designer zone and tracking controls are available.</p>
                    `:U`
                      <p class="firmware-status-note">
                        Base detection, exclusion and entry zones are supported. Profiles, interference zones and smoothing require updated firmware.
                      </p>
                    `:U`
                      <p class="firmware-status-note warning">
                        Live room tracking is available, but this firmware does not expose polygon zones to Home Assistant.
                      </p>
                    `}
                    ${"ceilsense"===o?.productFamily?U`
                      <p class="firmware-status-note">
                        CeilSense LD2450 is ceiling mounted. Its three X/Y targets are projected onto the floor; tracking orientation aligns those coordinates with this room.
                      </p>
                    `:K}
                  </div>
                `:K}
              </div>
              <div class="setting-item">
                <label>Mounting type</label>
                <select .value="${this._selectedSensor.mountingMode}"
                        @change="${e=>this._setSensorMountingMode(this._selectedSensorIndex,e.target.value)}">
                  <option value="wall">Wall mounted</option>
                  <option value="ceiling">Ceiling mounted</option>
                </select>
                ${"ceilsense"===o?.productFamily&&"ceiling"!==this._selectedSensor.mountingMode?U`
                  <p class="firmware-status-note warning">CeilSense is designed for ceiling mounting. Use wall mode only for a custom installation.</p>
                `:K}
              </div>
              <div class="setting-item">
                <label>${"ceiling"===this._selectedSensor.mountingMode?"Tracking orientation":"Rotation"}: ${this._selectedSensor.rotation}°</label>
                <input type="range" min="0" max="359" .value="${String(this._selectedSensor.rotation)}"
                       @input="${e=>this._updateSensor(this._selectedSensorIndex,{rotation:parseInt(e.target.value)})}"/>
              </div>
              <div class="setting-item">
                <label>${"ceiling"===this._selectedSensor.mountingMode?"Maximum floor radius":"Range"}: ${(this._selectedSensor.range/1e3).toFixed(1)}m</label>
                <input type="range" min="1" max="10" step="0.5" .value="${String(this._selectedSensor.range/1e3)}"
                       @input="${e=>this._updateSensor(this._selectedSensorIndex,{range:1e3*parseFloat(e.target.value)})}"/>
              </div>
              <div class="setting-item">
                <label>${"ceiling"===this._selectedSensor.mountingMode?"Coverage angle":"FOV"}: ${this._selectedSensor.fov}°</label>
                <input type="range" min="30" max="180" .value="${String(this._selectedSensor.fov)}"
                       @input="${e=>this._updateSensor(this._selectedSensorIndex,{fov:parseInt(e.target.value)})}"/>
              </div>
              <div class="setting-item">
                <label>${"ceiling"===this._selectedSensor.mountingMode?"Ceiling height":"Mounting height"}: ${((this._selectedSensor.heightMm??2e3)/1e3).toFixed(1)}m</label>
                <input type="range" min="${"ceiling"===this._selectedSensor.mountingMode?"2":"0.2"}" max="${"ceiling"===this._selectedSensor.mountingMode?"5":"3"}" step="0.1" .value="${String((this._selectedSensor.heightMm??2e3)/1e3)}"
                       @input="${e=>this._updateSensor(this._selectedSensorIndex,{heightMm:Math.round(1e3*parseFloat(e.target.value))})}"/>
                ${"ceiling"===this._selectedSensor.mountingMode?U`
                  <p class="firmware-status-note">Effective floor radius: ${(this._coverageRadius(this._selectedSensor)/1e3).toFixed(1)}m.</p>
                `:K}
              </div>
              <p class="firmware-status-note">
                CeilSense LD2412 is presence-only and is intentionally not listed here because it does not expose X/Y target positions.
              </p>
            </div>
          `:K}
        `:"zone"===this._toolMode&&this._drawingZone.length>0?U`
            <div>
              <div class="section-title">CURRENT DRAWING</div>
              <p class="info-text">${this._drawingZone.length} points drawn</p>
              <button class="tool-btn" style="width: 100%;" @click="${()=>this._drawingZone=[]}">
                <ha-icon icon="mdi:cancel"></ha-icon>
                <span>Cancel</span>
              </button>
        </div>
        `:""}

        <div class="settings-panel">
          <div class="settings-panel-header">
            <ha-icon icon="mdi:radar"></ha-icon>
            <span>Sensor coverage calibration</span>
          </div>
          <p class="info-text">
            Measure the furthest positions the selected LD2450 or LD2460 can reliably see.
            This sets the sensor's usable detection area, not the room size.
          </p>
          <div class="coverage-summary ${4===this._calibration.corners.length?"calibrated":""}">
            <ha-icon icon="${4===this._calibration.corners.length?"mdi:check-circle-outline":"mdi:map-marker-path"}"></ha-icon>
            <div>
              <strong>${4===this._calibration.corners.length?"Detection area measured":"No detection area measured"}</strong>
              <span>
                ${4===this._calibration.corners.length?`Four points${n?` measured with ${this._sensorLabel(n,this._sensors.indexOf(n))}`:""}.`:"Select a sensor, then walk to four reliable outer positions."}
              </span>
            </div>
          </div>
          ${4===this._calibration.corners.length?U`
            <div class="settings-row">
              <label>Use measured area</label>
              <input type="checkbox" .checked="${this._calibration.enabled}"
                     @change="${e=>this._updateCalibration({enabled:e.target.checked})}"/>
            </div>
          `:K}
          <button class="secondary-action" @click="${this._openCoverageCalibration}" ?disabled="${!this._selectedSensor?.deviceId}">
            <ha-icon icon="mdi:map-marker-radius"></ha-icon>
            ${4===this._calibration.corners.length?"Measure again":"Start live measurement"}
          </button>
          ${this._selectedSensor?.deviceId?U`
            <p class="firmware-status-note">Uses live X/Y target positions from ${this._sensorLabel(this._selectedSensor,this._selectedSensorIndex)}.</p>
          `:U`
            <p class="firmware-status-note warning">Select an LD2450 or LD2460 device above before starting.</p>
          `}
          <div class="settings-row">
            <label>Grid size</label>
            <select .value="${String(this._calibration.gridSizeMm)}"
                    @change="${e=>this._updateCalibration({gridSizeMm:parseInt(e.target.value,10)})}">
              <option value="100">10 cm</option>
              <option value="300">30 cm</option>
            </select>
          </div>
          <div class="settings-row">
            <label>Snap points to grid</label>
            <input type="checkbox" .checked="${this._calibration.snapToGrid}"
                   @change="${e=>this._updateCalibration({snapToGrid:e.target.checked})}"/>
          </div>
          ${this._calibration.enabled&&4===this._calibration.corners.length?U`
            <details class="calibration-details">
              <summary>Measured coordinates</summary>
              <div class="corner-grid">
                ${this._calibration.corners.map((e,t)=>U`
                  <div class="corner-row">
                    <strong>P${t+1}</strong>
                    <span>X ${Math.round(e.x)} mm</span>
                    <span>Y ${Math.round(e.y)} mm</span>
                  </div>
                `)}
              </div>
            </details>
          `:K}
        </div>

        <div class="settings-panel">
          <div class="settings-panel-header">
            <ha-icon icon="mdi:radar"></ha-icon>
            <span>Target tracking</span>
          </div>
          <div class="settings-row">
            <label>Smooth target movement</label>
            <input type="checkbox" .checked="${this._tracking.smoothingEnabled}"
                   @change="${e=>this._updateTracking({smoothingEnabled:e.target.checked})}"/>
          </div>
          <div class="setting-item">
            <label>Smoothing: ${Math.round(100*this._tracking.smoothingAlpha)}%</label>
            <input type="range" min="0.05" max="1" step="0.05" .value="${String(this._tracking.smoothingAlpha)}"
                   @input="${e=>this._updateTracking({smoothingAlpha:parseFloat(e.target.value)})}"/>
          </div>
          <div class="settings-row">
            <label>Maximum jump</label>
            <input type="number" min="100" max="5000" step="100" .value="${String(this._tracking.maxJumpMm)}"
                   @change="${e=>this._updateTracking({maxJumpMm:parseInt(e.target.value,10)||1200})}"/>
          </div>
          <div class="settings-row">
            <label>Track hold (ms)</label>
            <input type="number" min="0" max="10000" step="100" .value="${String(this._tracking.trackHoldMs)}"
                   @change="${e=>this._updateTracking({trackHoldMs:parseInt(e.target.value,10)||0})}"/>
          </div>
          <div class="settings-row">
            <label>Keep identity across zones</label>
            <input type="checkbox" .checked="${this._tracking.crossZoneTracking}"
                   @change="${e=>this._updateTracking({crossZoneTracking:e.target.checked})}"/>
          </div>
        </div>

        <!-- Detection Zones Section -->
        <div>
          <div class="section-title" style="color: #22c55e;">📍 DETECTION ZONES (${this._getZoneCountByType("detection")}/${Re.detection})</div>
          ${0===this._zones.filter(e=>"detection"===e.type).length?U`
            <p class="info-text">No detection zones yet. Draw a zone and choose "Detection".</p>
          `:U`
            <div class="zone-list">
              ${this._zones.map((e,t)=>"detection"!==e.type?"":U`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex===t?"selected":""}"
                       @click="${()=>{this._selectZone(t),this._editingZoneIndex=null,this._toolMode="zone"}}">
                    <div class="zone-color" style="background: ${Oe[e.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${e.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" @click="${e=>{e.stopPropagation(),this._editingZoneIndex=this._editingZoneIndex===t?null:t,this._selectZone(t)}}">
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

        <!-- Exclusion Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #f87171;">🚷 EXCLUSION ZONES (${this._getZoneCountByType("exclusion")}/${Re.exclusion})</div>
          ${0===this._zones.filter(e=>"exclusion"===e.type).length?U`
            <p class="info-text">No exclusion zones yet. Draw a zone and choose "Exclusion".</p>
          `:U`
            <div class="zone-list">
              ${this._zones.map((e,t)=>"exclusion"!==e.type?"":U`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex===t?"selected":""}"
                       @click="${()=>{this._selectZone(t),this._editingZoneIndex=null,this._toolMode="zone"}}">
                    <div class="zone-color" style="background: ${Oe[e.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${e.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" @click="${e=>{e.stopPropagation(),this._editingZoneIndex=this._editingZoneIndex===t?null:t,this._selectZone(t)}}">
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

        <!-- Interference Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #f59e0b;">⚡ INTERFERENCE ZONES (${this._getZoneCountByType("interference")}/${Re.interference})</div>
          ${0===this._zones.filter(e=>"interference"===e.type).length?U`
            <p class="info-text">No interference zones yet. Use these for fans, curtains and other moving objects that may create false targets.</p>
          `:U`
            <div class="zone-list">
              ${this._zones.map((e,t)=>"interference"!==e.type?"":U`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex===t?"selected":""}"
                       @click="${()=>{this._selectZone(t),this._editingZoneIndex=null,this._toolMode="zone"}}">
                    <div class="zone-color" style="background: ${Oe[e.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${e.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" @click="${e=>{e.stopPropagation(),this._editingZoneIndex=this._editingZoneIndex===t?null:t,this._selectZone(t)}}">
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
          <div class="section-title" style="color: #10b981;">🚪 ENTRY LINES (${this._getZoneCountByType("entry")}/${Re.entry})</div>
          ${0===this._zones.filter(e=>"entry"===e.type).length?U`
            <p class="info-text">No entry lines yet. Draw 2 points and choose "Entry Line" for in/out detection at doorways.</p>
          `:U`
            <div class="zone-list">
              ${this._zones.map((e,t)=>"entry"!==e.type?"":U`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex===t?"selected":""}"
                       @click="${()=>{this._selectZone(t),this._editingZoneIndex=null,this._toolMode="zone"}}">
                    <div class="zone-color" style="background: ${Oe[e.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${e.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" @click="${e=>{e.stopPropagation(),this._editingZoneIndex=this._editingZoneIndex===t?null:t,this._selectZone(t)}}">
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

        ${this._sensors.some(e=>e.deviceId)?U`
          <div class="live-status" style="border-left: 3px solid ${r>0?"#22c55e":"var(--rd-dim)"};">
            <div class="header">
              <span class="dot ${r>0?"active":"inactive"}"></span>
              <span style="font-weight: 600; color: var(--rd-text);">Live Tracking</span>
            </div>
            <div class="count" style="color: ${r>0?"#22c55e":"var(--rd-dim)"};">
              ${r} ${1===r?"person":"people"}
            </div>
            ${this._sensors.map((e,t)=>{if(!e.deviceId)return K;const i=(this._liveTargets[e.id]||[]).filter(e=>e.active).length;return U`
                <div class="live-sensor-row">
                  <span class="sensor-dot small" style="background: ${this._sensorColor(t)};">${t+1}</span>
                  <span class="live-sensor-name">${this._sensorLabel(e,t)}</span>
                  <span class="live-sensor-count">${i} active</span>
                </div>
              `})}
          </div>
        `:""}
        `}
      </div>

      <!-- Zone Type Picker Dialog -->
      ${this._showZoneTypePicker?U`
        <div class="zone-type-picker" @click="${e=>{e.target===e.currentTarget&&this._cancelZoneTypePicker()}}">
          <div class="zone-type-picker-content">
            ${2===this._pendingZonePoints.length?U`
              <!-- 2 punten: Entry Lijn of doorgaan tekenen -->
              <h3>🚪 Create an entry line?</h3>
              <p>You drew 2 points. Do you want to create an entry line for in/out detection?</p>
              <div class="zone-type-options">
                <div class="zone-type-option entry ${this._canAddZone("entry")?"":"disabled"}"
                     @click="${()=>this._canAddZone("entry")&&this._selectZoneType("entry")}">
                  <span class="icon">🚪</span>
                  <div class="info">
                    <div class="name">Entry Line</div>
                    <div class="desc">Detects whether someone walks IN or OUT</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType("entry")}/${Re.entry}</span>
                </div>
                <div class="zone-type-option continue" @click="${this._continueDrawingPolygon}">
                  <span class="icon">✏️</span>
                  <div class="info">
                    <div class="name">Continue drawing</div>
                    <div class="desc">Add more points for a polygon zone</div>
                  </div>
                  <span class="badge" style="background: rgba(100, 116, 139, 0.18); color: var(--rd-dim2);">→</span>
                </div>
              </div>
            `:U`
              <!-- 3+ punten: Polygon zone types -->
              <h3>Choose zone type</h3>
              <p>Your polygon zone is drawn! Choose what type this zone should be.</p>
              <div class="zone-type-options">
                <div class="zone-type-option detection ${this._canAddZone("detection")?"":"disabled"}"
                     @click="${()=>this._canAddZone("detection")&&this._selectZoneType("detection")}">
                  <span class="icon">📍</span>
                  <div class="info">
                    <div class="name">Detection Zone</div>
                    <div class="desc">Detects motion/presence</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType("detection")}/${Re.detection}</span>
                </div>
                <div class="zone-type-option exclusion ${this._canAddZone("exclusion")?"":"disabled"}"
                     @click="${()=>this._canAddZone("exclusion")&&this._selectZoneType("exclusion")}">
                  <span class="icon">🚷</span>
                  <div class="info">
                    <div class="name">Exclusion Zone</div>
                    <div class="desc">Ignores motion in this area</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType("exclusion")}/${Re.exclusion}</span>
                </div>
                <div class="zone-type-option interference ${this._canAddZone("interference")?"":"disabled"}"
                     @click="${()=>this._canAddZone("interference")&&this._selectZoneType("interference")}">
                  <span class="icon">⚡</span>
                  <div class="info">
                    <div class="name">Interference Zone</div>
                    <div class="desc">Filters fans, curtains and other moving objects</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType("interference")}/${Re.interference}</span>
                </div>
              </div>
            `}
            <button class="zone-type-picker-cancel" @click="${this._cancelZoneTypePicker}">Cancel</button>
          </div>
        </div>
      `:""}

      ${this._showNewRoomDialog?U`
        <div class="dialog-overlay" @click="${()=>this._showNewRoomDialog=!1}">
          <div class="dialog" @click="${e=>e.stopPropagation()}">
            <h3>New Room</h3>
            <label>Room name *</label>
            <input type="text" placeholder="e.g. Living room" .value="${this._newRoomName}"
              @input="${e=>this._newRoomName=e.target.value}"
              @keydown="${e=>"Enter"===e.key&&this._createNewRoom()}" autofocus/>
            <p class="help-text" style="margin-top: 8px;">Optional: dimensions for a rectangular room (leave empty to draw manually)</p>
            <div class="input-row">
              <div>
                <label>Width (cm)</label>
                <input type="number" placeholder="e.g. 400" .value="${this._newRoomWidth||""}"
                  @input="${e=>this._newRoomWidth=parseInt(e.target.value)||0}"/>
              </div>
              <div>
                <label>Length (cm)</label>
                <input type="number" placeholder="e.g. 500" .value="${this._newRoomLength||""}"
                  @input="${e=>this._newRoomLength=parseInt(e.target.value)||0}"/>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${()=>this._showNewRoomDialog=!1}">Cancel</button>
              <button class="dialog-btn primary" @click="${this._createNewRoom}">${this._newRoomWidth>0&&this._newRoomLength>0?"Create with dimensions":"Create (draw manually)"}</button>
            </div>
          </div>
        </div>
      `:""}

      ${this._showFurnitureDialog&&this._selectedFurnitureType?U`
        <div class="dialog-overlay" @click="${()=>this._showFurnitureDialog=!1}">
          <div class="dialog" @click="${e=>e.stopPropagation()}">
            <h3>Place ${this._selectedFurnitureType.name}</h3>
            <p class="help-text">Enter the dimensions (top view)</p>
            <div class="input-row">
              <div>
                <label>Width (cm)</label>
                <input type="number" min="10" max="500" .value="${String(this._furnitureWidth/10)}"
                  @input="${e=>this._furnitureWidth=10*(parseInt(e.target.value)||100)}"/>
              </div>
              <div>
                <label>Depth (cm)</label>
                <input type="number" min="10" max="500" .value="${String(this._furnitureHeight/10)}"
                  @input="${e=>this._furnitureHeight=10*(parseInt(e.target.value)||100)}"/>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${()=>this._showFurnitureDialog=!1}">Cancel</button>
              <button class="dialog-btn primary" @click="${this._placeFurniture}">Place</button>
            </div>
          </div>
        </div>
      `:""}

      ${this._showDoorDialog?U`
        <div class="dialog-overlay" @click="${this._hideDoorDialog}">
          <div class="dialog" @click="${e=>e.stopPropagation()}">
            <h3>${null!==this._editingDoorIndex?"Edit Door":"Add Door"}</h3>
            <label>Width (cm)</label>
            <input type="number" .value="${String(this._doorWidth/10)}"
              @input="${e=>this._doorWidth=10*(parseInt(e.target.value)||90)}"/>
            <label>Opening direction</label>
            <select .value="${this._doorOpenDirection}" @change="${e=>this._doorOpenDirection=e.target.value}">
              <option value="inward">Inward</option>
              <option value="outward">Outward</option>
            </select>
            <label>Hinge side</label>
            <select .value="${this._doorOpenSide}" @change="${e=>this._doorOpenSide=e.target.value}">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideDoorDialog}">Cancel</button>
              <button class="dialog-btn primary" @click="${null!==this._editingDoorIndex?this._saveDoorEdit:this._addDoor}">${null!==this._editingDoorIndex?"Save":"Add"}</button>
            </div>
          </div>
        </div>
      `:""}

      ${this._showWindowDialog?U`
        <div class="dialog-overlay" @click="${this._hideWindowDialog}">
          <div class="dialog" @click="${e=>e.stopPropagation()}">
            <h3>${null!==this._editingWindowIndex?"Edit Window":"Add Window"}</h3>
            <div class="input-row">
              <div>
                <label>Width (cm)</label>
                <input type="number" .value="${String(this._windowWidth/10)}"
                  @input="${e=>this._windowWidth=10*(parseInt(e.target.value)||120)}"/>
              </div>
              <div>
                <label>Height (cm)</label>
                <input type="number" .value="${String(this._windowHeight/10)}"
                  @input="${e=>this._windowHeight=10*(parseInt(e.target.value)||100)}"/>
              </div>
            </div>
            <label>Window type</label>
            <select .value="${this._windowType}" @change="${e=>this._windowType=e.target.value}">
              <option value="fixed">Fixed window</option>
              <option value="open">Casement window</option>
              <option value="tilt">Tilt window</option>
            </select>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideWindowDialog}">Cancel</button>
              <button class="dialog-btn primary" @click="${null!==this._editingWindowIndex?this._saveWindowEdit:this._addWindow}">${null!==this._editingWindowIndex?"Save":"Add"}</button>
            </div>
          </div>
        </div>
      `:""}

      ${this._showCoverageCalibration&&this._selectedSensor?U`
        <shs-sensor-coverage-calibration
          .targets="${this._liveTargets[this._selectedSensor.id]||[]}"
          .initialCorners="${this._calibration.sensorId===this._selectedSensor.id?this._calibration.corners.map(e=>this._worldToSensorLocal(this._selectedSensor,e)):[]}"
          .range="${this._selectedSensor.range}"
          .fov="${this._selectedSensor.fov}"
          .mountingMode="${this._selectedSensor.mountingMode}"
          .sensorName="${this._sensorLabel(this._selectedSensor,this._selectedSensorIndex)}"
          @calibration-cancel="${()=>this._showCoverageCalibration=!1}"
          @calibration-save="${this._saveCoverageCalibration}"
        ></shs-sensor-coverage-calibration>
      `:K}
    `}};qe.styles=n`
    :host {
      /* Room Designer theme tokens: follow the active HA theme. The old
         hardcoded slate palette only suited dark mode. */
      --rd-deep: var(--secondary-background-color, #0f172a);
      --rd-panel: var(--card-background-color, #1e293b);
      --rd-line: var(--divider-color, #334155);
      --rd-line-strong: var(--divider-color, #475569);
      --rd-dim: var(--secondary-text-color, #64748b);
      --rd-dim2: var(--secondary-text-color, #94a3b8);
      --rd-text: var(--primary-text-color, #e2e8f0);
    }
    :host { display: grid; grid-template-columns: 280px 1fr 280px; gap: 16px; padding: 20px; height: calc(100vh - 100px); box-sizing: border-box; background: var(--rd-deep); }
    .sidebar { background: var(--rd-panel); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
    .section-title { font-size: 11px; font-weight: 600; color: var(--rd-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .room-list { display: flex; flex-direction: column; gap: 6px; }
    .room-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .room-item:hover { border-color: var(--rd-line-strong); }
    .room-item.selected { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .room-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--rd-line); border-radius: 6px; }
    .room-icon ha-icon { --mdc-icon-size: 18px; color: var(--rd-dim2); }
    .room-name { flex: 1; font-size: 13px; color: var(--rd-text); font-weight: 500; }
    .tool-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .tool-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .tool-btn:hover { border-color: var(--rd-line-strong); background: var(--rd-panel); }
    .tool-btn.active { border-color: #4361ee; background: rgba(67, 97, 238, 0.15); }
    .tool-btn ha-icon { --mdc-icon-size: 24px; color: var(--rd-dim2); }
    .tool-btn.active ha-icon { color: #4361ee; }
    .tool-btn span { font-size: 11px; color: var(--rd-dim2); }
    .tool-btn.active span { color: #4361ee; }
    .canvas-area { background: var(--rd-panel); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .canvas-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; background: var(--rd-deep); border-bottom: 1px solid var(--rd-line); }
    .header-group { display: flex; align-items: center; gap: 8px; }
    .room-label { font-size: 13px; color: var(--rd-dim2); }
    .room-label span { color: var(--rd-text); font-weight: 600; }
    .save-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--rd-line); border: none; border-radius: 8px; color: var(--rd-dim2); font-size: 13px; font-weight: 600; cursor: default; }
    .save-btn.dirty { background: #22c55e; color: white; cursor: pointer; }
    .save-btn.dirty:hover { background: #16a34a; }
    .push-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: 1px solid #3b82f6; border-radius: 8px; color: #3b82f6; font-size: 13px; font-weight: 600; cursor: pointer; }
    .push-btn:disabled { border-color: var(--rd-line-strong); color: var(--rd-dim); cursor: not-allowed; }
    .push-btn:hover:not(:disabled) { background: rgba(59, 130, 246, 0.12); }
    svg { flex: 1; background: var(--rd-deep); cursor: crosshair; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--rd-dim); }
    .empty-state ha-icon { --mdc-icon-size: 64px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { margin: 0 0 8px 0; color: var(--rd-dim2); }
    .grid-line { stroke: var(--rd-line); stroke-width: 0.5; opacity: 0.6; }
    .grid-line.major { stroke: var(--rd-panel); stroke-width: 1; }
    .wall-line { stroke: var(--rd-line-strong); stroke-width: 3; stroke-linecap: round; }
    .canvas-controls { position: absolute; bottom: 16px; left: 16px; display: flex; gap: 8px; }
    .control-group { display: flex; background: var(--rd-panel); border-radius: 8px; overflow: hidden; border: 1px solid var(--rd-line); }
    .control-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: var(--rd-dim2); cursor: pointer; }
    .control-btn:hover { background: var(--rd-line); color: var(--rd-text); }
    .instructions { background: var(--rd-deep); border-radius: 10px; padding: 14px; }
    .instructions-title { font-size: 13px; font-weight: 600; color: #4361ee; margin-bottom: 6px; }
    .instructions-text { font-size: 12px; color: var(--rd-dim2); line-height: 1.5; }
    .setting-item { margin-bottom: 12px; }
    .setting-item label { display: block; font-size: 12px; color: var(--rd-dim2); margin-bottom: 4px; }
    .setting-item input[type="range"] { width: 100%; }
    .settings-panel { padding: 12px; margin-bottom: 14px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 10px; }
    .settings-panel-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: var(--rd-text); font-size: 13px; font-weight: 600; }
    .settings-panel-header ha-icon { --mdc-icon-size: 18px; color: #4361ee; }
    .settings-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; margin-top: 10px; }
    .settings-row label { color: var(--rd-dim2); font-size: 12px; }
    .settings-row input[type="number"], .corner-row input { width: 82px; padding: 7px 8px; box-sizing: border-box; border: 1px solid var(--rd-line); border-radius: 6px; background: var(--rd-panel); color: var(--rd-text); }
    .settings-row select { width: 120px; }
    .settings-row input[type="checkbox"] { width: 18px; height: 18px; accent-color: #4361ee; }
    .corner-grid { display: grid; gap: 6px; margin-top: 10px; }
    .corner-row { display: grid; grid-template-columns: 28px 1fr 1fr; gap: 6px; align-items: center; color: var(--rd-dim2); font-size: 11px; }
    .corner-row input { width: 100%; }
    .secondary-action { display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 10px; padding: 8px; border: 1px solid var(--rd-line-strong); border-radius: 7px; background: transparent; color: var(--rd-text); cursor: pointer; font-size: 12px; }
    .secondary-action:hover { border-color: #4361ee; color: #4361ee; }
    .secondary-action:disabled { opacity: 0.45; cursor: not-allowed; }
    .secondary-action ha-icon { --mdc-icon-size: 16px; }
    .coverage-summary { display: flex; align-items: flex-start; gap: 9px; margin-top: 10px; padding: 10px; border: 1px solid var(--rd-line); border-radius: 8px; background: var(--rd-panel); }
    .coverage-summary ha-icon { --mdc-icon-size: 18px; flex: 0 0 auto; margin-top: 1px; color: var(--rd-dim); }
    .coverage-summary.calibrated ha-icon { color: #22c55e; }
    .coverage-summary strong, .coverage-summary span { display: block; }
    .coverage-summary strong { color: var(--rd-text); font-size: 12px; }
    .coverage-summary span { margin-top: 2px; color: var(--rd-dim); font-size: 11px; line-height: 1.4; }
    .calibration-details { margin-top: 10px; color: var(--rd-dim2); font-size: 11px; }
    .calibration-details summary { cursor: pointer; }
    select { width: 100%; padding: 8px 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 6px; color: var(--rd-text); font-size: 13px; }
    .info-text { color: var(--rd-dim); font-size: 12px; line-height: 1.5; }
    .firmware-status { margin-top: 10px; padding: 10px; border: 1px solid var(--rd-border); border-radius: 8px; background: var(--rd-deep); }
    .firmware-status-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; }
    .firmware-status-row + .firmware-status-row { margin-top: 6px; }
    .firmware-status-value { color: var(--rd-text); font-weight: 600; text-align: right; }
    .firmware-status-note { margin: 8px 0 0; color: var(--rd-dim); font-size: 11px; line-height: 1.4; }
    .firmware-status-note.warning { color: #f59e0b; }
    .sensor-list { display: flex; flex-direction: column; gap: 6px; }
    .sensor-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; cursor: pointer; }
    .sensor-item:hover { border-color: var(--rd-line-strong); }
    .sensor-item.selected { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .sensor-dot { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .sensor-dot.small { width: 18px; height: 18px; font-size: 10px; }
    .sensor-item-info { flex: 1; min-width: 0; }
    .sensor-item-name { font-size: 13px; color: var(--rd-text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sensor-item-sub { font-size: 11px; color: var(--rd-dim); }
    .add-sensor-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 2px dashed var(--rd-line-strong); border-radius: 8px; background: transparent; color: var(--rd-dim2); font-size: 13px; cursor: pointer; }
    .add-sensor-btn:hover { border-color: #4361ee; color: #4361ee; }
    .add-sensor-btn ha-icon { --mdc-icon-size: 16px; }
    .live-sensor-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; }
    .live-sensor-name { flex: 1; color: var(--rd-dim2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .live-sensor-count { color: var(--rd-text); font-weight: 600; }
    .mode-toggle { display: flex; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; overflow: hidden; }
    .mode-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: none; color: var(--rd-dim2); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .mode-btn:hover { color: var(--rd-text); }
    .mode-btn.active { background: #4361ee; color: white; }
    .mode-btn ha-icon { --mdc-icon-size: 16px; }
    .add-room-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 2px dashed var(--rd-line-strong); border-radius: 8px; background: transparent; color: var(--rd-dim2); font-size: 13px; cursor: pointer; }
    .add-room-btn:hover { border-color: #4361ee; color: #4361ee; }
    .add-room-btn ha-icon { --mdc-icon-size: 16px; }
    .furniture-grid { display: flex; flex-direction: column; gap: 6px; }
    .furniture-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; cursor: pointer; }
    .furniture-item:hover { border-color: #4361ee; }
    .furniture-item.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .furniture-item ha-icon { --mdc-icon-size: 20px; color: var(--rd-dim2); }
    .furniture-item span { flex: 1; font-size: 13px; color: var(--rd-text); }
    .furniture-item small { font-size: 11px; color: var(--rd-dim); }
    .placed-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; margin-bottom: 6px; font-size: 12px; }
    .placed-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .placed-item ha-icon { --mdc-icon-size: 18px; color: var(--rd-dim); }
    .placed-item .name { flex: 1; color: var(--rd-text); }
    .placed-item .size { color: var(--rd-dim); }
    .icon-btn { background: none; border: none; color: var(--rd-dim2); cursor: pointer; padding: 4px; }
    .icon-btn:hover { color: var(--rd-text); }
    .icon-btn ha-icon { --mdc-icon-size: 16px; }
    .selected-panel { background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 10px; padding: 12px; }
    .selected-panel input { width: 100%; padding: 8px; background: var(--rd-panel); border: 1px solid var(--rd-line); border-radius: 6px; color: var(--rd-text); box-sizing: border-box; }
    .selected-panel label { display: block; font-size: 11px; color: var(--rd-dim2); margin-bottom: 4px; }
    .panel-btn-row { display: flex; gap: 8px; margin-top: 10px; }
    .panel-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: 8px; border: 1px solid var(--rd-line); background: transparent; color: var(--rd-text); font-size: 12px; cursor: pointer; }
    .panel-btn:hover { border-color: #4361ee; }
    .panel-btn.danger { color: #ef4444; }
    .panel-btn.danger:hover { border-color: #ef4444; }
    .panel-btn ha-icon { --mdc-icon-size: 16px; }
    .input-row { display: flex; gap: 12px; }
    .input-row > div { flex: 1; }
    .dialog-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: var(--rd-panel); border: 1px solid var(--rd-line); border-radius: 16px; padding: 24px; min-width: 340px; max-width: 420px; }
    .dialog h3 { margin: 0 0 16px; font-size: 16px; color: var(--rd-text); }
    .dialog label { display: block; font-size: 12px; color: var(--rd-dim2); margin: 10px 0 4px; }
    .dialog input, .dialog select { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--rd-line-strong); background: var(--rd-deep); color: var(--rd-text); font-size: 13px; box-sizing: border-box; }
    .dialog input:focus, .dialog select:focus { outline: none; border-color: #4361ee; }
    .dialog-buttons { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .dialog-btn { padding: 10px 18px; border-radius: 8px; font-size: 13px; cursor: pointer; border: none; }
    .dialog-btn.cancel { background: transparent; border: 1px solid var(--rd-line-strong); color: var(--rd-dim2); }
    .dialog-btn.primary { background: #4361ee; color: white; }
    .remove-sensor-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 8px; margin-top: 4px; background: transparent; border: 1px solid var(--rd-line); border-radius: 6px; color: #ef4444; font-size: 12px; cursor: pointer; }
    .remove-sensor-btn:hover { border-color: #ef4444; }
    .remove-sensor-btn ha-icon { --mdc-icon-size: 16px; }
    .live-status { margin: 12px 0; padding: 12px; background: var(--rd-deep); border-radius: 8px; }
    .live-status .header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .live-status .dot { width: 10px; height: 10px; border-radius: 50%; }
    .live-status .dot.active { background: #22c55e; animation: pulse 1s infinite; }
    .live-status .dot.inactive { background: var(--rd-dim); }
    .live-status .count { font-size: 24px; font-weight: bold; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .zone-list { display: flex; flex-direction: column; gap: 6px; }
    .zone-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; cursor: pointer; }
    .zone-item:hover { border-color: var(--rd-line-strong); }
    .zone-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .zone-color { width: 14px; height: 14px; border-radius: 4px; }
    .zone-info { flex: 1; }
    .zone-name { font-size: 13px; color: var(--rd-text); font-weight: 500; }
    .zone-type { font-size: 11px; color: var(--rd-dim); }
    .zone-actions { display: flex; gap: 4px; }
    .edit-btn { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 4px; }
    .edit-btn:hover { color: #60a5fa; }
    .delete-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; }
    .delete-btn:hover { color: #f87171; }
    .zone-edit-form { background: var(--rd-deep); border: 1px solid #3b82f6; border-radius: 8px; padding: 12px; margin-top: 8px; }
    .zone-edit-form label { display: block; font-size: 11px; color: var(--rd-dim2); margin-bottom: 4px; text-transform: uppercase; }
    .zone-edit-form input { width: 100%; padding: 8px; background: var(--rd-panel); border: 1px solid var(--rd-line); border-radius: 6px; color: var(--rd-text); font-size: 13px; margin-bottom: 10px; box-sizing: border-box; }
    .zone-edit-form input:focus { outline: none; border-color: #3b82f6; }
    .type-switch { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
    .type-switch button { flex: 1; min-width: 70px; padding: 6px 4px; border: 2px solid var(--rd-line); border-radius: 6px; background: var(--rd-panel); color: var(--rd-dim2); font-size: 11px; cursor: pointer; transition: all 0.15s; }
    .type-switch button.active { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .type-switch button.exclusion.active { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .type-switch button.entry.active { border-color: #10b981; background: rgba(16, 185, 129, 0.1); color: #10b981; }
    /* Direction toggle voor entry lijnen */
    .direction-toggle { display: flex; gap: 6px; margin-bottom: 12px; }
    .direction-toggle button { flex: 1; padding: 10px 8px; border: 2px solid var(--rd-line); border-radius: 8px; background: var(--rd-panel); color: var(--rd-dim2); font-size: 12px; cursor: pointer; transition: all 0.15s; }
    .direction-toggle button:hover { border-color: var(--rd-line-strong); }
    .direction-toggle button.active.in { border-color: #22c55e; background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .help-text { font-size: 11px; color: var(--rd-dim); margin: 0 0 12px 0; line-height: 1.4; }
    /* Zone Type Picker Dialog */
    .zone-type-picker { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .zone-type-picker-content { background: var(--rd-panel); border-radius: 16px; padding: 24px; max-width: 320px; width: 90%; border: 1px solid var(--rd-line); }
    .zone-type-picker h3 { margin: 0 0 8px 0; font-size: 16px; color: var(--rd-text); }
    .zone-type-picker p { margin: 0 0 20px 0; font-size: 13px; color: var(--rd-dim2); }
    .zone-type-options { display: flex; flex-direction: column; gap: 10px; }
    .zone-type-option { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--rd-deep); border: 2px solid var(--rd-line); border-radius: 10px; cursor: pointer; transition: all 0.15s; }
    .zone-type-option:hover:not(.disabled) { border-color: var(--rd-line-strong); background: var(--rd-panel); }
    .zone-type-option.disabled { opacity: 0.4; cursor: not-allowed; }
    .zone-type-option .icon { font-size: 24px; }
    .zone-type-option .info { flex: 1; }
    .zone-type-option .name { font-size: 14px; font-weight: 600; color: var(--rd-text); }
    .zone-type-option .desc { font-size: 11px; color: var(--rd-dim); }
    .zone-type-option .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .zone-type-option.detection .badge { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .zone-type-option.exclusion .badge { background: rgba(248, 113, 113, 0.2); color: #f87171; }
    .zone-type-option.entry .badge { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
    .zone-type-option.interference .badge { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .zone-type-option.disabled .badge { background: rgba(100, 116, 139, 0.18); color: var(--rd-dim); }
    .zone-type-picker-cancel { width: 100%; margin-top: 16px; padding: 12px; background: var(--rd-line); border: none; border-radius: 8px; color: var(--rd-dim2); font-size: 13px; cursor: pointer; }
    .zone-type-picker-cancel:hover { background: var(--rd-line-strong); color: var(--rd-text); }
    .edit-actions { display: flex; gap: 6px; }
    .edit-actions button { flex: 1; padding: 8px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; }
    .edit-actions .save-btn { background: #22c55e; color: white; }
    .edit-actions .cancel-btn { background: var(--rd-line); color: var(--rd-dim2); }
    .zone-type-select { display: flex; gap: 8px; margin-bottom: 12px; }
    .zone-type-btn { flex: 1; padding: 10px; border: 2px solid var(--rd-line); border-radius: 8px; background: var(--rd-deep); cursor: pointer; text-align: center; }
    .zone-type-btn.active { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .zone-type-btn span { display: block; font-size: 12px; color: var(--rd-dim2); margin-top: 4px; }
    .zone-type-btn.active span { color: #4361ee; }
    @media (max-width: 1200px) { :host { grid-template-columns: 240px 1fr; } .sidebar-right { grid-column: 1 / -1; max-height: 45vh; overflow-y: auto; } }
    .view-toggle { display: flex; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; overflow: hidden; }
    .view-toggle-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: none; color: var(--rd-dim2); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .view-toggle-btn:hover { background: rgba(67, 97, 238, 0.1); color: #4361ee; }
    .view-toggle-btn.active { background: #4361ee; color: white; }
    .view-toggle-btn ha-icon { --mdc-icon-size: 16px; }
    .canvas3d { flex: 1; display: block; cursor: grab; background: var(--rd-deep); }
    .canvas3d:active { cursor: grabbing; }
    .view3d-info { position: absolute; bottom: 16px; left: 16px; background: var(--rd-panel); border: 1px solid var(--rd-line); border-radius: 8px; padding: 10px 14px; z-index: 10; font-size: 12px; color: var(--rd-dim2); }
  `,e([ge({attribute:!1})],qe.prototype,"hass",void 0),e([ge({type:Array})],qe.prototype,"rooms",void 0),e([me()],qe.prototype,"_selectedRoomId",void 0),e([me()],qe.prototype,"_roomPoints",void 0),e([me()],qe.prototype,"_furniture",void 0),e([me()],qe.prototype,"_doors",void 0),e([me()],qe.prototype,"_windows",void 0),e([me()],qe.prototype,"_sensors",void 0),e([me()],qe.prototype,"_selectedSensorIndex",void 0),e([me()],qe.prototype,"_draggingSensorIndex",void 0),e([me()],qe.prototype,"_zones",void 0),e([me()],qe.prototype,"_selectedZoneIndex",void 0),e([me()],qe.prototype,"_selectedZonePartIndex",void 0),e([me()],qe.prototype,"_appendToZoneIndex",void 0),e([me()],qe.prototype,"_calibration",void 0),e([me()],qe.prototype,"_showCoverageCalibration",void 0),e([me()],qe.prototype,"_tracking",void 0),e([me()],qe.prototype,"_drawingZone",void 0),e([me()],qe.prototype,"_newZoneType",void 0),e([me()],qe.prototype,"_showZoneTypePicker",void 0),e([me()],qe.prototype,"_pendingZonePoints",void 0),e([me()],qe.prototype,"_draggingZonePointIndex",void 0),e([me()],qe.prototype,"_draggingDrawingPointIndex",void 0),e([me()],qe.prototype,"_draggingWholeZoneIndex",void 0),e([me()],qe.prototype,"_dragStartPos",void 0),e([me()],qe.prototype,"_zoneMidpointPreview",void 0),e([me()],qe.prototype,"_editingZoneIndex",void 0),e([me()],qe.prototype,"_liveTargets",void 0),e([me()],qe.prototype,"_entryExitEnabled",void 0),e([me()],qe.prototype,"_assumedPresent",void 0),e([me()],qe.prototype,"_pushingToSensor",void 0),e([me()],qe.prototype,"_toolMode",void 0),e([me()],qe.prototype,"_zoom",void 0),e([me()],qe.prototype,"_panOffset",void 0),e([me()],qe.prototype,"_cursorPos",void 0),e([me()],qe.prototype,"_saving",void 0),e([me()],qe.prototype,"_isDragging",void 0),e([me()],qe.prototype,"_dirty",void 0),e([me()],qe.prototype,"_designMode",void 0),e([me()],qe.prototype,"_pendingStart",void 0),e([me()],qe.prototype,"_previewPoint",void 0),e([me()],qe.prototype,"_wallHoverPreview",void 0),e([me()],qe.prototype,"_draggingPointIndex",void 0),e([me()],qe.prototype,"_selectedFurnitureType",void 0),e([me()],qe.prototype,"_showFurnitureDialog",void 0),e([me()],qe.prototype,"_furnitureWidth",void 0),e([me()],qe.prototype,"_furnitureHeight",void 0),e([me()],qe.prototype,"_selectedFurnitureIndex",void 0),e([me()],qe.prototype,"_draggingFurnitureIndex",void 0),e([me()],qe.prototype,"_draggingDoorIndex",void 0),e([me()],qe.prototype,"_draggingWindowIndex",void 0),e([me()],qe.prototype,"_doorWindowPreview",void 0),e([me()],qe.prototype,"_showDoorDialog",void 0),e([me()],qe.prototype,"_showWindowDialog",void 0),e([me()],qe.prototype,"_editingDoorIndex",void 0),e([me()],qe.prototype,"_editingWindowIndex",void 0),e([me()],qe.prototype,"_selectedWallIndex",void 0),e([me()],qe.prototype,"_doorWidth",void 0),e([me()],qe.prototype,"_doorOpenDirection",void 0),e([me()],qe.prototype,"_doorOpenSide",void 0),e([me()],qe.prototype,"_windowWidth",void 0),e([me()],qe.prototype,"_windowHeight",void 0),e([me()],qe.prototype,"_windowType",void 0),e([me()],qe.prototype,"_showNewRoomDialog",void 0),e([me()],qe.prototype,"_newRoomName",void 0),e([me()],qe.prototype,"_newRoomWidth",void 0),e([me()],qe.prototype,"_newRoomLength",void 0),e([ve("svg")],qe.prototype,"_svg",void 0),e([ve("#canvas3d")],qe.prototype,"_canvas3d",void 0),e([me()],qe.prototype,"_viewMode",void 0),e([me()],qe.prototype,"_pushingToESPHome",void 0),qe=e([he("shs-zones-page")],qe);let Ke=class extends le{constructor(){super(...arguments),this._account=null,this._apiKeyInput="",this._baseUrlInput="",this._showAdvanced=!1,this._savingKey=!1,this._showKeyForm=!1,this._syncing=!1,this._contracts=[],this._locations=[],this._error=null}connectedCallback(){super.connectedCallback(),this._load()}async _callWS(e,t=2e4){let i;try{return await Promise.race([this.hass.callWS(e),new Promise((e,o)=>{i=window.setTimeout(()=>o(new Error("The connection check timed out.")),t)})])}finally{void 0!==i&&window.clearTimeout(i)}}_picksLoadable(e){return"ok"===e||"no_contract"===e}async _load(){try{this._account=await this._callWS({type:"smarthomeshop/account"},8e3),this._baseUrlInput=this._account?.base_url||"",this._picksLoadable(this._account?.status)&&this._loadContracts(),this._startRefreshFollow()}catch(e){console.error("account load failed",e)}}async _loadContracts(){try{const e=await this._callWS({type:"smarthomeshop/account/contracts"},8e3);this._contracts=e.contracts||[],this._locations=e.locations||[]}catch(e){console.error("contracts load failed",e)}}async _selectContract(e){if(!this._savingKey){this._savingKey=!0,this._error=null;try{this._account=await this._callWS({type:"smarthomeshop/account/set",contract_id:e},12e3),this._picksLoadable(this._account?.status)&&this._loadContracts(),this._notifyAccountChanged(),this._startRefreshFollow()}catch(e){console.error("select contract failed",e),this._error=e instanceof Error?e.message:"Could not select the contract.",this._resetSelect(".js-contract-select",this._account?.contract_id)}finally{this._savingKey=!1}}}_pinnedContractName(){const e=this._account?.contract_id;if(!e)return"";const t=this._contracts.find(t=>String(t.id)===String(e));return t?.name||""}_resetSelect(e,t){const i=this.renderRoot?.querySelector(e);i&&(i.value=null==t?"":String(t))}async _selectLocation(e){if(!this._savingKey){this._savingKey=!0,this._error=null;try{this._account=await this._callWS({type:"smarthomeshop/account/set",location_id:e,contract_id:null},12e3),this._picksLoadable(this._account?.status)&&this._loadContracts(),this._notifyAccountChanged(),this._startRefreshFollow()}catch(e){console.error("select location failed",e),this._error=e instanceof Error?e.message:"Could not select the location.",this._resetSelect(".js-location-select",this._account?.contract_id?"__pinned":this._account?.location_id)}finally{this._savingKey=!1}}}async _save(){if(!this._savingKey){this._savingKey=!0,this._error=null;try{const e={type:"smarthomeshop/account/set",base_url:this._baseUrlInput.trim()},t=this._apiKeyInput.trim();t&&(e.api_key=t),this._account=await this._callWS(e,12e3),this._apiKeyInput="",this._showKeyForm="ok"!==this._account?.status,this._picksLoadable(this._account?.status)&&this._loadContracts(),this._notifyAccountChanged(),this._startRefreshFollow()}catch(e){console.error("account save failed",e),this._error=e instanceof Error?e.message:"Could not save - please try again."}finally{this._savingKey=!1}}}async _syncNow(){if(!this._syncing){this._syncing=!0,this._error=null;try{const e=await this._callWS({type:"smarthomeshop/account/refresh"},12e3);this._account=await this._waitForRefresh(e),this._picksLoadable(this._account?.status)&&this._loadContracts(),this._notifyAccountChanged()}catch(e){console.error("sync failed",e),this._error=e instanceof Error?e.message:"Could not refresh prices."}finally{this._syncing=!1}}}_startRefreshFollow(){this._account?.refreshing&&!this._refreshFollow&&(this._syncing=!0,this._refreshFollow=this._waitForRefresh(this._account).then(e=>{this._account=e,this._picksLoadable(e?.status)&&this._loadContracts(),this._notifyAccountChanged()}).catch(e=>console.warn("price refresh status polling failed",e)).finally(()=>{this._syncing=!1,this._refreshFollow=void 0}))}async _waitForRefresh(e){let t=e;const i=Date.now()+45e3;let o;for(;t?.refreshing&&this.isConnected&&Date.now()<i;){await new Promise(e=>window.setTimeout(e,1500));try{t=await this._callWS({type:"smarthomeshop/account"},8e3),this._account=t,o=void 0}catch(e){o=e}}if(t?.refreshing&&o)throw o;return t}_moreInfo(e){e&&this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:e},bubbles:!0,composed:!0}))}_notifyAccountChanged(){this.dispatchEvent(new CustomEvent("account-changed",{detail:{account:this._account},bubbles:!0,composed:!0}))}_chip(e,t,i){return U`
      <div class="chip ${i?"clickable":""}"
        title=${i?"Open in Home Assistant":""}
        @click=${()=>this._moreInfo(i)}>
        <div class="chip-label">${e}</div>
        <div class="chip-value">${t}</div>
      </div>`}_hm(e){try{return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}catch{return""}}_lastSyncedLabel(e){try{const t=new Date(e).getTime(),i=Math.floor((Date.now()-t)/6e4);return i<=0?"just now":i<60?`${i} min ago`:`at ${this._hm(e)}`}catch{return""}}async _disconnect(){this._savingKey=!0,this._error=null;try{this._account=await this._callWS({type:"smarthomeshop/account/set",api_key:null}),this._notifyAccountChanged()}catch(e){console.error("disconnect failed",e),this._error=e instanceof Error?e.message:"Could not disconnect - please try again."}finally{this._savingKey=!1}}render(){const e=this._account,t=e?.status||"unconfigured",i=e?.current,o={unconfigured:"Connect once here to use live dynamic spot prices across SmartHomeShop Energy. The integration keeps working locally without an account.",connecting:"Checking your API key and loading dynamic energy prices...",ok:"Connected - live prices are being fetched.",no_contract:"Connected, but the selected location has no active energy contract yet, so there are no prices to show.",unauthorized:"That API key is invalid or was revoked.",forbidden:"The price service rejected this key. Create a new API token in your account.",error:"Could not reach the price service. Check your connection and try again."},s="ok"===t?"ok":"unconfigured"===t?"":"alert";return U`
      <div class="card">
        <div class="head">
          <ha-icon icon="mdi:flash"></ha-icon>
          <span class="head-title">Dynamic energy prices</span>
          <span class="optional">Optional</span>
        </div>
        <div class="body">
          <div class="status">
            <div class="status-icon ${s}"><ha-icon icon="mdi:cloud-outline"></ha-icon></div>
            <div class="status-text">
              ${e?.has_key?U`<span class="status-badge ${"ok"===s?"ok":"alert"}">${{ok:"Connected",no_contract:"No contract"}[t]||t}</span>`:K}
              ${"error"===t&&e?.last_error?e.last_error:o[t]||o.error}
            </div>
          </div>

          ${this._error?U`
            <div class="error-banner">
              <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
              <span>${this._error}</span>
            </div>
          `:K}

          ${this._picksLoadable(t)&&this._locations.length>0?U`
            <div class="contract-row">
              <label>Location</label>
              <select class="js-location-select" ?disabled=${this._savingKey}
                @change=${e=>this._selectLocation(e.target.value)}>
                ${e?.contract_id?U`
                  <option value="__pinned" selected disabled>
                    Pinned contract${this._pinnedContractName()?` · ${this._pinnedContractName()}`:""}
                  </option>`:K}
                <option value="" ?selected=${!e?.location_id&&!e?.contract_id}>Active contract (automatic)</option>
                ${this._locations.map(t=>U`
                  <option value=${String(t.id)} ?selected=${String(e?.location_id)===String(t.id)&&!e?.contract_id}>
                    ${t.name}${t.active_contract?` · ${t.active_contract.name}${t.active_contract.provider?` (${t.active_contract.provider})`:""}`:" · no active contract"}
                  </option>`)}
              </select>
            </div>
            <div class="hint">
              ${e?.contract_id?U`SmartHomeShop Energy is pinned to a specific contract. Pick a location above to follow its active contract instead.`:e?.location_id?U`Prices follow the active contract for this location and update by themselves when you change it in your SmartHomeShop account.`:U`<b>Active contract (automatic)</b> follows whichever contract is active in your SmartHomeShop account. Pick a location to always follow that location's active contract, so prices update by themselves when you switch contracts there.`}
            </div>
            ${"no_contract"===t?U`
              <div class="warn">
                This location has no active energy contract, so no prices are shown. Add or
                activate a contract for it in your SmartHomeShop account, or pick another location.
              </div>`:K}
          `:this._picksLoadable(t)&&this._contracts.length>0?U`
            <div class="contract-row">
              <label>Contract</label>
              <select class="js-contract-select" ?disabled=${this._savingKey}
                @change=${e=>this._selectContract(e.target.value)}>
                <option value="" ?selected=${!e?.contract_id}>Active contract (automatic)</option>
                ${this._contracts.map(t=>U`
                  <option value=${String(t.id)} ?selected=${String(e?.contract_id)===String(t.id)}>
                    ${t.name}${t.supplier?` · ${t.supplier}`:""}
                  </option>`)}
              </select>
            </div>
            <div class="hint">
              ${e?.contract_id?U`SmartHomeShop Energy is pinned to a specific contract. Choose <b>Active contract (automatic)</b> to always follow the active contract in your account instead.`:U`<b>Active contract (automatic)</b> follows whichever contract is active in your SmartHomeShop account, so prices update by themselves when you switch contracts there. Pick a specific contract above to pin it instead.`}
            </div>
            ${"no_contract"===t?U`
              <div class="warn">
                The active contract for today has expired or is not set, so no prices are shown.
                Pin a specific contract above, or add an active contract in your SmartHomeShop account.
              </div>`:"ok"===t&&e?.contract_id&&!e?.contract?U`
              <div class="warn">
                The pinned contract no longer exists in your account, so generic prices without
                contract tariffs are used. Pick another contract above.
              </div>`:K}
          `:K}

          ${"ok"===t&&i?U`
            <div class="chips">
              ${this._chip("Electricity now",U`€ ${(i.electricity??0).toFixed(3)} <span class="unit">/kWh</span>`,e?.entities?.electricity)}
              ${i.level?this._chip("Tariff level",U`<span style="text-transform: capitalize;">${String(i.level).replace("_"," ")}</span>`,e?.entities?.level):K}
              ${null!=i.feed_in?this._chip("Feed-in now",U`€ ${i.feed_in.toFixed(3)} <span class="unit">/kWh</span>`,e?.entities?.feed_in):K}
              ${null!=i.gas?this._chip("Gas now",U`€ ${i.gas.toFixed(3)} <span class="unit">/m³</span>`,e?.entities?.gas):K}
              ${e?.contract?.tariffs?.water>0?this._chip("Water",U`€ ${Number(e.contract.tariffs.water).toFixed(4)} <span class="unit">/m³</span>`):K}
            </div>
            ${e?.summary?U`
              <div class="summary-row">
                ${null!=e.summary.cheap_now?U`
                  <span class="chip-tag ${e.summary.cheap_now?"good":""}">
                    <ha-icon icon=${e.summary.cheap_now?"mdi:cash-clock":"mdi:clock-outline"}></ha-icon>
                    ${e.summary.cheap_now?"Cheap right now":"Above average now"}
                  </span>
                `:K}
                ${e.summary.cheapest_3h?U`
                  <span class="chip-tag">Cheapest 3h: ${this._hm(e.summary.cheapest_3h.start)}-${this._hm(e.summary.cheapest_3h.end)} · € ${Number(e.summary.cheapest_3h.average).toFixed(3)}</span>
                `:K}
                ${null!=e.summary.average?U`<span class="chip-tag">Avg today € ${Number(e.summary.average).toFixed(3)}</span>`:K}
              </div>
            `:K}
            <div class="hint">
              Point the Home Assistant Energy Dashboard at
              <code>sensor.smarthomeshop_energy_prices_electricity_price</code>
              ("use an entity with current price") for accurate dynamic cost tracking. There are
              also sensors for the average/low/high price and the cheapest 1-6&nbsp;hour blocks,
              plus a <code>binary_sensor...cheap_electricity_now</code> for easy automations.
            </div>
          `:K}

          ${e?.has_key&&"ok"===t?U`
            <div class="sync-info">
              <ha-icon icon="mdi:sync"></ha-icon>
              <span>
                ${e?.last_synced?`Last synced ${this._lastSyncedLabel(e.last_synced)}`:"Not synced yet"}
                · auto-syncs every ${e?.interval_minutes??30} min
              </span>
            </div>
          `:K}

          ${e?.has_key&&!this._showKeyForm?U`
            <div class="actions">
              <button class="btn primary" ?disabled=${this._syncing} @click=${this._syncNow}>
                <ha-icon icon="mdi:sync"></ha-icon> ${this._syncing?"Syncing...":"Sync now"}
              </button>
              <button class="btn ghost" @click=${()=>{this._showKeyForm=!0}}>Replace key</button>
              <button class="btn ghost danger" ?disabled=${this._savingKey} @click=${this._disconnect}>Disconnect</button>
            </div>
          `:U`
            <div class="form">
              <input type="password" placeholder="Paste your API key" autocomplete="off"
                .value=${this._apiKeyInput}
                @input=${e=>{this._apiKeyInput=e.target.value}}
                @keydown=${e=>{"Enter"===e.key&&this._apiKeyInput.trim()&&this._save()}} />
              <button class="btn primary" ?disabled=${!this._apiKeyInput.trim()||this._savingKey} @click=${this._save}>
                ${this._savingKey?"Connecting...":"Connect"}
              </button>
              ${e?.has_key?U`
                <button class="btn ghost" @click=${()=>{this._showKeyForm=!1,this._apiKeyInput=""}}>Cancel</button>
              `:K}
            </div>
            <div class="hint">
              Fixed prices are set above and are free. For live dynamic spot prices, create an
              API key in your account at <b>smarthomeshop.io → Settings → API tokens</b>
              (free with any account) and paste it here.
            </div>
            <button class="linkbtn" @click=${()=>{this._showAdvanced=!this._showAdvanced}}>
              ${this._showAdvanced?"Hide advanced":"Advanced"}
            </button>
            ${this._showAdvanced?U`
              <div class="form" style="margin-top: 8px;">
                <input type="text" placeholder="https://api.smarthomeshop.io" autocomplete="off"
                  .value=${this._baseUrlInput}
                  @input=${e=>{this._baseUrlInput=e.target.value}} />
              </div>
              <div class="hint">Server URL - leave empty for the default. Only change this for self-hosting or local testing.</div>
            `:K}
          `}
        </div>
      </div>
    `}};Ke.styles=n`
    :host { display: block; --shs-primary: #4361ee; }
    .card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden; margin-bottom: 20px; }
    .head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--divider-color); }
    .head ha-icon { color: var(--shs-primary); --mdc-icon-size: 18px; }
    .head-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); flex: 1; }
    .optional { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--secondary-text-color); background: var(--secondary-background-color); padding: 2px 8px; border-radius: 999px; }
    .body { padding: 16px; }
    .status { display: flex; align-items: center; gap: 12px; }
    .status-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(148,163,184,0.15); color: var(--secondary-text-color); flex-shrink: 0; }
    .status-icon.ok { background: rgba(34,197,94,0.15); color: #22c55e; }
    .status-icon.alert { background: rgba(239,68,68,0.12); color: #ef4444; }
    .status-icon ha-icon { --mdc-icon-size: 20px; }
    .status-text { font-size: 13px; color: var(--secondary-text-color); line-height: 1.45; }
    .status-badge { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; text-transform: capitalize; margin-left: 6px; }
    .status-badge.ok { background: rgba(34,197,94,0.12); color: #22c55e; }
    .status-badge.alert { background: rgba(239,68,68,0.12); color: #ef4444; }
    .contract-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
    .contract-row label { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.4px; }
    .contract-row select { flex: 1; min-width: 200px; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 13px; font-family: inherit; }
    .contract-row select:focus { outline: none; border-color: var(--shs-primary); }
    .summary-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .chip-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--secondary-text-color); background: var(--secondary-background-color); border-radius: 999px; padding: 4px 12px; }
    .chip-tag.good { color: #22c55e; background: rgba(34,197,94,0.12); }
    .chip-tag ha-icon { --mdc-icon-size: 14px; }
    .chips { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 14px; }
    .chip { background: var(--secondary-background-color); border-radius: 10px; padding: 10px 12px; }
    .chip.clickable { cursor: pointer; transition: background 0.12s, transform 0.12s; }
    .chip.clickable:hover { background: var(--divider-color); transform: translateY(-1px); }
    .chip.clickable:active { transform: none; }
    .chip-label { font-size: 11px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.4px; }
    .chip-value { font-size: 16px; font-weight: 700; color: var(--primary-text-color); margin-top: 2px; }
    .chip-value .unit { font-size: 11px; font-weight: 400; color: var(--secondary-text-color); }
    .form { display: flex; gap: 8px; margin-top: 14px; }
    .form input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .form input:focus { outline: none; border-color: var(--shs-primary); }
    .actions { display: flex; gap: 10px; margin-top: 14px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border: none; }
    .btn ha-icon { --mdc-icon-size: 16px; }
    .sync-info { display: flex; align-items: center; gap: 6px; margin-top: 14px; font-size: 11.5px; color: var(--secondary-text-color); }
    .sync-info ha-icon { --mdc-icon-size: 15px; color: var(--shs-primary); }
    .btn.primary { background: var(--shs-primary); color: #fff; }
    .btn.primary:disabled { opacity: 0.5; cursor: default; }
    .btn.ghost { background: transparent; border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    .btn.ghost.danger { color: #ef4444; }
    .hint { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 12px; line-height: 1.5; }
    .warn { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); border-radius: 8px; padding: 10px 12px; margin-top: 10px; font-size: 12px; color: var(--primary-text-color); line-height: 1.45; }
    .hint code { background: var(--secondary-background-color); padding: 1px 5px; border-radius: 4px; font-size: 11px; }
    .linkbtn { margin-top: 10px; background: none; border: none; padding: 0; color: var(--shs-primary); font-size: 12px; font-family: inherit; cursor: pointer; }
    .linkbtn:hover { text-decoration: underline; }
    .error-banner { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px 12px; border-radius: 8px; font-size: 12.5px; background: rgba(239,68,68,0.1); color: #ef4444; }
    .error-banner ha-icon { --mdc-icon-size: 16px; }
  `,e([ge({attribute:!1})],Ke.prototype,"hass",void 0),e([me()],Ke.prototype,"_account",void 0),e([me()],Ke.prototype,"_apiKeyInput",void 0),e([me()],Ke.prototype,"_baseUrlInput",void 0),e([me()],Ke.prototype,"_showAdvanced",void 0),e([me()],Ke.prototype,"_savingKey",void 0),e([me()],Ke.prototype,"_showKeyForm",void 0),e([me()],Ke.prototype,"_syncing",void 0),e([me()],Ke.prototype,"_contracts",void 0),e([me()],Ke.prototype,"_locations",void 0),e([me()],Ke.prototype,"_error",void 0),Ke=e([he("shs-account-prices")],Ke);let Ve=class extends le{constructor(){super(...arguments),this._loaded=!1,this._cfg={},this._modal=!1,this._busy=!1,this._error="",this._form={}}connectedCallback(){super.connectedCallback(),this._load()}async _load(){if(this.hass){try{const e=await this.hass.callWS({type:"smarthomeshop/energy_sources"});this._cfg=e.sources||{}}catch(e){console.error("energy-sources: load failed",e)}this._loaded=!0}}_matchesKind(e,t){const i="string"==typeof e?e:e.entity_id||"";if("sensor"!==(e=>e.split(".")[0])(i))return!1;const o=this.hass.states?.[i];if(!o)return!1;const s=o.attributes?.device_class,r=String(o.attributes?.unit_of_measurement||"");return"power"===t?"power"===s||/^k?W$/i.test(r):"battery"===t?"battery"===s||"%"===r:"energy"===s||/^(?:Wh|kWh|MWh)$/i.test(r)}_capacityKwh(e){if(!e)return null;const t=this.hass.states?.[e];if(!t||"unknown"===t.state||"unavailable"===t.state)return null;const i=Number(t.state);if(!Number.isFinite(i))return null;const o=String(t.attributes?.unit_of_measurement||"").trim().toLowerCase();let s;if("wh"===o)s=i/1e3;else if("kwh"===o)s=i;else{if("mwh"!==o)return null;s=1e3*i}return{value:s,text:`${s.toLocaleString(void 0,{maximumFractionDigits:2})} kWh`}}_liveValue(e,t=!1){if(!e)return null;const i=this.hass.states[e];if(!i||"unavailable"===i.state||"unknown"===i.state)return{text:"unavailable",dead:!0};const o=Number(i.state),s=i.attributes?.unit_of_measurement||"";if(Number.isFinite(o)){return{text:`now: ${t?-o:o} ${s}`,dead:!1}}return{text:`now: ${i.state}`,dead:!1}}_set(e,t){this._form={...this._form,[e]:t}}_openModal(){this._error="",this._form={...this._cfg},this._modal=!0}async _save(){if(!this._busy)if(this.hass.user?.is_admin){this._busy=!0,this._error="";try{const{p1_device:e,...t}=this._form;await this.hass.callWS({type:"smarthomeshop/energy_sources/set",config:t}),this._cfg={...this._form},this._modal=!1,this.dispatchEvent(new CustomEvent("shs-energy-sources-changed",{bubbles:!0,composed:!0}))}catch(e){console.error("energy-sources: save failed",e),this._error=`Could not save. ${e?.message||""}`}this._busy=!1}else this._error="Administrator required."}_summary(){const e=this._cfg,t=[];return e.solar_power&&t.push("solar"),(e.battery_power||e.battery_soc)&&t.push("battery"),e.pv_forecast&&t.push("forecast"),t.length?`Connected: ${t.join(", ")}`:""}_hasDead(){return[this._cfg.solar_power,this._cfg.battery_power,this._cfg.battery_soc,this._cfg.pv_forecast].some(e=>e&&this._liveValue(e)?.dead)}_picker(e,t,i,o,s){const r=this._form[t],n=this._liveValue(r,!!o&&!!this._form[o]);return U`
      <div class="field">
        <label class="f">${e}</label>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${r||""}
          .includeDomains=${["sensor"]}
          .entityFilter=${e=>this._matchesKind(e,i)}
          .allowCustomEntity=${!1}
          @value-changed=${e=>this._set(t,e.detail?.value||"")}
        ></ha-entity-picker>
        ${s?U`<div class="help">${s}</div>`:K}
        ${n?U`<div class="live ${n.dead?"dead":"ok"}">${n.text}</div>`:K}
        ${o&&r?U`
          <label class="check">
            <input type="checkbox" ?checked=${!!this._form[o]}
              @change=${e=>this._set(o,e.target.checked)} />
            Reverse the sign (if charging/production shows the wrong way)
          </label>`:K}
      </div>`}_renderModal(){return this._modal?U`
      <div class="modal-backdrop" @click=${()=>{this._modal=!1}}>
        <div class="modal" @click=${e=>e.stopPropagation()}>
          <div class="modal-head">
            <div class="row-icon"><ha-icon icon="mdi:solar-power-variant"></ha-icon></div>
            <div class="modal-title">Solar &amp; battery entities</div>
            <button class="modal-x" @click=${()=>{this._modal=!1}}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="modal-body">
            <div class="section">Solar</div>
            ${this._picker("Solar production power (W)","solar_power","power","solar_invert","Live PV power from your inverter, shown in the energy overview. (The true-surplus calculation uses the battery power below.)")}
            ${this._picker("Solar forecast today (kWh left)","pv_forecast","energy",void 0,'A Forecast.Solar / Solcast "remaining today" sensor. Used to skip grid-charging when the sun will fill the battery.')}

            <div class="section">Battery</div>
            ${this._picker("Battery power (W, + discharge / - charge)","battery_power","power","battery_invert","Signed battery power. With solar power this gives true PV surplus; check the sign against the live value below.")}
            ${this._picker("Battery state of charge (%)","battery_soc","battery",void 0,"Used to stop charging at the target and to protect the reserve in battery arbitrage.")}
          <div class="field">
            <label class="f">Battery capacity entity (optional)</label>
            <ha-entity-picker
              .hass=${this.hass}
              .value=${this._form.battery_capacity_entity||""}
              .includeDomains=${["sensor"]}
              .entityFilter=${e=>this._matchesKind(e,"energy")}
              .allowCustomEntity=${!1}
              @value-changed=${e=>this._set("battery_capacity_entity",e.detail?.value||void 0)}
            ></ha-entity-picker>
            ${this._form.battery_capacity_entity?U`
                  <div class="live ${this._capacityKwh(this._form.battery_capacity_entity)?"":"dead"}">
                    ${this._capacityKwh(this._form.battery_capacity_entity)?.text||"Entity is unavailable or does not report Wh, kWh or MWh"}
                  </div>
                `:K}
            <div class="hint">
              Select a sensor when your inverter exposes the usable battery capacity. Its live value overrides the fixed value below.
            </div>
          </div>
          <div class="field">
            <label class="f">Fixed battery capacity (kWh)</label>
            <input
              type="number"
              min="1"
              max="200"
              step="0.1"
              .value=${null!=this._form.battery_capacity_kwh?String(this._form.battery_capacity_kwh):""}
              @input=${e=>{const t=e.target.value;this._set("battery_capacity_kwh",""===t?null:Number(t))}}
            />
            <div class="hint">
              Used when no capacity entity is selected or when that entity is temporarily unavailable.
            </div>
          </div>

            ${this._error?U`<div class="warn">${this._error}</div>`:K}
          </div>
          <div class="modal-foot">
            <span></span>
            <div class="right">
              <button class="btn ghost" @click=${()=>{this._modal=!1}}>Cancel</button>
              <button class="btn" ?disabled=${this._busy} @click=${this._save}><ha-icon icon="mdi:check"></ha-icon> ${this._busy?"Saving...":"Save"}</button>
            </div>
          </div>
        </div>
      </div>`:K}render(){if(!this._loaded)return K;const e=!!this.hass.user?.is_admin,t=!!(this._cfg.solar_power||this._cfg.battery_power||this._cfg.battery_soc||this._cfg.pv_forecast);return U`
      <div class="head">
        <span class="head-title">Solar &amp; battery</span>
      </div>
      <div class="sub">
        Your P1 meter only sees the grid. Connect your solar and battery entities (you already have them in
        Home Assistant) so we can see real solar surplus and your battery's charge level.
      </div>
      <div class="card">
        <div class="row">
          <div class="row-icon"><ha-icon icon="mdi:solar-power-variant"></ha-icon></div>
          <div class="row-main">
            <div class="row-title">${t?this._hasDead()?"Some entities are unavailable":"Solar / battery connected":"Not connected"}</div>
            <div class="row-meta">${t?this._summary():"Map your solar-production and battery entities to unlock true surplus and state-of-charge control."}</div>
          </div>
          ${e?U`<button class="btn ${t?"ghost":""}" @click=${this._openModal}>
            <ha-icon icon=${t?"mdi:cog-outline":"mdi:plus"}></ha-icon> ${t?"Edit":"Connect"}
          </button>`:K}
        </div>
      </div>
      ${this._renderModal()}
    `}};Ve.styles=n`
    :host { display: block; --shs-primary: #4361ee; margin-top: 24px; }
    .head { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
    .head-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .sub { font-size: 12.5px; color: var(--secondary-text-color); line-height: 1.5; margin: -4px 0 12px; }
    .card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 14px; }
    .row { display: flex; align-items: center; gap: 12px; }
    .row-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(234,179,8,.14); color: #eab308; flex-shrink: 0; }
    .row-main { flex: 1; min-width: 0; }
    .row-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
    .row-meta { font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .btn.ghost { background: transparent; border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    .btn ha-icon { --mdc-icon-size: 15px; }
    .warn { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); border-radius: 10px; padding: 12px 14px; margin: 8px 0; font-size: 13px; color: var(--primary-text-color); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
    .modal { width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    .modal-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--divider-color); position: sticky; top: 0; background: var(--card-background-color); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .modal-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .modal-body { padding: 18px 20px; }
    .section { font-size: 11px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: var(--secondary-text-color); margin: 18px 0 10px; }
    .section:first-child { margin-top: 0; }
    .field { margin-bottom: 14px; }
    label.f { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); margin: 0 0 6px; }
    .field .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; line-height: 1.4; }
    .live { font-size: 11.5px; margin-top: 4px; }
    .live.ok { color: #16a34a; }
    .live.dead { color: #ef4444; }
    ha-entity-picker { display: block; width: 100%; --mdc-theme-primary: var(--shs-primary); }
    input[type="number"] { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    input:focus { outline: none; border-color: var(--shs-primary); }
    .check { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--primary-text-color); margin-top: 6px; }
    .check input { width: auto; }
    .two { display: flex; gap: 10px; }
    .two > div { flex: 1; }
    .modal-foot { display: flex; justify-content: space-between; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--divider-color); position: sticky; bottom: 0; background: var(--card-background-color); }
    .modal-foot .right { display: flex; gap: 10px; }
  `,e([ge({attribute:!1})],Ve.prototype,"hass",void 0),e([me()],Ve.prototype,"_loaded",void 0),e([me()],Ve.prototype,"_cfg",void 0),e([me()],Ve.prototype,"_modal",void 0),e([me()],Ve.prototype,"_busy",void 0),e([me()],Ve.prototype,"_error",void 0),e([me()],Ve.prototype,"_form",void 0),Ve=e([he("shs-energy-sources")],Ve);const Ge="shs_batt",Ye=["shs_batt_charge","shs_batt_discharge"],Xe=(e,t)=>"number"==typeof e&&Number.isFinite(e)?e:t;let Je=class extends le{constructor(){super(...arguments),this.deviceName="",this._pricesOk=!1,this._accountStatus="unconfigured",this._loaded=!1,this._cfg={},this._plan={},this._modal=!1,this._busy=!1,this._error="",this._form={},this._sources={}}connectedCallback(){super.connectedCallback(),this._load()}refresh(){return this._load()}async _load(){if(this.hass){try{const e=await this.hass.callWS({type:"smarthomeshop/account"});if(this._accountStatus=e.status||"unconfigured",this._pricesOk="ok"===this._accountStatus,this._pricesOk){const[e,t,i]=await Promise.all([this.hass.callWS({type:"smarthomeshop/battery"}),this.hass.callWS({type:"smarthomeshop/energy_sources"}),this.hass.callWS({type:"smarthomeshop/battery/plan"})]);this._cfg=e.battery||{},this._sources=t.sources||{},this._plan=i.plan||{}}}catch(e){console.error("energy-battery: load failed",e)}this._loaded=!0}}_openAccountSettings(){this.dispatchEvent(new CustomEvent("open-device-settings",{bubbles:!0,composed:!0}))}_accountMessage(){return"no_contract"===this._accountStatus?"Your API key works, but the selected location has no active energy contract, so there are no prices to plan against. Add or activate a contract in your SmartHomeShop account, or pick another location in Settings.":["unauthorized","forbidden"].includes(this._accountStatus)?"The saved SmartHomeShop.io API key is invalid or was revoked. Replace it to enable dynamic prices and battery planning.":"unconfigured"===this._accountStatus?"Enter your SmartHomeShop.io API key to enable dynamic prices, forecasts and home battery planning.":"Dynamic price data is unavailable. Check the SmartHomeShop.io API key to enable home battery planning."}_noContract(){return"no_contract"===this._accountStatus}_matchesEntity(e,t,i){const o="string"==typeof e?e:e.entity_id||"";if(!t.includes((e=>e.split(".")[0])(o)))return!1;const s=this.hass.states[o],r=String(s?.attributes?.device_class||""),n=String(s?.attributes?.unit_of_measurement||"");return"battery"===i?"battery"===r||"%"===n:"energy"===i?"energy"===r||/^k?Wh$/i.test(n):"power"===i?"power"===r||/^(k|m)?W$/i.test(n):"forecast"!==i||(["energy","power"].includes(r)||/^(k|m)?W(h)?$/i.test(n))}_selectOptions(e){return e&&this.hass.states[e]?.attributes?.options||[]}_numberMin(e){if(!e)return 0;const t=Number(this.hass.states[e]?.attributes?.min);return Number.isFinite(t)?t:0}_sourceCapacityKwh(){const e=this._sources?.battery_capacity_entity;if(e){const t=this.hass.states?.[e],i=Number(t?.state),o=String(t?.attributes?.unit_of_measurement||"").trim().toLowerCase();if(Number.isFinite(i)&&i>0){if("wh"===o)return i/1e3;if("kwh"===o)return i;if("mwh"===o)return 1e3*i}}const t=Number(this._sources?.battery_capacity_kwh);return Number.isFinite(t)&&t>0?t:void 0}async _openModal(){this._error="";try{const e=await this.hass.callWS({type:"smarthomeshop/energy_sources"});this._sources=e.sources||{}}catch{}const e=this._sources||{};this._form={enabled:!0,automatic_control:!1,control_kind:"switch",target_soc:90,reserve_soc:15,capacity_kwh:this._sourceCapacityKwh(),soc_sensor:e.battery_soc||void 0,pv_forecast_sensor:e.pv_forecast||void 0,charge_power:3e3,max_discharge_power:3e3,charge_efficiency:.95,discharge_efficiency:.95,cycle_cost:.03,assumed_load_power:0,grid_import_limit:0,grid_export_limit:0,minimum_confidence:.55,planning_hours:36,...this._cfg},e.battery_soc&&(this._form.soc_sensor=e.battery_soc);const t=this._sourceCapacityKwh();null!=t&&(this._form.capacity_kwh=t),e.pv_forecast&&(this._form.pv_forecast_sensor=e.pv_forecast),this._modal=!0}_friendly(e){return e?this.hass.states[e]?.attributes?.friendly_name||e:""}_set(e,t){this._form={...this._form,[e]:t}}async _deleteAutomation(){for(const e of[Ge,...Ye])try{await this.hass.callApi("DELETE",`config/automation/config/${e}`)}catch{}}_legacyDeviceAutomations(){const e=[];for(const[t,i]of Object.entries(this.hass.states||{})){if(!t.startsWith("automation."))continue;const o=i.attributes?.id;o&&o.includes("_battery_charge_cheap_hold_peak_")&&e.push({entityId:t,name:i.attributes?.friendly_name||t,configId:o})}return e}async _removeLegacyAutomation(e){if(this.hass.user?.is_admin)try{await this.hass.callApi("DELETE",`config/automation/config/${e}`),this.requestUpdate()}catch(e){console.error("energy-battery: legacy cleanup failed",e)}}async _save(){if(this._busy)return;if(!this.hass.user?.is_admin)return void(this._error="Administrator required.");const e={...this._form,enabled:!0},t=Xe(e.target_soc,NaN),i=Xe(e.reserve_soc,NaN);if(e.soc_sensor)if(Xe(e.capacity_kwh,0)>0)if(Xe(e.charge_power,0)>0&&Xe(e.max_discharge_power,0)>0)if(!Number.isFinite(t)||t<10||t>100)this._error="Target SoC must be 10-100%.";else if(!Number.isFinite(i)||i<0||i>=t)this._error="Reserve SoC must be below the target.";else{if(e.automatic_control){if(!e.control_entity)return void(this._error="Select a control entity before enabling automatic control.");if(!("select"!==e.control_kind||e.charge_option&&e.idle_option&&e.discharge_option))return void(this._error="Select the charge, self-use and discharge options.")}this._busy=!0,this._error="";try{if("number"===e.control_kind?e.off_min=this._numberMin(e.control_entity):e.off_min=0,e.automatic_control){await this.hass.callApi("POST",`config/automation/config/${Ge}`,(o=`${this.deviceName||"Battery"} - Smart battery plan`,{alias:o,description:"Created with the SmartHomeShop.io battery planner",mode:"restart",trigger:[{platform:"time_pattern",minutes:"/5"},{platform:"homeassistant",event:"start"}],condition:[],action:[{service:"smarthomeshop.apply_battery_recommendation"}]}));for(const e of Ye)try{await this.hass.callApi("DELETE",`config/automation/config/${e}`)}catch{}}else await this._deleteAutomation();const t=await this.hass.callWS({type:"smarthomeshop/battery/set",config:e});this._cfg=t.battery||e;const i=await this.hass.callWS({type:"smarthomeshop/battery/plan"});this._plan=i.plan||{},this._modal=!1}catch(e){console.error("energy-battery: save failed",e),this._error=`Could not save. ${e?.message||""}`}var o;this._busy=!1}else this._error="Set both maximum charge and discharge power.";else this._error=this._sources?.battery_capacity_entity?"The selected battery capacity entity is unavailable. Set a fixed fallback under Energy settings.":"Enter the usable battery capacity.";else this._error="Select the battery state-of-charge sensor."}async _remove(){if(this.hass.user?.is_admin&&window.confirm("Remove the battery planner and its automation?"))try{await this.hass.callWS({type:"smarthomeshop/battery/set",config:{}}),await this._deleteAutomation(),this._cfg={},this._plan={},this._modal=!1}catch(e){console.error("energy-battery: remove failed",e)}}_hasUnavailableEntity(){return[this._cfg.control_entity,this._cfg.soc_sensor,this._cfg.pv_forecast_sensor,this._cfg.load_forecast_sensor].some(e=>e&&(!this.hass.states[e]||["unavailable","unknown"].includes(this.hass.states[e].state)))}_planTitle(){if(!this._cfg.enabled)return"Not set up yet";if(this._hasUnavailableEntity())return"A configured entity is unavailable";if("ready"!==this._plan.status)return"Planner needs more information";const e=this._plan.recommendation||"hold";return`${e.charAt(0).toUpperCase()}${e.slice(1)} recommended`}_planIcon(){return"charge"===this._plan.recommendation?"mdi:battery-arrow-up-outline":"discharge"===this._plan.recommendation?"mdi:battery-arrow-down-outline":"mdi:home-battery-outline"}_renderNumber(e,t,i,o,s,r,n=""){const a=this._form[e];return U`<div class="field">
      <label class="f">${t}</label>
      <input type="number" min=${o} max=${s} step=${r} .value=${String(a??i)}
        @input=${t=>this._set(e,parseFloat(t.target.value))} />
      ${n?U`<div class="help">${n}</div>`:K}
    </div>`}_renderCapacityField(){const e=this._sources?.battery_capacity_entity,t=Number(this._sources?.battery_capacity_kwh);if(!(Boolean(e)||Number.isFinite(t)&&t>0))return this._renderNumber("capacity_kwh","Usable capacity (kWh)",10,.5,500,.1);const i=this._sourceCapacityKwh(),o=e?this.hass.states?.[e]?.attributes?.friendly_name||e:"Fixed capacity from Energy settings";return U`
      <div class="field">
        <label class="f">Usable capacity (kWh)</label>
        <div class="locked">${null!=i?`${i.toFixed(2).replace(/\.?0+$/,"")} kWh`:"Unavailable"}</div>
        <div class="help">${o}. Configured under Energy settings.</div>
      </div>
    `}_renderModal(){if(!this._modal)return K;const e=this._form,t=e.control_kind||"switch",i="switch"===t?["switch","input_boolean"]:"number"===t?["number"]:["select"],o=this._selectOptions(e.control_entity);return U`
      <div class="modal-backdrop" @click=${()=>{this._modal=!1}}>
        <div class="modal" @click=${e=>e.stopPropagation()}>
          <div class="modal-head">
            <div class="row-icon"><ha-icon icon="mdi:home-battery"></ha-icon></div>
            <div>
              <div class="modal-title">Home battery planner</div>
              <div class="modal-subtitle">Price, solar, battery wear and grid limits in one plan</div>
            </div>
            <button class="modal-x" title="Close" @click=${()=>{this._modal=!1}}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="modal-body">
            <div class="section">Battery</div>
            <div class="two">
              <div class="field">
                <label class="f">State-of-charge sensor</label>
                ${this._sources?.battery_soc?U`
                  <div class="locked">${this._friendly(this._sources.battery_soc)}</div>
                  <div class="help">From Solar &amp; battery - change it there.</div>
                `:U`
                  <ha-entity-picker
                    .hass=${this.hass}
                    .value=${e.soc_sensor||""}
                    .includeDomains=${["sensor"]}
                    .entityFilter=${e=>this._matchesEntity(e,["sensor"],"battery")}
                    .allowCustomEntity=${!1}
                    @value-changed=${e=>this._set("soc_sensor",e.detail?.value||void 0)}
                  ></ha-entity-picker>
                `}
              </div>
              ${this._renderCapacityField()}
            </div>
            <div class="two">
              ${this._renderNumber("reserve_soc","Protected reserve SoC (%)",15,0,90,1)}
              ${this._renderNumber("target_soc","Preferred target SoC (%)",90,10,100,1)}
            </div>
            <div class="two">
              ${this._renderNumber("charge_power","Maximum charge power (W)",3e3,100,5e4,100)}
              ${this._renderNumber("max_discharge_power","Maximum discharge power (W)",3e3,100,5e4,100)}
            </div>

            <div class="section">Forecast inputs</div>
            <div class="two">
              <div class="field">
                <label class="f">Solar forecast (optional)</label>
                ${this._sources?.pv_forecast?U`
                  <div class="locked">${this._friendly(this._sources.pv_forecast)}</div>
                  <div class="help">From Solar &amp; battery - change it there.</div>
                `:U`
                  <ha-entity-picker
                    .hass=${this.hass}
                    .value=${e.pv_forecast_sensor||""}
                    .includeDomains=${["sensor"]}
                    .entityFilter=${e=>this._matchesEntity(e,["sensor"],"forecast")}
                    .allowCustomEntity=${!1}
                    @value-changed=${e=>this._set("pv_forecast_sensor",e.detail?.value||void 0)}
                  ></ha-entity-picker>
                  <div class="help">Hourly forecast attributes are used when available.</div>
                `}
              </div>
              <div class="field">
                <label class="f">House load forecast (optional)</label>
                <ha-entity-picker
                  .hass=${this.hass}
                  .value=${e.load_forecast_sensor||""}
                  .includeDomains=${["sensor"]}
                  .entityFilter=${e=>this._matchesEntity(e,["sensor"],"forecast")}
                  .allowCustomEntity=${!1}
                  @value-changed=${e=>this._set("load_forecast_sensor",e.detail?.value||void 0)}
                ></ha-entity-picker>
              </div>
            </div>
            <div class="two">
              ${this._renderNumber("assumed_load_power","Fallback house load (W)",0,0,5e4,50,"Used when no load forecast is selected.")}
              ${this._renderNumber("planning_hours","Planning horizon (hours)",36,6,48,1)}
            </div>

            <div class="section">Efficiency, wear &amp; safety</div>
            <div class="three">
              ${this._renderNumber("charge_efficiency","Charge efficiency",.95,.5,1,.01)}
              ${this._renderNumber("discharge_efficiency","Discharge efficiency",.95,.5,1,.01)}
              ${this._renderNumber("cycle_cost","Battery wear (€/kWh)",.03,0,1,.005)}
            </div>
            <div class="three">
              ${this._renderNumber("grid_import_limit","Grid import limit (W)",0,0,1e5,100,"0 disables the limit.")}
              ${this._renderNumber("grid_export_limit","Grid export limit (W)",0,0,1e5,100,"0 disables the limit.")}
              ${this._renderNumber("minimum_confidence","Minimum confidence",.55,0,1,.05,"Below this level the planner holds.")}
            </div>
            <div class="note">The planner uses confirmed prices first and conservative bounds for predicted prices. It never moves below the reserve or outside the configured grid limits.</div>

            <div class="section">Execution</div>
            <div class="toggle-row">
              <div class="toggle-copy">
                <div class="toggle-title">Automatically apply recommendations</div>
                <div class="help">Off by default. With this disabled, Home Assistant only exposes advice sensors.</div>
              </div>
              <ha-switch .checked=${!!e.automatic_control} @change=${e=>this._set("automatic_control",e.target.checked)}></ha-switch>
            </div>
            ${e.automatic_control?U`
              <div class="field">
                <label class="f">Control type</label>
                <select @change=${e=>{this._set("control_kind",e.target.value),this._set("control_entity","")}}>
                  <option value="switch" ?selected=${"switch"===t}>Grid-charge switch</option>
                  <option value="number" ?selected=${"number"===t}>Signed battery-power number</option>
                  <option value="select" ?selected=${"select"===t}>Battery mode select</option>
                </select>
              </div>
              <div class="field">
                <label class="f">Control entity</label>
                <ha-entity-picker
                  .hass=${this.hass}
                  .value=${e.control_entity||""}
                  .includeDomains=${i}
                  .entityFilter=${e=>this._matchesEntity(e,i)}
                  .allowCustomEntity=${!1}
                  @value-changed=${e=>this._set("control_entity",e.detail?.value||void 0)}
                ></ha-entity-picker>
              </div>
              ${"number"===t&&this._numberMin(e.control_entity)>0?U`<div class="warn">This number cannot be set to zero. Use a mode select or switch if the battery must have a true idle state.</div>`:K}
              ${"select"===t?U`
                <div class="three">
                  ${["charge_option","idle_option","discharge_option"].map((t,i)=>U`<div class="field">
                    <label class="f">${["Charge option","Self-use / idle option","Discharge option"][i]}</label>
                    <select @change=${e=>this._set(t,e.target.value)}>
                      <option value="">Select...</option>
                      ${o.map(i=>U`<option value=${i} ?selected=${i===e[t]}>${i}</option>`)}
                    </select>
                  </div>`)}
                </div>`:K}
            `:K}

            ${this._error?U`<div class="warn">${this._error}</div>`:K}
          </div>
          <div class="modal-foot">
            ${this._cfg.enabled?U`<button class="btn ghost" @click=${this._remove}>Remove</button>`:U`<span></span>`}
            <div class="right">
              <button class="btn ghost" @click=${()=>{this._modal=!1}}>Cancel</button>
              <button class="btn" ?disabled=${this._busy} @click=${this._save}><ha-icon icon="mdi:check"></ha-icon>${this._busy?"Saving...":"Save"}</button>
            </div>
          </div>
        </div>
      </div>`}render(){if(!this._loaded)return K;if(!this._pricesOk)return U`
        <div class="head"><span class="head-title">Home battery</span></div>
        <div class="sub">Plan charging and discharging against confirmed and predicted prices, solar, house load, efficiency and battery wear.</div>
        <div class="card unavailable">
          <div class="row">
            <div class="row-icon"><ha-icon icon=${this._noContract()?"mdi:file-document-alert-outline":"mdi:account-key-outline"}></ha-icon></div>
            <div class="row-main">
              <div class="row-title">${this._noContract()?"Energy contract required":"SmartHomeShop.io API key required"}</div>
              <div class="row-meta">${this._accountMessage()}${this.hass.user?.is_admin||this._noContract()?"":" Ask a Home Assistant administrator to add or replace the key."}</div>
              <div class="requirement"><ha-icon icon="mdi:lock-outline"></ha-icon>Battery planner unavailable until ${this._noContract()?"a contract is active":"connected"}</div>
            </div>
            ${this.hass.user?.is_admin?U`
              <button class="btn ghost" @click=${this._openAccountSettings}>
                <ha-icon icon=${this._noContract()?"mdi:cog-outline":"mdi:key-outline"}></ha-icon>
                ${this._noContract()?"Open settings":["unauthorized","forbidden"].includes(this._accountStatus)?"Replace API key":"Enter API key"}
              </button>
            `:K}
          </div>
        </div>
      `;const e=!!this._cfg.enabled,t=this._plan.recommendation||"hold",i=Math.abs(Xe(this._plan.target_power_w,0)),o=Math.round(100*Xe(this._plan.confidence,0));return U`
      <div class="head"><span class="head-title">Home battery</span></div>
      <div class="sub">Plan charging and discharging against confirmed and predicted prices, solar, house load, efficiency and battery wear.</div>
      <div class="card">
        <div class="row">
          <div class="row-icon ${t}"><ha-icon icon=${this._planIcon()}></ha-icon></div>
          <div class="row-main">
            <div class="row-title">${this._planTitle()}</div>
            <div class="row-meta">${e?this._plan.reason||"Waiting for the first complete plan.":"Configure battery details to start with advice-only planning."}</div>
            ${e?U`<div class="plan-stats">
              ${"ready"===this._plan.status?U`<span class="chip">${i?`${i} W`:"No power change"}</span><span class="chip">Target ${this._plan.target_soc??"-"}%</span><span class="chip">${o}% confidence</span><span class="chip">€ ${Xe(this._plan.expected_savings,0).toFixed(2)} plan value</span>`:K}
              <span class="chip">${this._cfg.automatic_control?"Automatic execution on":"Advice only"}</span>
            </div>`:K}
          </div>
          ${this.hass.user?.is_admin?U`<button class="btn ${e?"ghost":""}" @click=${this._openModal}><ha-icon icon=${e?"mdi:cog-outline":"mdi:plus"}></ha-icon>${e?"Configure":"Set up"}</button>`:K}
        </div>
      </div>
      ${this._legacyDeviceAutomations().map(e=>U`
        <div class="legacy-note">
          <ha-icon icon="mdi:alert-outline"></ha-icon>
          <div>An older battery automation (<b>${e.name}</b>) still steers the battery and can conflict with this planner.</div>
          ${this.hass.user?.is_admin?U`<button class="btn ghost" @click=${()=>this._removeLegacyAutomation(e.configId)}>Remove</button>`:K}
        </div>
      `)}
      ${this._renderModal()}
    `}};function Qe(e,t,i,o,s){const r=t?.battery_power;if(r){const n=function(e,t){const i=`(states('${e}')|float(0)) * -1`,o=t?.battery_power;return o?`${i} - ${(t?.battery_invert?-1:1)*(t?.battery_scale||1)} * (states('${o}')|float(0))`:i}(e,t),a=`states('${e}')|float(0)`;return[{platform:"template",value_template:`{{ ${`has_value('${e}') and has_value('${r}')`} and (${n}) >= ${i} and (${a}) <= 50 }}`,for:{minutes:o},id:"on"},{platform:"template",value_template:`{{ not has_value('${e}') or (${n}) < -50 or (${a}) > 100 }}`,for:{minutes:s},id:"off"}]}return[{platform:"numeric_state",entity_id:e,below:-i,for:{minutes:o},id:"on"},{platform:"numeric_state",entity_id:e,above:50,for:{minutes:s},id:"off"}]}Je.styles=n`
    :host { display: block; --shs-primary: #4361ee; margin-top: 24px; }
    .head { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
    .head-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .sub { font-size: 12.5px; color: var(--secondary-text-color); line-height: 1.5; margin: -4px 0 12px; }
    .card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 14px; }
    .card.unavailable { background: var(--secondary-background-color); border-style: dashed; }
    .card.unavailable .row-icon { background: color-mix(in srgb, var(--secondary-text-color) 12%, transparent); color: var(--secondary-text-color); }
    .card.unavailable .row-title { color: var(--secondary-text-color); }
    .requirement { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; color: var(--secondary-text-color); font-size: 11px; font-weight: 650; }
    .requirement ha-icon { --mdc-icon-size: 14px; }
    .row { display: flex; align-items: center; gap: 12px; }
    .row-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(16,185,129,.12); color: #10b981; flex-shrink: 0; }
    .row-icon.charge { background: rgba(67,97,238,.12); color: #4361ee; }
    .row-icon.discharge { background: rgba(245,158,11,.14); color: #d97706; }
    .row-main { flex: 1; min-width: 0; }
    .row-title { font-size: 14px; font-weight: 650; color: var(--primary-text-color); }
    .row-meta { font-size: 12px; color: var(--secondary-text-color); margin-top: 3px; line-height: 1.4; }
    .plan-stats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
    .chip { border-radius: 999px; padding: 4px 8px; background: var(--secondary-background-color); color: var(--secondary-text-color); font-size: 11px; font-weight: 600; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; padding: 8px 14px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .btn.ghost { background: transparent; border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    .btn ha-icon { --mdc-icon-size: 15px; }
    .warn { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); border-radius: 10px; padding: 12px 14px; margin: 12px 0 0; font-size: 13px; color: var(--primary-text-color); }
    .legacy-note { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 12px 14px; border: 1px solid rgba(245,158,11,.4); background: rgba(245,158,11,.08); border-radius: 10px; font-size: 12.5px; color: var(--primary-text-color); line-height: 1.45; }
    .legacy-note ha-icon { --mdc-icon-size: 18px; color: #b45309; flex: 0 0 auto; }
    .legacy-note > div { flex: 1; }
    .legacy-note .btn { padding: 7px 12px; font-size: 12px; }
    .note { border-left: 3px solid var(--shs-primary); background: color-mix(in srgb, var(--shs-primary) 8%, transparent); border-radius: 0 8px 8px 0; padding: 10px 12px; font-size: 12px; line-height: 1.45; color: var(--secondary-text-color); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
    .modal { width: 100%; max-width: 620px; max-height: 92vh; overflow-y: auto; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    .modal-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--divider-color); position: sticky; top: 0; z-index: 2; background: var(--card-background-color); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .modal-subtitle { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 2px; }
    .modal-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .modal-body { padding: 18px 20px; }
    .section { font-size: 11px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: var(--secondary-text-color); margin: 22px 0 10px; }
    .section:first-child { margin-top: 0; }
    .field { margin-bottom: 14px; min-width: 0; }
    label.f { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); margin: 0 0 6px; }
    .locked { padding: 9px 12px; border: 1px dashed var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 13.5px; }
    .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; line-height: 1.4; }
    select, input[type='number'] { width: 100%; box-sizing: border-box; min-height: 40px; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    ha-entity-picker { display: block; width: 100%; --mdc-theme-primary: var(--shs-primary); }
    select:focus, input:focus { outline: none; border-color: var(--shs-primary); }
    .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .three { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .toggle-row { display: flex; align-items: center; gap: 12px; border: 1px solid var(--divider-color); border-radius: 10px; padding: 12px; margin-bottom: 14px; }
    .toggle-copy { flex: 1; min-width: 0; }
    .toggle-title { color: var(--primary-text-color); font-size: 13px; font-weight: 650; }
    .modal-foot { display: flex; justify-content: space-between; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--divider-color); position: sticky; bottom: 0; z-index: 2; background: var(--card-background-color); }
    .modal-foot .right { display: flex; gap: 10px; }
    @media (max-width: 600px) {
      .modal-backdrop { align-items: flex-end; padding: 0; }
      .modal { max-height: 94vh; border-radius: 16px 16px 0 0; }
      .two, .three { grid-template-columns: 1fr; gap: 0; }
      .row { align-items: flex-start; flex-wrap: wrap; }
      .row-main { min-width: calc(100% - 54px); }
      .card .btn { margin-left: 50px; }
    }
  `,e([ge({attribute:!1})],Je.prototype,"hass",void 0),e([ge()],Je.prototype,"deviceName",void 0),e([me()],Je.prototype,"_pricesOk",void 0),e([me()],Je.prototype,"_accountStatus",void 0),e([me()],Je.prototype,"_loaded",void 0),e([me()],Je.prototype,"_cfg",void 0),e([me()],Je.prototype,"_plan",void 0),e([me()],Je.prototype,"_modal",void 0),e([me()],Je.prototype,"_busy",void 0),e([me()],Je.prototype,"_error",void 0),e([me()],Je.prototype,"_form",void 0),e([me()],Je.prototype,"_sources",void 0),Je=e([he("shs-energy-battery")],Je);const et="Created with the SmartHomeShop.io panel · smart energy",tt={platform:"homeassistant",event:"start",id:"boot"},it=e=>e.split(".")[0],ot=(e,t)=>({service:`${it(e)}.${t?"turn_on":"turn_off"}`,target:{entity_id:e}}),st=(e,t)=>{const i=it(e);return"number"===i?{service:"number.set_value",target:{entity_id:e},data:{value:t}}:"water_heater"===i?{service:"water_heater.set_temperature",target:{entity_id:e},data:{temperature:t}}:{service:"climate.set_temperature",target:{entity_id:e},data:{temperature:t}}},rt=(e,t)=>({service:"number.set_value",target:{entity_id:e},data:{value:t}}),nt=e=>({condition:"template",value_template:e}),at=e=>({condition:"state",entity_id:e.contract_active,state:"on"});function ct(e,t,i){return(e=>"switch"===it(e)||"input_boolean"===it(e))(e)?{startAct:ot(e,!0),stopAct:ot(e,!1),switchTarget:!0}:{startAct:st(e,t),stopAct:st(e,i),switchTarget:!1}}function lt(e){const t=[{platform:"state",entity_id:e.flag,to:"on",id:"edge"},{platform:"state",entity_id:e.flag,to:["off","unavailable"],id:"edge"},tt];return e.watchdogHours&&t.push({platform:"state",entity_id:e.target,to:"on",for:{hours:e.watchdogHours},id:"watchdog"}),{alias:e.alias,description:et,mode:"restart",trigger:t,condition:[],action:[{choose:[{conditions:[{condition:"trigger",id:"watchdog"}],sequence:[e.stopAct]},{conditions:[{condition:"state",entity_id:e.flag,state:"on"},e.contract],sequence:[e.startAct]}],default:[e.stopAct]}]}}function dt(e){const t=e.activeTemplate||"true",i=e.p,o=`(states('${e.net}') | float(0))`,s=`(states('${e.target}') | float(${i.normal_limit}))`;return{alias:e.alias,description:et,mode:"single",max_exceeded:"silent",trigger:[{platform:"time_pattern",seconds:"/30",id:"regulate"},...e.extraTriggers||[],tt],condition:[],action:[{choose:[{conditions:[nt(`{{ has_value('${e.target}') and (not (${t}) or not has_value('${e.net}')) and ${s} != ${i.normal_limit} }}`)],sequence:[rt(e.target,`{{ ${i.normal_limit} }}`)]},{conditions:[nt(`{{ has_value('${e.net}') and has_value('${e.target}') and (${t}) and ${o} < -${i.export_threshold} and ${s} > ${i.minimum_limit} }}`)],sequence:[rt(e.target,`{{ [${i.minimum_limit}, ${s} - ${i.step_size}] | max }}`)]},{conditions:[nt(`{{ has_value('${e.net}') and has_value('${e.target}') and (${t}) and ${o} > ${i.import_threshold} and ${s} < ${i.normal_limit} }}`)],sequence:[rt(e.target,`{{ [${i.normal_limit}, ${s} + ${i.step_size}] | min }}`)]}]}]}}function ht(e){const t=e.activeTemplate||"true",i=e.restoreTemplate||"false",o=`(${t}) and has_value('${e.net}') and (states('${e.net}') | float(0)) < -${e.p.export_threshold}`,s=`(${t}) and has_value('${e.net}') and (states('${e.net}') | float(0)) > ${e.p.import_threshold}`,r=`is_state('${e.target}', 'off') and (as_timestamp(now()) - as_timestamp(states['${e.target}'].last_changed)) >= ${60*e.p.retry_minutes}`,n={choose:[{conditions:[nt(`{{ ${i} and not is_state('${e.target}', 'on') }}`)],sequence:[ot(e.target,!0)]},{conditions:[nt(`{{ not has_value('${e.net}') and not is_state('${e.target}', 'on') }}`)],sequence:[ot(e.target,!0)]},{conditions:[nt(`{{ not is_state('${e.target}', 'on') and ${s} }}`)],sequence:[ot(e.target,!0)]},{conditions:[nt(`{{ is_state('${e.target}', 'on') and ${o} }}`)],sequence:[{delay:{minutes:e.p.export_delay}},{choose:[{conditions:[nt(`{{ ${o} }}`)],sequence:[ot(e.target,!1)]}]}]},{conditions:[nt(`{{ (${t}) and ${r} }}`)],sequence:[ot(e.target,!0),{delay:{seconds:e.p.probe_seconds}},{choose:[{conditions:[nt(`{{ ${o} }}`)],sequence:[ot(e.target,!1)]}]}]}]};return{alias:e.alias,description:et,mode:"single",max_exceeded:"silent",trigger:[{platform:"numeric_state",entity_id:e.net,below:-e.p.export_threshold,for:{minutes:e.p.export_delay},id:"export"},{platform:"numeric_state",entity_id:e.net,above:e.p.import_threshold,id:"import"},{platform:"state",entity_id:e.target,to:"on",id:"target_on"},{platform:"time_pattern",minutes:"/1",id:"evaluate"},{platform:"template",value_template:`{{ not has_value('${e.net}') }}`,for:{minutes:e.p.sensor_timeout},id:"sensor_failure"},...e.extraTriggers||[],tt],condition:[],action:[{choose:[{conditions:[{condition:"trigger",id:"export"},nt(`{{ ${t} }}`)],sequence:[ot(e.target,!1)]},{conditions:[{condition:"trigger",id:"sensor_failure"}],sequence:[{choose:[{conditions:[nt(`{{ not is_state('${e.target}', 'on') }}`)],sequence:[ot(e.target,!0)]}]}]},{conditions:[{condition:"trigger",id:"import"},nt(`{{ (${t}) and not is_state('${e.target}', 'on') }}`)],sequence:[ot(e.target,!0)]},{conditions:[{condition:"trigger",id:["target_on","evaluate","boot","source_changed"]}],sequence:[n]}]}]}}const pt=[{key:"run_cheapest_block",title:"Run in the cheapest hours",desc:"Switch a deferrable load (boiler, pump, ventilation) on during the cheapest contiguous block of the day and off when it ends.",icon:"mdi:clock-star-four-points-outline",color:"#22c55e",requires:"contract",targetDomains:["switch","input_boolean"],targetLabel:"Device to run",aliasStem:"Run in cheapest",params:[{key:"hours",label:"Block length",default:3,min:1,max:6,step:1,unit:"h"}],build:({target:e,p:t,px:i,min:o,deviceName:s})=>{const r=t.hours,n=ct(e,0,o);return lt({alias:`${s} - Run in cheapest ${r}h`,flag:i[`cheapest_${r}h_window_now`]??null,target:e,startAct:n.startAct,stopAct:n.stopAct,contract:at(i),watchdogHours:r+1})}},{key:"run_while_cheap_now",title:"Run while electricity is cheap",desc:"Run an opportunistic load whenever the price is at or below the daily average, and stop it when it rises above.",icon:"mdi:cash-clock",color:"#16a34a",requires:"contract",targetDomains:["switch","input_boolean"],targetLabel:"Device to run",aliasStem:"Run while cheap",params:[{key:"max_runtime",label:"Safety max runtime",default:6,min:1,max:24,step:1,unit:"h",help:"Forces the load off after this long, even if something goes wrong."}],note:'"Cheap" here means below the daily average price, not the single cheapest window. Use "Run in the cheapest hours" for that.',build:({target:e,p:t,px:i,min:o,deviceName:s})=>{const r=ct(e,0,o);return lt({alias:`${s} - Run while cheap`,flag:i.cheap_now??null,target:e,startAct:r.startAct,stopAct:r.stopAct,contract:at(i),watchdogHours:t.max_runtime})}},{key:"pause_on_price_peak",title:"Pause during price peaks",desc:"Switch a load off when the price level hits its daily peak and back on when it drops. Trims the most expensive hours.",icon:"mdi:transmission-tower-off",color:"#e11d48",requires:"contract",targetDomains:["switch","input_boolean"],targetLabel:"Device to pause",aliasStem:"Pause on price peak",params:[],note:"This automation fully controls the chosen device: it forces it off at price peaks and back on afterwards.",build:({target:e,px:t,deviceName:i})=>({alias:`${i} - Pause on price peak`,description:et,mode:"restart",trigger:[{platform:"state",entity_id:t.price_level,to:"peak",id:"pause"},{platform:"state",entity_id:t.price_level,to:["very_low","low","medium","high"],id:"resume"}],condition:[],action:[{choose:[{conditions:[{condition:"trigger",id:"pause"},at(t)],sequence:[ot(e,!1)]},{conditions:[{condition:"trigger",id:"resume"}],sequence:[ot(e,!0)]}]}]})},{key:"precharge_climate_before_peak",title:"Pre-heat cheap, ease off at peak",desc:"Raise a thermostat setpoint during the cheapest block to store comfort, then lower it during the price peak. Uses the home as thermal storage.",icon:"mdi:home-thermometer",color:"#f59e0b",requires:"contract",targetDomains:["climate"],targetLabel:"Thermostat",aliasStem:"Pre-heat cheap",params:[{key:"hours",label:"Cheap block",default:2,min:1,max:6,step:1,unit:"h"},{key:"comfort",label:"Comfort temp",default:21,min:5,max:30,step:.5,unit:"°C"},{key:"eco",label:"Eco temp (peak)",default:18,min:5,max:30,step:.5,unit:"°C"}],build:({target:e,p:t,px:i,deviceName:o})=>({alias:`${o} - Pre-heat cheap, ease at peak`,description:et,mode:"restart",trigger:[{platform:"state",entity_id:i[`cheapest_${t.hours}h_window_now`]??null,to:"on",id:"cheap"},{platform:"state",entity_id:i.price_level,to:"peak",id:"peak"}],condition:[],action:[{choose:[{conditions:[{condition:"trigger",id:"cheap"},at(i)],sequence:[st(e,t.comfort)]},{conditions:[{condition:"trigger",id:"peak"}],sequence:[st(e,t.eco)]}]}]})},{key:"solar_surplus_switch",title:"Use solar surplus for a device",desc:"Switch a load on when the house exports more than it needs, and off when you would start importing - with hysteresis + dwell so it does not flap.",icon:"mdi:solar-power-variant",color:"#eab308",requires:"solar",targetDomains:["switch","input_boolean"],targetLabel:"Device to run on surplus",aliasStem:"Solar surplus",params:[{key:"device_power",label:"Device power",default:1400,min:100,max:11e3,step:50,unit:"W",help:"On when export exceeds this. Its own draw creates the off-hysteresis."},{key:"on_delay",label:"On after",default:5,min:1,max:30,step:1,unit:"min"},{key:"off_delay",label:"Off after",default:3,min:1,max:30,step:1,unit:"min"},{key:"max_runtime",label:"Safety max runtime",default:6,min:1,max:24,step:1,unit:"h"}],build:({target:e,p:t,net:i,deviceName:o,sources:s})=>({alias:`${o} - Solar surplus`,description:et,mode:"restart",trigger:[...Qe(i??"",s,t.device_power,t.on_delay,t.off_delay),{platform:"state",entity_id:e,to:"on",for:{hours:t.max_runtime},id:"watchdog"},tt],condition:[],action:[{choose:[{conditions:[{condition:"trigger",id:"on"}],sequence:[ot(e,!0)]},{conditions:[{condition:"trigger",id:["off","watchdog","boot"]}],sequence:[ot(e,!1)]}]}]})},{key:"solar_surplus_heat_boost",title:"Heat on solar surplus",desc:"On real solar surplus, raise a water-heater/heat-pump setpoint (or a charge-current number) to self-consume instead of exporting; revert when surplus fades.",icon:"mdi:water-boiler",color:"#f97316",requires:"solar",targetDomains:["climate","water_heater","number"],targetLabel:"Device to boost",aliasStem:"Heat on solar surplus",params:[{key:"device_power",label:"Surplus needed",default:1500,min:100,max:11e3,step:50,unit:"W"},{key:"boost",label:"Boost value",default:55,min:0,max:80,step:1,unit:"°C / value"},{key:"normal",label:"Normal value",default:45,min:0,max:80,step:1,unit:"°C / value"},{key:"on_delay",label:"On after",default:5,min:1,max:30,step:1,unit:"min"},{key:"off_delay",label:"Off after",default:5,min:1,max:30,step:1,unit:"min"}],build:({target:e,p:t,net:i,deviceName:o,sources:s})=>{const[r,n]=Qe(i??"",s,t.device_power,t.on_delay,t.off_delay);return{alias:`${o} - Heat on solar surplus`,description:et,mode:"restart",trigger:[{...r,id:"boost"},{...n,id:"normal"},tt],condition:[],action:[{choose:[{conditions:[{condition:"trigger",id:"boost"}],sequence:[st(e,t.boost)]},{conditions:[{condition:"trigger",id:["normal","boot"]}],sequence:[st(e,t.normal)]}]}]}}},{key:"keep_solar_export_near_zero",title:"Keep solar export near zero",desc:"Reduce inverter output while exporting and restore it when the home needs power. A writable limit is adjusted gradually; an enable switch uses safe periodic test starts.",icon:"mdi:solar-power-variant-outline",color:"#0d9488",requires:"solar",targetDomains:["number","switch","input_boolean"],targetLabel:"Writable inverter limit or safe enable control",aliasStem:"Keep solar export near zero",params:[{key:"export_threshold",label:"Allowed export",default:100,min:0,max:5e3,step:25,unit:"W",help:"Control starts only when export exceeds this margin."},{key:"import_threshold",label:"Restore above import",default:150,min:25,max:5e3,step:25,unit:"W",help:"Raise the limit, or immediately restart a paused inverter, when grid import exceeds this value."},{key:"normal_limit",label:"Normal output limit",default:100,min:1,max:1e5,step:1,unit:"target value",domains:["number"],help:"Usually 100 for a percentage entity, or the inverter maximum for a watt-based entity."},{key:"minimum_limit",label:"Minimum output limit",default:5,min:0,max:1e5,step:1,unit:"target value",domains:["number"],help:"Use the lowest value accepted by the inverter. A small non-zero limit is safer for many models."},{key:"step_size",label:"Adjustment per 30 seconds",default:5,min:.1,max:1e4,step:.1,unit:"target value",domains:["number"],help:"Smaller steps react more smoothly and reduce oscillation."},{key:"export_delay",label:"Switch off after",default:2,min:1,max:30,step:1,unit:"min",domains:["switch","input_boolean"],help:"Export must persist this long before an inverter enable switch is turned off."},{key:"retry_minutes",label:"Test start every",default:15,min:2,max:120,step:1,unit:"min",domains:["switch","input_boolean"],help:"The inverter is briefly restarted because an off inverter cannot show whether solar production is useful again."},{key:"probe_seconds",label:"Test duration",default:45,min:15,max:300,step:5,unit:"sec",domains:["switch","input_boolean"],help:"Time allowed for the inverter and grid meter to settle during a test start."},{key:"sensor_timeout",label:"Grid sensor fail-safe",default:2,min:1,max:30,step:1,unit:"min",domains:["switch","input_boolean"],help:"If grid telemetry is missing this long, the inverter is restored instead of being left off."}],note:"Preferred: select a writable inverter active-power/output-limit number. Only use the switch fallback with the inverter manufacturer's safe enable control or a dedicated helper that calls that control. Never switch the inverter's AC supply with a smart plug, relay or contactor. The fallback can briefly export during every test start.",build:({target:e,p:t,net:i,min:o,deviceName:s})=>{const r={...t,minimum_limit:Math.max(t.minimum_limit,o)};return"number"===it(e)?dt({alias:`${s} - Keep solar export near zero`,target:e,net:i??"",p:r}):ht({alias:`${s} - Keep solar export near zero`,target:e,net:i??"",p:r})}},{key:"avoid_negative_price_solar_export",title:"Avoid negative-price solar export",desc:"Curtail or pause solar only while the live feed-in price is below your limit and the home is exporting. Full production is restored automatically when the price recovers.",icon:"mdi:solar-power-variant-outline",color:"#dc2626",requires:"contract_solar",targetDomains:["number","switch","input_boolean"],targetLabel:"Writable inverter limit or safe enable control",aliasStem:"Avoid negative-price solar export",params:[{key:"feed_in_threshold",label:"Curtail below feed-in price",default:0,min:-5,max:5,step:.001,unit:"EUR/kWh",help:"Production is unrestricted again as soon as the feed-in price reaches this value."},{key:"export_threshold",label:"Allowed export",default:100,min:0,max:5e3,step:25,unit:"W",help:"No curtailment while the home uses the solar power itself."},{key:"import_threshold",label:"Restore above import",default:150,min:25,max:5e3,step:25,unit:"W",help:"Raise the limit, or immediately restart a paused inverter, when grid import exceeds this value."},{key:"normal_limit",label:"Normal output limit",default:100,min:1,max:1e5,step:1,unit:"target value",domains:["number"]},{key:"minimum_limit",label:"Minimum output limit",default:5,min:0,max:1e5,step:1,unit:"target value",domains:["number"]},{key:"step_size",label:"Adjustment per 30 seconds",default:5,min:.1,max:1e4,step:.1,unit:"target value",domains:["number"]},{key:"export_delay",label:"Switch off after",default:2,min:1,max:30,step:1,unit:"min",domains:["switch","input_boolean"]},{key:"retry_minutes",label:"Test start every",default:15,min:2,max:120,step:1,unit:"min",domains:["switch","input_boolean"]},{key:"probe_seconds",label:"Test duration",default:45,min:15,max:300,step:5,unit:"sec",domains:["switch","input_boolean"]},{key:"sensor_timeout",label:"Grid sensor fail-safe",default:2,min:1,max:30,step:1,unit:"min",domains:["switch","input_boolean"]}],note:"The controller only limits exported energy: solar used by the home remains available. A switch-only inverter is periodically test-started while prices remain negative, and is immediately restored on sufficient grid import, price recovery, contract disconnect or missing grid telemetry. Only use a manufacturer-provided safe enable control; never interrupt the inverter AC supply with a smart plug, relay or contactor.",build:({target:e,p:t,px:i,net:o,min:s,deviceName:r})=>{const n=i.feed_in_price??"",a=i.contract_active??"",c=`is_state('${a}', 'on') and has_value('${n}') and (states('${n}') | float(0)) < ${t.feed_in_threshold}`,l=`not is_state('${a}', 'on') or not has_value('${n}') or (states('${n}') | float(0)) >= ${t.feed_in_threshold}`,d=[{platform:"state",entity_id:i.feed_in_price,id:"source_changed"},{platform:"state",entity_id:i.contract_active,id:"source_changed"}],h={...t,minimum_limit:Math.max(t.minimum_limit,s)};return"number"===it(e)?dt({alias:`${r} - Avoid negative-price solar export`,target:e,net:o??"",p:h,activeTemplate:c,extraTriggers:d}):ht({alias:`${r} - Avoid negative-price solar export`,target:e,net:o??"",p:h,activeTemplate:c,restoreTemplate:l,extraTriggers:d})}},{key:"dump_load_on_negative_feed_in",title:"Self-consume on negative feed-in",desc:"When the feed-in price goes negative (you would pay to export), switch on a diversion load to self-consume instead. Off again when feed-in is positive.",icon:"mdi:transmission-tower-import",color:"#8b5cf6",requires:"contract",targetDomains:["switch","input_boolean"],targetLabel:"Diversion load",aliasStem:"Self-consume on negative feed-in",params:[],build:({target:e,px:t,deviceName:i})=>({alias:`${i} - Self-consume on negative feed-in`,description:et,mode:"restart",trigger:[{platform:"numeric_state",entity_id:t.feed_in_price,below:0,id:"on"},{platform:"numeric_state",entity_id:t.feed_in_price,above:0,id:"off"},tt],condition:[],action:[{choose:[{conditions:[{condition:"numeric_state",entity_id:t.feed_in_price,below:0},at(t)],sequence:[ot(e,!0)]}],default:[ot(e,!1)]}]})},{key:"ev_charge_cheapest_block",title:"Charge the car in the cheapest hours",desc:"Start EV charging at the beginning of the cheapest block and stop at the end.",icon:"mdi:car-electric",color:"#0ea5e9",requires:"contract",targetDomains:["switch","number"],targetLabel:"Charger switch or charge-current",aliasStem:"Charge EV cheapest",params:[{key:"hours",label:"Charge window",default:4,min:1,max:6,step:1,unit:"h"},{key:"current",label:"Charge current (for a number target)",default:16,min:6,max:32,step:1,unit:"A"}],note:'This charges during the cheapest block without a ready-by guarantee. For "car ready by 07:00", use a deadline schedule below.',build:({target:e,p:t,px:i,min:o,deviceName:s})=>{const r=t.hours,n=ct(e,t.current,o);return lt({alias:`${s} - Charge EV cheapest ${r}h`,flag:i[`cheapest_${r}h_window_now`]??null,target:e,startAct:n.startAct,stopAct:n.stopAct,contract:at(i),watchdogHours:n.switchTarget?r+1:void 0})}}];function ut(e){const t=e.variables?.shs_managed_settings;if("string"==typeof t)try{const e=JSON.parse(t);if(!e||!Array.isArray(e.targets)||"object"!=typeof e.params)return;return e}catch{return}}function gt(e){const t=[],i=e=>{if(Array.isArray(e))return void e.forEach(i);if(!e||"object"!=typeof e)return;const o=e;t.push(o),Object.values(o).forEach(i)};return i(e),t}class mt extends le{constructor(){super(...arguments),this.deviceId="",this.deviceName="",this.deviceEntities=[],this.showHeader=!0,this.dialogOnly=!1,this.autoEditScenario="",this.autoEditId="",this.autoEditEntityId="",this.autoEditEnabled=!0,this._priceEntities={},this._contractActive=!1,this._sources={},this._loaded=!1,this._created={},this._modal=null,this._targets=[""],this._params={},this._busy=!1,this._modalLoading=!1,this._error="",this._editId="",this._editEntityId="",this._editEnabled=!0,this._autoEditOpened=!1}connectedCallback(){super.connectedCallback(),this._load()}updated(){if(!this._loaded||!this.autoEditScenario||!this.autoEditId||this._autoEditOpened)return;const e=pt.find(e=>e.key===this.autoEditScenario);e&&(this._autoEditOpened=!0,this._openEditModal(e,{id:this.autoEditId,entityId:this.autoEditEntityId||void 0,enabled:this.autoEditEnabled}))}async _load(){if(this.hass){try{const e=await this.hass.callWS({type:"smarthomeshop/prices/entities"});this._priceEntities=e.entities||{};const t=await this.hass.callWS({type:"smarthomeshop/device/config",device_id:this.deviceId});this._contractActive=!!t.contract_active;const i=await this.hass.callWS({type:"smarthomeshop/energy_sources"});this._sources=i.sources||{}}catch(e){console.error("energy-automations: load failed",e)}this._loaded=!0}}_netEntity(){return this.deviceEntities.find(e=>e.entity_id.includes("net_grid_power"))?.entity_id}async _freshSources(){let e=this._sources;try{e=(await this.hass.callWS({type:"smarthomeshop/energy_sources"})).sources||{},this._sources=e}catch{}if(e.battery_power){const t=String(this.hass.states[e.battery_power]?.attributes?.unit_of_measurement||"");e={...e,battery_scale:/kw/i.test(t)?1e3:1}}return e}_missingRequirement(e){const t=this._contractActive,i=!!this._netEntity();if("contract"===e.requires&&!t)return"Needs dynamic prices";if("solar"===e.requires&&!i)return"Needs grid meter";if("contract_solar"===e.requires){if(!t&&!i)return"Needs prices + grid meter";if(!t)return"Needs dynamic prices";if(!i)return"Needs grid meter"}return""}_automationRef(e){const t=this._created[e.key],i=`${this.deviceName||"the device"} - `;for(const[o,s]of Object.entries(this.hass.states||{})){if(!o.startsWith("automation."))continue;const r=s.attributes?.friendly_name,n=s.attributes?.id;if(t&&n===t||r&&r.startsWith(i)&&r.includes(e.aliasStem)){if(!n)return;return{id:n,entityId:o,enabled:"off"!==s.state}}}return t?{id:t,enabled:!0}:void 0}_openModal(e){this._missingRequirement(e)||(this._error="",this._modal=e,this._targets=[""],this._params=Object.fromEntries(e.params.map(e=>[e.key,e.default])),this._editId="",this._editEntityId="",this._editEnabled=!0)}async _openEditModal(e,t){this._openModal(e),this._editId=t.id,this._editEntityId=t.entityId||"",this._editEnabled=t.enabled,this._modalLoading=!0;try{const i=await this.hass.callApi("GET",`config/automation/config/${t.id}`),o=function(e,t){const i=ut(e)?.targets.filter(e=>t.includes(it(e)));if(i?.length)return[...new Set(i)];const o=new Set;for(const i of gt(e)){if(!i.service&&!i.action||!i.target?.entity_id)continue;const e=Array.isArray(i.target.entity_id)?i.target.entity_id:[i.target.entity_id];for(const i of e)"string"==typeof i&&t.includes(it(i))&&o.add(i)}return[...o]}(i,e.targetDomains);this._targets=o.length?o:[""],this._params=function(e,t){const i=Object.fromEntries(e.params.map(e=>[e.key,e.default])),o=ut(t);if(o?.scenario===e.key){for(const t of e.params){const e=o.params[t.key];Number.isFinite(e)&&(i[t.key]=e)}return i}const s=gt(t),r=String(t.alias||""),n=r.match(/(\d+)h\b/)?.[1];n&&"hours"in i&&(i.hours=Number(n));const a=e=>s.find(t=>t.id===e&&t.platform),c=s.filter(e=>(e.service||e.action)&&e.data&&"object"==typeof e.data),l=Number(a("watchdog")?.for?.hours);if(Number.isFinite(l)&&"max_runtime"in i&&(i.max_runtime=l),"solar_surplus_switch"===e.key||"solar_surplus_heat_boost"===e.key){const e=a("on")||a("boost"),t=a("off")||a("normal"),o=Number(e?.below),s=Number(e?.for?.minutes),r=Number(t?.for?.minutes);Number.isFinite(o)&&(i.device_power=Math.abs(o)),Number.isFinite(s)&&(i.on_delay=s),Number.isFinite(r)&&(i.off_delay=r)}const d=c.map(e=>Number(e.data?.temperature)).filter(Number.isFinite);if("precharge_climate_before_peak"===e.key&&d.length>=2&&(i.comfort=d[0],i.eco=d[1]),"solar_surplus_heat_boost"===e.key&&d.length>=2&&(i.boost=d[0],i.normal=d[1]),"ev_charge_cheapest_block"===e.key){const e=c.map(e=>Number(e.data?.value)).find(Number.isFinite);null!=e&&(i.current=e)}if("keep_solar_export_near_zero"===e.key||"avoid_negative_price_solar_export"===e.key){const e=a("export"),t=a("import"),o=a("sensor_failure"),r=Number(e?.below),n=Number(t?.above),c=Number(e?.for?.minutes),l=Number(o?.for?.minutes);Number.isFinite(r)&&(i.export_threshold=Math.abs(r)),Number.isFinite(n)&&(i.import_threshold=n),Number.isFinite(c)&&(i.export_delay=c),Number.isFinite(l)&&(i.sensor_timeout=l);const d=s.find(e=>Number.isFinite(Number(e.delay?.seconds)));d&&(i.probe_seconds=Number(d.delay.seconds))}if("avoid_negative_price_solar_export"===e.key){const e=JSON.stringify(t),o=e.match(/float\(0\)\) < (-?\d+(?:\.\d+)?)/)?.[1];null!=o&&(i.feed_in_threshold=Number(o))}return i}(e,i),o.length||(this._error="The existing automation has no supported target entities. Select one before saving.")}catch(e){console.error("energy-automations: edit load failed",e),this._error=`Could not load the existing automation. ${e?.message||""}`}this._modalLoading=!1}_closeModal(){this._busy||(this._modal=null,this._modalLoading=!1,this.dialogOnly&&this.dispatchEvent(new CustomEvent("shs-dialog-closed",{bubbles:!0,composed:!0})))}_setTarget(e,t){const i=[...this._targets];i[e]=t,this._targets=i}_addTarget(){this._targets=[...this._targets,""]}_removeTarget(e){1!==this._targets.length?this._targets=this._targets.filter((t,i)=>i!==e):this._targets=[""]}_entityAllowed(e,t,i){const o="string"==typeof e?e:e.entity_id||"";return!!t.targetDomains.includes(it(o))&&!this._targets.some((e,t)=>t!==i&&e===o)}_sanitized(e,t){const i={};for(const t of e.params){let e=this._params[t.key];("number"!=typeof e||Number.isNaN(e))&&(e=t.default),null!=t.min&&e<t.min&&(e=t.min),null!=t.max&&e>t.max&&(e=t.max),"hours"===t.key&&(e=Math.max(1,Math.min(6,Math.round(e)))),i[t.key]=e}let o=0;const s=this.hass.states[t];if(s&&"number"===it(t)){const e=Number(s.attributes?.min),t=Number(s.attributes?.max),r=Number(s.attributes?.step);Number.isFinite(e)&&(o=e);const n=Number.isFinite(t)?t:Number.POSITIVE_INFINITY;if("normal_limit"in i&&(i.normal_limit=Math.max(o,Math.min(n,i.normal_limit))),"minimum_limit"in i&&(i.minimum_limit=Math.max(o,Math.min(i.normal_limit??n,i.minimum_limit))),"step_size"in i){const e=Number.isFinite(r)&&r>0?r:.1,t=Number.isFinite(n)?Math.max(e,n-o):Number.POSITIVE_INFINITY;i.step_size=Math.max(e,Math.min(t,i.step_size))}}return{params:i,min:o}}async _save(){const e=this._modal,t=[...new Set(this._targets.filter(Boolean))];if(!e||!t.length||this._busy||this._modalLoading)return;if(!this.hass.user?.is_admin)return void(this._error="Administrator required.");this._busy=!0,this._error="";let i=!1;try{const o=await this._freshSources(),s=function(e){const t=e[0],i=new Map;for(const t of e)for(const e of t.trigger||[])i.set(JSON.stringify(e),e);return{...t,trigger:[...i.values()],condition:t.condition||[],action:e.flatMap(e=>e.action||[])}}(t.map(t=>{const{params:i,min:s}=this._sanitized(e,t);return e.build({target:t,p:i,px:this._priceEntities,net:this._netEntity(),min:s,deviceName:this.deviceName||"the device",sources:o})}));if(s.variables={...s.variables||{},shs_managed_settings:JSON.stringify({version:1,scenario:e.key,targets:t,params:this._params})},JSON.stringify(s).includes('"entity_id":null'))return this._error="The energy price sensors are not ready yet. Try again in a moment.",void(this._busy=!1);const r=this._editId||`shs_${this.deviceId.slice(0,6)}_${e.key}_${Date.now()}`;await this.hass.callApi("POST",`config/automation/config/${r}`,s),this._created={...this._created,[e.key]:r},i=!0}catch(e){console.error("energy-automations: save failed",e),this._error=`Could not save the automation. ${e?.message||""}`}this._busy=!1,i&&this._closeModal()}async _toggleAutomation(){if(this._editEntityId&&!this._busy){this._busy=!0,this._error="";try{const e=!this._editEnabled;await this.hass.callService("automation",e?"turn_on":"turn_off",{entity_id:this._editEntityId}),this._editEnabled=e}catch(e){console.error("energy-automations: toggle failed",e),this._error=`Could not ${this._editEnabled?"disable":"enable"} the automation. ${e?.message||""}`}this._busy=!1}}_renderCard(e){const t=this._automationRef(e),i=!!this.hass.user?.is_admin,o=this._missingRequirement(e);return U`
      <div class=${"card"+(o?" unavailable":"")}>
        <div class="card-head">
          <div class="card-icon" style="background: ${e.color}1f; color: ${e.color};"><ha-icon icon=${e.icon}></ha-icon></div>
          <div>
            <div class="card-title">${e.title}</div>
            <div class="card-desc">${e.desc}</div>
            ${o?U`<span class="tag solar">${o}</span>`:K}
          </div>
        </div>
        <div class="card-foot">
          ${t?U`
            <span class=${"created"+(t.enabled?"":" disabled")}>
              <ha-icon icon=${t.enabled?"mdi:check-circle":"mdi:pause-circle"} style="--mdc-icon-size:15px;"></ha-icon>
              ${t.enabled?"Created":"Disabled"} ·
              <button @click=${()=>this._openEditModal(e,t)}>Edit</button>
            </span>
          `:U`
            <button class="create-btn" ?disabled=${!i||!!o}
              title=${o||K}
              @click=${()=>this._openModal(e)}><ha-icon icon="mdi:plus"></ha-icon> Set up</button>
          `}
        </div>
      </div>`}_renderModal(){const e=this._modal;if(!e)return K;const t=this._targets.filter(Boolean),i=!!this._editId;return U`
      <div class="modal-backdrop" @click=${this._closeModal}>
        <div class="modal" @click=${e=>e.stopPropagation()}>
          <div class="modal-head">
            <div class="card-icon" style="background: ${e.color}1f; color: ${e.color};"><ha-icon icon=${e.icon}></ha-icon></div>
            <div>
              <div class="modal-title">${e.title}</div>
              <div class="modal-sub">${i?"Edit existing automation":this.deviceName}</div>
            </div>
            <button class="modal-x" ?disabled=${this._busy} @click=${this._closeModal}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          ${this._modalLoading?U`
            <div class="modal-loading">
              <div>Loading automation settings...</div>
            </div>
          `:U`<div class="modal-body">
            <p class="modal-desc">${e.desc}</p>
            ${e.note?U`<div class="note"><ha-icon icon="mdi:information-outline" style="--mdc-icon-size:14px;"></ha-icon> ${e.note}</div>`:K}

            <div class="field">
              <label class="f">${e.targetLabel}${this._targets.length>1?"s":""}</label>
              <div class="target-list">
                ${this._targets.map((t,i)=>U`
                  <div class="target-row">
                    <ha-entity-picker
                      .hass=${this.hass}
                      .value=${t}
                      .includeDomains=${e.targetDomains}
                      .entityFilter=${t=>this._entityAllowed(t,e,i)}
                      .allowCustomEntity=${!1}
                      @value-changed=${e=>this._setTarget(i,e.detail?.value||"")}
                    ></ha-entity-picker>
                    <button class="remove-target" title="Remove entity" @click=${()=>this._removeTarget(i)}>
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                `)}
              </div>
              <button class="add-target" @click=${this._addTarget}>
                <ha-icon icon="mdi:plus"></ha-icon> Add another entity
              </button>
              <div class="help">All selected entities are controlled together by this automation.</div>
            </div>

            ${e.params.filter(e=>!e.domains||!t.length||t.some(t=>e.domains.includes(it(t)))).map(e=>U`
              <div class="field">
                <label class="f">${e.label}</label>
                <div class="row">
                  <input type="number" .value=${String(this._params[e.key]??e.default)}
                    min=${e.min??K} max=${e.max??K} step=${e.step??K}
                    @input=${t=>{this._params={...this._params,[e.key]:parseFloat(t.target.value)}}} />
                  ${e.unit?U`<span class="unit">${e.unit}</span>`:K}
                </div>
                ${e.help?U`<div class="help">${e.help}</div>`:K}
              </div>
            `)}

            ${this._error?U`<div class="warn">${this._error}</div>`:K}
          </div>`}
          <div class="modal-foot">
            ${i&&this._editEntityId?U`
              <button
                class=${"btn-ghost btn-toggle"+(this._editEnabled?"":" enable")}
                ?disabled=${this._busy||this._modalLoading}
                @click=${this._toggleAutomation}
              >
                ${this._editEnabled?"Disable automation":"Enable automation"}
              </button>
            `:K}
            <button class="btn-ghost" ?disabled=${this._busy} @click=${this._closeModal}>Cancel</button>
            <button class="create-btn" ?disabled=${!t.length||this._busy||this._modalLoading} @click=${this._save}>
              <ha-icon icon=${i?"mdi:content-save-outline":"mdi:plus"}></ha-icon>
              ${this._busy?"Saving...":i?"Save changes":"Create automation"}
            </button>
          </div>
        </div>
      </div>`}render(){if(!this._loaded)return K;const e=this.scenarioKeys?.length?pt.filter(e=>this.scenarioKeys.includes(e.key)):pt;return this.dialogOnly?this._renderModal():U`
      ${this.showHeader?U`
        <div class="head">
          <div class="head-title">Smart energy</div>
          <div class="head-sub">
            Steer devices around prices and solar production. Loads can run in cheap or surplus hours,
            while inverter output can be reduced safely to avoid unwanted export. Each setup creates a
            normal, editable Home Assistant automation with restart recovery and fail-safe behaviour.
          </div>
        </div>
      `:K}
      <div class="cards">${e.map(e=>this._renderCard(e))}</div>
      ${this._renderModal()}
    `}}var vt;mt.styles=n`
    :host { display: block; --shs-primary: #4361ee; }
    .head { margin: 8px 0 12px; }
    .head-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .head-sub { font-size: 12.5px; color: var(--secondary-text-color); line-height: 1.5; margin-top: 4px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .card { display: flex; flex-direction: column; gap: 10px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 14px; }
    .card.unavailable { background: var(--secondary-background-color); }
    .card.unavailable .card-head { opacity: .72; }
    .card-head { display: flex; align-items: flex-start; gap: 10px; }
    .card-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .card-icon ha-icon { --mdc-icon-size: 20px; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
    .card-desc { font-size: 12px; color: var(--secondary-text-color); line-height: 1.4; margin-top: 2px; }
    .tag { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; padding: 2px 6px; border-radius: 5px; margin-top: 6px; }
    .tag.solar { background: rgba(234,179,8,.15); color: #b45309; }
    .card-foot { display: flex; align-items: center; gap: 8px; margin-top: auto; }
    .create-btn { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .create-btn:disabled { opacity: 0.5; cursor: default; }
    .create-btn ha-icon { --mdc-icon-size: 15px; }
    .created { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #22c55e; }
    .created button { border: 0; padding: 0; background: none; color: var(--shs-primary); font: inherit; cursor: pointer; }
    .created.disabled { color: var(--secondary-text-color); }
    .warn { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); color: var(--primary-text-color); border-radius: 10px; padding: 12px 14px; margin: 8px 0; font-size: 13px; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
    .modal { width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    .modal-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--divider-color); position: sticky; top: 0; background: var(--card-background-color); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .modal-sub { font-size: 12.5px; color: var(--secondary-text-color); margin-top: 1px; }
    .modal-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .modal-x ha-icon { --mdc-icon-size: 20px; }
    .modal-body { padding: 18px 20px; }
    .modal-desc { font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; margin: 0 0 16px; }
    .note { background: rgba(59,130,246,.08); border: 1px solid var(--divider-color); border-radius: 8px; padding: 10px 12px; font-size: 12px; color: var(--secondary-text-color); line-height: 1.45; margin-bottom: 16px; }
    label.f { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .4px; margin: 0 0 6px; }
    .field { margin-bottom: 14px; }
    .field .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; line-height: 1.4; }
    ha-entity-picker { display: block; width: 100%; --mdc-theme-primary: var(--shs-primary); }
    input[type="number"] { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .target-list { display: grid; gap: 8px; }
    .target-row { display: grid; grid-template-columns: minmax(0, 1fr) 36px; align-items: center; gap: 8px; }
    .remove-target { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--secondary-text-color); cursor: pointer; }
    .remove-target:hover { color: var(--error-color, #dc2626); border-color: currentColor; }
    .remove-target ha-icon { --mdc-icon-size: 18px; }
    .add-target { display: inline-flex; align-items: center; gap: 5px; border: 0; padding: 7px 0 0; background: none; color: var(--shs-primary); font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .add-target ha-icon { --mdc-icon-size: 16px; }
    .row { display: flex; align-items: center; gap: 8px; }
    .row input { max-width: 130px; text-align: right; }
    .row .unit { font-size: 12px; color: var(--secondary-text-color); }
    input:focus { outline: none; border-color: var(--shs-primary); }
    .modal-loading { min-height: 180px; display: grid; place-items: center; color: var(--secondary-text-color); font-size: 13px; }
    .modal-foot { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--divider-color); position: sticky; bottom: 0; background: var(--card-background-color); }
    .btn-ghost { padding: 9px 16px; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--primary-text-color); font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; }
    .btn-toggle { margin-right: auto; color: var(--error-color, #dc2626); }
    .btn-toggle.enable { color: #16a34a; }
    button:disabled { opacity: .5; cursor: default; }
    .modal-foot .create-btn { margin-left: 0; }
    @media (max-width: 560px) {
      .modal-backdrop { align-items: flex-end; padding: 0; }
      .modal { max-height: 94vh; border-radius: 16px 16px 0 0; border-bottom: 0; }
      .modal-foot { flex-wrap: wrap; }
      .btn-toggle { width: 100%; margin: 0 0 2px; }
    }
  `,e([ge({attribute:!1})],mt.prototype,"hass",void 0),e([ge()],mt.prototype,"deviceId",void 0),e([ge()],mt.prototype,"deviceName",void 0),e([ge({attribute:!1})],mt.prototype,"deviceEntities",void 0),e([ge({attribute:!1})],mt.prototype,"scenarioKeys",void 0),e([ge({type:Boolean})],mt.prototype,"showHeader",void 0),e([ge({type:Boolean})],mt.prototype,"dialogOnly",void 0),e([ge()],mt.prototype,"autoEditScenario",void 0),e([ge()],mt.prototype,"autoEditId",void 0),e([ge()],mt.prototype,"autoEditEntityId",void 0),e([ge({type:Boolean})],mt.prototype,"autoEditEnabled",void 0),e([me()],mt.prototype,"_priceEntities",void 0),e([me()],mt.prototype,"_contractActive",void 0),e([me()],mt.prototype,"_sources",void 0),e([me()],mt.prototype,"_loaded",void 0),e([me()],mt.prototype,"_created",void 0),e([me()],mt.prototype,"_modal",void 0),e([me()],mt.prototype,"_targets",void 0),e([me()],mt.prototype,"_params",void 0),e([me()],mt.prototype,"_busy",void 0),e([me()],mt.prototype,"_modalLoading",void 0),e([me()],mt.prototype,"_error",void 0),e([me()],mt.prototype,"_editId",void 0),e([me()],mt.prototype,"_editEntityId",void 0),e([me()],mt.prototype,"_editEnabled",void 0),customElements.get("shs-energy-automations")||customElements.define("shs-energy-automations",mt);let _t=vt=class extends le{constructor(){super(...arguments),this._loaded=!1,this._sources={},this._p1Devices=[],this._p1Saving=!1,this._netByDevice={},this._entitiesByDevice={},this._historyQueued=!1,this._account=null,this._schedules=[],this._battery={},this._priceTab="today",this._cheapestHours=3,this._history={},this._hoverBar=-1,this._powerChartWidth=760,this._hiddenPowerSeries=[],this._statisticsChartReady=!1,this._settingsOpen=!1,this._settingsTab="connection",this._savings={},this._wizardDone=!1,this._wizardKeyInput="",this._wizardBusy=!1,this._wizardError="",this._wizardContracts=[],this._wizardContractSkipped=!1,this._wizardEngaged=!1,this._wizardContractsRequested=!1,this._loadStarted=!1,this._accountPollAttempts=0}connectedCallback(){super.connectedCallback(),this._timer=window.setInterval(()=>this._load(),6e4)}disconnectedCallback(){this._timer&&window.clearInterval(this._timer),this._accountPollTimer&&window.clearTimeout(this._accountPollTimer),this._timer=void 0,this._accountPollTimer=void 0,this._accountPollAttempts=0,this._powerChartObserver?.disconnect(),this._powerChartObserver=void 0,this._powerChartElement=void 0,super.disconnectedCallback()}updated(){const e=this.renderRoot.querySelector(".power-surface .chart");e!==this._powerChartElement&&(this._powerChartObserver?.disconnect(),this._powerChartElement=e||void 0,e&&"undefined"!=typeof ResizeObserver&&(this._powerChartObserver=new ResizeObserver(e=>{const t=Math.round(e[0]?.contentRect.width||0);t>0&&Math.abs(t-this._powerChartWidth)>1&&(this._powerChartWidth=t)}),this._powerChartObserver.observe(e)))}willUpdate(){this.hass&&!this._loadStarted&&(this._loadStarted=!0,this._load())}async _load(){if(this.hass)return this._loading||(this._loading=this._loadData().finally(()=>{this._loading=void 0})),this._loading}async _callWS(e,t){let i;try{return await Promise.race([this.hass.callWS(e),new Promise((o,s)=>{i=window.setTimeout(()=>s(new Error(`${String(e.type)} timed out`)),t)})])}finally{void 0!==i&&window.clearTimeout(i)}}async _loadData(){this._startAccountLoad("smarthomeshop/account");try{const[e,t,i,o,s,r]=await Promise.allSettled([this._callWS({type:"smarthomeshop/energy_sources"},vt.INITIAL_LOAD_TIMEOUT),this._callWS({type:"smarthomeshop/prices/entities"},vt.INITIAL_LOAD_TIMEOUT),this._callWS({type:"smarthomeshop/schedules"},vt.INITIAL_LOAD_TIMEOUT),this._callWS({type:"smarthomeshop/battery"},vt.INITIAL_LOAD_TIMEOUT),this._callWS({type:"smarthomeshop/savings"},vt.INITIAL_LOAD_TIMEOUT),this._callWS({type:"smarthomeshop/devices"},vt.INITIAL_LOAD_TIMEOUT)]);if("fulfilled"!==e.status||this._p1Saving||(this._sources=e.value.sources||{}),"fulfilled"===t.status&&(this._priceEntity=t.value.entities?.electricity_price||void 0),"fulfilled"===i.status&&(this._schedules=i.value.schedules||[]),"fulfilled"===o.status&&(this._battery=o.value.battery||{}),"fulfilled"===s.status&&(this._savings=s.value.savings||{}),"fulfilled"===r.status){const e=(r.value.devices||[]).filter(e=>"p1meterkit"===e.product_type||"waterp1meterkit"===e.product_type),t=await Promise.all(e.map(async e=>{try{const t=await this._callWS({type:"smarthomeshop/device/entities",device_id:e.id},vt.INITIAL_LOAD_TIMEOUT),i=(t.entities||[]).find(e=>e.entity_id.startsWith("sensor.")&&e.entity_id.includes("_net_grid_power"));return i?{device:e,netEntity:i.entity_id,entities:t.entities||[]}:null}catch{return null}})),i={},o={};this._p1Devices=t.filter(e=>null!==e).map(({device:e,netEntity:t,entities:s})=>(i[e.id]=t,o[e.id]=s,{id:e.id,name:e.name,product_name:e.product_name,online:!1!==e.online})),this._netByDevice=i,this._entitiesByDevice=o}this._resolveNetEntity()}catch(e){console.warn("Energy overview load failed",e)}finally{this._loaded=!0,this._startHistoryLoad()}}_startAccountLoad(e){this._accountLoading||(this._accountLoading=this._callWS({type:e},vt.BACKGROUND_LOAD_TIMEOUT).then(e=>{this._account=e,this._watchAccountRefresh(e,!0)}).catch(e=>{console.warn("Energy account load failed",e)}).finally(()=>{this._accountLoading=void 0}))}_watchAccountRefresh(e,t=!1){if(t&&(this._accountPollTimer&&window.clearTimeout(this._accountPollTimer),this._accountPollTimer=void 0,this._accountPollAttempts=0),!e?.refreshing)return this._accountPollTimer&&window.clearTimeout(this._accountPollTimer),this._accountPollTimer=void 0,void(this._accountPollAttempts=0);!this.isConnected||this._accountPollTimer||this._accountPollAttempts>=30||(this._accountPollTimer=window.setTimeout(()=>{this._accountPollTimer=void 0,this._pollAccountRefresh()},1500))}async _pollAccountRefresh(){if(this.isConnected){this._accountPollAttempts+=1;try{const e=await this._callWS({type:"smarthomeshop/account"},vt.INITIAL_LOAD_TIMEOUT);this._account=e,this._watchAccountRefresh(e)}catch(e){this._accountPollAttempts<30?this._watchAccountRefresh(this._account):console.warn("Energy account status polling failed",e)}}}_startHistoryLoad(){this._historyLoading?this._historyQueued=!0:this._historyLoading=this._loadHistory().finally(()=>{this._historyLoading=void 0,this._historyQueued&&(this._historyQueued=!1,this._startHistoryLoad())})}async _loadHistory(){const e=[this._netEntity(),this._sources.solar_power,this._sources.battery_power].filter(Boolean);if(e.length)try{const t=new Date(this._todayStart()).toISOString(),[i,o,s]=await Promise.all([this._callWS({type:"recorder/statistics_during_period",start_time:t,end_time:(new Date).toISOString(),statistic_ids:e,period:"5minute",types:["mean","min","max"]},vt.HISTORY_LOAD_TIMEOUT).catch(()=>({})),this._callWS({type:"history/history_during_period",start_time:t,entity_ids:e,minimal_response:!0,no_attributes:!0,significant_changes_only:!0},vt.HISTORY_LOAD_TIMEOUT).catch(()=>({})),this._ensureStatisticsChart(e[0])]),r={};this._statisticsChartReady=s;for(const t of e){const e=t===this._sources.solar_power?!!this._sources.solar_invert:t===this._sources.battery_power&&!!this._sources.battery_invert,s=(e?-1:1)*this._scale(t),n=(i[t]||[]).map(e=>{const t=Number(e.min),i=Number(e.max);return{t:this._normaliseHistoryTime(e.start),end:this._normaliseHistoryTime(e.end),v:s*Number(e.mean),min:s<0?s*i:s*t,max:s<0?s*t:s*i}}).filter(e=>Number.isFinite(e.v)&&Number.isFinite(e.min)&&Number.isFinite(e.max)&&Number.isFinite(e.t)&&e.t>0);if(n.length>1){r[t]=n;continue}const a=(o[t]||[]).map(e=>{const t=e.lu??e.lc??e.last_updated??e.last_changed;return{t:this._normaliseHistoryTime(t),v:s*Number(e.s??e.state)}}).filter(e=>Number.isFinite(e.v)&&Number.isFinite(e.t)&&e.t>0);r[t]=this._downsample(a,360)}this._history=r}catch{}else this._history={}}_normaliseHistoryTime(e){return"number"==typeof e?e>1e12?e:1e3*e:Date.parse(String(e))}async _ensureStatisticsChart(e){return!!customElements.get("statistics-chart")||!!window.loadCardHelpers&&(window.__shsStatisticsChartReady||(window.__shsStatisticsChartReady=(async()=>((await window.loadCardHelpers()).createCardElement({type:"statistics-graph",entities:e?[e]:["sensor.invalid"]}),Promise.race([customElements.whenDefined("statistics-chart").then(()=>!0),new Promise(e=>window.setTimeout(()=>e(!1),8e3))])))().catch(()=>!1)),window.__shsStatisticsChartReady)}_downsample(e,t){if(e.length<=t)return e;if(t<4)return[e[0],e[e.length-1]].slice(0,t);const i=e[0],o=e[e.length-1],s=e.slice(1,-1),r=Math.max(1,Math.floor((t-2)/2)),n=[i];for(let e=0;e<r;e+=1){const t=Math.floor(e*s.length/r),i=Math.floor((e+1)*s.length/r),o=s.slice(t,i);if(!o.length)continue;const a=o.reduce((e,t)=>t.v<e.v?t:e),c=o.reduce((e,t)=>t.v>e.v?t:e);n.push(...a.t<=c.t?[a,c]:[c,a])}return n.push(o),n.filter((e,t,i)=>0===t||e.t!==i[t-1].t||e.v!==i[t-1].v)}_effectiveP1(){const e=this._sources.p1_device;return e&&this._p1Devices.find(t=>t.id===e)||this._p1Devices[0]}_resolveNetEntity(){const e=this._effectiveP1();this._netEntityId=e?this._netByDevice[e.id]:void 0}_netEntity(){return this._netEntityId?this._netEntityId:this._p1Devices.length?void 0:Object.keys(this.hass.states||{}).find(e=>e.startsWith("sensor.")&&e.includes("_net_grid_power"))}async _selectP1(e){if(!this._p1Saving&&e&&e!==this._sources.p1_device){this._p1Saving=!0;try{await this._callWS({type:"smarthomeshop/energy_sources/set",config:{p1_device:e}},vt.BACKGROUND_LOAD_TIMEOUT),this._sources={...this._sources,p1_device:e},this._resolveNetEntity(),this._history={},this._startHistoryLoad()}catch(e){console.warn("P1 selection save failed",e);const t=this.renderRoot.querySelector(".p1-select");t&&(t.value=this._effectiveP1()?.id||""),alert(`Could not save the P1 meter selection. ${e?.message||"Administrator rights are required."}`)}finally{this._p1Saving=!1}}}_scale(e){const t=String(e&&this.hass.states[e]?.attributes?.unit_of_measurement||"");return/^kw$/i.test(t)?1e3:1}_num(e,t=!1){if(!e)return null;const i=this.hass.states[e];if(!i||"unavailable"===i.state||"unknown"===i.state)return null;const o=Number(i.state);return Number.isFinite(o)?(t?-1:1)*this._scale(e)*o:null}_isDead(e){if(!e)return!1;const t=this.hass.states[e];return!t||"unavailable"===t.state||"unknown"===t.state}_formatPower(e,t=!1){if(null===e)return{value:"-",unit:""};const i=t?Math.abs(e):e;return Math.abs(i)>=1e3?{value:(i/1e3).toFixed(2),unit:"kW"}:{value:String(Math.round(i)),unit:"W"}}_formatPrice(e){return null!=e&&Number.isFinite(Number(e))?`€ ${Number(e).toFixed(3)}`:"-"}_priceRows(e){const t=this._priceEntity?this.hass.states[this._priceEntity]?.attributes:void 0,i="today"===e?t?.prices_today:t?.prices_tomorrow;return Array.isArray(i)?i.filter(e=>e&&"string"==typeof e.start&&"number"==typeof e.consumer):[]}_periodFromRow(e){return{start:e.start,end:new Date(new Date(e.start).getTime()+36e5).toISOString(),price:e.consumer}}_cheapestPriceBlock(e,t){const i=Math.max(1,Math.min(6,Math.round(t)));if(e.length<i)return null;const o=[...e].sort((e,t)=>new Date(e.start).getTime()-new Date(t.start).getTime());let s=null;for(let e=0;e+i<=o.length;e+=1){const t=o.slice(e,e+i),r=t.map(e=>new Date(e.start).getTime());if(!(r.every(Number.isFinite)&&r.slice(1).every((e,t)=>Math.abs(e-r[t]-36e5)<1e3)))continue;const n=t.reduce((e,t)=>e+t.consumer,0)/i;(!s||n<s.average)&&(s={hours:i,start:t[0].start,end:new Date(r[r.length-1]+36e5).toISOString(),average:n})}return s}_priceInsights(e,t){if(!e.length)return null;const i=Date.now(),o=e.find(e=>{const t=new Date(e.start).getTime();return Number.isFinite(t)&&t<=i&&t+36e5>i}),s=Number(this._account?.current?.electricity),r=o?.consumer??s;if(!Number.isFinite(r))return null;const n=e.map(e=>e.consumer),a=n.reduce((e,t)=>e+t,0)/n.length,c=e.reduce((e,t)=>t.consumer<e.consumer?t:e,e[0]),l=e.reduce((e,t)=>t.consumer>e.consumer?t:e,e[0]),d=r-a,h=Math.abs(a)>1e-6?d/Math.abs(a)*100:null,p=[...e,...t].filter(e=>new Date(e.start).getTime()>i&&e.consumer<r).sort((e,t)=>new Date(e.start).getTime()-new Date(t.start).getTime())[0],u=this._account?.summary?.next_lower_period,g=u?new Date(u.start).getTime():Number.NaN,m=u&&Number.isFinite(g)&&g>i&&Number(u.price)<r,v=Number(this._account?.current?.feed_in);return{current:r,feedIn:"number"==typeof o?.feed_in?o.feed_in:Number.isFinite(v)?v:null,average:a,difference:d,differencePercentage:h,lowest:this._periodFromRow(c),highest:this._periodFromRow(l),nextLower:m?u:p?{...this._periodFromRow(p),saving:r-p.consumer}:null,negativeHours:n.filter(e=>e<0).length,spread:Math.max(...n)-Math.min(...n)}}_homeSourcePill(e,t,i,o,s){if(null===e||s||e<=0)return null;const r=Math.max(0,i??0),n=Math.max(0,o??0),a=Math.max(0,e-r-n);if(null!==t&&t>5&&a>5){return{cls:"amber",icon:"mdi:transmission-tower-import",text:`${Math.min(100,Math.max(0,Math.round(a/e*100)))}% from the grid`}}const c=r>5,l=n>5;return c&&l?{cls:"green",icon:"",text:"Running on solar and battery"}:c?{cls:"green",icon:"",text:"Running on solar"}:l?{cls:"green",icon:"",text:"Running on your battery"}:null}_sourceRow(e){const t=this._formatPower(e.value,!0),i=e.dead?"idle":e.dir||"idle",o="out"===i?"mdi:arrow-up":"mdi:arrow-down",s=e.soc,r=null!=s,n=r?Math.max(0,Math.min(100,s)):0;return U`
      <div class="source-row">
        <div class="source-icon ${e.iconClass}"><ha-icon icon=${e.icon}></ha-icon></div>
        <div class="source-main">
          <div class="source-name">${e.name}</div>
          <div class="source-status ${e.dead?"bad":e.statusClass||""}">
            ${e.dead?"Sensor unavailable":e.status}
          </div>
        </div>
        <div class="source-end">
          <div class="source-value">
            ${"idle"!==i?U`<ha-icon class="flow-arrow ${i}" icon=${o}></ha-icon>`:K}
            ${t.value} <span>${t.unit}</span>
          </div>
          ${r?U`
            <div class="batt">
              <span class="batt-glyph"><span
                class="${e.charging?"charging":n<=15?"low":""}"
                style="width:${n}%"></span></span>
              <span class="batt-pct">${Math.round(n)}%</span>
            </div>
          `:K}
        </div>
      </div>
    `}_renderLive(e,t,i,o,s,r){const n=this._formatPower(e),a=1+(this._sources.solar_power?1:0)+(this._sources.battery_power?1:0),c=this._homeSourcePill(e,t,i,o,r);return U`
      <section class="section">
        <div class="section-head">
          <div class="section-title"><h2>Live energy</h2><span>${a} source${1===a?"":"s"} connected</span></div>
        </div>
        <div class="surface live-surface">
          <div class="live-home">
            <div class="metric-label"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon>Home consumption</div>
            <div class="live-value">${n.value} <span>${n.unit}</span></div>
            <div class="live-caption ${null===e&&r?"error":""}">
              ${null===e&&r?"A connected power sensor is unavailable":"Total power your home is using right now"}
            </div>
            ${c?U`
              <div class="live-source-pill ${c.cls}">
                ${"green"===c.cls?U`<span class="dot"></span>`:U`<ha-icon icon=${c.icon}></ha-icon>`}
                ${c.text}
              </div>`:K}
          </div>
          <div class="source-list">
            ${this._sourceRow({name:"Grid",icon:null!==t&&t<-5?"mdi:transmission-tower-export":"mdi:transmission-tower-import",iconClass:null===t||Math.abs(t)<=5?"":t>5?"grid-in":"grid-out",value:t,dead:this._isDead(this._netEntity()),status:null===t?"No reading":t>5?"Importing from grid":t<-5?"Exporting to grid":"Grid balanced",statusClass:null!==t&&t<-5?"good":"",dir:null===t||Math.abs(t)<=5?"idle":t>5?"cost":"out"})}
            ${this._sources.solar_power?this._sourceRow({name:"Solar",icon:"mdi:solar-power-variant",iconClass:"solar",value:i,dead:this._isDead(this._sources.solar_power),status:null!==i&&i>5?"Producing now":"No production",statusClass:null!==i&&i>5?"good":"",dir:null!==i&&i>5?"in":"idle"}):K}
            ${this._sources.battery_power?this._sourceRow({name:"Battery",icon:null!==o&&o<-5?"mdi:battery-arrow-up-outline":"mdi:battery-arrow-down-outline",iconClass:null!==o&&o<-5?"battery-in":null!==o&&o>5?"battery-out":"",value:o,dead:this._isDead(this._sources.battery_power),status:null===o?"No reading":o>5?"Discharging":o<-5?"Charging":"Idle",statusClass:null!==o&&o>5?"good":"",dir:null===o||Math.abs(o)<=5?"idle":o>5?"in":"out",charging:null!==o&&o<-5,soc:s}):K}
          </div>
        </div>
        ${this._netEntity()?K:U`
          <div class="setup-note">
            <ha-icon icon="mdi:transmission-tower-off"></ha-icon>
            <div>No SmartHomeShop P1 meter is set up, so there is no live grid reading. Add a P1MeterKit or WaterP1MeterKit for grid power; solar and battery readings work as soon as you connect them in Settings.</div>
          </div>
        `}
        ${this._sources.solar_power||this._sources.battery_power?K:U`
          <div class="setup-note">
            <ha-icon icon="mdi:connection"></ha-icon>
            <div>Only grid power is connected. Add your solar and battery entities to see production, storage and state of charge.</div>
            ${this.hass.user?.is_admin?U`<button class="cta-btn ghost" @click=${()=>this._openSettings("sources")}>Set up</button>`:K}
          </div>
        `}
      </section>
    `}_priceChart(e){const t=48,i=24,o=178,s=e.map(e=>e.consumer),r=Math.min(...s),n=Math.max(...s),a=1.08*(n<=0?.01:n),c=1.08*Math.min(0,r),l=Math.max(.001,a-c),d=e=>i+(a-e)/l*154,h=d(0),p=702/e.length,u=Date.now(),g=e.findIndex(e=>{const t=new Date(e.start).getTime();return t<=u&&t+36e5>u}),m=c<0?[a,0,c]:[a,a/2,0],v=this._hoverBar>=0&&this._hoverBar<e.length?this._hoverBar:-1,_=[0,Math.floor(e.length/4),Math.floor(e.length/2),Math.floor(.75*e.length)].filter((t,i,o)=>t<e.length&&o.indexOf(t)===i);return U`
      <div class="chart">
        <svg viewBox="0 0 ${760} ${220}" role="img" aria-label="Hourly electricity prices" @pointerleave=${()=>{this._hoverBar=-1}}>
          ${m.map(e=>B`
            <line class="grid" x1=${t} y1=${d(e)} x2=${750} y2=${d(e)}></line>
            <text x=${41} y=${d(e)+3} text-anchor="end">${e.toFixed(2)}</text>
          `)}
          <line class="axis" x1=${t} y1=${i} x2=${t} y2=${o}></line>
          ${e.map((e,i)=>{const o=d(e.consumer),s=Math.min(h,o),a=Math.max(2,Math.abs(o-h)),c=i===g||i===v;return B`
              <rect
                x=${t+i*p+1.5}
                y=${s}
                width=${Math.max(2,p-3)}
                height=${a}
                rx="2"
                fill=${(e=>{const t=n===r?.5:(e-r)/(n-r);return t<=.34?"#159957":t<=.67?"#d8890b":"#d34a4a"})(e.consumer)}
                opacity=${c?1:.62}
              ></rect>
            `})}
          ${g>=0?B`
            <line class="nowline" x1=${t+g*p+p/2} y1=${i} x2=${t+g*p+p/2} y2=${o}></line>
            <text class="nowtext" x=${t+g*p+p/2} y="13" text-anchor="middle">Now</text>
          `:K}
          ${_.map(i=>B`
            <text x=${t+i*p+p/2} y=${210} text-anchor="middle">${this._hm(e[i].start)}</text>
          `)}
          ${e.map((e,o)=>B`
            <rect
              class="hit"
              x=${t+o*p}
              y=${i}
              width=${p}
              height=${154}
              @pointerenter=${()=>{this._hoverBar=o}}
              @click=${()=>{this._hoverBar=o}}
            ><title>${this._hm(e.start)} ${this._formatPrice(e.consumer)}/kWh</title></rect>
          `)}
          ${v>=0?this._priceTooltip(e[v],t+v*p+p/2,t,750,i):K}
        </svg>
      </div>
    `}_priceTooltip(e,t,i,o,s){const r=104,n=Math.max(i+52,Math.min(o-52,t));return B`
      <g pointer-events="none">
        <rect class="tip-bg" x=${n-52} y=${s} width=${r} height=${38} rx="5"></rect>
        <text class="tip-h" x=${n} y=${s+14} text-anchor="middle">${this._hm(e.start)}</text>
        <text class="tip-p" x=${n} y=${s+29} text-anchor="middle">${this._formatPrice(e.consumer)}/kWh</text>
      </g>
    `}_renderPriceSection(e){if(!e&&!this._priceRows("today").length&&!this._priceRows("tomorrow").length)return K;const t=this._priceRows("today"),i=this._priceRows("tomorrow"),o="tomorrow"===this._priceTab&&i.length?i:t,s=this._priceInsights(t,i);if(!o.length||!s)return K;const r=s.difference<=0,n="tomorrow"===this._priceTab&&i.length?"Tomorrow":"Today",a=this._cheapestPriceBlock(o,this._cheapestHours),c=this._account?.contract?.name;return U`
      <section class="section">
        <div class="section-head">
          <div class="section-title">
            <h2>Price outlook</h2>
            <span>${c?`${c} - `:""}All-in consumer price</span>
          </div>
          ${i.length?U`
            <div class="seg" aria-label="Price day">
              <button class=${"today"===this._priceTab?"on":""} @click=${()=>{this._priceTab="today",this._hoverBar=-1}}>Today</button>
              <button class=${"tomorrow"===this._priceTab?"on":""} @click=${()=>{this._priceTab="tomorrow",this._hoverBar=-1}}>Tomorrow</button>
            </div>
          `:K}
        </div>
        <div class="surface price-surface">
          <div class="price-summary">
            <div class="price-kicker">
              <span>Price now</span>
            </div>
            <div class="price-value">${this._formatPrice(s.current)} <span>/kWh</span></div>
            <div class="price-state ${r?"good":"bad"}">
              <ha-icon icon=${r?"mdi:trending-down":"mdi:trending-up"}></ha-icon>
              ${null===s.differencePercentage?r?"Below daily average":"Above daily average":`${Math.abs(s.differencePercentage).toFixed(0)}% ${r?"below":"above"} daily average`}
            </div>
            <div class="price-facts">
              <div class="price-fact"><div class="price-fact-label">Daily average</div><div class="price-fact-value">${this._formatPrice(s.average)}</div></div>
              <div class="price-fact"><div class="price-fact-label">Feed-in now</div><div class="price-fact-value">${this._formatPrice(s.feedIn)}</div></div>
              <div class="price-fact"><div class="price-fact-label">Next lower</div><div class="price-fact-value">${s.nextLower?`${this._hm(s.nextLower.start)}, save ${this._formatPrice(s.nextLower.saving)}`:"None available"}</div></div>
              <div class="price-fact"><div class="price-fact-label">Lowest</div><div class="price-fact-value">${this._formatPrice(s.lowest.price)} at ${this._hm(s.lowest.start)}</div></div>
              <div class="price-fact"><div class="price-fact-label">Highest</div><div class="price-fact-value">${this._formatPrice(s.highest.price)} at ${this._hm(s.highest.start)}</div></div>
              <div class="price-fact"><div class="price-fact-label">${s.negativeHours>0?"Negative prices":"Daily spread"}</div><div class="price-fact-value">${s.negativeHours>0?`${s.negativeHours} hour${1===s.negativeHours?"":"s"}`:this._formatPrice(s.spread)}</div></div>
            </div>
          </div>
          <div class="price-chart-wrap">
            <div class="chart-top">
              <div class="chart-title">${"tomorrow"===this._priceTab?"Tomorrow by hour":"Today by hour"} (EUR/kWh)</div>
              <div class="chart-legend"><span><i style="background:#159957"></i>Lower</span><span><i style="background:#d34a4a"></i>Higher</span></div>
            </div>
            ${this._priceChart(o)}
            <div class="chart-foot">
              <a class="chart-link" href=${vt.APP_STATS_URL} target="_blank" rel="noopener">
                Detailed statistics <ha-icon icon="mdi:open-in-new"></ha-icon>
              </a>
            </div>
          </div>
          <div class="cheapest-strip">
            <div>
              <div class="cheapest-kicker">Cheapest consecutive block - ${n}</div>
              <div class="cheapest-result">
                ${a?U`
                  <strong>${this._hm(a.start)}-${this._hm(a.end)}</strong>
                  <span>${this._formatPrice(a.average)}/kWh average</span>
                `:U`<strong>Not available</strong>`}
              </div>
            </div>
            <div class="cheapest-options" role="group" aria-label="Cheapest block duration">
              ${[1,2,3,4,5,6].map(e=>U`
                <button
                  type="button"
                  class=${this._cheapestHours===e?"active":""}
                  aria-pressed=${this._cheapestHours===e?"true":"false"}
                  title=${`Show the cheapest ${e}-hour block`}
                  @click=${()=>{this._cheapestHours=e}}
                >${e}h</button>
              `)}
            </div>
          </div>
        </div>
      </section>
    `}_powerSeries(){const e=[],t=Date.now(),i=this._netEntity(),o=this._historyWithCurrent(i,i&&this._history[i]||[],t);o.length>1&&e.push({key:"grid-import",label:"Grid import",color:"#d34a4a",points:o.map(e=>this._mapPowerPoint(e,e=>Math.max(0,e)))},{key:"grid-export",label:"Grid export",color:"#159957",points:o.map(e=>this._mapPowerPoint(e,e=>Math.max(0,-e),!0)),dash:"7 3"});const s=this._sources.solar_power,r=this._historyWithCurrent(s,s&&this._history[s]||[],t,!!this._sources.solar_invert);s&&r.length>1&&e.push({key:"solar",label:"Solar",color:"#d8890b",points:r.map(e=>this._mapPowerPoint(e,e=>Math.max(0,e)))});const n=this._sources.battery_power,a=this._historyWithCurrent(n,n&&this._history[n]||[],t,!!this._sources.battery_invert);return n&&a.length>1&&e.push({key:"battery",label:"Battery",color:"#4361ee",points:a}),e}_mapPowerPoint(e,t,i=!1){const o=e.min??e.v,s=e.max??e.v,r=t(i?s:o),n=t(i?o:s);return{...e,v:t(e.v),min:Math.min(r,n),max:Math.max(r,n)}}_historyWithCurrent(e,t,i,o=!1){const s=this._num(e,o);return null===s?t:[...t.filter(e=>e.t<i),{t:i,end:i,v:s,min:s,max:s}]}_togglePowerSeries(e){this._hiddenPowerSeries=this._hiddenPowerSeries.includes(e)?this._hiddenPowerSeries.filter(t=>t!==e):[...this._hiddenPowerSeries,e],this._hoverPowerTime=void 0}_renderPowerSection(e){const t=this._powerSeries();if(!t.length)return K;const i=this._netEntity(),o=i&&this._history[i]||[],s=e??0,r=o.length?Math.max(0,s,...o.map(e=>e.max??e.v)):Math.max(0,s),n=o.length?Math.abs(Math.min(0,s,...o.map(e=>e.min??e.v))):Math.abs(Math.min(0,s)),a=null===e?"Grid now":e<0?"Export now":"Import now";return U`
      <section class="section">
        <div class="section-head">
          <div class="section-title"><h2>Power trend</h2><span>Today</span></div>
        </div>
        <div class="surface power-surface">
          <div class="power-summary">
            ${this._powerStat(a,this._formatPower(e,!0))}
            ${this._powerStat("Peak import",this._formatPower(r))}
            ${this._powerStat("Peak export",this._formatPower(n))}
          </div>
          <div class="power-native-chart">
            <div class="power-native-label">Power (W) · 5-minute mean with min/max range</div>
            ${this._statisticsChartReady?U`
              <statistics-chart
                .hass=${this.hass}
                .statisticsData=${this._powerStatistics(t)}
                .metadata=${this._powerMetadata(t)}
                .names=${this._powerNames(t)}
                .colors=${this._powerColors(t)}
                .statTypes=${["mean","min","max"]}
                .chartType=${"line"}
                .period=${"5minute"}
                .startTime=${new Date(this._todayStart())}
                .endTime=${new Date}
                .unit=${"W"}
                .height=${"100%"}
                .clickForMoreInfo=${!1}
              ></statistics-chart>
            `:U`<div class="power-native-loading">Loading Home Assistant chart…</div>`}
          </div>
        </div>
      </section>
    `}_powerStat(e,t){return U`<div class="power-stat"><div class="power-stat-label">${e}</div><div class="power-stat-value">${t.value} ${t.unit}</div></div>`}_powerStatistics(e){const t=Date.now();return Object.fromEntries(e.map(e=>[`shs:${e.key}`,e.points.map((i,o)=>({start:i.t,end:i.end||e.points[o+1]?.t||Math.min(t,i.t+3e5),mean:i.v,min:i.min??i.v,max:i.max??i.v}))]))}_powerMetadata(e){return Object.fromEntries(e.map(e=>[`shs:${e.key}`,{statistic_id:`shs:${e.key}`,source:"smarthomeshop",name:e.label,statistics_unit_of_measurement:"W",unit_class:"power",has_sum:!1,mean_type:1}]))}_powerNames(e){return Object.fromEntries(e.map(e=>[`shs:${e.key}`,e.label]))}_powerColors(e){return Object.fromEntries(e.map(e=>[`shs:${e.key}`,e.color]))}_nicePowerStep(e,t){const i=Math.max(Number.EPSILON,e/Math.max(1,t)),o=10**Math.floor(Math.log10(i)),s=i/o;return(s<1.5?1:s<3?2:s<7?5:10)*o}_powerScale(e){let t=Math.min(0,...e),i=Math.max(0,...e);t===i&&(t=Math.min(0,t-1),i=Math.max(1,i+1));const o=Math.max(1,i-t);t<0&&(t-=.06*o),i>0&&(i+=.06*o);const s=this._nicePowerStep(i-t,4),r=Math.floor(t/s)*s,n=Math.ceil(i/s)*s,a=[];for(let e=r;e<=n+.5*s;e+=s)a.push(Number(e.toPrecision(12)));return{minimum:r,maximum:n,ticks:a}}_nearestPowerPoint(e,t){if(!e.length)return;let i=0,o=e.length-1;for(;i<o;){const s=Math.floor((i+o)/2);e[s].t<t?i=s+1:o=s}const s=e[i],r=e[Math.max(0,i-1)];return Math.abs(r.t-t)<=Math.abs(s.t-t)?r:s}_nearestPowerTime(e,t){if(!e.length)return;let i=0,o=e.length-1;for(;i<o;){const s=Math.floor((i+o)/2);e[s]<t?i=s+1:o=s}const s=e[i],r=e[Math.max(0,i-1)];return Math.abs(r-t)<=Math.abs(s-t)?r:s}_setPowerHover(e,t,i,o){const s=e.currentTarget.getBoundingClientRect();if(s.width<=0||!t.length)return;const r=i+Math.max(0,Math.min(1,(e.clientX-s.left)/s.width))*(o-i);if(r<t[0]||r>t[t.length-1])return void(this._hoverPowerTime=void 0);const n=this._nearestPowerTime(t,r);void 0!==n&&n!==this._hoverPowerTime&&(this._hoverPowerTime=n)}_powerTimeTicks(e,t,i){const o=i<430?3:i<720?4:5,s=(t-e)/Math.max(1,o-1),r=[1,2,3,4,6,12,24].map(e=>3600*e*1e3),n=r.find(e=>e>=s)||r[r.length-1],a=[e];for(let i=e+n;i<t-6e4;i+=n)a.push(i);return t-a[a.length-1]>6e4&&a.push(t),a}_movePowerHover(e,t){if(!t.length)return;if("Escape"===e.key)return void(this._hoverPowerTime=void 0);if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;if(e.preventDefault(),"Home"===e.key)return void(this._hoverPowerTime=t[0]);if("End"===e.key)return void(this._hoverPowerTime=t[t.length-1]);const i=void 0===this._hoverPowerTime?t.length-1:t.indexOf(this._hoverPowerTime),o="ArrowLeft"===e.key?-1:1,s=Math.max(0,Math.min(t.length-1,(i<0?t.length-1:i)+o));this._hoverPowerTime=t[s]}_powerChart(e){const t=Math.max(280,this._powerChartWidth),i=Math.round(Math.max(230,Math.min(320,.29*t))),o=t<420?44:52,s=t-12,r=22,n=i-34,a=e.filter(e=>!this._hiddenPowerSeries.includes(e.key)),c=a.flatMap(e=>e.points),l=this._todayStart(),d=Math.max(Date.now(),l+1),h=this._powerScale(c.length?c.map(e=>e.v):[0]),p=h.maximum,u=h.minimum,g=Math.max(1,p-u),m=e=>d===l?s:o+(e-l)/(d-l)*(s-o),v=e=>r+(p-e)/g*(n-r),_=v(0),y=this._powerTimeTicks(l,d,t),x=[...new Set(c.map(e=>e.t))].sort((e,t)=>e-t),f=void 0===this._hoverPowerTime?void 0:this._nearestPowerTime(x,this._hoverPowerTime),b=void 0===f?void 0:m(f),w=void 0===f?[]:a.map(e=>({item:e,point:this._nearestPowerPoint(e.points,f)})).filter(e=>!!e.point),$=w.map(e=>{const t=this._formatPower(e.point.v);return`${e.item.label} ${t.value} ${t.unit}`}).join(", ");return U`
      <div class="chart">
        <div class="chart-top power-chart-top">
          <div class="chart-title">Live power (W)</div>
          <div class="chart-legend power-chart-legend" role="group" aria-label="Power chart series">
            ${e.map(e=>{const t=!this._hiddenPowerSeries.includes(e.key);return U`
                <button
                  type="button"
                  class=${"power-legend-toggle"+(t?"":" off")}
                  aria-pressed=${t?"true":"false"}
                  title=${`${t?"Hide":"Show"} ${e.label}`}
                  @click=${()=>this._togglePowerSeries(e.key)}
                ><i style="background:${e.color}"></i>${e.label}</button>
              `})}
          </div>
        </div>
        <svg
          class="power-chart-svg"
          viewBox="0 0 ${t} ${i}"
          style=${`height:${i}px`}
          role="group"
          aria-label="Interactive power history for today"
        >
          ${h.ticks.map(e=>B`
            <line class=${Math.abs(e)<.01?"zero":"grid"} x1=${o} y1=${v(e)} x2=${s} y2=${v(e)}></line>
            <text x=${o-7} y=${v(e)+3} text-anchor="end">${this._shortPower(e)}</text>
          `)}
          ${y.slice(1,-1).map(e=>B`
            <line class="grid time-grid" x1=${m(e)} y1=${r} x2=${m(e)} y2=${n}></line>
          `)}
          ${a.map(e=>{const t=e.points,i=t.map((e,t)=>`${0===t?"M":"L"}${m(e.t).toFixed(1)},${v(e.v).toFixed(1)}`).join(" "),o=t[0],s=t[t.length-1],r=`${i} L${m(s.t).toFixed(1)},${_.toFixed(1)} L${m(o.t).toFixed(1)},${_.toFixed(1)} Z`;return B`
              <path class="power-area" d=${r} fill=${e.color}></path>
              <path
                class="power-line"
                d=${i}
                fill="none"
                stroke=${e.color}
                stroke-width="2.35"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-dasharray=${e.dash||K}
              ></path>
              <circle class="power-endpoint" cx=${m(s.t)} cy=${v(s.v)} r="3" fill=${e.color} stroke="var(--card-background-color)" stroke-width="1.5"></circle>
            `})}
          ${y.map((e,t)=>B`
            <text x=${m(e)} y=${i-10} text-anchor=${0===t?"start":t===y.length-1?"end":"middle"}>${this._time(e)}</text>
          `)}
          ${a.length?K:B`
            <text class="power-tip-label" x=${(o+s)/2} y=${(r+n)/2} text-anchor="middle">
              Select a series in the legend
            </text>
          `}
          <rect
            class="power-hit"
            x=${o}
            y=${r}
            width=${s-o}
            height=${n-r}
            tabindex=${a.length?"0":"-1"}
            role="img"
            aria-label=${void 0===f?a.length?"Move over the chart or use the left and right arrow keys to inspect power values":"No power series selected":`Power values at ${this._powerTime(f)}: ${$}`}
            @pointermove=${e=>this._setPowerHover(e,x,l,d)}
            @pointerdown=${e=>this._setPowerHover(e,x,l,d)}
            @pointerleave=${()=>{this._hoverPowerTime=void 0}}
            @focus=${()=>{void 0===this._hoverPowerTime&&(this._hoverPowerTime=x[x.length-1])}}
            @keydown=${e=>this._movePowerHover(e,x)}
          ></rect>
          ${void 0!==f&&void 0!==b?B`
            <line class="power-crosshair" x1=${b} y1=${r} x2=${b} y2=${n}></line>
            ${w.map(e=>B`
              <circle
                class="power-hover-dot"
                cx=${m(e.point.t)}
                cy=${v(e.point.v)}
                r="4.2"
                fill=${e.item.color}
                stroke="var(--card-background-color)"
                stroke-width="2"
              ></circle>
            `)}
            ${this._powerTooltip(f,b,w,o,s,r,t)}
          `:K}
        </svg>
      </div>
    `}_powerTooltip(e,t,i,o,s,r,n){const a=Math.min(n<480?158:188,s-o-8),c=34+20*i.length,l=t>(o+s)/2?t-a-12:t+12,d=Math.max(o+4,Math.min(s-a-4,l)),h=r+7;return B`
      <g pointer-events="none">
        <rect class="power-tip-bg" x=${d} y=${h} width=${a} height=${c} rx="6"></rect>
        <text class="power-tip-time" x=${d+11} y=${h+17}>${this._powerTime(e)}</text>
        ${i.map((e,t)=>{const i=h+36+20*t,o=this._formatPower(e.point.v);return B`
            <circle cx=${d+12} cy=${i-3} r="3" fill=${e.item.color}></circle>
            <text class="power-tip-label" x=${d+22} y=${i}>${e.item.label}</text>
            <text class="power-tip-value" x=${d+a-10} y=${i} text-anchor="end">${o.value} ${o.unit}</text>
          `})}
      </g>
    `}_renderSmartEnergy(e,t,i){const o=this._priceRows("today"),s=this._priceRows("tomorrow"),r="tomorrow"===this._priceTab&&s.length?"tomorrow":"today",n="tomorrow"===r?s:o,a=this._cheapestPriceBlock(n,this._cheapestHours),c=this._schedules.map(e=>e.next_start).filter(Boolean).sort((e,t)=>new Date(e).getTime()-new Date(t).getTime())[0];return U`
      <section class="section">
        <div class="section-head"><div class="section-title"><h2>Smart control</h2><span>Automation readiness</span></div></div>
        <div class="surface smart-list">
          <div class="smart-item">
            <div class="smart-icon ${e?"good":""}"><ha-icon icon="mdi:currency-eur"></ha-icon></div>
            <div><div class="smart-name">Dynamic price</div><div class="smart-detail">${e?this._hm(a?.start)?`Cheapest ${this._cheapestHours}h ${r} from ${this._hm(a?.start)}`:"Waiting for price data":"Account not connected"}</div></div>
            ${!e&&this.hass.user?.is_admin?U`<button class="cta-btn ghost" @click=${()=>this._openSettings("account")}>Connect</button>`:K}
          </div>
          <div class="smart-item">
            <div class="smart-icon ${t>0?"good":""}"><ha-icon icon="mdi:calendar-clock"></ha-icon></div>
            <div><div class="smart-name">Schedules</div><div class="smart-detail">${t>0?`${t} running now`:c?`Next at ${this._hm(c)}`:"Created on a device page (Automations)"}</div></div>
          </div>
          <div class="smart-item">
            <div class="smart-icon ${i?"good":""}"><ha-icon icon="mdi:home-battery-outline"></ha-icon></div>
            <div><div class="smart-name">Battery control</div><div class="smart-detail">${i?this._batterySummary():"Not configured"}</div></div>
            ${!i&&this.hass.user?.is_admin?U`<button class="cta-btn ghost" @click=${()=>this._openSettings("battery")}>Set up</button>`:K}
          </div>
        </div>
      </section>
    `}render(){if(!this._loaded)return U`<div class="loading"><div><div class="loading-ring"></div>Loading energy data</div></div>`;if(this._settingsOpen)return this._renderSettingsPage();const e=this._netEntity(),t=this._num(e),i=this._sources.solar_power?Math.max(0,this._num(this._sources.solar_power,this._sources.solar_invert)??0):null,o=this._sources.battery_power?this._num(this._sources.battery_power,this._sources.battery_invert):null,s=this._num(this._sources.battery_soc),r=this._isDead(e)||!!this._sources.solar_power&&this._isDead(this._sources.solar_power)||!!this._sources.battery_power&&this._isDead(this._sources.battery_power),n=null===t||r?null:Math.max(0,t+(i??0)+(o??0)),a="ok"===this._account?.status,c=!!this._account?.has_key,l=this._schedules.filter(e=>e.entity_id?"on"===this.hass.states[e.entity_id]?.state:e.active).length,d=!!this._battery?.enabled,h=this._account?.contract?.name;return U`
      <header class="page-head">
        <div>
          <div class="eyebrow">Smart Energy</div>
          <h1>Energy</h1>
          <div class="subtitle">Live flow, price planning, and automated control in one overview.</div>
        </div>
        <div class="head-actions">
          ${a?U`<div class="connection"><span class="connection-dot"></span>${h||"Energy prices connected"}</div>`:K}
          ${this.hass.user?.is_admin?U`
            <button class="settings-btn" @click=${()=>this._openSettings(a?"":"account")}>
              <ha-icon icon="mdi:cog-outline"></ha-icon>Settings
            </button>`:K}
        </div>
      </header>

      ${this._wizardVisible(c)?this._renderOnboarding(c,a):K}

      ${c||this._wizardVisible(c)?c&&"no_contract"===this._account?.status&&!this._wizardVisible(c)?U`
        <div class="empty">
          <ha-icon icon="mdi:file-document-alert-outline"></ha-icon>
          <div>The selected location has no active energy contract, so there are no prices to show. Add one in your SmartHomeShop account or pick another location in Settings.</div>
          ${this.hass.user?.is_admin?U`<button class="cta-btn ghost" @click=${()=>this._openSettings("account")}>Open settings</button>`:K}
        </div>`:!c||a||this._wizardVisible(c)?K:U`
        <div class="empty">
          <ha-icon icon="mdi:cloud-alert-outline"></ha-icon>
          <div>The price connection has a problem right now. Cached prices stay in use where available.</div>
          ${this.hass.user?.is_admin?U`<button class="cta-btn ghost" @click=${()=>this._openSettings("account")}>Check connection</button>`:K}
        </div>`:U`
        <div class="empty">
          <ha-icon icon="mdi:account-key-outline"></ha-icon>
          <div>Connect your SmartHomeShop account to get dynamic prices, cheapest-hours planning and automated control.</div>
          ${this.hass.user?.is_admin?U`<button class="cta-btn" @click=${()=>this._openSettings("account")}>Connect</button>`:K}
        </div>`}

      ${this._renderLive(n,t,i,o,s,r)}
      ${this._renderPriceSection(a)}
      ${this._renderSavings(a)}
      ${this._renderPowerSection(t)}
      ${this._renderSmartEnergy(a,l,d)}
      ${this._renderCompareNudge(a)}
    `}_wizardVisible(e){if(!this.hass.user?.is_admin)return!1;if(this._wizardDone)return!1;try{if(window.localStorage.getItem(vt.WIZARD_KEY))return!1}catch{}return!e||this._wizardEngaged}_finishWizard(){try{window.localStorage.setItem(vt.WIZARD_KEY,"1")}catch{}this._wizardDone=!0}async _wizardConnect(){const e=this._wizardKeyInput.trim();if(e&&!this._wizardBusy){this._wizardBusy=!0,this._wizardError="";try{const t=await this._callWS({type:"smarthomeshop/account/set",api_key:e},vt.BACKGROUND_LOAD_TIMEOUT);this._account=t,this._wizardKeyInput="",this._wizardEngaged=!0,this._watchAccountRefresh(t,!0),this._loadWizardContracts()}catch(e){this._wizardError=`Could not connect: ${e?.message||"unknown error"}`}this._wizardBusy=!1}}async _loadWizardContracts(){if(!this._wizardContractsRequested){this._wizardContractsRequested=!0;try{const e=await this._callWS({type:"smarthomeshop/account/contracts"},vt.BACKGROUND_LOAD_TIMEOUT);this._wizardContracts=e.contracts||[]}catch{this._wizardContracts=[]}}}async _wizardPickContract(e){if(!this._wizardBusy){this._wizardBusy=!0;try{this._account=await this._callWS({type:"smarthomeshop/account/set",contract_id:e||null},vt.BACKGROUND_LOAD_TIMEOUT)}catch(e){this._wizardError=`Could not select the contract: ${e?.message||""}`}this._wizardBusy=!1}}_renderOnboarding(e,t){const i=e?this._account?.contract_id||this._wizardContractSkipped?3:2:1;2===i&&0===this._wizardContracts.length&&this._loadWizardContracts();const o=(e,t)=>U`
      <span class="wstep ${i===e?"on":""} ${i>e?"done":""}">
        <i>${i>e?U`<ha-icon icon="mdi:check" style="--mdc-icon-size:13px;"></ha-icon>`:e}</i>${t}
      </span>`;return U`
      <div class="wizard">
        <div class="wizard-steps">
          ${o(1,"Account")}${o(2,"Contract")}${o(3,"Solar & battery")}
        </div>
        ${1===i?U`
          <div class="wizard-title">Welcome! Connect your SmartHomeShop account</div>
          <div class="wizard-text">
            One connection unlocks live dynamic prices, cheapest-hours planning, deadline
            schedules and battery control. Create a free API key in your account and paste it here.
          </div>
          <div class="wizard-row">
            <input type="password" placeholder="Paste your API key" autocomplete="off"
              .value=${this._wizardKeyInput}
              @input=${e=>{this._wizardKeyInput=e.target.value}}
              @keydown=${e=>{"Enter"===e.key&&this._wizardConnect()}} />
            <button class="cta-btn" ?disabled=${!this._wizardKeyInput.trim()||this._wizardBusy}
              @click=${this._wizardConnect}>${this._wizardBusy?"Connecting...":"Connect"}</button>
          </div>
          <div class="wizard-links">
            <a href=${vt.APP_TOKENS_URL} target="_blank" rel="noopener">Create a free API key</a>
            <span style="color:var(--secondary-text-color);"> · </span>
            <button @click=${this._finishWizard}>Skip setup for now</button>
          </div>
        `:2===i?U`
          <div class="wizard-title">Pick your energy contract</div>
          <div class="wizard-text">
            Prices follow your own contract (fixed or dynamic). Manage contracts in your
            SmartHomeShop account; pick one here or let it follow the active contract automatically.
          </div>
          <div class="wizard-row">
            <select @change=${e=>this._wizardPickContract(e.target.value)}>
              <option value="">Active contract (automatic)</option>
              ${this._wizardContracts.map(e=>U`
                <option value=${String(e.id)}>${e.name}${e.supplier?` - ${e.supplier}`:""}</option>`)}
            </select>
            <button class="cta-btn ghost" @click=${()=>{this._wizardContractSkipped=!0}}>Use automatic</button>
          </div>
          <div class="wizard-links">
            <a href=${vt.APP_STATS_URL} target="_blank" rel="noopener">Manage contracts in the app</a>
            <span style="color:var(--secondary-text-color);"> · </span>
            <button @click=${this._finishWizard}>Skip setup for now</button>
          </div>
        `:U`
          <div class="wizard-title">Almost done: solar and battery</div>
          <div class="wizard-text">
            Your P1 meter covers the grid. If you have solar panels or a home battery, connect
            their sensors so the Energy tab shows real surplus and state of charge. You can
            always do this later from Settings.
          </div>
          <div class="wizard-row">
            <button class="cta-btn" @click=${()=>this._openSettings("sources")}>Connect solar &amp; battery</button>
            <button class="cta-btn ghost" @click=${this._finishWizard}>Finish</button>
          </div>
        `}
        ${this._wizardError?U`<div class="wizard-err">${this._wizardError}</div>`:K}
        ${"no_contract"===this._account?.status?U`<div class="wizard-err">Connected, but this location has no active energy contract yet. Add one in your SmartHomeShop account to see prices.</div>`:!t&&e?U`<div class="wizard-err">The price connection is not working yet; check the key or try Sync in Settings.</div>`:K}
      </div>
    `}_renderSavings(e){const t=this._savings||{},i=t.today_eur??0,o=t.month_eur??0,s=t.total_eur??0;if(!e&&!s)return K;const r=e=>`${e<0?"-":""}€ ${Math.abs(e).toFixed(2)}`;return U`
      <section class="section">
        <div class="section-head"><div class="section-title"><h2>Smart savings</h2><span>What smart energy earned</span></div></div>
        <div class="savings-grid">
          <div class="save-card">
            <div class="save-label">Today</div>
            <div class="save-val ${i>0?"pos":""}">${r(i)}</div>
            <div class="save-sub">battery ${r(t.today_battery_eur??0)} · schedules ${r(t.today_schedule_eur??0)}</div>
          </div>
          <div class="save-card">
            <div class="save-label">This month</div>
            <div class="save-val ${o>0?"pos":""}">${r(o)}</div>
          </div>
          <div class="save-card">
            <div class="save-label">All time</div>
            <div class="save-val ${s>0?"pos":""}">${r(s)}</div>
          </div>
        </div>
        <div class="save-foot">
          Measured every 15 minutes from your battery flows and running schedules, valued against
          the day-average price. Give a schedule its load power to count it here.
        </div>
      </section>
    `}_renderCompareNudge(e){return e?U`
      <section class="section">
        <div class="compare">
          <div class="compare-icon"><ha-icon icon="mdi:scale-balance"></ha-icon></div>
          <div class="compare-main">
            <div class="compare-title">Is another contract cheaper for you?</div>
            <div class="compare-text">
              Compare energy contracts against real spot prices and your own usage in your
              SmartHomeShop account, including a full savings analysis.
            </div>
          </div>
          <a class="cta-btn" href=${vt.APP_STATS_URL} target="_blank" rel="noopener">
            Compare in the app <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
        </div>
      </section>
    `:K}openSettings(e=""){this._openSettings(e)}_settingsTabForFocus(e){return"sources"===e?"sources":"ha-energy"===e?"ha-energy":"solar-control"===e?"automations":"battery"===e?"battery":"connection"}_openSettings(e=""){this._settingsTab=this._settingsTabForFocus(e),this._settingsOpen=!0,this._scrollSettingsTop()}_setSettingsTab(e){this._settingsTab!==e&&(this._settingsTab=e,this._scrollSettingsTop())}_onSettingsTabKeydown(e,t){const i=["connection","sources","ha-energy","automations","battery"],o=i.indexOf(t);let s;"ArrowRight"===e.key&&(s=i[(o+1)%i.length]),"ArrowLeft"===e.key&&(s=i[(o-1+i.length)%i.length]),"Home"===e.key&&(s=i[0]),"End"===e.key&&(s=i[i.length-1]),s&&(e.preventDefault(),this._settingsTab=s,this.updateComplete.then(()=>{this.renderRoot.querySelector(`#energy-settings-tab-${s}`)?.focus()}))}_scrollSettingsTop(){this.updateComplete.then(()=>{this.renderRoot.querySelector(".settings-page")?.scrollIntoView({block:"start",behavior:"smooth"}),this.renderRoot.querySelector(".settings-panel")?.focus({preventScroll:!0})})}_closeSettings(){this._settingsOpen=!1,this.updateComplete.then(()=>{this.renderRoot.querySelector(".page-head")?.scrollIntoView({block:"start",behavior:"smooth"})}),this._load()}_scrollToAccountSection(){this._setSettingsTab("connection")}_renderSettingsTab(e){const t=this._effectiveP1();return"connection"===e?U`
        <div class="settings-panel" id="energy-settings-connection" role="tabpanel"
          aria-labelledby="energy-settings-tab-connection" tabindex="-1">
          <div class="settings-intro">
            <div class="settings-intro-icon"><ha-icon icon="mdi:cloud-sync-outline"></ha-icon></div>
            <div>
              <div class="settings-intro-title">Connection</div>
              <div class="settings-intro-text">Connect your SmartHomeShop account, select a contract and choose the P1 meter used across Smart Energy.</div>
            </div>
          </div>
          <shs-account-prices
            .hass=${this.hass}
            @account-changed=${this._handleAccountChanged}>
          </shs-account-prices>
          ${this._p1Devices.length?U`
            <div class="p1-card">
              <div class="p1-head">
                <ha-icon icon="mdi:meter-electric-outline"></ha-icon>
                <div style="flex: 1; min-width: 0;">
                  <div class="p1-title">P1 meter</div>
                  <div class="p1-sub">All grid readings and smart-energy features on this page follow this meter.</div>
                </div>
              </div>
              ${1===this._p1Devices.length?U`
                <div class="p1-row">
                  <span class="p1-name">${this._p1Devices[0].name}</span>
                  <span class="p1-badge">Selected automatically</span>
                </div>
              `:U`
                <div class="p1-row">
                  <select class="p1-select"
                    ?disabled=${this._p1Saving||!this.hass.user?.is_admin}
                    @change=${e=>this._selectP1(e.target.value)}>
                    ${this._p1Devices.map(e=>U`
                      <option value=${e.id} ?selected=${e.id===this._effectiveP1()?.id}>
                        ${e.name} (${e.product_name})${e.online?"":" - offline"}
                      </option>
                    `)}
                  </select>
                  ${this._p1Saving?U`<span class="p1-badge">Saving...</span>`:K}
                </div>
                ${this.hass.user?.is_admin?K:U`
                  <div class="p1-sub" style="margin-top: 6px;">Ask a Home Assistant administrator to change this.</div>
                `}
              `}
            </div>
          `:K}
        </div>
      `:"sources"===e?U`
        <div class="settings-panel" id="energy-settings-sources" role="tabpanel"
          aria-labelledby="energy-settings-tab-sources" tabindex="-1">
          <div class="settings-intro">
            <div class="settings-intro-icon"><ha-icon icon="mdi:solar-power-variant-outline"></ha-icon></div>
            <div>
              <div class="settings-intro-title">Energy sources</div>
              <div class="settings-intro-text">Map your solar and battery entities so live flow, surplus and state of charge are calculated correctly.</div>
            </div>
          </div>
          <shs-energy-sources
            .hass=${this.hass}
            @shs-energy-sources-changed=${this._handleEnergySourcesChanged}>
          </shs-energy-sources>
        </div>
      `:"automations"===e?U`
        <div class="settings-panel" id="energy-settings-automations" role="tabpanel"
          aria-labelledby="energy-settings-tab-automations" tabindex="-1">
          <div class="settings-intro">
            <div class="settings-intro-icon"><ha-icon icon="mdi:robot-outline"></ha-icon></div>
            <div>
              <div class="settings-intro-title">Smart energy automations</div>
              <div class="settings-intro-text">Configure price, solar, EV and inverter automations once for the whole home.</div>
            </div>
          </div>
          <div class="alpha-notice" role="note" aria-label="Smart Energy alpha notice">
            <div class="alpha-icon"><ha-icon icon="mdi:flask-outline"></ha-icon></div>
            <div class="alpha-copy">
              <div class="alpha-title">Smart Energy is in alpha</div>
              <div class="alpha-text">
                These features are still in active development. If you use or test them, join us on Discord.
                Tell us what you are setting up, what works, what does not, and share feedback to help shape the next release.
              </div>
              <a
                class="alpha-link"
                href="https://smarthomeshop.io/discord"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ha-icon icon="mdi:discord"></ha-icon>
                Join the SmartHomeShop Discord
                <ha-icon icon="mdi:open-in-new"></ha-icon>
              </a>
            </div>
          </div>
          ${t?U`
            <shs-energy-automations
              .hass=${this.hass}
              .deviceId=${t.id}
              .deviceName=${t.name}
              .deviceEntities=${this._entitiesByDevice[t.id]||[]}
              .showHeader=${!1}>
            </shs-energy-automations>
          `:U`
            <div class="p1-card">
              <div class="p1-sub">Connect or select a P1 meter first to configure smart energy automations.</div>
              ${this.hass.user?.is_admin?U`
                <button class="cta-btn ghost" style="margin-top: 12px;"
                  @click=${()=>this._setSettingsTab("connection")}>Open connection settings</button>
              `:K}
            </div>
          `}
        </div>
      `:"ha-energy"===e?U`
        <div class="settings-panel" id="energy-settings-ha-energy" role="tabpanel"
          aria-labelledby="energy-settings-tab-ha-energy" tabindex="-1">
          <div class="settings-intro">
            <div class="settings-intro-icon"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></div>
            <div>
              <div class="settings-intro-title">Home Assistant Energy</div>
              <div class="settings-intro-text">Connect the selected P1 meter to the native HA Energy Dashboard or import compatible HA source mappings into Smart Energy.</div>
            </div>
          </div>
          ${t?U`
            <shs-ha-energy-sync
              .hass=${this.hass}
              .deviceId=${t.id}
              .deviceName=${t.name}
              .deviceEntities=${this._entitiesByDevice[t.id]||[]}
              @ha-energy-synced=${this._handleEnergySourcesChanged}>
            </shs-ha-energy-sync>
          `:U`
            <div class="p1-card">
              <div class="p1-sub">Connect or select a P1 meter before linking the Home Assistant Energy Dashboard.</div>
              ${this.hass.user?.is_admin?U`
                <button class="cta-btn ghost" style="margin-top: 12px;"
                  @click=${()=>this._setSettingsTab("connection")}>Open connection settings</button>
              `:K}
            </div>
          `}
        </div>
      `:U`
      <div class="settings-panel" id="energy-settings-battery" role="tabpanel"
        aria-labelledby="energy-settings-tab-battery" tabindex="-1">
        <div class="settings-intro">
          <div class="settings-intro-icon"><ha-icon icon="mdi:home-battery-outline"></ha-icon></div>
          <div>
            <div class="settings-intro-title">Home battery</div>
            <div class="settings-intro-text">Configure planning, limits, forecasts and automatic execution for your battery.</div>
          </div>
        </div>
        <shs-energy-battery
          .hass=${this.hass}
          .deviceName=${"Home battery"}
          @open-device-settings=${this._scrollToAccountSection}>
        </shs-energy-battery>
      </div>
    `}_renderSettingsPage(){return U`
      <main class="settings-page">
        <header class="settings-page-head">
          <button class="settings-back" @click=${this._closeSettings}>
            <ha-icon icon="mdi:arrow-left"></ha-icon>
            Back to Energy
          </button>
          <div class="eyebrow">Smart Energy</div>
          <h1>Energy settings</h1>
          <div class="subtitle">Configure your connection, energy sources, Home Assistant Energy, automations and battery.</div>
        </header>
        <div class="settings-tabs-shell">
          <nav class="settings-tabs" role="tablist" aria-label="Energy settings sections">
            ${[{id:"connection",label:"Connection",icon:"mdi:cloud-sync-outline"},{id:"sources",label:"Sources",icon:"mdi:solar-power-variant-outline"},{id:"ha-energy",label:"HA Energy",icon:"mdi:home-lightning-bolt-outline"},{id:"automations",label:"Automations",icon:"mdi:robot-outline"},{id:"battery",label:"Battery",icon:"mdi:home-battery-outline"}].map(e=>U`
              <button
                id="energy-settings-tab-${e.id}"
                class="settings-tab ${this._settingsTab===e.id?"active":""}"
                role="tab"
                aria-selected=${this._settingsTab===e.id?"true":"false"}
                aria-controls="energy-settings-${e.id}"
                tabindex=${this._settingsTab===e.id?"0":"-1"}
                @click=${()=>this._setSettingsTab(e.id)}
                @keydown=${t=>this._onSettingsTabKeydown(t,e.id)}
              >
                <ha-icon icon=${e.icon}></ha-icon>
                ${e.label}
              </button>
            `)}
          </nav>
        </div>
        ${this._renderSettingsTab(this._settingsTab)}
      </main>
    `}async _handleEnergySourcesChanged(){try{const e=await this._callWS({type:"smarthomeshop/energy_sources"},vt.BACKGROUND_LOAD_TIMEOUT);this._sources=e.sources||{},this._resolveNetEntity(),this._history={},this._startHistoryLoad();const t=this.renderRoot.querySelector("shs-energy-battery");await(t?.refresh?.())}catch(e){console.warn("Energy source refresh failed",e)}}_handleAccountChanged(e){const t=this.renderRoot.querySelector("shs-energy-battery");if(t?.refresh?.(),e.detail?.account)return this._account=e.detail.account,void this._watchAccountRefresh(e.detail.account,!0);this._startAccountLoad("smarthomeshop/account")}_batterySummary(){const e=this._battery||{},t=e.target_soc;return`${e.automatic_control?"Automatic execution on":"Advice only"}${"number"==typeof t?` - target ${t}%`:""}`}_shortPower(e){return Math.abs(e)>=1e3?`${(e/1e3).toFixed(1)}k`:String(Math.round(e))}_todayStart(){const e=this.hass.config?.time_zone;if(!e){const e=new Date;return e.setHours(0,0,0,0),e.getTime()}try{const t=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}),i=Object.fromEntries(t.formatToParts(new Date).filter(e=>"literal"!==e.type).map(e=>[e.type,Number(e.value)])),o=Date.UTC(i.year,i.month-1,i.day),s=new Intl.DateTimeFormat("en-CA",{timeZone:e,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});let r=o;for(let e=0;e<2;e+=1){const e=Object.fromEntries(s.formatToParts(new Date(r)).filter(e=>"literal"!==e.type).map(e=>[e.type,Number(e.value)]));r+=o-Date.UTC(e.year,e.month-1,e.day,e.hour,e.minute,e.second)}return r}catch{const e=new Date;return e.setHours(0,0,0,0),e.getTime()}}_time(e){const t=this.hass.config?.time_zone;return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",...t?{timeZone:t}:{}})}_powerTime(e){const t=this.hass.config?.time_zone;return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit",...t?{timeZone:t}:{}})}_hm(e){if(!e)return"";const t=new Date(e).getTime();return Number.isFinite(t)?this._time(t):""}};_t.APP_STATS_URL="https://app.smarthomeshop.io/energy-prices",_t.INITIAL_LOAD_TIMEOUT=6e3,_t.BACKGROUND_LOAD_TIMEOUT=12e3,_t.HISTORY_LOAD_TIMEOUT=25e3,_t.styles=n`
    :host {
      display: block;
      max-width: 1180px;
      margin: 0 auto;
      box-sizing: border-box;
      color: var(--primary-text-color);
      --shs-blue: #4361ee;
      --shs-blue-soft: color-mix(in srgb, var(--shs-blue) 12%, var(--card-background-color));
      --shs-green: #159957;
      --shs-green-soft: color-mix(in srgb, var(--shs-green) 12%, var(--card-background-color));
      --shs-amber: #d8890b;
      --shs-amber-soft: color-mix(in srgb, var(--shs-amber) 13%, var(--card-background-color));
      --shs-red: #d34a4a;
      --shs-red-soft: color-mix(in srgb, var(--shs-red) 11%, var(--card-background-color));
      --shs-border: color-mix(in srgb, var(--divider-color) 78%, transparent);
      --shs-muted-surface: color-mix(in srgb, var(--secondary-background-color) 74%, var(--card-background-color));
    }

    * { box-sizing: border-box; }
    button, a { -webkit-tap-highlight-color: transparent; }

    .page-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
    }
    .eyebrow {
      color: var(--shs-blue);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    h1 { font-size: 26px; line-height: 1.1; margin: 0; font-weight: 760; letter-spacing: 0; }
    .subtitle { font-size: 13px; color: var(--secondary-text-color); margin-top: 7px; }
    .connection {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--secondary-text-color);
      font-size: 12px;
      white-space: nowrap;
    }
    .connection-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--shs-green); }
    .head-actions { display: flex; align-items: center; gap: 14px; }
    .settings-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 16px; border: 1px solid var(--divider-color); border-radius: 10px;
      background: var(--card-background-color); color: var(--primary-text-color);
      font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
    }
    .settings-btn:hover { border-color: var(--shs-blue); color: var(--shs-blue); }
    .settings-btn ha-icon { --mdc-icon-size: 17px; }

    /* Energy settings is a full page: these controls are too important and
       extensive for a long, nested modal. */
    .settings-page { width: 100%; max-width: 960px; margin: 0 auto; }
    .settings-page-head { margin-bottom: 20px; }
    .settings-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 36px;
      margin: 0 0 16px -8px;
      padding: 6px 8px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--secondary-text-color);
      font: 600 13px/1 inherit;
      cursor: pointer;
    }
    .settings-back:hover { color: var(--shs-blue); background: var(--shs-blue-soft); }
    .settings-back:focus-visible { outline: 2px solid var(--shs-blue); outline-offset: 2px; }
    .settings-back ha-icon { --mdc-icon-size: 18px; }
    .settings-tabs-shell {
      position: sticky;
      top: 0;
      z-index: 20;
      margin-bottom: 24px;
      padding-top: 4px;
      background: var(--primary-background-color);
    }
    .settings-tabs {
      display: flex;
      gap: 4px;
      padding: 4px;
      overflow-x: auto;
      scrollbar-width: none;
      border: 1px solid var(--shs-border);
      border-radius: 12px;
      background: var(--card-background-color);
    }
    .settings-tabs::-webkit-scrollbar { display: none; }
    .settings-tab {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex: 1 0 auto;
      min-width: 130px;
      min-height: 44px;
      padding: 9px 14px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--secondary-text-color);
      font: 650 13px/1 inherit;
      cursor: pointer;
      white-space: nowrap;
    }
    .settings-tab:hover { color: var(--primary-text-color); background: var(--secondary-background-color); }
    .settings-tab.active { color: var(--shs-blue); background: var(--shs-blue-soft); }
    .settings-tab:focus-visible { outline: 2px solid var(--shs-blue); outline-offset: -2px; }
    .settings-tab ha-icon { --mdc-icon-size: 18px; }
    .settings-panel { min-height: 360px; outline: none; }
    .settings-panel > * + * { margin-top: 18px; }
    .settings-intro {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 18px;
    }
    .settings-intro-icon {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 10px;
      color: var(--shs-blue);
      background: var(--shs-blue-soft);
    }
    .settings-intro-icon ha-icon { --mdc-icon-size: 21px; }
    .settings-intro-title { font-size: 16px; font-weight: 720; color: var(--primary-text-color); }
    .settings-intro-text { margin-top: 3px; font-size: 12.5px; line-height: 1.5; color: var(--secondary-text-color); }
    .alpha-notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: 14px 0 20px;
      padding: 14px 16px;
      border: 1px solid color-mix(in srgb, var(--shs-amber) 34%, var(--divider-color));
      border-radius: 14px;
      background: color-mix(in srgb, var(--shs-amber) 9%, var(--card-background-color));
    }
    .alpha-icon {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 9px;
      color: var(--shs-amber);
      background: color-mix(in srgb, var(--shs-amber) 15%, var(--card-background-color));
    }
    .alpha-icon ha-icon { --mdc-icon-size: 20px; }
    .alpha-copy { flex: 1; min-width: 0; }
    .alpha-title { font-size: 14px; font-weight: 700; color: var(--primary-text-color); }
    .alpha-text { margin-top: 3px; color: var(--secondary-text-color); font-size: 12.5px; line-height: 1.5; }
    .alpha-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      color: var(--shs-blue);
      font-size: 12.5px;
      font-weight: 700;
      text-decoration: none;
    }
    .alpha-link:hover { text-decoration: underline; }
    .alpha-link:focus-visible { outline: 2px solid var(--shs-blue); outline-offset: 3px; border-radius: 3px; }
    .alpha-link ha-icon { --mdc-icon-size: 16px; }
    .p1-card { border: 1px solid var(--divider-color); border-radius: 14px; padding: 14px 16px; background: var(--card-background-color); }
    .p1-head { display: flex; align-items: flex-start; gap: 10px; }
    .p1-head ha-icon { color: var(--shs-primary); --mdc-icon-size: 20px; margin-top: 1px; }
    .p1-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
    .p1-sub { font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
    .p1-row { display: flex; align-items: center; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
    .p1-name { font-size: 13.5px; font-weight: 600; color: var(--primary-text-color); }
    .p1-badge { font-size: 11.5px; color: var(--secondary-text-color); border: 1px solid var(--divider-color); border-radius: 999px; padding: 2px 10px; }
    .p1-select { flex: 1; min-width: 220px; font-family: inherit; font-size: 13px; color: var(--primary-text-color); background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 10px; padding: 8px 10px; }
    .p1-select:disabled { opacity: 0.6; }
    .p1-card shs-energy-automations { display: block; margin-top: 14px; }
    .cta-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 9px; background: var(--shs-blue, var(--shs-primary, #4361ee)); color: #fff; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap; }
    .cta-btn.ghost { background: transparent; border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    .cta-btn ha-icon { --mdc-icon-size: 15px; }
    .smart-item .cta-btn { margin-left: auto; }

    /* Onboarding wizard */
    .wizard { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; padding: 20px; margin-bottom: 8px; }
    .wizard-steps { display: flex; gap: 14px; margin-bottom: 14px; flex-wrap: wrap; }
    .wstep { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--secondary-text-color); }
    .wstep i { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-style: normal; font-size: 12px; font-weight: 700; background: var(--secondary-background-color); color: var(--secondary-text-color); }
    .wstep.on { color: var(--primary-text-color); font-weight: 600; }
    .wstep.on i { background: var(--shs-blue, #4361ee); color: #fff; }
    .wstep.done i { background: var(--shs-green, #22c55e); color: #fff; }
    .wizard-title { font-size: 15.5px; font-weight: 700; color: var(--primary-text-color); }
    .wizard-text { font-size: 13px; color: var(--secondary-text-color); line-height: 1.55; margin-top: 6px; }
    .wizard-row { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
    .wizard-row input, .wizard-row select { flex: 1; min-width: 220px; padding: 10px 12px; border: 1px solid var(--divider-color); border-radius: 9px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .wizard-row input:focus, .wizard-row select:focus { outline: none; border-color: var(--shs-blue, #4361ee); }
    .wizard-links { margin-top: 12px; font-size: 12px; }
    .wizard-links a, .wizard-links button { color: var(--shs-blue, #4361ee); background: none; border: none; padding: 0; font-size: 12px; font-family: inherit; cursor: pointer; text-decoration: none; }
    .wizard-links a:hover, .wizard-links button:hover { text-decoration: underline; }
    .wizard-err { margin-top: 10px; font-size: 12.5px; color: #ef4444; }

    /* Savings */
    .savings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
    .save-card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 14px; padding: 16px; }
    .save-label { font-size: 11.5px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: var(--secondary-text-color); }
    .save-val { font-size: 24px; font-weight: 750; margin-top: 8px; color: var(--primary-text-color); }
    .save-val.pos { color: var(--shs-green, #16a34a); }
    .save-sub { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 4px; }
    .save-foot { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 10px; line-height: 1.5; }

    /* Contract compare nudge */
    .compare { display: flex; align-items: center; gap: 14px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 14px; padding: 16px; }
    .compare-icon { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; background: rgba(67,97,238,.1); color: var(--shs-blue, #4361ee); flex: 0 0 auto; }
    .compare-main { flex: 1; min-width: 0; }
    .compare-title { font-size: 14px; font-weight: 650; color: var(--primary-text-color); }
    .compare-text { font-size: 12.5px; color: var(--secondary-text-color); margin-top: 3px; line-height: 1.45; }

    .section { margin-top: 26px; }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 10px;
    }
    .section-title { display: flex; align-items: baseline; gap: 9px; }
    .section-title h2 { font-size: 17px; line-height: 1.2; margin: 0; font-weight: 720; }
    .section-title span { font-size: 12px; color: var(--secondary-text-color); }

    .surface {
      background: var(--card-background-color);
      border: 1px solid var(--shs-border);
      border-radius: 8px;
      overflow: hidden;
    }

    .live-surface { display: grid; grid-template-columns: minmax(250px, .8fr) minmax(0, 1.6fr); }
    .live-home {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 236px;
      padding: 28px;
      background:
        radial-gradient(120% 90% at 15% 0%, color-mix(in srgb, var(--shs-blue) 16%, var(--card-background-color)), transparent 70%),
        var(--shs-blue-soft);
      border-right: 1px solid var(--shs-border);
    }
    .metric-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--secondary-text-color);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .55px;
      text-transform: uppercase;
    }
    .metric-label ha-icon { color: var(--shs-blue); --mdc-icon-size: 19px; }
    .live-value { font-size: 48px; line-height: 1; font-weight: 760; margin-top: 18px; letter-spacing: -.5px; }
    .live-value span { font-size: 17px; font-weight: 600; color: var(--secondary-text-color); }
    .live-caption { color: var(--secondary-text-color); font-size: 13px; margin-top: 10px; }
    .live-caption.error { color: var(--shs-red); }
    /* Self-sufficiency pill: instantly says where the home's power comes from. */
    .live-source-pill {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 16px;
      padding: 5px 12px 5px 9px; border-radius: 999px; width: fit-content;
      font-size: 12px; font-weight: 650;
      background: var(--shs-muted-surface, var(--secondary-background-color)); color: var(--secondary-text-color);
    }
    .live-source-pill ha-icon { --mdc-icon-size: 15px; }
    /* Text is mixed toward the theme's primary text colour so it clears WCAG AA
       on the soft same-hue background in both light and dark themes (the raw
       accent on its 12% tint only reached ~2.5:1 for amber in light mode). */
    .live-source-pill.green { background: var(--shs-green-soft); color: color-mix(in srgb, var(--shs-green) 58%, var(--primary-text-color)); }
    .live-source-pill.amber { background: var(--shs-amber-soft); color: color-mix(in srgb, var(--shs-amber) 52%, var(--primary-text-color)); }
    .live-source-pill .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: live-pulse 2s ease-in-out infinite; }
    @keyframes live-pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }

    .source-list { display: flex; flex-direction: column; }
    .source-row {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 1px solid var(--shs-border);
    }
    .source-row:last-child { border-bottom: 0; }
    .source-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--shs-muted-surface, var(--secondary-background-color));
      color: var(--secondary-text-color);
    }
    .source-icon ha-icon { --mdc-icon-size: 22px; }
    .source-icon.grid-in { background: var(--shs-red-soft); color: var(--shs-red); }
    .source-icon.grid-out, .source-icon.solar, .source-icon.battery-out { background: var(--shs-green-soft); color: var(--shs-green); }
    .source-icon.battery-in { background: var(--shs-blue-soft); color: var(--shs-blue); }
    .source-main { flex: 1; min-width: 0; }
    .source-name { font-size: 13.5px; font-weight: 700; }
    .source-status { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 3px; display: flex; align-items: center; gap: 5px; }
    .source-status.good { color: var(--shs-green); }
    .source-status.bad { color: var(--shs-red); }
    .source-end { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
    .source-value { display: flex; align-items: center; gap: 6px; font-size: 21px; font-weight: 750; white-space: nowrap; }
    .source-value span { font-size: 12px; font-weight: 550; color: var(--secondary-text-color); }
    /* Flow arrow: down = into your home, up = leaving it. Pulses when live. */
    .flow-arrow { --mdc-icon-size: 18px; color: var(--secondary-text-color); }
    .flow-arrow.in { color: var(--shs-green); animation: flow-in 1.6s ease-in-out infinite; }
    .flow-arrow.cost { color: var(--shs-red); animation: flow-in 1.6s ease-in-out infinite; }
    .flow-arrow.out { color: var(--shs-blue); animation: flow-out 1.6s ease-in-out infinite; }
    @keyframes flow-in { 0%,100% { transform: translateY(-1px); opacity: .55; } 50% { transform: translateY(1px); opacity: 1; } }
    @keyframes flow-out { 0%,100% { transform: translateY(1px); opacity: .55; } 50% { transform: translateY(-1px); opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .flow-arrow, .live-source-pill .dot { animation: none; } }
    /* Compact battery glyph instead of a lonely full-width bar. */
    .batt { display: flex; align-items: center; gap: 7px; }
    .batt-pct { font-size: 11.5px; font-weight: 650; color: var(--secondary-text-color); }
    .batt-glyph { position: relative; width: 30px; height: 15px; border: 1.5px solid color-mix(in srgb, var(--secondary-text-color) 55%, transparent); border-radius: 4px; padding: 1.5px; }
    .batt-glyph::after { content: ''; position: absolute; right: -3.5px; top: 4px; width: 2.5px; height: 5px; border-radius: 0 2px 2px 0; background: color-mix(in srgb, var(--secondary-text-color) 55%, transparent); }
    .batt-glyph > span { display: block; height: 100%; border-radius: 1.5px; background: var(--shs-green); transition: width .4s ease; }
    .batt-glyph > span.charging { background: var(--shs-blue); }
    .batt-glyph > span.low { background: var(--shs-red); }

    .setup-note, .empty {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-top: 10px;
      padding: 13px 14px;
      border: 1px dashed var(--shs-border);
      border-radius: 8px;
      color: var(--secondary-text-color);
      font-size: 12.5px;
      line-height: 1.5;
    }
    .setup-note ha-icon, .empty ha-icon { --mdc-icon-size: 18px; color: var(--shs-blue); flex: 0 0 auto; }
    .setup-note b, .empty b { color: var(--primary-text-color); }
    .setup-note > div, .empty > div { flex: 1; }
    .setup-note .cta-btn, .empty .cta-btn { align-self: center; }

    .seg { display: inline-flex; padding: 3px; background: var(--secondary-background-color); border-radius: 7px; }
    .seg button {
      min-height: 30px;
      border: 0;
      border-radius: 5px;
      padding: 5px 12px;
      color: var(--secondary-text-color);
      background: transparent;
      font: inherit;
      font-size: 12px;
      font-weight: 650;
      cursor: pointer;
    }
    .seg button.on { color: var(--primary-text-color); background: var(--card-background-color); box-shadow: 0 1px 3px rgba(0, 0, 0, .12); }
    .seg button:focus-visible, .chart-link:focus-visible { outline: 2px solid var(--shs-blue); outline-offset: 2px; }

    .price-surface { display: grid; grid-template-columns: 310px minmax(0, 1fr); }
    .price-summary { padding: 24px; background: var(--shs-amber-soft); border-right: 1px solid var(--shs-border); }
    .price-kicker { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .price-kicker span:first-child { font-size: 12px; font-weight: 700; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .55px; }
    .price-value { margin-top: 16px; font-size: 38px; line-height: 1; font-weight: 760; }
    .price-value span { font-size: 13px; color: var(--secondary-text-color); font-weight: 550; }
    .price-state { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; margin-top: 9px; }
    .price-state.good { color: var(--shs-green); }
    .price-state.bad { color: var(--shs-red); }
    .price-state ha-icon { --mdc-icon-size: 16px; }
    .price-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 23px; border-top: 1px solid var(--shs-border); }
    .price-fact { padding: 12px 8px 0 0; min-width: 0; }
    .price-fact:nth-child(2n) { padding-left: 12px; border-left: 1px solid var(--shs-border); }
    .price-fact-label { font-size: 10.5px; color: var(--secondary-text-color); }
    .price-fact-value { font-size: 13px; font-weight: 720; line-height: 1.25; margin-top: 3px; overflow-wrap: anywhere; }
    .price-chart-wrap { padding: 20px 18px 14px; min-width: 0; }
    .chart-top { display: flex; align-items: center; gap: 14px; margin: 0 2px 7px; }
    .chart-title { font-size: 13px; font-weight: 700; }
    .chart-legend { margin-left: auto; display: flex; gap: 12px; color: var(--secondary-text-color); font-size: 10.5px; }
    .chart-legend span { display: inline-flex; align-items: center; gap: 5px; }
    .chart-legend i { width: 8px; height: 8px; border-radius: 2px; }
    .power-chart-legend { flex-wrap: wrap; justify-content: flex-end; }
    .power-legend-toggle {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-height: 32px;
      padding: 4px 6px;
      border: 0;
      border-radius: 4px;
      color: inherit;
      background: transparent;
      font: inherit;
      cursor: pointer;
    }
    .power-legend-toggle:hover { color: var(--primary-text-color); background: var(--shs-muted-surface); }
    .power-legend-toggle:focus-visible { outline: 2px solid var(--shs-blue); outline-offset: 1px; }
    .power-legend-toggle.off { opacity: .48; text-decoration: line-through; }
    .power-legend-toggle.off i { background: transparent !important; box-shadow: inset 0 0 0 1.5px currentColor; }
    .chart svg { width: 100%; height: 225px; display: block; overflow: visible; }
    .power-surface .chart svg { height: auto; }
    .power-native-chart {
      padding: 18px 18px 10px;
    }
    .power-native-label {
      margin: 0 2px 4px;
      font-size: 12px;
      font-weight: 700;
    }
    .power-native-chart statistics-chart {
      display: block;
      width: 100%;
      height: clamp(250px, 29vw, 330px);
      --chart-max-height: 330px;
    }
    .power-native-loading {
      min-height: 270px;
      display: grid;
      place-items: center;
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    .chart text { fill: var(--secondary-text-color); font-size: 10px; }
    .chart .grid, .chart .axis { stroke: var(--shs-border); stroke-width: 1; }
    .chart .grid { opacity: .7; }
    .chart .time-grid { opacity: .38; }
    .chart .zero { stroke: var(--secondary-text-color); stroke-width: 1; opacity: .48; }
    .chart .nowline { stroke: var(--shs-blue); stroke-width: 1.4; stroke-dasharray: 4 3; }
    .chart .nowtext { fill: var(--shs-blue); font-weight: 750; }
    .chart .hit { fill: transparent; cursor: pointer; }
    .chart .tip-bg { fill: var(--card-background-color); stroke: var(--shs-border); }
    .chart .tip-h { fill: var(--primary-text-color); font-weight: 700; }
    .chart .tip-p { fill: var(--secondary-text-color); }
    .power-chart-svg { touch-action: pan-y; }
    .power-chart-svg .power-area { opacity: .075; pointer-events: none; }
    .power-chart-svg .power-line { vector-effect: non-scaling-stroke; pointer-events: none; }
    .power-chart-svg .power-endpoint,
    .power-chart-svg .power-hover-dot { vector-effect: non-scaling-stroke; pointer-events: none; }
    .power-chart-svg .power-crosshair {
      stroke: var(--secondary-text-color);
      stroke-width: 1;
      stroke-dasharray: 3 4;
      opacity: .55;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .power-chart-svg .power-hit { fill: transparent; cursor: crosshair; outline: none; }
    .power-chart-svg .power-hit:focus { stroke: var(--shs-blue); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
    .power-chart-svg .power-tip-bg {
      fill: var(--card-background-color);
      stroke: var(--shs-border);
      stroke-width: 1;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, .14));
    }
    .power-chart-svg .power-tip-time { fill: var(--primary-text-color); font-size: 11px; font-weight: 750; }
    .power-chart-svg .power-tip-label { fill: var(--secondary-text-color); font-size: 10px; }
    .power-chart-svg .power-tip-value { fill: var(--primary-text-color); font-size: 10px; font-weight: 700; }
    .chart-foot { display: flex; align-items: center; justify-content: flex-end; min-height: 28px; margin: 2px 3px 0; }
    .chart-link { display: inline-flex; align-items: center; gap: 4px; color: var(--shs-blue); font-size: 12px; font-weight: 650; text-decoration: none; }
    .chart-link:hover { text-decoration: underline; }
    .chart-link ha-icon { --mdc-icon-size: 14px; }

    .cheapest-strip {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: minmax(230px, .8fr) minmax(360px, 1.2fr);
      align-items: center;
      gap: 20px;
      padding: 14px 18px;
      border-top: 1px solid var(--shs-border);
      background: var(--shs-muted-surface);
    }
    .cheapest-kicker {
      color: var(--secondary-text-color);
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: .45px;
      text-transform: uppercase;
    }
    .cheapest-result {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 5px 10px;
      margin-top: 4px;
    }
    .cheapest-result strong { font-size: 15px; line-height: 1.25; }
    .cheapest-result span { color: var(--secondary-text-color); font-size: 11.5px; }
    .cheapest-options {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 4px;
      padding: 3px;
      border: 1px solid var(--shs-border);
      border-radius: 7px;
      background: var(--secondary-background-color);
    }
    .cheapest-options button {
      min-width: 0;
      min-height: 34px;
      padding: 4px 6px;
      border: 0;
      border-radius: 5px;
      color: var(--secondary-text-color);
      background: transparent;
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .cheapest-options button:hover { color: var(--primary-text-color); }
    .cheapest-options button.active {
      color: var(--primary-text-color);
      background: var(--card-background-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, .12);
    }
    .cheapest-options button:focus-visible { outline: 2px solid var(--shs-blue); outline-offset: 1px; }

    .power-surface { padding: 20px; }
    .power-summary { display: flex; flex-wrap: wrap; gap: 0; margin-bottom: 8px; }
    .power-stat { min-width: 145px; padding: 2px 22px 8px 0; margin-right: 22px; border-right: 1px solid var(--shs-border); }
    .power-stat:last-child { border-right: 0; }
    .power-stat-label { color: var(--secondary-text-color); font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; }
    .power-stat-value { font-size: 17px; font-weight: 740; margin-top: 4px; }

    .smart-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .smart-item { display: flex; align-items: center; gap: 11px; padding: 16px; border-right: 1px solid var(--shs-border); }
    .smart-item:last-child { border-right: 0; }
    .smart-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 8px; background: var(--shs-muted-surface); color: var(--secondary-text-color); flex: 0 0 auto; }
    .smart-icon.good { color: var(--shs-green); background: var(--shs-green-soft); }
    .smart-icon ha-icon { --mdc-icon-size: 19px; }
    .smart-name { font-size: 12.5px; font-weight: 700; }
    .smart-detail { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 2px; }

    .loading { min-height: 330px; display: grid; place-items: center; color: var(--secondary-text-color); font-size: 13px; }
    .loading-ring { width: 28px; height: 28px; margin: 0 auto 12px; border: 3px solid var(--divider-color); border-top-color: var(--shs-blue); border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .loading-ring { animation: none; } }

    @media (max-width: 850px) {
      .price-surface { grid-template-columns: 1fr; }
      .price-summary { border-right: 0; border-bottom: 1px solid var(--shs-border); }
      .cheapest-strip { grid-template-columns: 1fr; gap: 10px; }
      .price-facts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .price-fact { padding-left: 12px; border-left: 1px solid var(--shs-border); }
      .price-fact:nth-child(3n + 1) { padding-left: 0; border-left: 0; }
    }

    @media (max-width: 680px) {
      .page-head { align-items: flex-start; margin-bottom: 20px; }
      .connection { display: none; }
      h1 { font-size: 23px; }
      .section { margin-top: 22px; }
      .section-title h2 { font-size: 16px; }
      .live-surface { grid-template-columns: 1fr; }
      .live-home { min-height: auto; padding: 22px; border-right: 0; border-bottom: 1px solid var(--shs-border); }
      .live-value { font-size: 40px; margin-top: 14px; }
      .source-row { padding: 15px 17px; }
      .price-summary { padding: 20px; }
      .price-value { font-size: 34px; }
      .price-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .price-fact { padding-left: 12px; border-left: 1px solid var(--shs-border); }
      .price-fact:nth-child(odd) { padding-left: 0; border-left: 0; }
      .price-fact:nth-child(n + 3) { border-top: 1px solid var(--shs-border); margin-top: 10px; padding-top: 10px; }
      .price-chart-wrap { padding: 16px 10px 12px; }
      .cheapest-strip { padding: 14px 10px; }
      .chart-top { align-items: flex-start; }
      .chart-legend { display: none; }
      .power-chart-top { flex-direction: column; gap: 6px; }
      .power-chart-legend { display: flex; margin-left: 0; justify-content: flex-start; gap: 4px 8px; }
      .power-legend-toggle { min-height: 40px; padding: 7px 6px; }
      .chart svg { height: 205px; }
      .power-surface .chart svg { height: auto; }
      .power-surface { padding: 16px 10px 12px; }
      .power-summary { padding: 0 7px; }
      .power-stat { min-width: 0; flex: 1; padding-right: 10px; margin-right: 10px; }
      .smart-list { grid-template-columns: 1fr; }
      .smart-item { border-right: 0; border-bottom: 1px solid var(--shs-border); }
      .smart-item:last-child { border-bottom: 0; }
      .alpha-notice { padding: 13px 14px; }
      .settings-tabs-shell { margin-inline: -4px; }
      .settings-tab { min-width: 118px; }
      .settings-page-head { margin-bottom: 16px; }
    }
  `,_t.WIZARD_KEY="shs-energy-onboarding-done",_t.APP_TOKENS_URL="https://app.smarthomeshop.io/settings/api-tokens",e([ge({attribute:!1})],_t.prototype,"hass",void 0),e([me()],_t.prototype,"_loaded",void 0),e([me()],_t.prototype,"_sources",void 0),e([me()],_t.prototype,"_p1Devices",void 0),e([me()],_t.prototype,"_netEntityId",void 0),e([me()],_t.prototype,"_p1Saving",void 0),e([me()],_t.prototype,"_account",void 0),e([me()],_t.prototype,"_schedules",void 0),e([me()],_t.prototype,"_battery",void 0),e([me()],_t.prototype,"_priceEntity",void 0),e([me()],_t.prototype,"_priceTab",void 0),e([me()],_t.prototype,"_cheapestHours",void 0),e([me()],_t.prototype,"_history",void 0),e([me()],_t.prototype,"_hoverBar",void 0),e([me()],_t.prototype,"_powerChartWidth",void 0),e([me()],_t.prototype,"_hoverPowerTime",void 0),e([me()],_t.prototype,"_hiddenPowerSeries",void 0),e([me()],_t.prototype,"_statisticsChartReady",void 0),e([me()],_t.prototype,"_settingsOpen",void 0),e([me()],_t.prototype,"_settingsTab",void 0),e([me()],_t.prototype,"_savings",void 0),e([me()],_t.prototype,"_wizardDone",void 0),e([me()],_t.prototype,"_wizardKeyInput",void 0),e([me()],_t.prototype,"_wizardBusy",void 0),e([me()],_t.prototype,"_wizardError",void 0),e([me()],_t.prototype,"_wizardContracts",void 0),e([me()],_t.prototype,"_wizardContractSkipped",void 0),e([me()],_t.prototype,"_wizardEngaged",void 0),_t=vt=e([he("shs-energy-hub")],_t);const yt="1.5.5";let xt=class extends le{constructor(){super(...arguments),this.narrow=!1,this._currentPage="dashboard"}firstUpdated(e){console.log(`SmartHomeShop Panel v${yt} initialized`),"automations"===new URLSearchParams(window.location.search).get("energy-settings")&&(this._currentPage="energy",this.updateComplete.then(()=>{const e=this.renderRoot.querySelector("shs-energy-hub");e?.openSettings?.("solar-control")}))}_navigateTo(e){if(("zones"===this._currentPage||"room-builder"===this._currentPage)&&"zones"!==e&&"room-builder"!==e){const e=this.renderRoot.querySelector("shs-zones-page");if(e?.isDirty&&!window.confirm("You have unsaved changes in the Room Designer. Discard them?"))return}this._currentPage=e}_handleDeviceSelect(e){this._selectedDeviceId=e.detail.deviceId}async _handleOpenEnergySettings(e){e.stopPropagation(),this._navigateTo("energy"),await this.updateComplete,await new Promise(e=>requestAnimationFrame(()=>e()));const t=this.renderRoot.querySelector("shs-energy-hub");t?.openSettings?.(e.detail?.focus||"solar-control")}render(){return U`
      <div class="panel-header">
        <div class="header-left">
          <div class="logo">
            <div class="logo-icon" .innerHTML=${'\n<svg viewBox="0 0 772.9 607.6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n  <g>\n    <g>\n      <path d="M636.8,285.9c-0.5-10.6-11-15.9-18.8-21.6c-40.6-30.1-81.2-60.1-121.8-90.2c-34.5-25.6-69-51.1-103.5-76.7 c-3.2-2.4-9.4-2.4-12.6,0c-71.6,53.1-143.3,106.1-214.9,159.2c-5.8,4.3-11.6,8.6-17.4,12.9c-3.2,2.4-8.1,5.2-10.1,8.6 c-4.8,8.3-1.7,24.7-1.7,33.6c0,52.9,0,105.8,0,158.7c0,41.6,0,83.1,0,124.7c0,6.7,5.7,12.5,12.5,12.5c30.9,0,61.9,0,92.8,0 c16.1,0,16.1-25,0-25c-26.8,0-53.6,0-80.4,0c0-86.7,0-173.3,0-260c0-10.7,0-21.4,0-32c67.3-49.9,134.6-99.7,202-149.6 c7.8-5.8,15.6-11.6,23.5-17.4c67.3,49.8,134.6,99.7,201.8,149.5c7.9,5.8,15.7,11.6,23.6,17.5c0,88.8,0,177.5,0,266.3 c0,8.6,0,17.2,0,25.8c-26.8,0-53.6,0-80.4,0c-16.1,0-16.1,25,0,25c30.9,0,61.9,0,92.8,0c6.7,0,12.5-5.7,12.5-12.5 c0-89.3,0-178.7,0-268C636.8,313.4,637.4,299.6,636.8,285.9z"/>\n      <g>\n        <g>\n          <path d="M261.7,428.8c0,27.7,13.7,53.7,36,69.9c17.3,12.5,37.1,16,58,16c18.5,0,37,0,55.4,0c19.1,0,37.3-0.9,54.7-10.2 c27.6-14.6,45.4-44.5,45.4-75.7c0-16.1-25-16.1-25,0c0,29.1-21.2,54.6-49.8,60c-16,3-33.9,1-50,1c-16.1,0-34,2-50-1 c-28.6-5.4-49.8-30.9-49.8-60C286.6,412.8,261.7,412.7,261.7,428.8L261.7,428.8z"/>\n        </g>\n      </g>\n      <g>\n        <g>\n          <circle cx="310.9" cy="351.6" r="21.4"/>\n        </g>\n        <g>\n          <circle cx="462" cy="351.6" r="21.4"/>\n        </g>\n      </g>\n      <path d="M767.5,279.4c-42.2-31.3-84.5-62.6-126.7-93.8C573.5,135.7,506.3,85.9,439,36c-15.4-11.4-30.8-22.8-46.2-34.3 c-3.2-2.4-9.4-2.4-12.6,0c-42.2,31.3-84.5,62.6-126.7,93.8c-67.3,49.8-134.6,99.7-201.9,149.5C36.2,256.5,20.8,268,5.4,279.4 c-12.8,9.5-0.3,31.1,12.6,21.5c42.2-31.3,84.5-62.6,126.7-93.8c67.3-49.8,134.6-99.7,201.9-149.5c13.3-9.9,26.6-19.7,40-29.6 c40.1,29.7,80.3,59.4,120.4,89.2c67.3,49.8,134.6,99.7,201.9,149.5c15.4,11.4,30.8,22.8,46.2,34.3 C767.8,310.5,780.3,288.8,767.5,279.4z"/>\n    </g>\n  </g>\n</svg>\n'}></div>
            <span class="logo-brand">SmartHomeShop.io</span>
          </div>
        </div>
        <nav class="nav-tabs">
          <button class="nav-tab ${"dashboard"===this._currentPage?"active":""}" @click=${()=>this._navigateTo("dashboard")}>
            <ha-icon icon="mdi:view-dashboard"></ha-icon>Dashboard
          </button>
          <button class="nav-tab ${"zones"===this._currentPage||"room-builder"===this._currentPage?"active":""}" @click=${()=>this._navigateTo("zones")}>
            <ha-icon icon="mdi:floor-plan"></ha-icon>Room Designer
          </button>
          <button class="nav-tab ${"energy"===this._currentPage?"active":""}" @click=${()=>this._navigateTo("energy")}>
            <ha-icon icon="mdi:lightning-bolt"></ha-icon>Energy
          </button>
        </nav>
        <div class="header-right">
          <span class="version">v${yt}</span>
        </div>
      </div>
      <div class="panel-content">${this._renderPage()}</div>
    `}_renderPage(){switch(this._currentPage){case"dashboard":case"settings":return U`<shs-dashboard-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
          @device-select=${this._handleDeviceSelect}
          @open-energy-settings=${this._handleOpenEnergySettings}
          @navigate=${e=>this._navigateTo(e.detail.page)}
        ></shs-dashboard-page>`;case"room-builder":case"zones":return U`<shs-zones-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
        ></shs-zones-page>`;case"energy":return U`<shs-energy-hub .hass=${this.hass}></shs-energy-hub>`;default:return U`<p>Page not found</p>`}}};xt.styles=n`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--primary-background-color);
      /* SmartHomeShop brand color, used as accent only */
      --shs-primary: #4361ee;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 0 16px;
      min-height: 56px;
      background: var(--card-background-color);
      border-bottom: 1px solid var(--divider-color);
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--shs-primary);
    }

    .logo-icon svg {
      width: 100%;
      height: 100%;
    }

    .logo-brand {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .nav-tabs {
      display: flex;
      align-self: stretch;
      gap: 4px;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 14px;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--secondary-text-color);
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
    }

    .nav-tab:hover {
      color: var(--primary-text-color);
    }

    .nav-tab.active {
      color: var(--shs-primary);
      border-bottom-color: var(--shs-primary);
    }

    .nav-tab ha-icon {
      --mdc-icon-size: 18px;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .version {
      font-size: 12px;
      color: var(--secondary-text-color);
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
        padding: 8px 16px 0;
        gap: 8px;
      }
      .nav-tabs {
        order: 3;
        width: 100%;
        overflow-x: auto;
      }
      .nav-tab {
        padding: 10px 12px;
        font-size: 13px;
        white-space: nowrap;
      }
      .panel-content {
        padding: 16px;
      }
    }
  `,e([ge({attribute:!1})],xt.prototype,"hass",void 0),e([ge({type:Boolean,reflect:!0})],xt.prototype,"narrow",void 0),e([ge({attribute:!1})],xt.prototype,"panel",void 0),e([me()],xt.prototype,"_currentPage",void 0),e([me()],xt.prototype,"_selectedDeviceId",void 0),xt=e([he("smarthomeshop-panel")],xt);export{xt as SmartHomeShopPanel};
