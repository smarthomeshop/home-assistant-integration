function e(e,t,i,a){var o,s=arguments.length,r=s<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,i):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,a);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(r=(s<3?o(r):s>3?o(t,i,r):o(t,i))||r);return s>3&&r&&Object.defineProperty(t,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const i=globalThis,a=i.ShadowRoot&&(void 0===i.ShadyCSS||i.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap;let r=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(a&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=s.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(t,e))}return e}toString(){return this.cssText}};const n=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,a)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[a+1],e[0]);return new r(i,e,o)},l=a?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new r("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:c,defineProperty:d,getOwnPropertyDescriptor:h,getOwnPropertyNames:p,getOwnPropertySymbols:g,getPrototypeOf:u}=Object,m=globalThis,f=m.trustedTypes,v=f?f.emptyScript:"",_=m.reactiveElementPolyfillSupport,y=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?v:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},w=(e,t)=>!c(e,t),x={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:w};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let k=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),a=this.getPropertyDescriptor(e,i,t);void 0!==a&&d(this.prototype,e,a)}}static getPropertyDescriptor(e,t,i){const{get:a,set:o}=h(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:a,set(t){const s=a?.call(this);o?.call(this,t),this.requestUpdate(e,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const e=u(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const e=this.properties,t=[...p(e),...g(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(l(e))}else void 0!==e&&t.push(l(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,t)=>{if(a)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const a of t){const t=document.createElement("style"),o=i.litNonce;void 0!==o&&t.setAttribute("nonce",o),t.textContent=a.cssText,e.appendChild(t)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),a=this.constructor._$Eu(e,i);if(void 0!==a&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(t,i.type);this._$Em=e,null==o?this.removeAttribute(a):this.setAttribute(a,o),this._$Em=null}}_$AK(e,t){const i=this.constructor,a=i._$Eh.get(e);if(void 0!==a&&this._$Em!==a){const e=i.getPropertyOptions(a),o="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:b;this._$Em=a;const s=o.fromAttribute(t,e.type);this[a]=s??this._$Ej?.get(a)??s,this._$Em=null}}requestUpdate(e,t,i){if(void 0!==e){const a=this.constructor,o=this[e];if(i??=a.getPropertyOptions(e),!((i.hasChanged??w)(o,t)||i.useDefault&&i.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:a,wrapped:o},s){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==o||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===a&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,a=this[t];!0!==e||this._$AL.has(t)||void 0===a||this.C(t,void 0,i,a)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};k.elementStyles=[],k.shadowRootOptions={mode:"open"},k[y("elementProperties")]=new Map,k[y("finalized")]=new Map,_?.({ReactiveElement:k}),(m.reactiveElementVersions??=[]).push("2.1.1");const $=globalThis,S=$.trustedTypes,M=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,z="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+C,D=`<${P}>`,E=document,A=()=>E.createComment(""),T=e=>null===e||"object"!=typeof e&&"function"!=typeof e,I=Array.isArray,W="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,L=/-->/g,U=/>/g,O=RegExp(`>|${W}(?:([^\\s"'>=/]+)(${W}*=${W}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,R=/"/g,F=/^(?:script|style|textarea|title)$/i,H=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),G=H(1),V=H(2),Y=Symbol.for("lit-noChange"),Z=Symbol.for("lit-nothing"),X=new WeakMap,q=E.createTreeWalker(E,129);function K(e,t){if(!I(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==M?M.createHTML(t):t}const B=(e,t)=>{const i=e.length-1,a=[];let o,s=2===t?"<svg>":3===t?"<math>":"",r=N;for(let t=0;t<i;t++){const i=e[t];let n,l,c=-1,d=0;for(;d<i.length&&(r.lastIndex=d,l=r.exec(i),null!==l);)d=r.lastIndex,r===N?"!--"===l[1]?r=L:void 0!==l[1]?r=U:void 0!==l[2]?(F.test(l[2])&&(o=RegExp("</"+l[2],"g")),r=O):void 0!==l[3]&&(r=O):r===O?">"===l[0]?(r=o??N,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,n=l[1],r=void 0===l[3]?O:'"'===l[3]?R:j):r===R||r===j?r=O:r===L||r===U?r=N:(r=O,o=void 0);const h=r===O&&e[t+1].startsWith("/>")?" ":"";s+=r===N?i+D:c>=0?(a.push(n),i.slice(0,c)+z+i.slice(c)+C+h):i+C+(-2===c?t:h)}return[K(e,s+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),a]};class Q{constructor({strings:e,_$litType$:t},i){let a;this.parts=[];let o=0,s=0;const r=e.length-1,n=this.parts,[l,c]=B(e,t);if(this.el=Q.createElement(l,i),q.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(a=q.nextNode())&&n.length<r;){if(1===a.nodeType){if(a.hasAttributes())for(const e of a.getAttributeNames())if(e.endsWith(z)){const t=c[s++],i=a.getAttribute(e).split(C),r=/([.?@])?(.*)/.exec(t);n.push({type:1,index:o,name:r[2],strings:i,ctor:"."===r[1]?ae:"?"===r[1]?oe:"@"===r[1]?se:ie}),a.removeAttribute(e)}else e.startsWith(C)&&(n.push({type:6,index:o}),a.removeAttribute(e));if(F.test(a.tagName)){const e=a.textContent.split(C),t=e.length-1;if(t>0){a.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)a.append(e[i],A()),q.nextNode(),n.push({type:2,index:++o});a.append(e[t],A())}}}else if(8===a.nodeType)if(a.data===P)n.push({type:2,index:o});else{let e=-1;for(;-1!==(e=a.data.indexOf(C,e+1));)n.push({type:7,index:o}),e+=C.length-1}o++}}static createElement(e,t){const i=E.createElement("template");return i.innerHTML=e,i}}function J(e,t,i=e,a){if(t===Y)return t;let o=void 0!==a?i._$Co?.[a]:i._$Cl;const s=T(t)?void 0:t._$litDirective$;return o?.constructor!==s&&(o?._$AO?.(!1),void 0===s?o=void 0:(o=new s(e),o._$AT(e,i,a)),void 0!==a?(i._$Co??=[])[a]=o:i._$Cl=o),void 0!==o&&(t=J(e,o._$AS(e,t.values),o,a)),t}class ee{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,a=(e?.creationScope??E).importNode(t,!0);q.currentNode=a;let o=q.nextNode(),s=0,r=0,n=i[0];for(;void 0!==n;){if(s===n.index){let t;2===n.type?t=new te(o,o.nextSibling,this,e):1===n.type?t=new n.ctor(o,n.name,n.strings,this,e):6===n.type&&(t=new re(o,this,e)),this._$AV.push(t),n=i[++r]}s!==n?.index&&(o=q.nextNode(),s++)}return q.currentNode=E,a}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class te{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,a){this.type=2,this._$AH=Z,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=J(this,e,t),T(e)?e===Z||null==e||""===e?(this._$AH!==Z&&this._$AR(),this._$AH=Z):e!==this._$AH&&e!==Y&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>I(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==Z&&T(this._$AH)?this._$AA.nextSibling.data=e:this.T(E.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,a="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Q.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===a)this._$AH.p(t);else{const e=new ee(a,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=X.get(e.strings);return void 0===t&&X.set(e.strings,t=new Q(e)),t}k(e){I(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,a=0;for(const o of e)a===t.length?t.push(i=new te(this.O(A()),this.O(A()),this,this.options)):i=t[a],i._$AI(o),a++;a<t.length&&(this._$AR(i&&i._$AB.nextSibling,a),t.length=a)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=e.nextSibling;e.remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ie{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,a,o){this.type=1,this._$AH=Z,this._$AN=void 0,this.element=e,this.name=t,this._$AM=a,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Z}_$AI(e,t=this,i,a){const o=this.strings;let s=!1;if(void 0===o)e=J(this,e,t,0),s=!T(e)||e!==this._$AH&&e!==Y,s&&(this._$AH=e);else{const a=e;let r,n;for(e=o[0],r=0;r<o.length-1;r++)n=J(this,a[i+r],t,r),n===Y&&(n=this._$AH[r]),s||=!T(n)||n!==this._$AH[r],n===Z?e=Z:e!==Z&&(e+=(n??"")+o[r+1]),this._$AH[r]=n}s&&!a&&this.j(e)}j(e){e===Z?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ae extends ie{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===Z?void 0:e}}class oe extends ie{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==Z)}}class se extends ie{constructor(e,t,i,a,o){super(e,t,i,a,o),this.type=5}_$AI(e,t=this){if((e=J(this,e,t,0)??Z)===Y)return;const i=this._$AH,a=e===Z&&i!==Z||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,o=e!==Z&&(i===Z||a);a&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class re{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){J(this,e)}}const ne=$.litHtmlPolyfillSupport;ne?.(Q,te),($.litHtmlVersions??=[]).push("3.3.1");const le=globalThis;class ce extends k{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const a=i?.renderBefore??t;let o=a._$litPart$;if(void 0===o){const e=i?.renderBefore??null;a._$litPart$=o=new te(t.insertBefore(A(),e),e,void 0,i??{})}return o._$AI(e),o})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Y}}ce._$litElement$=!0,ce.finalized=!0,le.litElementHydrateSupport?.({LitElement:ce});const de=le.litElementPolyfillSupport;de?.({LitElement:ce}),(le.litElementVersions??=[]).push("4.2.1");const he=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},pe={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:w},ge=(e=pe,t,i)=>{const{kind:a,metadata:o}=i;let s=globalThis.litPropertyMetadata.get(o);if(void 0===s&&globalThis.litPropertyMetadata.set(o,s=new Map),"setter"===a&&((e=Object.create(e)).wrapped=!0),s.set(i.name,e),"accessor"===a){const{name:a}=i;return{set(i){const o=t.get.call(this);t.set.call(this,i),this.requestUpdate(a,o,e)},init(t){return void 0!==t&&this.C(a,void 0,e,t),t}}}if("setter"===a){const{name:a}=i;return function(i){const o=this[a];t.call(this,i),this.requestUpdate(a,o,e)}}throw Error("Unsupported decorator location: "+a)};function ue(e){return(t,i)=>"object"==typeof i?ge(e,t,i):((e,t,i)=>{const a=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),a?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function me(e){return ue({...e,state:!0,attribute:!1})}function fe(e,t){return e&&t&&e.states[t]?e.states[t]:null}function ve(e,t,i=0){const a=fe(e,t);if(!a||"unavailable"===a.state||"unknown"===a.state)return i;const o=parseFloat(a.state);return isNaN(o)?i:o}function _e(e,t=1){return null==e||isNaN(e)?"—":e.toFixed(t)}function ye(e,t){t&&e.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}}))}function be(e,t=300,i=50){const a=24===e?.length?e:new Array(24).fill(0).map((e,t)=>t>6&&t<9?2:t>17&&t<21?3:.5),o=Math.max(...a,.1),s=a.map(e=>e/o*(i-5));let r="M 0 "+(i-s[0]);return s.forEach((e,a)=>{a>0&&(r+=` L ${a*(t/23)} ${i-e}`)}),r}class we extends ce{constructor(){super(...arguments),this._config={},this._historyData=null,this._historyLoading=!1,this._lastHistoryFetch=0}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_graph:!0,_entitiesResolved:!t&&e._entitiesResolved,...e},t&&(this._lastDeviceId=e.device_id)}getCardSize(){return 5}updated(e){if(super.updated(e),e.has("hass")&&this.hass&&(this._config._entitiesResolved&&this._lastDeviceId===this._config.device_id||(this._autoDetectEntities(),this._lastDeviceId=this._config.device_id),this._config.show_graph&&this._config.flow_entity)){(Date.now()-this._lastHistoryFetch>3e5||!this._historyData)&&this._fetchHistory()}}_findEntity(e,t="sensor",i=!1){if(!this.hass)return"";const a=this._config.device_id,o=["waterp1meterkit","watermeterkit","waterflowkit","smarthomeshop"],s=Object.keys(this.hass.states).find(s=>{if(!s.startsWith(t+"."))return!1;const r=this.hass.states[s];if(!r?.attributes)return!1;const n=(r.attributes.friendly_name||"").toLowerCase(),l=s.toLowerCase(),c=o.some(e=>n.includes(e)||l.includes(e));if(!c)return!1;if(a){if(!(n.includes(a.toLowerCase())||l.includes(a.toLowerCase())))return!1}return i?e.some(e=>l.includes(e.toLowerCase())):e.some(e=>n.includes(e.toLowerCase()))});return s||""}_autoDetectEntities(){if(!this.hass)return;const e=this._config.device_id;if(e){const t=Object.keys(this.hass.states);t.some(t=>t.includes("waterp1meterkit")&&t.includes(e))?this._config._productName="WaterP1MeterKit":t.some(t=>t.includes("watermeterkit")&&t.includes(e))?this._config._productName="WaterMeterKit":t.some(t=>t.includes("waterflowkit")&&t.includes(e))?this._config._productName="WaterFlowKit":this._config._productName="SmartHomeShop"}else{const e=Object.keys(this.hass.states);e.some(e=>e.includes("waterp1meterkit"))?this._config._productName="WaterP1MeterKit":e.some(e=>e.includes("watermeterkit"))?this._config._productName="WaterMeterKit":e.some(e=>e.includes("waterflowkit"))?this._config._productName="WaterFlowKit":this._config._productName="SmartHomeShop"}this._config.flow_entity||(this._config.flow_entity=this._findEntity(["current_usage"],"sensor",!0)||this._findEntity(["huidig waterverbruik"])),this._config.total_entity||(this._config.total_entity=this._findEntity(["water_meter_total","total_consumption"],"sensor",!0)),this._config.today_entity||(this._config.today_entity=this._findEntity(["verbruik vandaag"])),this._config.week_entity||(this._config.week_entity=this._findEntity(["verbruik deze week"])),this._config.month_entity||(this._config.month_entity=this._findEntity(["verbruik deze maand"])),this._config.year_entity||(this._config.year_entity=this._findEntity(["verbruik dit jaar"])),this._config.leak_entity||(this._config.leak_entity=this._findEntity(["lek alarm"],"binary_sensor")),this._config._entitiesResolved=!0}async _fetchHistory(){if(!this.hass||!this._config.flow_entity||this._historyLoading)return;this._historyLoading=!0;const e=this._config.flow_entity,t=new Date,i=new Date(t.getTime()-864e5);try{const a=await this.hass.callWS({type:"history/history_during_period",start_time:i.toISOString(),end_time:t.toISOString(),entity_ids:[e],minimal_response:!0,no_attributes:!0,significant_changes_only:!1});a?.[e]&&(this._historyData=function(e){if(!e?.length)return[];const t=new Array(24).fill(null).map(()=>({sum:0,count:0})),i=new Date;return e.forEach(e=>{const a=new Date(e.lu?1e3*e.lu:e.last_updated||0),o=Math.floor((i.getTime()-a.getTime())/36e5),s=23-Math.min(o,23),r=parseFloat(e.s||e.state||"0");!isNaN(r)&&s>=0&&s<24&&(t[s].sum+=r,t[s].count++)}),t.map(e=>e.count>0?e.sum/e.count:0)}(a[e]),this._lastHistoryFetch=Date.now())}catch(e){console.error("SmartHomeShop: Error fetching history:",e)}finally{this._historyLoading=!1}}_getFlowRate(){return ve(this.hass,this._config.flow_entity)}_getTodayUsage(){return ve(this.hass,this._config.today_entity)}_getWeekUsage(){return ve(this.hass,this._config.week_entity)}_getMonthUsage(){return ve(this.hass,this._config.month_entity)}_getYearUsage(){return ve(this.hass,this._config.year_entity)}_getMeterTotal(){return ve(this.hass,this._config.total_entity)}_hasLeak(){const e=fe(this.hass,this._config.leak_entity);return"on"===e?.state}_getMaxHistoryValue(){return this._historyData?.length?Math.max(...this._historyData):0}}e([ue({attribute:!1})],we.prototype,"hass",void 0),e([me()],we.prototype,"_config",void 0),e([me()],we.prototype,"_historyData",void 0),e([me()],we.prototype,"_historyLoading",void 0);const xe=n`
  /*
   * Home Assistant CSS Variables Reference:
   * --primary-text-color: Main text color
   * --secondary-text-color: Muted/secondary text
   * --primary-background-color: Main background
   * --secondary-background-color: Cards/sections background
   * --card-background-color: Card background
   * --divider-color: Borders and dividers
   * --primary-color: Theme accent color
   * --text-primary-color: Text on primary color backgrounds
   * --error-color: Red for errors/alerts
   * --warning-color: Orange for warnings
   * --success-color: Green for success states
   * --info-color: Blue for information
   * --state-icon-color: Default icon color
   */

  :host {
    display: block;
  }

  ha-card {
    height: 100%;
    overflow: hidden;
  }

  .card-content {
    padding: 16px;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
    transition: all 0.3s ease;
  }

  .header-icon ha-icon {
    --mdc-icon-size: 28px;
  }

  .header-icon.flowing {
    animation: pulse 1.5s ease-in-out infinite;
    background: var(--primary-color);
    color: var(--text-primary-color);
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .header-title {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--primary-text-color);
    margin: 0;
    line-height: 1.2;
  }

  .header-subtitle {
    font-size: 0.8rem;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  /* Status badges */
  .status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .status-badge ha-icon {
    --mdc-icon-size: 16px;
  }

  .status-ok {
    background: color-mix(in srgb, var(--success-color) 15%, transparent);
    color: var(--success-color);
  }

  .status-active {
    background: color-mix(in srgb, var(--info-color) 15%, transparent);
    color: var(--info-color);
  }

  .status-alert {
    background: color-mix(in srgb, var(--error-color) 15%, transparent);
    color: var(--error-color);
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  /* Value display - main metric */
  .value-display {
    background: var(--secondary-background-color);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 12px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .value-display:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .value-display::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--divider-color);
    transition: background 0.3s ease;
  }

  .value-display.active::before {
    background: var(--primary-color);
  }

  .value-big {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--primary-text-color);
    line-height: 1;
  }

  .value-unit {
    font-size: 1rem;
    color: var(--secondary-text-color);
    margin-left: 4px;
    font-weight: 400;
  }

  .value-label {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    margin-top: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  /* Stats grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  .stat-item {
    background: var(--secondary-background-color);
    border-radius: 12px;
    padding: 12px 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .stat-item:hover {
    background: color-mix(in srgb, var(--primary-color) 10%, var(--secondary-background-color));
    transform: translateY(-2px);
  }

  .stat-value {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .stat-unit {
    font-size: 0.65rem;
    color: var(--secondary-text-color);
    font-weight: 400;
  }

  .stat-label {
    font-size: 0.65rem;
    color: var(--secondary-text-color);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  /* Graph section */
  .graph-section {
    background: var(--secondary-background-color);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .graph-section:hover {
    background: color-mix(in srgb, var(--primary-color) 5%, var(--secondary-background-color));
  }

  .graph-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .graph-title {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  .graph-max {
    font-size: 0.7rem;
    color: var(--secondary-text-color);
    opacity: 0.8;
  }

  .sparkline {
    width: 100%;
    height: 50px;
  }

  .sparkline-fill {
    fill: url(#gradient);
  }

  .sparkline-line {
    fill: none;
    stroke: var(--primary-color);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .graph-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
  }

  .graph-labels span {
    font-size: 0.6rem;
    color: var(--secondary-text-color);
    opacity: 0.7;
  }

  /* Info bar (leak detection) */
  .info-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--secondary-background-color);
    border-radius: 12px;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .info-bar:hover {
    background: color-mix(in srgb, var(--primary-color) 5%, var(--secondary-background-color));
  }

  .info-bar.alert {
    background: color-mix(in srgb, var(--error-color) 10%, var(--secondary-background-color));
    border: 1px solid color-mix(in srgb, var(--error-color) 30%, transparent);
  }

  .info-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .info-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .info-icon.ok {
    background: color-mix(in srgb, var(--success-color) 15%, transparent);
    color: var(--success-color);
  }

  .info-icon.alert {
    background: color-mix(in srgb, var(--error-color) 15%, transparent);
    color: var(--error-color);
  }

  .info-icon ha-icon {
    --mdc-icon-size: 20px;
  }

  .info-text {
    font-size: 0.85rem;
    color: var(--primary-text-color);
    font-weight: 500;
  }

  .info-subtext {
    font-size: 0.7rem;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  .info-right {
    text-align: right;
    cursor: pointer;
  }

  .info-value {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .info-label {
    font-size: 0.65rem;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  /* Section divider */
  .section-divider {
    height: 1px;
    background: var(--divider-color);
    margin: 16px 0;
  }

  /* Section headers */
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--secondary-text-color);
  }

  .section-header ha-icon {
    --mdc-icon-size: 18px;
  }

  .section-header.water {
    color: var(--info-color);
  }

  .section-header.energy {
    color: var(--warning-color);
  }

  /* Dual stats for energy section */
  .dual-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }

  .dual-stats .stat-item {
    padding: 14px 10px;
  }

  /* Domain-specific accent colors using HA variables */
  .water-accent {
    --domain-color: var(--info-color);
  }

  .energy-accent {
    --domain-color: var(--warning-color);
  }

  .alert-accent {
    --domain-color: var(--error-color);
  }

  .success-accent {
    --domain-color: var(--success-color);
  }
`;let ke=class extends we{constructor(){super(...arguments),this._config={}}static getConfigElement(){return document.createElement("smarthomeshop-water-card-editor")}static getStubConfig(){return{show_graph:!0,graph_type:"sparkline"}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_graph:!0,_entitiesResolved:!t&&e._entitiesResolved,...e}}_handleClick(e){e&&ye(this,e)}render(){if(!this.hass)return Z;const e=this._getFlowRate(),t=this._getTodayUsage(),i=this._getWeekUsage(),a=this._getMonthUsage(),o=this._getYearUsage(),s=this._getMeterTotal(),r=this._hasLeak(),n=this._config._productName||"SmartHomeShop";return G`
      <ha-card>
        <div class="card-content">
          ${this._renderHeader(n,e,r)}
          ${this._renderFlowDisplay(e)}
          ${this._renderStats(t,i,a,o)}
          ${this._config.show_graph?this._renderGraph():Z}
          ${this._renderLeakBar(r,s)}
        </div>
      </ha-card>
    `}_renderHeader(e,t,i){let a,o,s;return i?(a="mdi:alert",o="Lek gedetecteerd",s="status-alert"):t>0?(a="mdi:water",o="Water stroomt",s="status-active"):(a="mdi:check-circle",o="Geen verbruik",s="status-ok"),G`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${t>0?"flowing":""}">
            <ha-icon icon="mdi:water"></ha-icon>
          </div>
          <div>
            <h2 class="header-title">${e}</h2>
            <div class="header-subtitle">Water Monitoring</div>
          </div>
        </div>
        <div class="status-badge ${s}">
          <ha-icon icon="${a}"></ha-icon>
          <span>${o}</span>
        </div>
      </div>
    `}_renderFlowDisplay(e){return G`
      <div
        class="value-display ${e>0?"active":""}"
        @click=${()=>this._handleClick(this._config.flow_entity)}
      >
        <span class="value-big">${_e(e,1)}</span>
        <span class="value-unit">L/min</span>
        <div class="value-label">Huidig waterverbruik</div>
      </div>
    `}_renderStats(e,t,i,a){return G`
      <div class="stats-grid">
        <div class="stat-item" @click=${()=>this._handleClick(this._config.today_entity)}>
          <div class="stat-value">${_e(e,0)}<span class="stat-unit">L</span></div>
          <div class="stat-label">Vandaag</div>
        </div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.week_entity)}>
          <div class="stat-value">${_e(t,0)}<span class="stat-unit">L</span></div>
          <div class="stat-label">Week</div>
        </div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.month_entity)}>
          <div class="stat-value">
            ${_e(i/1e3,1)}<span class="stat-unit">m³</span>
          </div>
          <div class="stat-label">Maand</div>
        </div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.year_entity)}>
          <div class="stat-value">${_e(a,1)}<span class="stat-unit">m³</span></div>
          <div class="stat-label">Jaar</div>
        </div>
      </div>
    `}_renderGraph(){const e=be(this._historyData),t=this._getMaxHistoryValue();return G`
      <div class="graph-section" @click=${()=>this._handleClick(this._config.flow_entity)}>
        <div class="graph-header">
          <span class="graph-title">Verbruik laatste 24 uur</span>
          <span class="graph-max">
            ${this._historyData?`max: ${_e(t,1)} L/min`:""}
          </span>
        </div>
        <svg class="sparkline" viewBox="0 0 300 55" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="var(--info-color)" stop-opacity="0.3" />
              <stop offset="100%" stop-color="var(--info-color)" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          <path
            class="sparkline-fill"
            d="${e} L 300 55 L 0 55 Z"
            style="fill: url(#waterGradient);"
          />
          <path class="sparkline-line" d="${e}" style="stroke: var(--info-color);" />
        </svg>
        <div class="graph-labels">
          <span>-24u</span><span>-18u</span><span>-12u</span><span>-6u</span><span>Nu</span>
        </div>
      </div>
    `}_renderLeakBar(e,t){return G`
      <div
        class="info-bar ${e?"alert":""}"
        @click=${()=>this._handleClick(this._config.leak_entity)}
      >
        <div class="info-left">
          <div class="info-icon ${e?"alert":"ok"}">
            <ha-icon icon="${e?"mdi:alert":"mdi:check-circle"}"></ha-icon>
          </div>
          <div>
            <div class="info-text">Lekdetectie</div>
            <div class="info-subtext">${e?"Mogelijke lekkage":"Geen afwijkingen"}</div>
          </div>
        </div>
        <div
          class="info-right"
          @click=${e=>{e.stopPropagation(),this._handleClick(this._config.total_entity)}}
        >
          <div class="info-value">${_e(t,3)} m³</div>
          <div class="info-label">Meterstand</div>
        </div>
      </div>
    `}};ke.styles=[xe],e([me()],ke.prototype,"_config",void 0),ke=e([he("smarthomeshop-water-card")],ke);let $e=class extends we{constructor(){super(...arguments),this._energyTodayFromStats=null,this._lastStatsUpdate=0,this._config={},this._leakPanelExpanded=!1}static getConfigElement(){return document.createElement("smarthomeshop-waterp1-card-editor")}static getStubConfig(){return{show_graph:!0,show_water:!0,show_energy:!0,has_water_leak_sensor:!1}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_graph:!0,show_water:!0,show_energy:!0,has_water_leak_sensor:!1,_entitiesResolved:!t&&e._entitiesResolved,...e}}_autoDetectEntities(){super._autoDetectEntities(),this.hass&&(this._config._productName="WaterP1MeterKit",this._config.power_entity||(this._config.power_entity=this._findEntity(["power_consumed","currently_delivered","power_delivered","active_power","vermogen_actueel","stroom_afgenomen"],"sensor",!0)||this._findEntity(["power consumed","vermogen","current power"])),this._config.power_phase_l1_entity||(this._config.power_phase_l1_entity=this._findEntity(["power_consumed_phase_l1","power_phase_l1","phase_1_power","l1_power"],"sensor",!0)),this._config.power_phase_l2_entity||(this._config.power_phase_l2_entity=this._findEntity(["power_consumed_phase_l2","power_phase_l2","phase_2_power","l2_power"],"sensor",!0)),this._config.power_phase_l3_entity||(this._config.power_phase_l3_entity=this._findEntity(["power_consumed_phase_l3","power_phase_l3","phase_3_power","l3_power"],"sensor",!0)),this._config.energy_today_entity||(this._config.energy_today_entity=this._findEntity(["electricity_today","electricity_daily","energy_today"],"sensor",!0)||this._findEntity(["energy_consumed_tariff"],"sensor",!0)||this._findEntity(["energy consumed"])),this._config.gas_entity||(this._config.gas_entity=this._findEntity(["gas_consumed","gas_delivered"],"sensor",!0)||this._findEntity(["gas consumed"])),this._config.leak_score_entity||(this._config.leak_score_entity=this._findEntity(["leak_score","lek_score"],"sensor",!0)),this._config.continuous_flow_entity||(this._config.continuous_flow_entity=this._findEntity(["continuous_flow","continue_flow"],"binary_sensor",!0)),this._config.night_usage_entity||(this._config.night_usage_entity=this._findEntity(["night_usage","nacht_gebruik"],"binary_sensor",!0)),this._config.micro_leak_entity||(this._config.micro_leak_entity=this._findEntity(["micro_leak","micro_lek"],"binary_sensor",!0)),this._config.has_water_leak_sensor&&!this._config.water_leak_sensor_entity&&(this._config.water_leak_sensor_entity=this._findEntity(["water_leak_sensor","water_leak"],"binary_sensor",!0)||this._findEntity(["water leak sensor","leksensor"],"binary_sensor")))}_handleClick(e){e&&ye(this,e)}_getTotalPower(){const e=fe(this.hass,this._config.power_entity),t=e?.attributes?.unit_of_measurement||"W";let i=ve(this.hass,this._config.power_entity);if("kw"===t.toLowerCase()&&(i*=1e3),i>0)return i;const a=e=>{const t=fe(this.hass,e),i=t?.attributes?.unit_of_measurement||"W";let a=ve(this.hass,e);return"kw"===i.toLowerCase()&&(a*=1e3),a},o=a(this._config.power_phase_l1_entity),s=a(this._config.power_phase_l2_entity),r=a(this._config.power_phase_l3_entity);return o>0||s>0||r>0?o+s+r:i}_isHardwareLeakSensorWet(){if(!this._config.has_water_leak_sensor||!this._config.water_leak_sensor_entity||!this.hass)return!1;const e=fe(this.hass,this._config.water_leak_sensor_entity);return"on"===e?.state}_getLeakScore(){return ve(this.hass,this._config.leak_score_entity)}_isContinuousFlow(){return"on"===fe(this.hass,this._config.continuous_flow_entity)?.state}_isNightUsage(){return"on"===fe(this.hass,this._config.night_usage_entity)?.state}_isMicroLeak(){return"on"===fe(this.hass,this._config.micro_leak_entity)?.state}async _fetchEnergyStatistics(){if(!this.hass)return;const e=Date.now();if(e-this._lastStatsUpdate<6e4&&null!==this._energyTodayFromStats)return;const t=this._findUtilityMeterEntity("energy_daily_t1"),i=this._findUtilityMeterEntity("energy_daily_t2");if(t||i){const a=ve(this.hass,t),o=ve(this.hass,i);return this._energyTodayFromStats=a+o,this._lastStatsUpdate=e,void console.debug("WaterP1 Card: Energy today from Utility Meters (CC):",a,"+",o,"=",this._energyTodayFromStats,"kWh")}const a=this._findEntity(["energy_consumed_tariff_1"],"sensor",!0),o=this._findEntity(["energy_consumed_tariff_2"],"sensor",!0);if(!a&&!o)return void console.debug("WaterP1 Card: No tariff entities found for statistics");const s=[a,o].filter(Boolean);try{const t=new Date;t.setHours(0,0,0,0);const i=t.toISOString(),a=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:i,statistic_ids:s,period:"day",types:["change"]});let o=0;for(const e of s){const t=a[e];if(t&&t.length>0)for(const e of t)void 0!==e.change&&(o+=e.change)}this._energyTodayFromStats=o,this._lastStatsUpdate=e,console.debug("WaterP1 Card: Energy today from Statistics API:",o,"kWh")}catch(e){console.warn("WaterP1 Card: Failed to fetch energy statistics:",e)}}_findUtilityMeterEntity(e){if(!this.hass)return;const t=this._config.device_id;if(!t)return;const i=t.match(/([a-f0-9]{6})/i),a=i?i[1].toLowerCase():"";if(!a)return;const o=`sensor.waterp1_${a}_${e}`;if(this.hass.states[o])return o;for(const t of Object.keys(this.hass.states))if(t.includes(a)&&t.endsWith(e))return t}_getEnergyToday(){if(null!==this._energyTodayFromStats&&this._energyTodayFromStats>0)return this._energyTodayFromStats;const e=ve(this.hass,this._config.energy_today_entity);return e<.5&&null===this._energyTodayFromStats&&this._fetchEnergyStatistics(),this._energyTodayFromStats??e}_getGasToday(){const e=this._findUtilityMeterEntity("gas_daily");return e?ve(this.hass,e):0}firstUpdated(e){super.firstUpdated(e),this._fetchEnergyStatistics()}updated(e){super.updated(e),e.has("hass")&&this._fetchEnergyStatistics()}render(){if(!this.hass)return Z;const e=this._getFlowRate(),t=this._getTodayUsage(),i=this._getWeekUsage(),a=this._getMonthUsage(),o=this._getYearUsage(),s=this._getMeterTotal(),r=this._hasLeak(),n=this._getLeakScore(),l=this._isContinuousFlow(),c=this._isNightUsage(),d=this._isMicroLeak(),h=!0===this._config.has_water_leak_sensor,p=this._isHardwareLeakSensorWet(),g=this._getTotalPower(),u=this._getEnergyToday(),m=this._getGasToday();return G`
      <ha-card>
        <div class="card-content">
          ${p?this._renderHardwareLeakAlert():Z}
          ${this._renderHeader(e,g,r,p)}
          ${this._config.show_water?G`
            <div class="water-section">
              ${this._renderWaterSection(e,t,i,a,o,s)}
              ${this._renderLeakDetectionPanel(r,n,l,c,d,h,p)}
            </div>
          `:Z}
          ${this._config.show_water&&this._config.show_energy?G`<div class="section-divider"></div>`:Z}
          ${this._config.show_energy?G`<div class="energy-section">${this._renderEnergySection(g,u,m)}</div>`:Z}
        </div>
      </ha-card>
    `}_renderHardwareLeakAlert(){return G`
      <div class="hardware-leak-alert" @click=${()=>this._handleClick(this._config.water_leak_sensor_entity)}>
        <div class="alert-icon"><ha-icon icon="mdi:water-alert"></ha-icon></div>
        <div class="alert-content">
          <div class="alert-title">⚠️ Water Leak Detected!</div>
          <div class="alert-message">The leak sensor detected water. Check immediately!</div>
        </div>
        <div class="alert-badge">WET</div>
      </div>
    `}_renderHeader(e,t,i,a){let o="mdi:check-circle",s="All normal",r="status-ok";return a?(o="mdi:water-alert",s="WATER LEAK!",r="status-alert"):i?(o="mdi:alert",s="Leak detected",r="status-alert"):(e>0||t>100)&&(o=e>0?"mdi:water":"mdi:flash",s=e>0?"Water flowing":"Energy active",r="status-active"),G`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${e>0||t>100?"flowing":""}"><ha-icon icon="mdi:water-flash"></ha-icon></div>
          <div><h2 class="header-title">WaterP1MeterKit</h2><div class="header-subtitle">Water + Energy</div></div>
        </div>
        <div class="status-badge ${r}"><ha-icon icon="${o}"></ha-icon><span>${s}</span></div>
      </div>
    `}_renderWaterSection(e,t,i,a,o,s){const r=be(this._historyData),n=this._getMaxHistoryValue();return G`
      <div class="section-header water"><ha-icon icon="mdi:water"></ha-icon> Water</div>
      <div class="value-display ${e>0?"active":""}" @click=${()=>this._handleClick(this._config.flow_entity)}>
        <span class="value-big">${_e(e,1)}</span><span class="value-unit">L/min</span>
        <div class="value-label">Current water usage</div>
      </div>
      <div class="stats-grid">
        <div class="stat-item" @click=${()=>this._handleClick(this._config.today_entity)}><div class="stat-value">${_e(t,0)}<span class="stat-unit">L</span></div><div class="stat-label">Today</div></div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.week_entity)}><div class="stat-value">${_e(i,0)}<span class="stat-unit">L</span></div><div class="stat-label">Week</div></div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.month_entity)}><div class="stat-value">${_e(a/1e3,1)}<span class="stat-unit">m³</span></div><div class="stat-label">Month</div></div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.year_entity)}><div class="stat-value">${_e(o,1)}<span class="stat-unit">m³</span></div><div class="stat-label">Year</div></div>
      </div>
      ${this._config.show_graph?G`
        <div class="graph-section" @click=${()=>this._handleClick(this._config.flow_entity)}>
          <div class="graph-header"><span class="graph-title">Water last 24 hours</span><span class="graph-max">${this._historyData?`max: ${_e(n,1)} L/min`:""}</span></div>
          <svg class="sparkline" viewBox="0 0 300 55" preserveAspectRatio="none">
            <defs><linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="var(--info-color)" stop-opacity="0.3"/><stop offset="100%" stop-color="var(--info-color)" stop-opacity="0.02"/></linearGradient></defs>
            <path class="sparkline-fill" d="${r} L 300 55 L 0 55 Z" style="fill: url(#waterGradient);"/>
            <path class="sparkline-line" d="${r}" style="stroke: var(--info-color);"/>
          </svg>
          <div class="graph-labels"><span>-24h</span><span>-18h</span><span>-12h</span><span>-6h</span><span>Now</span></div>
        </div>
      `:Z}
      ${this._renderMeterCounter()}
    `}_renderMeterCounter(){const e=this._getMeterReading();if(null===e)return Z;const t=Math.floor(e),i=Math.round(1e3*(e-t)),a=t.toString().padStart(6,"0").split(""),o=i.toString().padStart(3,"0").split(""),s=this._getMeterReadingAttributes(),r=s?.last_calibration?new Date(s.last_calibration).toLocaleDateString("nl-NL"):null,n=s?.usage_since_calibration??0;return G`
      <div class="meter-counter-section" @click=${()=>this._handleClick(this._getMeterReadingEntityId())}>
        <div class="meter-counter-header">
          <div class="meter-counter-title">
            <ha-icon icon="mdi:counter"></ha-icon>
            Meterstand
          </div>
          <div class="meter-counter-calibrate" @click=${e=>{e.stopPropagation(),this._handleClick(this._getMeterInputEntityId())}}>
            ⚙️ Ijken
          </div>
        </div>
        <div class="meter-counter-display">
          ${a.map(e=>G`<div class="meter-digit">${e}</div>`)}
          <span class="meter-separator">,</span>
          ${o.map(e=>G`<div class="meter-digit decimal">${e}</div>`)}
          <span class="meter-unit">m³</span>
        </div>
        ${r||n>0?G`
          <div class="meter-counter-footer">
            <span class="last-calibration">${r?`Geijkt: ${r}`:""}</span>
            <span class="usage-since">${n>0?`+${_e(1e3*n,0)} L sinds ijking`:""}</span>
          </div>
        `:Z}
      </div>
    `}_getMeterReading(){const e=this._getMeterReadingEntityId();if(!e)return null;const t=this.hass?.states[e];if(!t||"unknown"===t.state||"unavailable"===t.state)return null;try{return parseFloat(t.state)}catch{return null}}_getMeterReadingEntityId(){if(!this.hass)return null;for(const e of Object.keys(this.hass.states))if(e.includes("meter_reading")&&!e.includes("input")&&e.startsWith("sensor.")){const t=this.hass.states[e];if(void 0!==t?.attributes?.last_calibration||void 0!==t?.attributes?.usage_since_calibration)return e}return null}_getMeterInputEntityId(){if(!this.hass)return null;for(const e of Object.keys(this.hass.states))if(e.includes("meter_reading")&&e.startsWith("number."))return e;return null}_getMeterReadingAttributes(){const e=this._getMeterReadingEntityId();return e&&this.hass?.states[e]?.attributes||null}_renderLeakDetectionPanel(e,t,i,a,o,s,r){const n=[i,a,o,r].filter(Boolean).length,l=this._getMeterTotal();let c="ok",d="mdi:shield-check",h="No anomalies";return r?(c="alert",d="mdi:water-alert",h="Water leak detected!"):e||t>=50?(c="alert",d="mdi:alert-circle",h=`${n} issue${1!==n?"s":""} detected`):(t>0||n>0)&&(c="warning",d="mdi:alert",h="Monitoring activity"),G`
      <div class="leak-panel">
        <div class="leak-panel-header" @click=${()=>this._leakPanelExpanded=!this._leakPanelExpanded}>
          <div class="header-icon ${c}"><ha-icon icon="${d}"></ha-icon></div>
          <div class="header-content"><div class="header-title">Leak Detection</div><div class="header-subtitle">${h}</div></div>
          <div class="header-right"><div class="meter-value">${_e(l,3)} m³</div><div class="meter-label">Meter</div></div>
        </div>
        ${this._leakPanelExpanded?G`
          <div class="leak-details">
            <div class="leak-detail-row" @click=${()=>this._handleClick(this._config.continuous_flow_entity)}>
              <div class="detail-icon ${i?"active":""}"><ha-icon icon="mdi:water-sync"></ha-icon></div>
              <div class="detail-info"><div class="detail-name">Continuous flow</div><div class="detail-desc">Water running for extended period</div></div>
              <div class="detail-status ${i?"active":"ok"}">${i?"ACTIVE":"OK"}</div>
            </div>
            <div class="leak-detail-row" @click=${()=>this._handleClick(this._config.night_usage_entity)}>
              <div class="detail-icon ${a?"active":""}"><ha-icon icon="mdi:weather-night"></ha-icon></div>
              <div class="detail-info"><div class="detail-name">Night usage</div><div class="detail-desc">Water usage during night hours</div></div>
              <div class="detail-status ${a?"active":"ok"}">${a?"ACTIVE":"OK"}</div>
            </div>
            <div class="leak-detail-row" @click=${()=>this._handleClick(this._config.micro_leak_entity)}>
              <div class="detail-icon ${o?"active":""}"><ha-icon icon="mdi:water-opacity"></ha-icon></div>
              <div class="detail-info"><div class="detail-name">Micro leak</div><div class="detail-desc">Small constant water flow</div></div>
              <div class="detail-status ${o?"active":"ok"}">${o?"ACTIVE":"OK"}</div>
            </div>
            ${s?G`
              <div class="leak-detail-row hardware ${r?"wet":""}" @click=${()=>this._handleClick(this._config.water_leak_sensor_entity)}>
                <div class="detail-icon"><ha-icon icon="mdi:water-pump"></ha-icon></div>
                <div class="detail-info"><div class="detail-name">Hardware leak sensor</div><div class="detail-desc">Physical water detection (V3)</div></div>
                <div class="detail-status ${r?"active":"ok"}">${r?"WET!":"DRY"}</div>
              </div>
            `:Z}
            ${t>0?G`
              <div class="leak-detail-row" @click=${()=>this._handleClick(this._config.leak_score_entity)}>
                <div class="detail-icon ${t>=50?"active":""}"><ha-icon icon="mdi:gauge"></ha-icon></div>
                <div class="detail-info"><div class="detail-name">Leak score</div><div class="detail-desc">Overall risk assessment</div></div>
                <div class="detail-status ${t>=50?"active":"ok"}">${t}%</div>
              </div>
            `:Z}
          </div>
        `:Z}
      </div>
    `}_renderEnergySection(e,t,i){const a=this._getPowerReturned(),o=this._getEnergyReturnedToday();return G`
      <div class="section-header energy"><ha-icon icon="mdi:flash"></ha-icon> Energy</div>

      ${a>0||o>0?G`
        <!-- Solar mode: show consumption and return -->
        <div class="dual-power">
          <div class="value-display ${e>100?"active":""}" @click=${()=>this._handleClick(this._config.power_entity)}>
            <span class="value-big">${_e(e,0)}</span><span class="value-unit">W</span>
            <div class="value-label">Verbruik</div>
          </div>
          <div class="value-display solar ${a>0?"active":""}" @click=${()=>this._handleClick(this._config.power_returned_entity)}>
            <span class="value-big">${_e(a,0)}</span><span class="value-unit">W</span>
            <div class="value-label">Teruglevering</div>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-item" @click=${()=>this._handleClick(this._config.energy_today_entity)}><div class="stat-value">${_e(t,2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Verbruik vandaag</div></div>
          <div class="stat-item solar" @click=${()=>this._handleClick(this._config.energy_returned_entity)}><div class="stat-value">${_e(o,2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Teruglevering vandaag</div></div>
          <div class="stat-item" @click=${()=>this._handleClick(this._config.gas_entity)}><div class="stat-value">${_e(i,2)}<span class="stat-unit">m³</span></div><div class="stat-label">Gas vandaag</div></div>
        </div>
      `:G`
        <!-- No solar: simple view -->
        <div class="value-display ${e>100?"active":""}" @click=${()=>this._handleClick(this._config.power_entity)}>
          <span class="value-big">${_e(e,0)}</span><span class="value-unit">W</span>
          <div class="value-label">Huidig verbruik</div>
        </div>
        <div class="dual-stats">
          <div class="stat-item" @click=${()=>this._handleClick(this._config.energy_today_entity)}><div class="stat-value">${_e(t,2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Stroom vandaag</div></div>
          <div class="stat-item" @click=${()=>this._handleClick(this._config.gas_entity)}><div class="stat-value">${_e(i,2)}<span class="stat-unit">m³</span></div><div class="stat-label">Gas vandaag</div></div>
        </div>
      `}
    `}_getPowerReturned(){return this._config.power_returned_entity||(this._config.power_returned_entity=this._findEntity(["power_returned","power_delivered_to_grid","power_export"],"sensor",!0)),ve(this.hass,this._config.power_returned_entity)}_getEnergyReturnedToday(){const e=this._findUtilityMeterEntity("energy_returned_daily_t1"),t=this._findUtilityMeterEntity("energy_returned_daily_t2");return e||t?ve(this.hass,e)+ve(this.hass,t):(this._config.energy_returned_entity||(this._config.energy_returned_entity=this._findEntity(["energy_returned_tariff_1","energy_returned_tariff_2","energy_returned","energy_delivered","energy_export"],"sensor",!0)),0)}};$e.styles=[xe,n`
      .energy-section .value-display.active::before {
        background: var(--warning-color);
      }

      /* Dual power display (consumption + return) */
      .dual-power {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }
      .dual-power .value-display {
        padding: 16px 12px;
      }
      .dual-power .value-display .value-big {
        font-size: 28px;
      }
      .dual-power .value-display.solar {
        background: linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(255, 152, 0, 0.04) 100%);
        border: 1px solid rgba(255, 193, 7, 0.15);
      }
      .dual-power .value-display.solar::before {
        background: var(--warning-color);
      }
      .dual-power .value-display.solar .value-big,
      .dual-power .value-display.solar .value-unit {
        color: #ffc107;
      }

      /* Solar stat item styling */
      .stat-item.solar {
        background: linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(255, 152, 0, 0.04) 100%);
        border: 1px solid rgba(255, 193, 7, 0.15);
      }
      .stat-item.solar .stat-value {
        color: #ffc107;
      }

      /* Dual stats (simple view without solar) */
      .dual-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .dual-stats .stat-item {
        background: var(--secondary-background-color);
        border-radius: 12px;
        padding: 14px;
        text-align: center;
        cursor: pointer;
        transition: background 0.2s;
      }
      .dual-stats .stat-item:hover {
        background: var(--primary-background-color);
      }
      .dual-stats .stat-value {
        font-size: 22px;
        font-weight: 700;
        color: var(--primary-text-color);
      }
      .dual-stats .stat-unit {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-left: 2px;
      }
      .dual-stats .stat-label {
        font-size: 11px;
        color: var(--secondary-text-color);
        margin-top: 4px;
        text-transform: uppercase;
      }

      .hardware-leak-alert {
        background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: pulse-alert 1s ease-in-out infinite;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255, 0, 0, 0.4);
      }

      @keyframes pulse-alert {
        0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 4px 20px rgba(255, 0, 0, 0.4); }
        50% { opacity: 0.85; transform: scale(1.01); box-shadow: 0 4px 30px rgba(255, 0, 0, 0.7); }
      }

      .hardware-leak-alert .alert-icon {
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: shake 0.5s ease-in-out infinite;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        75% { transform: translateX(3px); }
      }

      .hardware-leak-alert .alert-icon ha-icon { --mdc-icon-size: 28px; color: white; }
      .hardware-leak-alert .alert-content { flex: 1; }
      .hardware-leak-alert .alert-title { font-size: 16px; font-weight: 700; color: white; margin-bottom: 4px; text-transform: uppercase; }
      .hardware-leak-alert .alert-message { font-size: 13px; color: rgba(255, 255, 255, 0.9); }
      .hardware-leak-alert .alert-badge { background: white; color: #cc0000; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }

      .leak-panel {
        background: var(--card-background-color, #1a1a1a);
        border-radius: 12px;
        margin-top: 12px;
        overflow: hidden;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.1));
      }

      .leak-panel-header {
        display: flex;
        align-items: center;
        padding: 12px 14px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .leak-panel-header:hover { background: var(--secondary-background-color); }

      .leak-panel-header .header-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
      }

      .leak-panel-header .header-icon.ok { background: rgba(76, 175, 80, 0.15); color: var(--success-color); }
      .leak-panel-header .header-icon.warning { background: rgba(255, 152, 0, 0.15); color: var(--warning-color); }
      .leak-panel-header .header-icon.alert { background: rgba(244, 67, 54, 0.15); color: var(--error-color); }
      .leak-panel-header .header-icon ha-icon { --mdc-icon-size: 20px; }
      .leak-panel-header .header-content { flex: 1; }
      .leak-panel-header .header-title { font-size: 13px; font-weight: 500; color: var(--primary-text-color); }
      .leak-panel-header .header-subtitle { font-size: 11px; color: var(--secondary-text-color); margin-top: 2px; }
      .leak-panel-header .header-right { text-align: right; }
      .leak-panel-header .meter-value { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
      .leak-panel-header .meter-label { font-size: 10px; color: var(--secondary-text-color); text-transform: uppercase; }

      .leak-details { padding: 0 14px 14px; border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08)); }

      .leak-detail-row {
        display: flex;
        align-items: center;
        padding: 8px 0;
        cursor: pointer;
      }

      .leak-detail-row:not(:last-child) { border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.05)); }

      .leak-detail-row .detail-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        background: rgba(100, 100, 100, 0.1);
      }

      .leak-detail-row .detail-icon ha-icon { --mdc-icon-size: 14px; color: var(--secondary-text-color); }
      .leak-detail-row .detail-icon.active { background: rgba(244, 67, 54, 0.15); }
      .leak-detail-row .detail-icon.active ha-icon { color: var(--error-color); }
      .leak-detail-row .detail-info { flex: 1; }
      .leak-detail-row .detail-name { font-size: 12px; color: var(--primary-text-color); }
      .leak-detail-row .detail-desc { font-size: 10px; color: var(--secondary-text-color); }
      .leak-detail-row .detail-status { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 8px; }
      .leak-detail-row .detail-status.ok { background: rgba(76, 175, 80, 0.1); color: var(--success-color); }
      .leak-detail-row .detail-status.active { background: rgba(244, 67, 54, 0.15); color: var(--error-color); }
      .leak-detail-row.hardware .detail-icon { background: rgba(33, 150, 243, 0.15); }
      .leak-detail-row.hardware .detail-icon ha-icon { color: var(--info-color); }
      .leak-detail-row.hardware.wet .detail-icon { background: rgba(244, 67, 54, 0.15); }
      .leak-detail-row.hardware.wet .detail-icon ha-icon { color: var(--error-color); animation: pulse 1s infinite; }

      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

      /* Meter Reading Counter - Classic meter look */
      .meter-counter-section {
        background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
        border-radius: 12px;
        padding: 16px;
        margin-top: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .meter-counter-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .meter-counter-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .meter-counter-title ha-icon {
        --mdc-icon-size: 18px;
        color: var(--info-color);
      }
      .meter-counter-calibrate {
        font-size: 11px;
        color: var(--info-color);
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      .meter-counter-calibrate:hover { opacity: 1; }

      .meter-counter-display {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 3px;
        padding: 12px 0;
      }
      .meter-digit {
        width: 32px;
        height: 48px;
        background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Courier New', monospace;
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        box-shadow: 
          inset 0 1px 0 rgba(255,255,255,0.1),
          inset 0 -1px 0 rgba(0,0,0,0.3),
          0 2px 4px rgba(0,0,0,0.3);
        position: relative;
        overflow: hidden;
      }
      .meter-digit::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(0, 0, 0, 0.4);
      }
      .meter-digit::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 50%;
        background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%);
      }
      .meter-digit.decimal {
        color: #ff6b6b;
        background: linear-gradient(180deg, #3a2020 0%, #2a1515 50%, #3a2020 100%);
        border-color: rgba(255, 107, 107, 0.3);
      }
      .meter-separator {
        font-size: 32px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.4);
        margin: 0 2px;
      }
      .meter-unit {
        font-size: 14px;
        color: var(--secondary-text-color);
        margin-left: 8px;
        align-self: flex-end;
        padding-bottom: 8px;
      }

      .meter-counter-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 11px;
        color: var(--secondary-text-color);
      }
      .meter-counter-footer .last-calibration { opacity: 0.7; }
      .meter-counter-footer .usage-since { color: var(--info-color); }
    `],e([me()],$e.prototype,"_energyTodayFromStats",void 0),e([me()],$e.prototype,"_lastStatsUpdate",void 0),e([me()],$e.prototype,"_config",void 0),e([me()],$e.prototype,"_leakPanelExpanded",void 0),$e=e([he("smarthomeshop-waterp1-card")],$e);const Se={common:{loading:"Loading...",error:"Error",unknown:"Unknown",today:"Today",week:"Week",month:"Month",year:"Year",daily:"Daily",weekly:"Weekly",monthly:"Monthly",yearly:"Yearly",current:"Current",total:"Total",temperature:"Temperature",humidity:"Humidity",settings:"Settings",save:"Save",cancel:"Cancel",close:"Close",edit:"Edit",delete:"Delete",add:"Add",name:"Name",value:"Value",unit:"Unit",active:"Active",inactive:"Inactive",on:"On",off:"Off",yes:"Yes",no:"No",show:"Show",hide:"Hide"},waterflowkit:{title:"WaterFlowKit",subtitle:"Dual flow monitoring",pipe1:"Pipe 1",pipe2:"Pipe 2",currentFlow:"Current flow",totalConsumption:"Total consumption",flowRate:"Flow rate",perHour:"per hour",noFlow:"No flow",flowing:"Flowing",waterTemperature:"Water temperature",showPipe1:"Show Pipe 1",showPipe2:"Show Pipe 2",showTemperature:"Show temperature",pipe1Name:"Pipe 1 name",pipe2Name:"Pipe 2 name"},waterp1:{title:"WaterP1MeterKit",water:"Water",energy:"Energy",energyActive:"Energy active",currentUsage:"Current water usage",leakDetection:"Leak Detection",monitoringActivity:"Monitoring activity",meter:"Meter",currentPower:"Current power",electricityToday:"Electricity today",gasToday:"Gas today",waterLast24h:"Water last 24 hours",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Water usage",dailyUsage:"Daily usage",weeklyUsage:"Weekly usage",monthlyUsage:"Monthly usage",yearlyUsage:"Yearly usage",calibration:"Calibration",lastCalibration:"Last calibration",sinceLast:"since calibration"},ultimatesensor:{title:"UltimateSensor",roomScore:"Room Score",excellent:"Excellent",good:"Good",moderate:"Moderate",poor:"Poor",unhealthy:"Unhealthy",hazardous:"Hazardous",presence:"Presence",detected:"Detected",notDetected:"Not detected",targets:"Targets",co2Level:"CO₂ level",vocIndex:"VOC index",noxIndex:"NOx index",illuminance:"Illuminance",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radar view",roomView:"Room view",view2D:"2D",view3D:"3D",zoneOccupancy:"Zone occupancy",zone:"Zone",recommendations:"Recommendations",ventilateNow:"Ventilate now!",openWindow:"Open a window",airQualityPoor:"Air quality is poor",tooHumid:"Too humid",tooDry:"Too dry",tooCold:"Too cold",tooWarm:"Too warm"},editor:{deviceId:"Device ID",selectDevice:"Select device",appearance:"Appearance",showGraph:"Show graph",showWater:"Show water",showEnergy:"Show energy",graphType:"Graph type",historyGraph:"History graph",liveGraph:"Live graph",displayOptions:"Display options"}},Me={en:Se,nl:{common:{loading:"Laden...",error:"Fout",unknown:"Onbekend",today:"Vandaag",week:"Week",month:"Maand",year:"Jaar",daily:"Dagelijks",weekly:"Wekelijks",monthly:"Maandelijks",yearly:"Jaarlijks",current:"Huidig",total:"Totaal",temperature:"Temperatuur",humidity:"Luchtvochtigheid",settings:"Instellingen",save:"Opslaan",cancel:"Annuleren",close:"Sluiten",edit:"Bewerken",delete:"Verwijderen",add:"Toevoegen",name:"Naam",value:"Waarde",unit:"Eenheid",active:"Actief",inactive:"Inactief",on:"Aan",off:"Uit",yes:"Ja",no:"Nee",show:"Tonen",hide:"Verbergen"},waterflowkit:{title:"WaterFlowKit",subtitle:"Dubbele flowmeting",pipe1:"Leiding 1",pipe2:"Leiding 2",currentFlow:"Huidige flow",totalConsumption:"Totaal verbruik",flowRate:"Debiet",perHour:"per uur",noFlow:"Geen flow",flowing:"Stromend",waterTemperature:"Watertemperatuur",showPipe1:"Toon leiding 1",showPipe2:"Toon leiding 2",showTemperature:"Toon temperatuur",pipe1Name:"Naam leiding 1",pipe2Name:"Naam leiding 2"},waterp1:{title:"WaterP1MeterKit",water:"Water",energy:"Energie",energyActive:"Energie actief",currentUsage:"Huidig waterverbruik",leakDetection:"Lekdetectie",monitoringActivity:"Bewakingsactiviteit",meter:"Meter",currentPower:"Huidig vermogen",electricityToday:"Stroom vandaag",gasToday:"Gas vandaag",waterLast24h:"Water laatste 24 uur",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Waterverbruik",dailyUsage:"Dagelijks verbruik",weeklyUsage:"Wekelijks verbruik",monthlyUsage:"Maandelijks verbruik",yearlyUsage:"Jaarlijks verbruik",calibration:"Kalibratie",lastCalibration:"Laatste kalibratie",sinceLast:"sinds kalibratie"},ultimatesensor:{title:"UltimateSensor",roomScore:"Kamerscore",excellent:"Uitstekend",good:"Goed",moderate:"Matig",poor:"Slecht",unhealthy:"Ongezond",hazardous:"Gevaarlijk",presence:"Aanwezigheid",detected:"Gedetecteerd",notDetected:"Niet gedetecteerd",targets:"Doelen",co2Level:"CO₂-niveau",vocIndex:"VOC-index",noxIndex:"NOx-index",illuminance:"Verlichtingssterkte",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radarweergave",roomView:"Kamerweergave",view2D:"2D",view3D:"3D",zoneOccupancy:"Zone bezetting",zone:"Zone",recommendations:"Aanbevelingen",ventilateNow:"Ventileer nu!",openWindow:"Open een raam",airQualityPoor:"Luchtkwaliteit is slecht",tooHumid:"Te vochtig",tooDry:"Te droog",tooCold:"Te koud",tooWarm:"Te warm"},editor:{deviceId:"Apparaat-ID",selectDevice:"Selecteer apparaat",appearance:"Uiterlijk",showGraph:"Toon grafiek",showWater:"Toon water",showEnergy:"Toon energie",graphType:"Grafiektype",historyGraph:"Historiegrafiek",liveGraph:"Live grafiek",displayOptions:"Weergaveopties"}},de:{common:{loading:"Laden...",error:"Fehler",unknown:"Unbekannt",today:"Heute",week:"Woche",month:"Monat",year:"Jahr",daily:"Täglich",weekly:"Wöchentlich",monthly:"Monatlich",yearly:"Jährlich",current:"Aktuell",total:"Gesamt",temperature:"Temperatur",humidity:"Luftfeuchtigkeit",settings:"Einstellungen",save:"Speichern",cancel:"Abbrechen",close:"Schließen",edit:"Bearbeiten",delete:"Löschen",add:"Hinzufügen",name:"Name",value:"Wert",unit:"Einheit",active:"Aktiv",inactive:"Inaktiv",on:"An",off:"Aus",yes:"Ja",no:"Nein",show:"Anzeigen",hide:"Ausblenden"},waterflowkit:{title:"WaterFlowKit",subtitle:"Doppelte Durchflussmessung",pipe1:"Leitung 1",pipe2:"Leitung 2",currentFlow:"Aktueller Durchfluss",totalConsumption:"Gesamtverbrauch",flowRate:"Durchflussrate",perHour:"pro Stunde",noFlow:"Kein Durchfluss",flowing:"Fließend",waterTemperature:"Wassertemperatur",showPipe1:"Leitung 1 anzeigen",showPipe2:"Leitung 2 anzeigen",showTemperature:"Temperatur anzeigen",pipe1Name:"Name Leitung 1",pipe2Name:"Name Leitung 2"},waterp1:{title:"WaterP1MeterKit",water:"Wasser",energy:"Energie",energyActive:"Energie aktiv",currentUsage:"Aktueller Wasserverbrauch",leakDetection:"Leckerkennung",monitoringActivity:"Überwachungsaktivität",meter:"Zähler",currentPower:"Aktuelle Leistung",electricityToday:"Strom heute",gasToday:"Gas heute",waterLast24h:"Wasser letzte 24 Stunden",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Wasserverbrauch",dailyUsage:"Täglicher Verbrauch",weeklyUsage:"Wöchentlicher Verbrauch",monthlyUsage:"Monatlicher Verbrauch",yearlyUsage:"Jährlicher Verbrauch",calibration:"Kalibrierung",lastCalibration:"Letzte Kalibrierung",sinceLast:"seit Kalibrierung"},ultimatesensor:{title:"UltimateSensor",roomScore:"Raumbewertung",excellent:"Ausgezeichnet",good:"Gut",moderate:"Mäßig",poor:"Schlecht",unhealthy:"Ungesund",hazardous:"Gefährlich",presence:"Anwesenheit",detected:"Erkannt",notDetected:"Nicht erkannt",targets:"Ziele",co2Level:"CO₂-Niveau",vocIndex:"VOC-Index",noxIndex:"NOx-Index",illuminance:"Beleuchtungsstärke",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radaransicht",roomView:"Raumansicht",view2D:"2D",view3D:"3D",zoneOccupancy:"Zonenbelegung",zone:"Zone",recommendations:"Empfehlungen",ventilateNow:"Jetzt lüften!",openWindow:"Öffnen Sie ein Fenster",airQualityPoor:"Luftqualität ist schlecht",tooHumid:"Zu feucht",tooDry:"Zu trocken",tooCold:"Zu kalt",tooWarm:"Zu warm"},editor:{deviceId:"Geräte-ID",selectDevice:"Gerät auswählen",appearance:"Erscheinungsbild",showGraph:"Diagramm anzeigen",showWater:"Wasser anzeigen",showEnergy:"Energie anzeigen",graphType:"Diagrammtyp",historyGraph:"Verlaufsdiagramm",liveGraph:"Live-Diagramm",displayOptions:"Anzeigeoptionen"}},fr:{common:{loading:"Chargement...",error:"Erreur",unknown:"Inconnu",today:"Aujourd'hui",week:"Semaine",month:"Mois",year:"Année",daily:"Quotidien",weekly:"Hebdomadaire",monthly:"Mensuel",yearly:"Annuel",current:"Actuel",total:"Total",temperature:"Température",humidity:"Humidité",settings:"Paramètres",save:"Enregistrer",cancel:"Annuler",close:"Fermer",edit:"Modifier",delete:"Supprimer",add:"Ajouter",name:"Nom",value:"Valeur",unit:"Unité",active:"Actif",inactive:"Inactif",on:"Activé",off:"Désactivé",yes:"Oui",no:"Non",show:"Afficher",hide:"Masquer"},waterflowkit:{title:"WaterFlowKit",subtitle:"Double mesure de débit",pipe1:"Conduite 1",pipe2:"Conduite 2",currentFlow:"Débit actuel",totalConsumption:"Consommation totale",flowRate:"Débit",perHour:"par heure",noFlow:"Pas de débit",flowing:"En cours",waterTemperature:"Température de l'eau",showPipe1:"Afficher conduite 1",showPipe2:"Afficher conduite 2",showTemperature:"Afficher température",pipe1Name:"Nom conduite 1",pipe2Name:"Nom conduite 2"},waterp1:{title:"WaterP1MeterKit",water:"Eau",energy:"Énergie",energyActive:"Énergie active",currentUsage:"Consommation d'eau actuelle",leakDetection:"Détection de fuite",monitoringActivity:"Activité de surveillance",meter:"Compteur",currentPower:"Puissance actuelle",electricityToday:"Électricité aujourd'hui",gasToday:"Gaz aujourd'hui",waterLast24h:"Eau dernières 24 heures",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Consommation d'eau",dailyUsage:"Consommation quotidienne",weeklyUsage:"Consommation hebdomadaire",monthlyUsage:"Consommation mensuelle",yearlyUsage:"Consommation annuelle",calibration:"Calibration",lastCalibration:"Dernière calibration",sinceLast:"depuis calibration"},ultimatesensor:{title:"UltimateSensor",roomScore:"Score de la pièce",excellent:"Excellent",good:"Bon",moderate:"Modéré",poor:"Mauvais",unhealthy:"Malsain",hazardous:"Dangereux",presence:"Présence",detected:"Détectée",notDetected:"Non détectée",targets:"Cibles",co2Level:"Niveau de CO₂",vocIndex:"Indice COV",noxIndex:"Indice NOx",illuminance:"Éclairement",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vue radar",roomView:"Vue de la pièce",view2D:"2D",view3D:"3D",zoneOccupancy:"Occupation de zone",zone:"Zone",recommendations:"Recommandations",ventilateNow:"Aérez maintenant !",openWindow:"Ouvrez une fenêtre",airQualityPoor:"La qualité de l'air est mauvaise",tooHumid:"Trop humide",tooDry:"Trop sec",tooCold:"Trop froid",tooWarm:"Trop chaud"},editor:{deviceId:"ID appareil",selectDevice:"Sélectionner appareil",appearance:"Apparence",showGraph:"Afficher graphique",showWater:"Afficher l'eau",showEnergy:"Afficher l'énergie",graphType:"Type de graphique",historyGraph:"Graphique historique",liveGraph:"Graphique en direct",displayOptions:"Options d'affichage"}},es:{common:{loading:"Cargando...",error:"Error",unknown:"Desconocido",today:"Hoy",week:"Semana",month:"Mes",year:"Año",daily:"Diario",weekly:"Semanal",monthly:"Mensual",yearly:"Anual",current:"Actual",total:"Total",temperature:"Temperatura",humidity:"Humedad",settings:"Configuración",save:"Guardar",cancel:"Cancelar",close:"Cerrar",edit:"Editar",delete:"Eliminar",add:"Añadir",name:"Nombre",value:"Valor",unit:"Unidad",active:"Activo",inactive:"Inactivo",on:"Encendido",off:"Apagado",yes:"Sí",no:"No",show:"Mostrar",hide:"Ocultar"},waterflowkit:{title:"WaterFlowKit",subtitle:"Medición de flujo dual",pipe1:"Tubería 1",pipe2:"Tubería 2",currentFlow:"Flujo actual",totalConsumption:"Consumo total",flowRate:"Caudal",perHour:"por hora",noFlow:"Sin flujo",flowing:"Fluyendo",waterTemperature:"Temperatura del agua",showPipe1:"Mostrar tubería 1",showPipe2:"Mostrar tubería 2",showTemperature:"Mostrar temperatura",pipe1Name:"Nombre tubería 1",pipe2Name:"Nombre tubería 2"},waterp1:{title:"WaterP1MeterKit",water:"Agua",energy:"Energía",energyActive:"Energía activa",currentUsage:"Consumo de agua actual",leakDetection:"Detección de fugas",monitoringActivity:"Actividad de monitoreo",meter:"Medidor",currentPower:"Potencia actual",electricityToday:"Electricidad hoy",gasToday:"Gas hoy",waterLast24h:"Agua últimas 24 horas",max:"máx"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo de agua",dailyUsage:"Consumo diario",weeklyUsage:"Consumo semanal",monthlyUsage:"Consumo mensual",yearlyUsage:"Consumo anual",calibration:"Calibración",lastCalibration:"Última calibración",sinceLast:"desde calibración"},ultimatesensor:{title:"UltimateSensor",roomScore:"Puntuación de habitación",excellent:"Excelente",good:"Bueno",moderate:"Moderado",poor:"Malo",unhealthy:"No saludable",hazardous:"Peligroso",presence:"Presencia",detected:"Detectada",notDetected:"No detectada",targets:"Objetivos",co2Level:"Nivel de CO₂",vocIndex:"Índice COV",noxIndex:"Índice NOx",illuminance:"Iluminancia",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista de habitación",view2D:"2D",view3D:"3D",zoneOccupancy:"Ocupación de zona",zone:"Zona",recommendations:"Recomendaciones",ventilateNow:"¡Ventila ahora!",openWindow:"Abre una ventana",airQualityPoor:"La calidad del aire es mala",tooHumid:"Demasiado húmedo",tooDry:"Demasiado seco",tooCold:"Demasiado frío",tooWarm:"Demasiado caliente"},editor:{deviceId:"ID de dispositivo",selectDevice:"Seleccionar dispositivo",appearance:"Apariencia",showGraph:"Mostrar gráfico",showWater:"Mostrar agua",showEnergy:"Mostrar energía",graphType:"Tipo de gráfico",historyGraph:"Gráfico histórico",liveGraph:"Gráfico en vivo",displayOptions:"Opciones de visualización"}},it:{common:{loading:"Caricamento...",error:"Errore",unknown:"Sconosciuto",today:"Oggi",week:"Settimana",month:"Mese",year:"Anno",daily:"Giornaliero",weekly:"Settimanale",monthly:"Mensile",yearly:"Annuale",current:"Attuale",total:"Totale",temperature:"Temperatura",humidity:"Umidità",settings:"Impostazioni",save:"Salva",cancel:"Annulla",close:"Chiudi",edit:"Modifica",delete:"Elimina",add:"Aggiungi",name:"Nome",value:"Valore",unit:"Unità",active:"Attivo",inactive:"Inattivo",on:"Acceso",off:"Spento",yes:"Sì",no:"No",show:"Mostra",hide:"Nascondi"},waterflowkit:{title:"WaterFlowKit",subtitle:"Misurazione doppio flusso",pipe1:"Tubo 1",pipe2:"Tubo 2",currentFlow:"Flusso attuale",totalConsumption:"Consumo totale",flowRate:"Portata",perHour:"all'ora",noFlow:"Nessun flusso",flowing:"In flusso",waterTemperature:"Temperatura dell'acqua",showPipe1:"Mostra tubo 1",showPipe2:"Mostra tubo 2",showTemperature:"Mostra temperatura",pipe1Name:"Nome tubo 1",pipe2Name:"Nome tubo 2"},waterp1:{title:"WaterP1MeterKit",water:"Acqua",energy:"Energia",energyActive:"Energia attiva",currentUsage:"Consumo d'acqua attuale",leakDetection:"Rilevamento perdite",monitoringActivity:"Attività di monitoraggio",meter:"Contatore",currentPower:"Potenza attuale",electricityToday:"Elettricità oggi",gasToday:"Gas oggi",waterLast24h:"Acqua ultime 24 ore",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo d'acqua",dailyUsage:"Consumo giornaliero",weeklyUsage:"Consumo settimanale",monthlyUsage:"Consumo mensile",yearlyUsage:"Consumo annuale",calibration:"Calibrazione",lastCalibration:"Ultima calibrazione",sinceLast:"dalla calibrazione"},ultimatesensor:{title:"UltimateSensor",roomScore:"Punteggio stanza",excellent:"Eccellente",good:"Buono",moderate:"Moderato",poor:"Scarso",unhealthy:"Non salutare",hazardous:"Pericoloso",presence:"Presenza",detected:"Rilevata",notDetected:"Non rilevata",targets:"Obiettivi",co2Level:"Livello CO₂",vocIndex:"Indice COV",noxIndex:"Indice NOx",illuminance:"Illuminamento",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista stanza",view2D:"2D",view3D:"3D",zoneOccupancy:"Occupazione zona",zone:"Zona",recommendations:"Raccomandazioni",ventilateNow:"Ventila ora!",openWindow:"Apri una finestra",airQualityPoor:"La qualità dell'aria è scarsa",tooHumid:"Troppo umido",tooDry:"Troppo secco",tooCold:"Troppo freddo",tooWarm:"Troppo caldo"},editor:{deviceId:"ID dispositivo",selectDevice:"Seleziona dispositivo",appearance:"Aspetto",showGraph:"Mostra grafico",showWater:"Mostra acqua",showEnergy:"Mostra energia",graphType:"Tipo di grafico",historyGraph:"Grafico storico",liveGraph:"Grafico in tempo reale",displayOptions:"Opzioni di visualizzazione"}},pt:{common:{loading:"Carregando...",error:"Erro",unknown:"Desconhecido",today:"Hoje",week:"Semana",month:"Mês",year:"Ano",daily:"Diário",weekly:"Semanal",monthly:"Mensal",yearly:"Anual",current:"Atual",total:"Total",temperature:"Temperatura",humidity:"Umidade",settings:"Configurações",save:"Salvar",cancel:"Cancelar",close:"Fechar",edit:"Editar",delete:"Excluir",add:"Adicionar",name:"Nome",value:"Valor",unit:"Unidade",active:"Ativo",inactive:"Inativo",on:"Ligado",off:"Desligado",yes:"Sim",no:"Não",show:"Mostrar",hide:"Ocultar"},waterflowkit:{title:"WaterFlowKit",subtitle:"Medição de fluxo duplo",pipe1:"Tubo 1",pipe2:"Tubo 2",currentFlow:"Fluxo atual",totalConsumption:"Consumo total",flowRate:"Vazão",perHour:"por hora",noFlow:"Sem fluxo",flowing:"Fluindo",waterTemperature:"Temperatura da água",showPipe1:"Mostrar tubo 1",showPipe2:"Mostrar tubo 2",showTemperature:"Mostrar temperatura",pipe1Name:"Nome tubo 1",pipe2Name:"Nome tubo 2"},waterp1:{title:"WaterP1MeterKit",water:"Água",energy:"Energia",energyActive:"Energia ativa",currentUsage:"Consumo de água atual",leakDetection:"Detecção de vazamento",monitoringActivity:"Atividade de monitoramento",meter:"Medidor",currentPower:"Potência atual",electricityToday:"Eletricidade hoje",gasToday:"Gás hoje",waterLast24h:"Água últimas 24 horas",max:"máx"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo de água",dailyUsage:"Consumo diário",weeklyUsage:"Consumo semanal",monthlyUsage:"Consumo mensal",yearlyUsage:"Consumo anual",calibration:"Calibração",lastCalibration:"Última calibração",sinceLast:"desde calibração"},ultimatesensor:{title:"UltimateSensor",roomScore:"Pontuação do ambiente",excellent:"Excelente",good:"Bom",moderate:"Moderado",poor:"Ruim",unhealthy:"Não saudável",hazardous:"Perigoso",presence:"Presença",detected:"Detectada",notDetected:"Não detectada",targets:"Alvos",co2Level:"Nível de CO₂",vocIndex:"Índice COV",noxIndex:"Índice NOx",illuminance:"Iluminância",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista do ambiente",view2D:"2D",view3D:"3D",zoneOccupancy:"Ocupação da zona",zone:"Zona",recommendations:"Recomendações",ventilateNow:"Ventile agora!",openWindow:"Abra uma janela",airQualityPoor:"A qualidade do ar está ruim",tooHumid:"Muito úmido",tooDry:"Muito seco",tooCold:"Muito frio",tooWarm:"Muito quente"},editor:{deviceId:"ID do dispositivo",selectDevice:"Selecionar dispositivo",appearance:"Aparência",showGraph:"Mostrar gráfico",showWater:"Mostrar água",showEnergy:"Mostrar energia",graphType:"Tipo de gráfico",historyGraph:"Gráfico histórico",liveGraph:"Gráfico ao vivo",displayOptions:"Opções de exibição"}},pl:{common:{loading:"Ładowanie...",error:"Błąd",unknown:"Nieznany",today:"Dzisiaj",week:"Tydzień",month:"Miesiąc",year:"Rok",daily:"Dziennie",weekly:"Tygodniowo",monthly:"Miesięcznie",yearly:"Rocznie",current:"Bieżący",total:"Łącznie",temperature:"Temperatura",humidity:"Wilgotność",settings:"Ustawienia",save:"Zapisz",cancel:"Anuluj",close:"Zamknij",edit:"Edytuj",delete:"Usuń",add:"Dodaj",name:"Nazwa",value:"Wartość",unit:"Jednostka",active:"Aktywny",inactive:"Nieaktywny",on:"Włączony",off:"Wyłączony",yes:"Tak",no:"Nie",show:"Pokaż",hide:"Ukryj"},waterflowkit:{title:"WaterFlowKit",subtitle:"Podwójny pomiar przepływu",pipe1:"Rura 1",pipe2:"Rura 2",currentFlow:"Bieżący przepływ",totalConsumption:"Całkowite zużycie",flowRate:"Przepływ",perHour:"na godzinę",noFlow:"Brak przepływu",flowing:"Przepływa",waterTemperature:"Temperatura wody",showPipe1:"Pokaż rurę 1",showPipe2:"Pokaż rurę 2",showTemperature:"Pokaż temperaturę",pipe1Name:"Nazwa rury 1",pipe2Name:"Nazwa rury 2"},waterp1:{title:"WaterP1MeterKit",water:"Woda",energy:"Energia",energyActive:"Energia aktywna",currentUsage:"Bieżące zużycie wody",leakDetection:"Wykrywanie wycieków",monitoringActivity:"Aktywność monitorowania",meter:"Licznik",currentPower:"Bieżąca moc",electricityToday:"Prąd dzisiaj",gasToday:"Gaz dzisiaj",waterLast24h:"Woda ostatnie 24 godziny",max:"maks"},watermeter:{title:"WaterMeterKit",waterUsage:"Zużycie wody",dailyUsage:"Dzienne zużycie",weeklyUsage:"Tygodniowe zużycie",monthlyUsage:"Miesięczne zużycie",yearlyUsage:"Roczne zużycie",calibration:"Kalibracja",lastCalibration:"Ostatnia kalibracja",sinceLast:"od kalibracji"},ultimatesensor:{title:"UltimateSensor",roomScore:"Wynik pomieszczenia",excellent:"Doskonały",good:"Dobry",moderate:"Umiarkowany",poor:"Słaby",unhealthy:"Niezdrowy",hazardous:"Niebezpieczny",presence:"Obecność",detected:"Wykryta",notDetected:"Nie wykryta",targets:"Cele",co2Level:"Poziom CO₂",vocIndex:"Indeks LZO",noxIndex:"Indeks NOx",illuminance:"Natężenie oświetlenia",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Widok radaru",roomView:"Widok pomieszczenia",view2D:"2D",view3D:"3D",zoneOccupancy:"Zajętość strefy",zone:"Strefa",recommendations:"Zalecenia",ventilateNow:"Wietrz teraz!",openWindow:"Otwórz okno",airQualityPoor:"Jakość powietrza jest słaba",tooHumid:"Za wilgotno",tooDry:"Za sucho",tooCold:"Za zimno",tooWarm:"Za ciepło"},editor:{deviceId:"ID urządzenia",selectDevice:"Wybierz urządzenie",appearance:"Wygląd",showGraph:"Pokaż wykres",showWater:"Pokaż wodę",showEnergy:"Pokaż energię",graphType:"Typ wykresu",historyGraph:"Wykres historyczny",liveGraph:"Wykres na żywo",displayOptions:"Opcje wyświetlania"}}};let ze="en",Ce=Se;function Pe(e){return e&&function(e){const t=function(e){return e?(e.language||e.locale?.language||"en").split("-")[0].toLowerCase():"en"}(e);t!==ze&&(ze=t,Ce=Me[t]||Se)}(e),Ce}let De=class extends ce{constructor(){super(...arguments),this._config={}}setConfig(e){this._config={show_flow1:!0,show_flow2:!0,show_temperature:!0,...e}}getCardSize(){return 5}updated(e){super.updated(e),e.has("hass")&&this.hass&&!this._config.flow1_flow_entity&&this._autoDetectEntities()}_autoDetectEntities(){if(!this.hass)return;const e=Object.keys(this.hass.states),t={};for(const i of e){const e=i.toLowerCase();e.includes("waterflowkit")&&(e.includes("flow1")&&(e.includes("current")&&e.includes("usage")?t.flow1_flow_entity=i:e.includes("total")&&e.includes("consumption")?t.flow1_total_entity=i:e.includes("temperature")&&(t.flow1_temp_entity=i)),e.includes("flow2")&&(e.includes("current")&&e.includes("usage")?t.flow2_flow_entity=i:e.includes("total")&&e.includes("consumption")?t.flow2_total_entity=i:e.includes("temperature")&&(t.flow2_temp_entity=i)))}Object.keys(t).length>0&&(this._config={...this._config,...t},console.log("WaterFlowKit: Auto-detected entities:",t))}_getFlowData(e){const t=1===e?this._config.flow1_flow_entity:this._config.flow2_flow_entity,i=1===e?this._config.flow1_total_entity:this._config.flow2_total_entity,a=1===e?this._config.flow1_temp_entity:this._config.flow2_temp_entity,o=ve(this.hass,t)??0,s=ve(this.hass,i)??0,r=ve(this.hass,a),n=null!==r&&r>-10;return{flow:o,total:s,temp:n?r:null,hasTemp:n,isFlowing:o>.01}}_getTempClass(e){return null===e?"":e<20?"cold":e<40?"warm":"hot"}_getFlowSpeed(e){return e>5?"fast":e<1?"slow":""}render(){if(!this.hass)return Z;const e=Pe(this.hass),t=!1!==this._config.show_flow1,i=!1!==this._config.show_flow2,a=!1!==this._config.flow1_show_temp,o=!1!==this._config.flow2_show_temp,s=this._getFlowData(1),r=this._getFlowData(2),n=this._config.flow1_name||e.waterflowkit.pipe1,l=this._config.flow2_name||e.waterflowkit.pipe2,c=(t&&s.isFlowing?1:0)+(i&&r.isFlowing?1:0),d=(t?s.flow:0)+(i?r.flow:0);return G`
      <ha-card>
        <div class="card-content">
          <div class="header">
            <div class="header-left">
              <div class="header-icon ${c>0?"flowing":""}">
                <ha-icon icon="mdi:pipe"></ha-icon>
              </div>
              <div>
                <h2 class="header-title">${e.waterflowkit.title}</h2>
                <div class="header-subtitle">${e.waterflowkit.subtitle}</div>
              </div>
            </div>
            <div class="status-badge ${c>0?"flowing":"inactive"}">
              <ha-icon icon="${c>0?"mdi:water":"mdi:water-off"}"></ha-icon>
              <span>${c>0?`${_e(d,2)} L/min`:e.waterflowkit.noFlow}</span>
            </div>
          </div>

          <div class="pipe-container">
            ${this._renderPipesSVG(s,r,t,i,a,o)}
          </div>

          ${t?this._renderFlowCard(1,s,n,a):Z}
          ${i?this._renderFlowCard(2,r,l,o):Z}
        </div>
      </ha-card>
    `}_renderPipesSVG(e,i,a,o,s,r){const n=a&&e.isFlowing,l=o&&i.isFlowing,c=a&&o,d=35,h=c?105:35;return V`
      <svg class="pipes-svg" viewBox="0 0 360 ${c?140:70}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <!-- Water flow gradients -->
          <linearGradient id="waterGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:0.9" />
            <stop offset="50%" style="stop-color:#38bdf8;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0.9" />
          </linearGradient>
          <linearGradient id="waterGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.9" />
            <stop offset="50%" style="stop-color:#4ade80;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#22c55e;stop-opacity:0.9" />
          </linearGradient>
          <!-- Brass/copper gradient for sensor body -->
          <linearGradient id="brassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#d4a853" />
            <stop offset="50%" style="stop-color:#b8860b" />
            <stop offset="100%" style="stop-color:#8b6914" />
          </linearGradient>
          <!-- Pipe metallic gradient -->
          <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#64748b" />
            <stop offset="50%" style="stop-color:#475569" />
            <stop offset="100%" style="stop-color:#334155" />
          </linearGradient>
        </defs>

        <!-- Flow 1 -->
        ${a?V`
          <!-- Pipe -->
          <path class="pipe" d="M 0 ${d} L 360 ${d}" />
          <path class="pipe-inner" d="M 0 ${d} L 360 ${d}" />

          <!-- Animated water flow -->
          <path class="water-flow flow1 ${n?"active":""} ${this._getFlowSpeed(e.flow)}" d="M 0 ${d} L 360 ${d}" />

          <!-- Water bubbles animation when flowing -->
          ${n?V`
            <circle class="water-bubble" cx="80" cy="${d}" r="3" fill="#38bdf8" opacity="0.6">
              <animate attributeName="cx" from="80" to="360" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.8;0.4;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle class="water-bubble" cx="120" cy="${33}" r="2" fill="#7dd3fc" opacity="0.5">
              <animate attributeName="cx" from="120" to="400" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle class="water-bubble" cx="160" cy="${37}" r="2.5" fill="#38bdf8" opacity="0.5">
              <animate attributeName="cx" from="160" to="440" dur="2s" repeatCount="indefinite" />
            </circle>
          `:""}

          <!-- YF-Sensor SVG -->
          ${this._renderYFSensor(55,d,n,1)}

          <!-- Labels -->
          <text class="pipe-label" x="110" y="${20}">${(this._config.flow1_name||t.waterflowkit.pipe1).toUpperCase()}</text>
          <text class="pipe-value" x="220" y="${40}">${_e(e.flow,2)}</text>
          <text class="pipe-unit" x="265" y="${40}">L/min</text>
          ${s&&e.hasTemp?V`
            <text class="temp-badge ${this._getTempClass(e.temp)}" x="320" y="${40}">${_e(e.temp,1)}°C</text>
          `:""}
        `:""}

        <!-- Flow 2 -->
        ${o?V`
          <!-- Pipe -->
          <path class="pipe" d="M 0 ${h} L 360 ${h}" />
          <path class="pipe-inner" d="M 0 ${h} L 360 ${h}" />

          <!-- Animated water flow -->
          <path class="water-flow flow2 ${l?"active":""} ${this._getFlowSpeed(i.flow)}" d="M 0 ${h} L 360 ${h}" />

          <!-- Water bubbles animation when flowing -->
          ${l?V`
            <circle class="water-bubble" cx="90" cy="${h}" r="3" fill="#4ade80" opacity="0.6">
              <animate attributeName="cx" from="90" to="370" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.8;0.4;0.6" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle class="water-bubble" cx="140" cy="${h+2}" r="2" fill="#86efac" opacity="0.5">
              <animate attributeName="cx" from="140" to="420" dur="1.9s" repeatCount="indefinite" />
            </circle>
            <circle class="water-bubble" cx="180" cy="${h-2}" r="2.5" fill="#4ade80" opacity="0.5">
              <animate attributeName="cx" from="180" to="460" dur="2.1s" repeatCount="indefinite" />
            </circle>
          `:""}

          <!-- YF-Sensor SVG -->
          ${this._renderYFSensor(55,h,l,2)}

          <!-- Labels -->
          <text class="pipe-label" x="110" y="${h-15}">${(this._config.flow2_name||t.waterflowkit.pipe2).toUpperCase()}</text>
          <text class="pipe-value flow2" x="220" y="${h+5}">${_e(i.flow,2)}</text>
          <text class="pipe-unit" x="265" y="${h+5}">L/min</text>
          ${r&&i.hasTemp?V`
            <text class="temp-badge ${this._getTempClass(i.temp)}" x="320" y="${h+5}">${_e(i.temp,1)}°C</text>
          `:""}
        `:""}
      </svg>
    `}_renderYFSensor(e,t,i,a){const o=1===a?"#0ea5e9":"#22c55e";return V`
      <g transform="translate(${e-20}, ${t-12})">
        <!-- Left brass connector -->
        <rect x="0" y="6" width="8" height="12" rx="1" fill="url(#brassGradient)" />
        <rect x="1" y="7" width="6" height="10" rx="1" fill="#d4a853" opacity="0.3" />

        <!-- Main brass body -->
        <rect x="8" y="4" width="24" height="16" rx="2" fill="url(#brassGradient)" />
        <rect x="9" y="5" width="22" height="3" fill="#e8c36a" opacity="0.4" />

        <!-- Right brass connector -->
        <rect x="32" y="6" width="8" height="12" rx="1" fill="url(#brassGradient)" />
        <rect x="33" y="7" width="6" height="10" rx="1" fill="#d4a853" opacity="0.3" />

        <!-- Red sensor module on top -->
        <rect x="12" y="-4" width="16" height="10" rx="2" fill="${i?o:"#dc2626"}" />
        <rect x="13" y="-3" width="14" height="2" fill="${i?"#fff":"#ef4444"}" opacity="0.4" />

        <!-- Cable -->
        <path d="M 20 -4 Q 20 -10 25 -12 L 30 -12" stroke="#1e293b" stroke-width="2" fill="none" />
        <circle cx="30" cy="-12" r="2" fill="#374151" />

        <!-- Flow direction arrow inside -->
        <path d="M 14 12 L 22 12 L 20 9 M 22 12 L 20 15" stroke="#8b6914" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Active glow -->
        ${i?V`
          <rect x="12" y="-4" width="16" height="10" rx="2" fill="${o}" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1s" repeatCount="indefinite" />
          </rect>
        `:""}
      </g>
    `}_renderFlowCard(e,t,i,a){const o=Pe(this.hass),s=1===e?this._config.flow1_flow_entity:this._config.flow2_flow_entity,r=this._getTempClass(t.temp);return G`
      <div class="flow-card flow${e} ${t.isFlowing?"active":""}" @click=${()=>s&&ye(this,s)}>
        <div class="flow-card-header">
          <div class="flow-card-left">
            <div class="flow-icon flow${e}">
              <ha-icon icon="mdi:${t.isFlowing?"water":"water-off"}"></ha-icon>
            </div>
            <div>
              <div class="flow-name">${i}</div>
              <div class="flow-status ${t.isFlowing?"active":""}">${t.isFlowing?`● ${o.waterflowkit.flowing}`:`○ ${o.common.inactive}`}</div>
            </div>
          </div>
          <div class="flow-current">
            <span class="flow-value">${_e(t.flow,2)}</span>
            <span class="flow-unit">L/min</span>
          </div>
        </div>
        <div class="flow-card-stats">
          <div class="flow-stat">
            <div class="flow-stat-label">${o.waterflowkit.totalConsumption}</div>
            <div class="flow-stat-value">${_e(1e3*t.total,0)}</div>
            <div class="flow-stat-unit">liter</div>
          </div>
          ${a&&t.hasTemp?G`
            <div class="flow-stat">
              <div class="flow-stat-label">${o.common.temperature}</div>
              <div class="temp-display ${r}">
                <ha-icon icon="mdi:thermometer"></ha-icon>
                <span class="flow-stat-value">${_e(t.temp,1)}°C</span>
              </div>
            </div>
          `:G`
            <div class="flow-stat">
              <div class="flow-stat-label">Status</div>
              <div class="flow-stat-value">${t.isFlowing?o.common.active:o.common.off}</div>
            </div>
          `}
          <div class="flow-stat">
            <div class="flow-stat-label">${o.waterflowkit.flowRate}</div>
            <div class="flow-stat-value">${_e(60*t.flow,1)}</div>
            <div class="flow-stat-unit">L/h</div>
          </div>
        </div>
      </div>
    `}static getConfigElement(){return document.createElement("smarthomeshop-waterflowkit-card-editor")}static getStubConfig(){return{show_flow1:!0,show_flow2:!0,flow1_show_temp:!0,flow2_show_temp:!0,flow1_name:"Hot water",flow2_name:"Cold water"}}};De.styles=[xe,n`
      :host {
        display: block;
      }

      .card-content {
        padding: 16px;
      }

      /* Status badge styling for water flow */
      .status-badge.flowing {
        background: rgba(14, 165, 233, 0.15);
        color: #0ea5e9;
      }
      .status-badge.inactive {
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
      }

      /* Pipe visualization container */
      .pipe-container {
        position: relative;
        background: linear-gradient(180deg,
          rgba(15, 23, 42, 0.6) 0%,
          rgba(30, 41, 59, 0.4) 100%);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .pipes-svg {
        width: 100%;
        height: auto;
      }

      .pipe {
        fill: none;
        stroke: #475569;
        stroke-width: 16;
        stroke-linecap: round;
      }

      .pipe-inner {
        fill: none;
        stroke: #1e293b;
        stroke-width: 10;
        stroke-linecap: round;
      }

      .water-flow {
        fill: none;
        stroke-width: 8;
        stroke-linecap: round;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .water-flow.active {
        opacity: 1;
        stroke-dasharray: 16 8;
        animation: flowAnimation 0.6s linear infinite;
        filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.5));
      }

      .water-flow.flow1 { stroke: url(#waterGradient1); }
      .water-flow.flow2 {
        stroke: url(#waterGradient2);
        filter: drop-shadow(0 0 4px rgba(74, 222, 128, 0.5));
      }
      .water-flow.fast {
        animation-duration: 0.25s;
        stroke-dasharray: 20 6;
      }
      .water-flow.slow {
        animation-duration: 1s;
        stroke-dasharray: 10 12;
      }

      @keyframes flowAnimation {
        0% { stroke-dashoffset: 48; }
        100% { stroke-dashoffset: 0; }
      }

      .water-bubble {
        filter: blur(0.5px);
      }

      .pipe-label {
        font-family: 'Roboto', sans-serif;
        font-size: 10px;
        font-weight: 600;
        fill: var(--secondary-text-color);
      }

      .pipe-value {
        font-family: 'Roboto Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        fill: #0ea5e9;
      }

      .pipe-value.flow2 { fill: #22c55e; }
      .pipe-unit { font-size: 10px; fill: var(--secondary-text-color); opacity: 0.7; }
      .temp-badge { font-size: 11px; font-weight: 600; }
      .temp-badge.cold { fill: #38bdf8; }
      .temp-badge.warm { fill: #fbbf24; }
      .temp-badge.hot { fill: #ef4444; }

      /* Flow cards */
      .flow-card {
        background: var(--secondary-background-color);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }

      .flow-card:last-child { margin-bottom: 0; }
      .flow-card:hover {
        background: var(--primary-background-color);
        border-color: rgba(14, 165, 233, 0.3);
      }

      .flow-card.active {
        border-color: #0ea5e9;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%);
      }

      .flow-card.flow2.active {
        border-color: #22c55e;
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%);
      }

      .flow-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .flow-card-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .flow-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .flow-icon.flow1 { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); }
      .flow-icon.flow2 { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
      .flow-icon ha-icon { --mdc-icon-size: 22px; color: white; }

      .flow-name { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
      .flow-status { font-size: 11px; color: var(--secondary-text-color); opacity: 0.7; }
      .flow-status.active { color: #22c55e; opacity: 1; }

      .flow-current { text-align: right; }
      .flow-value { font-size: 24px; font-weight: 700; color: var(--primary-text-color); line-height: 1; }
      .flow-unit { font-size: 12px; color: var(--secondary-text-color); margin-left: 2px; }

      .flow-card-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }

      .flow-stat { text-align: center; }
      .flow-stat-label { font-size: 10px; color: var(--secondary-text-color); opacity: 0.7; margin-bottom: 4px; }
      .flow-stat-value { font-size: 16px; font-weight: 600; color: var(--primary-text-color); }
      .flow-stat-unit { font-size: 10px; color: var(--secondary-text-color); }

      .temp-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }

      .temp-display ha-icon { --mdc-icon-size: 16px; }
      .temp-display.cold ha-icon { color: #38bdf8; }
      .temp-display.warm ha-icon { color: #fbbf24; }
      .temp-display.hot ha-icon { color: #ef4444; }
    `],e([ue({attribute:!1})],De.prototype,"hass",void 0),e([me()],De.prototype,"_config",void 0),De=e([he("smarthomeshop-waterflowkit-card")],De);let Ee=class extends ce{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&this._findDevices()}_findDevices(){if(!this.hass?.devices||!this.hass?.entities)return;const e=[];for(const[t,i]of Object.entries(this.hass.devices)){const a=Object.entries(this.hass.entities).filter(([e,i])=>i.device_id===t).map(([e])=>e),o=a.some(e=>e.includes("flow1")),s=a.some(e=>e.includes("flow2"));(o||s)&&e.push({id:t,name:i.name||i.name_by_user||"WaterFlowKit"})}this._devices=e}_valueChanged(e,t){const i={...this._config,[e]:t};this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}_getFilteredEntities(e){return this.hass?.states?Object.keys(this.hass.states).filter(t=>t.startsWith("sensor.")&&e(t)).sort():[]}_getFlowEntities(){return this._getFilteredEntities(e=>e.includes("water")||e.includes("flow")||e.includes("usage"))}_getTotalEntities(){return this._getFilteredEntities(e=>e.includes("consumption")||e.includes("total")||e.includes("water"))}_getTempEntities(){return this._getFilteredEntities(e=>e.includes("temp")||e.includes("temperature"))}render(){const e=Pe(this.hass),t=this._getFlowEntities(),i=this._getTotalEntities(),a=this._getTempEntities();return G`
      <div class="info-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="info-banner-content">
          <div class="info-banner-title">WaterFlowKit</div>
          <div class="info-banner-text">
            ${e.waterflowkit.subtitle}. Configure each pipe individually below.
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Pipe 1 Section -->
      <div class="pipe-section">
        <div class="pipe-header">
          <div class="pipe-title flow1">
            <ha-icon icon="mdi:pipe"></ha-icon>
            ${e.waterflowkit.pipe1}
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_flow1"
              .checked=${!1!==this._config.show_flow1}
              @change=${e=>this._valueChanged("show_flow1",e.target.checked)} />
            <label for="show_flow1">${e.common.show}</label>
          </div>
        </div>
        <div class="form-row">
          <label>${e.common.name}</label>
          <input type="text"
            .value=${this._config.flow1_name||""}
            placeholder="Hot water"
            @input=${e=>this._valueChanged("flow1_name",e.target.value||void 0)} />
        </div>
        <div class="form-row">
          <label>Flow sensor</label>
          <select @change=${e=>this._valueChanged("flow1_flow_entity",e.target.value||void 0)}>
            <option value="">-- Select entity --</option>
            ${t.map(e=>G`
              <option value=${e} ?selected=${e===this._config.flow1_flow_entity}>${e}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <label>Total consumption sensor</label>
          <select @change=${e=>this._valueChanged("flow1_total_entity",e.target.value||void 0)}>
            <option value="">-- Select entity --</option>
            ${i.map(e=>G`
              <option value=${e} ?selected=${e===this._config.flow1_total_entity}>${e}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <div class="checkbox-row">
            <input type="checkbox" id="flow1_show_temp"
              .checked=${!1!==this._config.flow1_show_temp}
              @change=${e=>this._valueChanged("flow1_show_temp",e.target.checked)} />
            <label for="flow1_show_temp">${e.waterflowkit.showTemperature}</label>
          </div>
        </div>
        ${!1!==this._config.flow1_show_temp?G`
          <div class="form-row">
            <label>Temperature sensor</label>
            <select @change=${e=>this._valueChanged("flow1_temp_entity",e.target.value||void 0)}>
              <option value="">-- Select entity --</option>
              ${a.map(e=>G`
                <option value=${e} ?selected=${e===this._config.flow1_temp_entity}>${e}</option>
              `)}
            </select>
          </div>
        `:""}
      </div>

      <!-- Pipe 2 Section -->
      <div class="pipe-section">
        <div class="pipe-header">
          <div class="pipe-title flow2">
            <ha-icon icon="mdi:pipe"></ha-icon>
            ${e.waterflowkit.pipe2}
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_flow2"
              .checked=${!1!==this._config.show_flow2}
              @change=${e=>this._valueChanged("show_flow2",e.target.checked)} />
            <label for="show_flow2">${e.common.show}</label>
          </div>
        </div>
        <div class="form-row">
          <label>${e.common.name}</label>
          <input type="text"
            .value=${this._config.flow2_name||""}
            placeholder="Cold water"
            @input=${e=>this._valueChanged("flow2_name",e.target.value||void 0)} />
        </div>
        <div class="form-row">
          <label>Flow sensor</label>
          <select @change=${e=>this._valueChanged("flow2_flow_entity",e.target.value||void 0)}>
            <option value="">-- Select entity --</option>
            ${t.map(e=>G`
              <option value=${e} ?selected=${e===this._config.flow2_flow_entity}>${e}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <label>Total consumption sensor</label>
          <select @change=${e=>this._valueChanged("flow2_total_entity",e.target.value||void 0)}>
            <option value="">-- Select entity --</option>
            ${i.map(e=>G`
              <option value=${e} ?selected=${e===this._config.flow2_total_entity}>${e}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <div class="checkbox-row">
            <input type="checkbox" id="flow2_show_temp"
              .checked=${!1!==this._config.flow2_show_temp}
              @change=${e=>this._valueChanged("flow2_show_temp",e.target.checked)} />
            <label for="flow2_show_temp">${e.waterflowkit.showTemperature}</label>
          </div>
        </div>
        ${!1!==this._config.flow2_show_temp?G`
          <div class="form-row">
            <label>Temperature sensor</label>
            <select @change=${e=>this._valueChanged("flow2_temp_entity",e.target.value||void 0)}>
              <option value="">-- Select entity --</option>
              ${a.map(e=>G`
                <option value=${e} ?selected=${e===this._config.flow2_temp_entity}>${e}</option>
              `)}
            </select>
          </div>
        `:""}
      </div>
    `}};Ee.styles=n`
    .form-row {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
      color: var(--primary-text-color);
    }
    select, input[type='text'], input[type='number'] {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 14px;
      box-sizing: border-box;
    }
    select:focus, input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .checkbox-row input { width: 18px; height: 18px; }
    .checkbox-row label { margin-bottom: 0; font-weight: normal; }
    .info {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 8px;
    }
    .divider {
      height: 1px;
      background: var(--divider-color);
      margin: 16px 0;
    }
    .section-title {
      font-weight: 600;
      font-size: 14px;
      color: var(--primary-text-color);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title ha-icon {
      color: var(--primary-color);
      --mdc-icon-size: 20px;
    }
    .pipe-section {
      background: var(--secondary-background-color);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .pipe-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .pipe-title {
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pipe-title ha-icon {
      --mdc-icon-size: 20px;
    }
    .pipe-title.flow1 ha-icon { color: #0ea5e9; }
    .pipe-title.flow2 ha-icon { color: #22c55e; }
    .info-banner {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(6, 182, 212, 0.15));
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .info-banner ha-icon {
      color: #0ea5e9;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .info-banner-content { flex: 1; }
    .info-banner-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--primary-text-color);
    }
    .info-banner-text {
      font-size: 13px;
      color: var(--secondary-text-color);
      line-height: 1.4;
    }
  `,e([ue({attribute:!1})],Ee.prototype,"hass",void 0),e([me()],Ee.prototype,"_config",void 0),e([me()],Ee.prototype,"_devices",void 0),Ee=e([he("smarthomeshop-waterflowkit-card-editor")],Ee);let Ae=class extends ce{constructor(){super(...arguments),this.entityPrefix="",this.deviceName="",this.isOpen=!1,this._settings=[],this._zones=[],this._activeTab="mmwave",this._showZoneEditor=!1,this._loading=!1,this._saving=!1,this._pendingChanges=new Map}updated(e){e.has("isOpen")&&this.isOpen&&this._loadSettings()}_loadSettings(){if(!this.hass||!this.entityPrefix)return;this._loading=!0;const e=[],t=this.entityPrefix;[{suffix:"max_distance",name:"Max Afstand",unit:"mm",min:100,max:6e3,step:100}].forEach(i=>{const a=`number.${t}_${i.suffix}`,o=this.hass.states[a];o&&"unavailable"!==o.state&&e.push({entityId:a,name:i.name,value:parseFloat(o.state),min:i.min,max:i.max,step:i.step,unit:i.unit,group:"mmwave"})});[{suffix:"temperature_offset",name:"Temp Offset",unit:"°C",min:-10,max:10,step:.1},{suffix:"humidity_offset",name:"Humidity Offset",unit:"%",min:-20,max:20,step:1}].forEach(i=>{const a=`number.${t}_${i.suffix}`,o=this.hass.states[a];o&&"unavailable"!==o.state&&e.push({entityId:a,name:i.name,value:parseFloat(o.state),min:i.min,max:i.max,step:i.step,unit:i.unit,group:"calibration"})});const i=[];for(let e=1;e<=4;e++)i.push({id:e,beginX:this._getNum(`zone_${e}_begin_x`),endX:this._getNum(`zone_${e}_end_x`),beginY:this._getNum(`zone_${e}_begin_y`),endY:this._getNum(`zone_${e}_end_y`)});this._settings=e,this._zones=i,this._loading=!1}_getNum(e){const t=`number.${this.entityPrefix}_${e}`,i=this.hass?.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_handleChange(e,t){this._pendingChanges.set(e,t),this.requestUpdate()}async _saveChanges(){if(this.hass&&0!==this._pendingChanges.size){this._saving=!0;try{for(const[e,t]of this._pendingChanges)await this.hass.callService("number","set_value",{entity_id:e,value:t});this._pendingChanges.clear(),setTimeout(()=>this._loadSettings(),500)}catch(e){console.error("Save failed:",e)}finally{this._saving=!1}}}async _saveZone(e){if(this.hass){this._saving=!0;try{const t=this.entityPrefix;await Promise.all([this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_begin_x`,value:e.beginX}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_end_x`,value:e.endX}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_begin_y`,value:e.beginY}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_end_y`,value:e.endY})])}catch(e){console.error("Zone save failed:",e)}finally{this._saving=!1}}}_close(){this.dispatchEvent(new CustomEvent("close"))}_renderSetting(e){const t=this._pendingChanges.has(e.entityId)?this._pendingChanges.get(e.entityId):e.value;return G`
      <div class="setting-item">
        <div>
          <div class="setting-name">${e.name}</div>
          <div class="setting-value">${e.value}${e.unit?" "+e.unit:""}</div>
        </div>
        <div class="number-control">
          <button class="number-btn" @click=${()=>this._handleChange(e.entityId,Math.max(e.min,t-e.step))} ?disabled=${t<=e.min}>−</button>
          <input class="number-input" type="number" .value=${t.toString()} @change=${t=>this._handleChange(e.entityId,parseFloat(t.target.value))} />
          <button class="number-btn" @click=${()=>this._handleChange(e.entityId,Math.min(e.max,t+e.step))} ?disabled=${t>=e.max}>+</button>
          ${e.unit?G`<span class="number-unit">${e.unit}</span>`:Z}
        </div>
      </div>
    `}_renderZone(e){const t=0!==e.beginX||0!==e.endX||0!==e.beginY||0!==e.endY;return G`
      <div class="zone-editor">
        <div class="zone-header">
          <div class="zone-title">
            <ha-icon icon="mdi:vector-square"></ha-icon>
            Zone ${e.id}
            <span class="zone-badge ${t?"active":"inactive"}">${t?"Actief":"Leeg"}</span>
          </div>
          <button class="save-zone-btn" @click=${()=>this._saveZone(e)} ?disabled=${this._saving}>Opslaan</button>
        </div>
        <div class="zone-grid">
          <div class="zone-input-group">
            <label>Begin X (mm)</label>
            <input class="zone-input" type="number" .value=${e.beginX.toString()} @change=${t=>{e.beginX=parseFloat(t.target.value),this.requestUpdate()}} />
          </div>
          <div class="zone-input-group">
            <label>Eind X (mm)</label>
            <input class="zone-input" type="number" .value=${e.endX.toString()} @change=${t=>{e.endX=parseFloat(t.target.value),this.requestUpdate()}} />
          </div>
          <div class="zone-input-group">
            <label>Begin Y (mm)</label>
            <input class="zone-input" type="number" .value=${e.beginY.toString()} @change=${t=>{e.beginY=parseFloat(t.target.value),this.requestUpdate()}} />
          </div>
          <div class="zone-input-group">
            <label>Eind Y (mm)</label>
            <input class="zone-input" type="number" .value=${e.endY.toString()} @change=${t=>{e.endY=parseFloat(t.target.value),this.requestUpdate()}} />
          </div>
        </div>
      </div>
    `}render(){if(!this.isOpen)return Z;const e=this._settings.filter(e=>"mmwave"===e.group),t=this._settings.filter(e=>"calibration"===e.group);return G`
      <div class="modal-overlay" @click=${e=>e.target===e.currentTarget&&this._close()}>
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              <ha-icon icon="mdi:cog"></ha-icon>
              ${this.deviceName||"Sensor"} Instellingen
            </div>
            <button class="close-btn" @click=${this._close}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>

          <div class="tabs">
            <button class="tab ${"mmwave"===this._activeTab?"active":""}" @click=${()=>this._activeTab="mmwave"}>
              <ha-icon icon="mdi:radar"></ha-icon> mmWave
            </button>
            <button class="tab ${"zones"===this._activeTab?"active":""}" @click=${()=>this._activeTab="zones"}>
              <ha-icon icon="mdi:vector-square"></ha-icon> Zones
            </button>
            <button class="tab ${"calibration"===this._activeTab?"active":""}" @click=${()=>this._activeTab="calibration"}>
              <ha-icon icon="mdi:tune"></ha-icon> Calibratie
            </button>
          </div>

          <div class="modal-content">
            ${"mmwave"===this._activeTab?G`
              ${e.length>0?G`
                <div class="group-title"><ha-icon icon="mdi:radar"></ha-icon> Radar Instellingen</div>
                ${e.map(e=>this._renderSetting(e))}
              `:G`<div class="empty-state">Geen mmWave instellingen gevonden</div>`}
            `:Z}

            ${"zones"===this._activeTab?G`
              <div class="group-title"><ha-icon icon="mdi:vector-square"></ha-icon> Zone Configuratie</div>
              <button class="btn btn-primary" style="width: 100%; margin-bottom: 16px; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" @click=${()=>this._showZoneEditor=!0}>
                <ha-icon icon="mdi:pencil-ruler"></ha-icon> Open Visuele Editor
              </button>
              ${this._zones.map(e=>this._renderZone(e))}
            `:Z}

            ${"calibration"===this._activeTab?G`
              ${t.length>0?G`
                <div class="group-title"><ha-icon icon="mdi:tune"></ha-icon> Sensor Calibratie</div>
                ${t.map(e=>this._renderSetting(e))}
              `:G`<div class="empty-state">Geen calibratie instellingen gevonden</div>`}
            `:Z}
          </div>

          <div class="modal-footer">
            <div class="changes-badge">
              ${this._pendingChanges.size>0?G`<ha-icon icon="mdi:alert-circle"></ha-icon> ${this._pendingChanges.size} wijzigingen`:Z}
            </div>
            <div>
              <button class="btn btn-secondary" @click=${this._close}>Sluiten</button>
              <button class="btn btn-primary" @click=${this._saveChanges} ?disabled=${0===this._pendingChanges.size||this._saving}>
                ${this._saving?"Opslaan...":"Opslaan"}
              </button>
            </div>
          </div>
        </div>
      </div>

        <smarthomeshop-zone-editor
          .hass=${this.hass}
          .entityPrefix=${this.entityPrefix}
          .deviceName=${this.deviceName}
          .isOpen=${this._showZoneEditor}
          @close=${()=>{this._showZoneEditor=!1,this._loadSettings()}}
        ></smarthomeshop-zone-editor>
    `}};Ae.styles=n`
    :host { display: block; }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: var(--card-background-color, #1c1c1c);
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .close-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 32px; height: 32px;
      border-radius: 50%;
      cursor: pointer;
    }

    .tabs {
      display: flex;
      gap: 4px;
      padding: 10px 16px;
      background: var(--secondary-background-color, #2a2a2a);
      border-bottom: 1px solid var(--divider-color, #333);
    }

    .tab {
      padding: 8px 14px;
      border-radius: 6px;
      background: transparent;
      border: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tab:hover { background: var(--divider-color, #333); }
    .tab.active { background: var(--primary-color, #9c27b0); color: white; }
    .tab ha-icon { --mdc-icon-size: 16px; }

    .modal-content {
      padding: 16px;
      overflow-y: auto;
      max-height: calc(80vh - 180px);
    }

    .group-title {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--secondary-text-color);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: var(--secondary-background-color, #2a2a2a);
      border-radius: 10px;
      margin-bottom: 8px;
    }

    .setting-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .setting-value {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
    }

    .number-control {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--card-background-color, #1c1c1c);
      border-radius: 6px;
      padding: 3px;
    }

    .number-btn {
      width: 28px; height: 28px;
      border: none;
      background: var(--primary-color, #9c27b0);
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1.1rem;
    }

    .number-btn:disabled { opacity: 0.3; }

    .number-input {
      width: 60px;
      text-align: center;
      border: none;
      background: transparent;
      color: var(--primary-text-color);
      font-size: 0.85rem;
      font-weight: 600;
    }

    .number-unit {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
      margin-left: 4px;
    }

    .zone-editor {
      background: var(--secondary-background-color, #2a2a2a);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
    }

    .zone-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .zone-title {
      font-weight: 600;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zone-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 600;
    }

    .zone-badge.active { background: rgba(76,175,80,0.2); color: #4caf50; }
    .zone-badge.inactive { background: rgba(158,158,158,0.2); color: #9e9e9e; }

    .zone-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .zone-input-group label {
      display: block;
      font-size: 0.65rem;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }

    .zone-input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid var(--divider-color, #333);
      border-radius: 4px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.85rem;
      box-sizing: border-box;
    }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-top: 1px solid var(--divider-color, #333);
      background: var(--secondary-background-color);
    }

    .changes-badge {
      font-size: 0.75rem;
      color: #ff9800;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }

    .btn-secondary {
      background: var(--divider-color, #333);
      color: var(--primary-text-color);
    }

    .btn-primary {
      background: var(--primary-color, #9c27b0);
      color: white;
      margin-left: 8px;
    }

    .btn-primary:disabled { opacity: 0.5; }

    .empty-state {
      text-align: center;
      padding: 30px;
      color: var(--secondary-text-color);
    }

    .save-zone-btn {
      padding: 4px 10px;
      font-size: 0.7rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `,e([ue({attribute:!1})],Ae.prototype,"hass",void 0),e([ue()],Ae.prototype,"entityPrefix",void 0),e([ue()],Ae.prototype,"deviceName",void 0),e([ue({type:Boolean})],Ae.prototype,"isOpen",void 0),e([me()],Ae.prototype,"_settings",void 0),e([me()],Ae.prototype,"_zones",void 0),e([me()],Ae.prototype,"_activeTab",void 0),e([me()],Ae.prototype,"_showZoneEditor",void 0),e([me()],Ae.prototype,"_loading",void 0),e([me()],Ae.prototype,"_saving",void 0),e([me()],Ae.prototype,"_pendingChanges",void 0),Ae=e([he("smarthomeshop-sensor-settings")],Ae);let Te=class extends ce{constructor(){super(...arguments),this._config={},this._targets=[],this._zones=[],this._environment={temperature:null,humidity:null,co2:null,illuminance:null,voc:null,nox:null,pm1_0:null,pm2_5:null,pm4_0:null,pm10:null,typical_particle_size:null},this._entityPrefix="",this._deviceName="",this._entityIds={targets:[]},this._showSettings=!1,this._viewMode="radar",this._rooms=[],this._selectedRoomId=null,this._roomViewMode="2d",this._camera3d={azimuth:-45,elevation:30,distance:8e3,targetX:0,targetY:0,targetZ:1e3},this._isDragging3D=!1,this._lastMouseX=0,this._lastMouseY=0,this._roomsLoaded=!1,this._on3DMouseDown=e=>{this._isDragging3D=!0,this._lastMouseX=e.clientX,this._lastMouseY=e.clientY},this._on3DMouseMove=e=>{if(!this._isDragging3D)return;const t=e.clientX-this._lastMouseX,i=e.clientY-this._lastMouseY;this._lastMouseX=e.clientX,this._lastMouseY=e.clientY,this._camera3d.azimuth+=.5*t,this._camera3d.elevation=Math.max(5,Math.min(85,this._camera3d.elevation+.5*i)),this._render3DView()},this._on3DMouseUp=()=>{this._isDragging3D=!1},this._on3DWheel=e=>{e.preventDefault();const t=e.deltaY>0?1.1:.9;this._camera3d.distance=Math.max(2e3,Math.min(2e4,this._camera3d.distance*t)),this._render3DView()}}_fireMoreInfo(e){if(!e)return;const t=new CustomEvent("hass-more-info",{detail:{entityId:e},bubbles:!0,composed:!0});this.dispatchEvent(t)}static getConfigElement(){return document.createElement("smarthomeshop-ultimatesensor-card-editor")}static getStubConfig(){return{max_distance:6e3,show_radar:!0,show_environment:!0,show_zones:!0,show_grid:!0}}setConfig(e){this._config={max_distance:6e3,show_radar:!0,show_environment:!0,show_zones:!0,show_grid:!0,...e}}getCardSize(){return 6}connectedCallback(){super.connectedCallback(),this._startUpdates()}disconnectedCallback(){super.disconnectedCallback(),this._stopUpdates()}_startUpdates(){this._updateData(),this._updateInterval=window.setInterval(()=>this._updateData(),1e3)}async _loadRooms(){if(this.hass)if(this._roomsLoaded)console.debug("SmartHomeShop: Rooms already loaded, skipping");else try{console.debug("SmartHomeShop: Loading rooms via WebSocket...");const e=await this.hass.callWS({type:"smarthomeshop/rooms"});console.debug("SmartHomeShop: WebSocket result:",e),this._rooms=Array.isArray(e?.rooms)?e.rooms:[],this._rooms.length>0&&!this._selectedRoomId&&(this._selectedRoomId=this._rooms[0]?.id||null,console.debug("SmartHomeShop: Auto-selected room:",this._selectedRoomId)),this._roomsLoaded=!0,console.info("SmartHomeShop: Loaded",this._rooms.length,"rooms:",this._rooms.map(e=>e.name).join(", "))}catch(e){console.error("SmartHomeShop: Could not load rooms:",e),this._rooms=[]}else console.debug("SmartHomeShop: _loadRooms called but hass not available")}_stopUpdates(){this._updateInterval&&clearInterval(this._updateInterval)}updated(e){super.updated(e),this.hass&&!this._roomsLoaded&&this._loadRooms(),(e.has("hass")||e.has("_config"))&&this._detectEntityPrefix(),(e.has("_targets")||e.has("_zones"))&&(this._drawRadar(),"room"===this._config.view_mode&&"3d"===this._roomViewMode&&this._render3DView()),e.has("_roomViewMode")&&"3d"===this._roomViewMode&&setTimeout(()=>this._render3DView(),50)}firstUpdated(){this._drawRadar(),this.hass&&!this._roomsLoaded&&this._loadRooms()}_detectEntityPrefix(){if(this.hass){if(this._config.device_id){const e=this._getEntitiesForDevice(this._config.device_id).find(e=>e.includes("target_1_x"));if(e){const t=e.match(/^sensor\.(.+)_target_1_x$/);if(t){this._entityPrefix=t[1];const e=this.hass.devices?.[this._config.device_id];return void(this._deviceName=e?.name||"UltimateSensor")}}}if(this._config.entity_prefix)return this._entityPrefix=this._config.entity_prefix,void(this._deviceName=this._config.title||"UltimateSensor");for(const e of Object.keys(this.hass.states))if(e.includes("target_1_x")&&e.startsWith("sensor.")){const t=e.match(/^sensor\.(.+)_target_1_x$/);if(t)return this._entityPrefix=t[1],void(this._deviceName="UltimateSensor")}}}_getEntitiesForDevice(e){return this.hass?.entities?Object.entries(this.hass.entities).filter(([t,i])=>i.device_id===e).map(([e])=>e):[]}_getSensorState(e){if(!this.hass||!this._entityPrefix)return null;const t=`sensor.${this._entityPrefix}_${e}`,i=this.hass.states[t]?.state;return i&&"unavailable"!==i&&"unknown"!==i?parseFloat(i):null}_findSensorEntityId(e){if(this.hass&&this._entityPrefix)for(const t of e){const e=`sensor.${this._entityPrefix}_${t}`,i=this.hass.states[e]?.state;if(i&&"unavailable"!==i&&"unknown"!==i)return e}}_getNumberState(e){if(!this.hass||!this._entityPrefix)return 0;const t=`number.${this._entityPrefix}_${e}`,i=this.hass.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_getBinaryState(e){if(!this.hass||!this._entityPrefix)return!1;const t=`binary_sensor.${this._entityPrefix}_${e}`;return"on"===this.hass.states[t]?.state}_updateData(){if(!this.hass||!this._entityPrefix)return;const e=[];for(let t=1;t<=3;t++){const i=this._getSensorState(`target_${t}_x`)??0,a=this._getSensorState(`target_${t}_y`)??0,o=this._getBinaryState(`target_${t}_active`),s=this._getSensorState(`target_${t}_distance`)??0;e.push({x:i,y:a,active:o,distance:s})}this._targets=e;const t=[];for(let e=1;e<=4;e++){const i=this._getNumberState(`zone_${e}_begin_x`),a=this._getNumberState(`zone_${e}_begin_y`),o=this._getNumberState(`zone_${e}_end_x`),s=this._getNumberState(`zone_${e}_end_y`);0===i&&0===a&&0===o&&0===s||t.push({beginX:i,beginY:a,endX:o,endY:s})}this._zones=t,this._environment={temperature:this._getSensorState("scd41_temperature")??this._getSensorState("temperature")??this._getSensorState("bme280_temperature"),humidity:this._getSensorState("scd41_humidity")??this._getSensorState("humidity")??this._getSensorState("bme280_humidity"),co2:this._getSensorState("scd41_co2")??this._getSensorState("co2"),illuminance:this._getSensorState("bh1750_illuminance")??this._getSensorState("illuminance"),voc:this._getSensorState("voc_index")??this._getSensorState("sgp41_voc_index")??this._getSensorState("sgp30_voc")??this._getSensorState("voc"),nox:this._getSensorState("nox_index")??this._getSensorState("sgp41_nox_index"),pm1_0:this._getSensorState("pm_1mm_weight_concentration")??this._getSensorState("pm_1_0"),pm2_5:this._getSensorState("pm_2_5mm_weight_concentration")??this._getSensorState("pm_2_5"),pm4_0:this._getSensorState("pm_4mm_weight_concentration")??this._getSensorState("pm_4_0"),pm10:this._getSensorState("pm_10mm_weight_concentration")??this._getSensorState("pm_10"),typical_particle_size:this._getSensorState("typical_particle_size")},this._entityIds={temperature:this._findSensorEntityId(["scd41_temperature","temperature","bme280_temperature"]),humidity:this._findSensorEntityId(["scd41_humidity","humidity","bme280_humidity"]),co2:this._findSensorEntityId(["scd41_co2","co2"]),illuminance:this._findSensorEntityId(["bh1750_illuminance","illuminance"]),voc:this._findSensorEntityId(["voc_index","sgp41_voc_index","sgp30_voc","voc"]),nox:this._findSensorEntityId(["nox_index","sgp41_nox_index"]),pm1_0:this._findSensorEntityId(["pm_1mm_weight_concentration","pm_1_0"]),pm2_5:this._findSensorEntityId(["pm_2_5mm_weight_concentration","pm_2_5"]),pm4_0:this._findSensorEntityId(["pm_4mm_weight_concentration","pm_4_0"]),pm10:this._findSensorEntityId(["pm_10mm_weight_concentration","pm_10"]),typical_particle_size:this._findSensorEntityId(["typical_particle_size"]),targets:[`sensor.${this._entityPrefix}_target_1_distance`,`sensor.${this._entityPrefix}_target_2_distance`,`sensor.${this._entityPrefix}_target_3_distance`]},this._drawRadar()}_drawRadar(){const e=this.shadowRoot?.querySelector(".radar-canvas");if(!e)return;const t=e.getContext("2d");if(!t)return;const i=e.getBoundingClientRect();if(i.width<10||i.height<50)return;const a=window.devicePixelRatio||1;e.width=i.width*a,e.height=i.height*a,t.scale(a,a);const o=i.width,s=i.height,r=o/2,n=s-25,l=this._config.max_distance||6e3,c=Math.max(.001,(s-50)/l);if(t.clearRect(0,0,o,s),!1!==this._config.show_grid){t.strokeStyle="rgba(255, 255, 255, 0.1)",t.lineWidth=1,t.setLineDash([5,5]);for(let e=1e3;e<=l;e+=1e3){const i=e*c;t.beginPath(),t.arc(r,n,i,Math.PI,2*Math.PI),t.stroke()}t.beginPath(),t.moveTo(r,n),t.lineTo(r,10),t.stroke(),t.setLineDash([])}const d=120*Math.PI/180,h=l*c;t.beginPath(),t.moveTo(r,n),t.arc(r,n,h,Math.PI+(Math.PI-d)/2,Math.PI+(Math.PI+d)/2),t.closePath();const p=t.createRadialGradient(r,n,0,r,n,h);if(p.addColorStop(0,"rgba(100, 180, 255, 0.3)"),p.addColorStop(1,"rgba(100, 180, 255, 0.05)"),t.fillStyle=p,t.fill(),t.strokeStyle="rgba(100, 180, 255, 0.5)",t.lineWidth=2,t.stroke(),!1!==this._config.show_zones){const e=["rgba(76, 175, 80, 0.3)","rgba(33, 150, 243, 0.3)","rgba(255, 152, 0, 0.3)","rgba(156, 39, 176, 0.3)"];this._zones.forEach((i,a)=>{const o=r+i.beginX*c,s=n-i.beginY*c,l=r+i.endX*c,d=n-i.endY*c,h=Math.min(o,l),p=Math.min(s,d),g=Math.abs(l-o),u=Math.abs(d-s);if(g>5&&u>5){t.fillStyle=e[a%e.length],t.strokeStyle=e[a%e.length].replace("0.3","0.8"),t.lineWidth=2,t.beginPath();const i=Math.min(4,g/2,u/2);t.roundRect(h,p,g,u,Math.max(0,i)),t.fill(),t.stroke()}})}const g=["#e91e63","#9c27b0","#3f51b5"];this._targets.forEach((e,i)=>{if(!e.active||0===e.x&&0===e.y)return;const a=r+e.x*c,o=n-e.y*c,s=g[i%g.length];t.beginPath(),t.arc(a,o,20,0,2*Math.PI);const l=t.createRadialGradient(a,o,0,a,o,20);l.addColorStop(0,s.replace(")",", 0.4)").replace("rgb","rgba")),l.addColorStop(1,"transparent"),t.fillStyle=l,t.fill(),t.beginPath(),t.arc(a,o,10,0,2*Math.PI),t.fillStyle=s,t.fill(),t.strokeStyle="white",t.lineWidth=2,t.stroke(),t.beginPath(),t.arc(a,o,3,0,2*Math.PI),t.fillStyle="white",t.fill()}),t.fillStyle="#2196f3",t.beginPath(),t.arc(r,n,8,0,2*Math.PI),t.fill(),t.fillStyle="rgba(255, 255, 255, 0.6)",t.font="10px sans-serif",t.textAlign="center",t.fillText("SENSOR",r,n+18),t.fillStyle="rgba(255, 255, 255, 0.5)",t.font="10px sans-serif",t.textAlign="right";for(let e=1;e<=l/1e3;e++){const i=n-1e3*e*c;t.fillText(`${e}m`,o-8,i+4)}}_renderRoomView(){const e=G`
      <div class="room-view-header">
        <div class="room-view-toggle">
          <button class="${"2d"===this._roomViewMode?"active":""}" @click=${()=>this._setRoomViewMode("2d")}>2D</button>
          <button class="${"3d"===this._roomViewMode?"active":""}" @click=${()=>this._setRoomViewMode("3d")}>3D</button>
        </div>
      </div>
    `,t=this._rooms.find(e=>e.id===this._selectedRoomId),i=t?.walls||[],a=i.filter(e=>"number"==typeof e?.x1&&"number"==typeof e?.y1).map(e=>({x:e.x1/1e3,y:e.y1/1e3}));console.debug("SmartHomeShop: _renderRoomView",{selectedRoomId:this._selectedRoomId,wallSegments:i.length,cornerPoints:a.length,room:t?.name});const o=a.length>=3;if(!t||!o)return this._roomsLoaded&&this._rooms.length>0&&console.warn("SmartHomeShop: Room validation failed",{roomName:t?.name,wallSegmentsCount:i.length,cornerPointsCount:a.length}),G`
        ${e}
        <div class="no-room-message">
          <ha-icon icon="mdi:floor-plan"></ha-icon>
          <div>${this._roomsLoaded?"Geen kamer geconfigureerd":"Kamers laden..."}</div>
          ${this._roomsLoaded?G`
            <div style="font-size: 0.8rem; margin-top: 8px;">
              Maak eerst een kamer aan in het SmartHomeShop panel
            </div>
          `:Z}
        </div>
      `;const s=a.map(e=>e.x).filter(e=>!isNaN(e)),r=a.map(e=>e.y).filter(e=>!isNaN(e));if(0===s.length||0===r.length)return G`
        <div class="no-room-message">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <div>Ongeldige kamer data</div>
        </div>
      `;const n=Math.min(...s),l=Math.max(...s),c=Math.min(...r),d=Math.max(...r),h=.5,p=n-h,g=c-h,u=(l-n||1)+1,m=(d-c||1)+1;console.debug("SmartHomeShop: ViewBox",{viewMinX:p,viewMinY:g,viewWidth:u,viewHeight:m,minX:n,maxX:l,minY:c,maxY:d});const f=a.map((e,t)=>`${0===t?"M":"L"} ${e.x} ${e.y}`).join(" ")+" Z",v=t.sensor?.x?t.sensor.x/1e3:(n+l)/2,_=t.sensor?.y?t.sensor.y/1e3:c+.5,y=t.sensor?.rotation??270,b=(t.sensor?.range??6e3)/1e3,w=t.sensor?.fov??120,x=isNaN(v)?(n+l)/2:v,k=isNaN(_)?c+.5:_,$=this._targets.filter(e=>e.active||0!==e.x||0!==e.y);console.debug("SmartHomeShop: Room targets:",JSON.stringify(this._targets),"Active/visible:",$.length);const S=(y-90)*Math.PI/180,M=w/2*Math.PI/180,z=Math.min(b,3),C=S-M,P=S+M;if("3d"===this._roomViewMode)return G`
        ${e}
        <canvas class="canvas-3d"
          @mousedown=${this._on3DMouseDown}
          @mousemove=${this._on3DMouseMove}
          @mouseup=${this._on3DMouseUp}
          @mouseleave=${this._on3DMouseUp}
          @wheel=${this._on3DWheel}
        ></canvas>
      `;const D=[];for(let e=0;e<=32;e++){const t=C+e/32*(P-C);D.push(`${x+Math.cos(t)*z},${k+Math.sin(t)*z}`)}const E=`M ${x} ${k} L ${D.join(" L ")} Z`;return G`
      ${e}
      <svg viewBox="${p} ${g} ${u} ${m}"
           style="width: 100%; height: 300px; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 12px;">
        <defs>
          <pattern id="room-grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgba(71, 85, 105, 0.3)" stroke-width="0.01"/>
          </pattern>
          <marker id="arrow-in" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e"/>
          </marker>
          <marker id="arrow-out" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444"/>
          </marker>
        </defs>
        <rect x="${p}" y="${g}" width="${u}" height="${m}" fill="url(#room-grid)"/>
        <!-- Room walls - same style as zones-page -->
        <path d="${f}" fill="rgba(249, 115, 22, 0.08)" stroke="#475569" stroke-width="0.04"/>
        <!-- Sensor FOV - same style as zones-page (arc instead of triangle) -->
        <path d="${E}" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="0.015"/>
        <!-- Zones from room configuration -->
        ${(()=>{const e=t.zones||[];return console.log("SmartHomeShop: Rendering zones count:",e.length,"entry lines:",e.filter(e=>"entry"===e.type).length),e.map(e=>{if(!e.points||e.points.length<2)return Z;if("entry"===e.type&&2===e.points.length){const t=e.points[0].x/1e3,i=e.points[0].y/1e3,a=e.points[1].x/1e3,o=e.points[1].y/1e3,s=(t+a)/2,r=(i+o)/2,n=a-t,l=o-i,c=Math.sqrt(n*n+l*l);if(c<.01)return Z;const d=-l/c,h=n/c,p="left"===(e.inDirection||"left")?1:-1,g=.12,u=.02,m=s+d*p*(g+u),f=r+h*p*(g+u),v=s-d*p*(g+u),_=r-h*p*(g+u);return V`
                <line x1="${t}" y1="${i}" x2="${a}" y2="${o}" stroke="#10b981" stroke-width="0.04" stroke-linecap="round"/>
                <line x1="${m}" y1="${f}" x2="${s-d*p*u}" y2="${r-h*p*u}" stroke="#22c55e" stroke-width="0.025" marker-end="url(#arrow-in)"/>
                <line x1="${v}" y1="${_}" x2="${s+d*p*u}" y2="${r+h*p*u}" stroke="#ef4444" stroke-width="0.025" marker-end="url(#arrow-out)"/>
                <text x="${m+d*p*.05}" y="${f+h*p*.05+.025}" fill="#22c55e" font-size="0.07" text-anchor="middle" font-weight="bold">IN</text>
                <text x="${v-d*p*.05}" y="${_-h*p*.05+.025}" fill="#ef4444" font-size="0.07" text-anchor="middle" font-weight="bold">UIT</text>
              `}if(e.points.length<3)return Z;const t=e.points.map((e,t)=>`${0===t?"M":"L"} ${e.x/1e3} ${e.y/1e3}`).join(" ")+" Z",i="detection"===e.type;return V`
              <path d="${t}" fill="none" stroke="${i?"#22c55e":"#ef4444"}" stroke-width="0.025"/>
            `})})()}
        <!-- Doors - same style as zones-page (purple) -->
        ${(()=>{const e=t.doors||[],i=a;return i.length<3?Z:e.map(e=>{if(e.wallIndex>=i.length)return Z;const t=i[e.wallIndex],a=i[(e.wallIndex+1)%i.length],o=t.x+(a.x-t.x)*e.position,s=t.y+(a.y-t.y)*e.position,r=Math.atan2(a.y-t.y,a.x-t.x),n=(e.width||800)/1e3/2;return V`
              <line
                x1="${o-Math.cos(r)*n}"
                y1="${s-Math.sin(r)*n}"
                x2="${o+Math.cos(r)*n}"
                y2="${s+Math.sin(r)*n}"
                stroke="#a855f7" stroke-width="0.06" stroke-linecap="round"
              />
            `})})()}
        <!-- Windows - same style as zones-page (light blue) -->
        ${(()=>{const e=t.windows||[],i=a;return i.length<3?Z:e.map(e=>{if(e.wallIndex>=i.length)return Z;const t=i[e.wallIndex],a=i[(e.wallIndex+1)%i.length],o=t.x+(a.x-t.x)*e.position,s=t.y+(a.y-t.y)*e.position,r=Math.atan2(a.y-t.y,a.x-t.x),n=(e.width||1e3)/1e3/2;return V`
              <line
                x1="${o-Math.cos(r)*n}"
                y1="${s-Math.sin(r)*n}"
                x2="${o+Math.cos(r)*n}"
                y2="${s+Math.sin(r)*n}"
                stroke="#0ea5e9" stroke-width="0.06" stroke-linecap="round"
              />
            `})})()}
        <!-- Furniture - same style as zones-page (gray) -->
        ${(()=>{const e=(t.furniture||[]).filter(e=>"number"==typeof e?.x&&"number"==typeof e?.y&&e?.width&&e?.height);return e.map(e=>{const t=e.x/1e3,i=e.y/1e3,a=e.width/1e3,o=e.height/1e3,s=e.rotation||0;return V`
                <g transform="translate(${t}, ${i}) rotate(${s})">
                  <rect x="${-a/2}" y="${-o/2}" width="${a}" height="${o}"
                        fill="#334155" stroke="#475569" stroke-width="0.02" rx="0.03"/>
                </g>
              `})})()}
        <!-- Sensor icon - same style as zones-page -->
        <circle cx="${x}" cy="${k}" r="0.15" fill="#3b82f6" stroke="#1d4ed8" stroke-width="0.02"/>
        <!-- Sensor direction indicator -->
        <line x1="${x}" y1="${k}"
              x2="${x+.2*Math.cos(S)}" y2="${k+.2*Math.sin(S)}"
              stroke="white" stroke-width="0.04" stroke-linecap="round"/>
        <!-- Targets - same style as zones-page (white circle with colored border) -->
        ${(()=>{const e=["#ef4444","#f97316","#eab308"];return $.map((t,i)=>{const a=t.x/1e3,o=t.y/1e3,s=x+o*Math.cos(S)-a*Math.sin(S),r=k+o*Math.sin(S)+a*Math.cos(S);if(isNaN(s)||isNaN(r))return Z;const n=e[i]||"#ef4444";return V`
              <g class="live-target">
                <!-- Outer ring with animation -->
                <circle cx="${s}" cy="${r}" r="0.15" fill="none" stroke="${n}" stroke-width="0.01" opacity="0.6">
                  <animate attributeName="r" values="0.15;0.25;0.15" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <!-- Main circle - white fill with colored border -->
                <circle cx="${s}" cy="${r}" r="0.1" fill="white" stroke="${n}" stroke-width="0.025"/>
                <!-- Number label - colored text -->
                <text x="${s}" y="${r+.035}" text-anchor="middle" fill="${n}" font-size="0.08" font-weight="bold">${i+1}</text>
              </g>
            `})})()}
      </svg>
    `}_getCo2Status(e){return e<600?{label:"Uitstekend",class:"excellent"}:e<800?{label:"Goed",class:"good"}:e<1e3?{label:"Matig",class:"moderate"}:e<1500?{label:"Slecht",class:"poor"}:{label:"Ongezond",class:"unhealthy"}}_setRoomViewMode(e){this._roomViewMode=e,"3d"===e&&setTimeout(()=>this._init3DView(),50)}_init3DView(){const e=this._rooms.find(e=>e.id===this._selectedRoomId);if(!e)return;const t=e.walls||[],i=t.map(e=>e.x1/1e3).filter(e=>!isNaN(e)),a=t.map(e=>e.y1/1e3).filter(e=>!isNaN(e));if(i.length>0&&a.length>0){const e=Math.min(...i),t=Math.max(...i),o=Math.min(...a),s=Math.max(...a);this._camera3d.targetX=(e+t)/2*1e3,this._camera3d.targetY=(o+s)/2*1e3,this._camera3d.distance=1500*Math.max(t-e,s-o)}this._render3DView()}_render3DView(){const e=this.shadowRoot?.querySelector(".canvas-3d");if(!e)return;const t=e.getContext("2d");if(!t)return;e.width=800,e.height=600;const i=this._rooms.find(e=>e.id===this._selectedRoomId);if(!i)return;const a=t.createLinearGradient(0,0,0,600);a.addColorStop(0,"#1e293b"),a.addColorStop(1,"#0f172a"),t.fillStyle=a,t.fillRect(0,0,800,600),this._draw3DGrid(t),this._draw3DRoom(t,i),this._draw3DFurniture(t,i),this._draw3DZones(t,i),this._draw3DSensor(t,i),this._draw3DTargetsCard(t,i)}_project3D(e){const t=this._camera3d,i=t.azimuth*Math.PI/180,a=t.elevation*Math.PI/180,o=e.x-t.targetX,s=e.y-t.targetY,r=e.z-t.targetZ,n=o*Math.cos(i)-s*Math.sin(i),l=o*Math.sin(i)+s*Math.cos(i),c=r,d=l*Math.cos(a)-c*Math.sin(a),h=l*Math.sin(a)+c*Math.cos(a),p=1/Math.tan(60*Math.PI/360)*400,g=t.distance+d,u=g>50?p/g:p/50;return{x:400-n*u,y:300-h*u}}_draw3DGrid(e){e.strokeStyle="rgba(71, 85, 105, 0.3)",e.lineWidth=1;const t=5e3;for(let i=-5e3;i<=t;i+=1e3){const a=this._project3D({x:i,y:-5e3,z:0}),o=this._project3D({x:i,y:t,z:0});e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(o.x,o.y),e.stroke();const s=this._project3D({x:-5e3,y:i,z:0}),r=this._project3D({x:t,y:i,z:0});e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(r.x,r.y),e.stroke()}}_draw3DRoom(e,t){const i=t.walls||[];if(i.length<3)return;const a=i.map(e=>({x:e.x1,y:e.y1}));e.fillStyle="rgba(249, 115, 22, 0.08)",e.strokeStyle="rgba(249, 115, 22, 0.4)",e.lineWidth=2,e.beginPath();const o=this._project3D({x:a[0].x,y:a[0].y,z:0});e.moveTo(o.x,o.y);for(let t=1;t<a.length;t++){const i=this._project3D({x:a[t].x,y:a[t].y,z:0});e.lineTo(i.x,i.y)}e.closePath(),e.fill(),e.stroke();const s=a.map((e,t)=>{const i=a[(t+1)%a.length],o=(e.x+i.x)/2,s=(e.y+i.y)/2;return{index:t,dist:Math.hypot(o-this._camera3d.targetX,s-this._camera3d.targetY)}}).sort((e,t)=>t.dist-e.dist);for(const{index:t}of s){const i=a[t],o=a[(t+1)%a.length],s=this._project3D({x:i.x,y:i.y,z:0}),r=this._project3D({x:o.x,y:o.y,z:0}),n=this._project3D({x:o.x,y:o.y,z:2500}),l=this._project3D({x:i.x,y:i.y,z:2500}),c=o.x-i.x,d=o.y-i.y,h=Math.atan2(d,c)+Math.PI/2,p=this._camera3d.azimuth*Math.PI/180,g=.3+.4*Math.abs(Math.cos(h-p)),u=e.createLinearGradient((s.x+r.x)/2,Math.max(s.y,r.y),(l.x+n.x)/2,Math.min(l.y,n.y));u.addColorStop(0,`rgba(71, 85, 105, ${.5*g})`),u.addColorStop(1,`rgba(71, 85, 105, ${.2*g})`),e.fillStyle=u,e.strokeStyle="#475569",e.lineWidth=2,e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(r.x,r.y),e.lineTo(n.x,n.y),e.lineTo(l.x,l.y),e.closePath(),e.fill(),e.stroke()}}_draw3DFurniture(e,t){const i=t.furniture||[];for(const t of i){const i=t.width/2,a=t.height/2,o=400,s=[{x:t.x-i,y:t.y-a,z:0},{x:t.x+i,y:t.y-a,z:0},{x:t.x+i,y:t.y+a,z:0},{x:t.x-i,y:t.y+a,z:0}],r=s.map(e=>({...e,z:o})),n=s.map(e=>this._project3D(e)),l=r.map(e=>this._project3D(e));e.fillStyle="rgba(148, 163, 184, 0.5)",e.strokeStyle="#64748b",e.lineWidth=1,e.beginPath(),e.moveTo(l[0].x,l[0].y);for(let t=1;t<4;t++)e.lineTo(l[t].x,l[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle="rgba(148, 163, 184, 0.25)",e.beginPath(),e.moveTo(n[t].x,n[t].y),e.lineTo(n[i].x,n[i].y),e.lineTo(l[i].x,l[i].y),e.lineTo(l[t].x,l[t].y),e.closePath(),e.fill(),e.stroke()}const c=this._project3D({x:t.x,y:t.y,z:o+100});e.fillStyle="#94a3b8",e.font="11px sans-serif",e.textAlign="center",e.fillText(t.name||t.type||"",c.x,c.y)}}_draw3DZones(e,t){const i=t.zones||[],a=2500;for(const t of i){if(!t.points||t.points.length<2)continue;const i="detection"===t.type,o="exclusion"===t.type,s=i?"rgba(34, 197, 94, 0.15)":o?"rgba(239, 68, 68, 0.15)":"rgba(16, 185, 129, 0.15)",r=i?"#22c55e":o?"#ef4444":"#10b981";if("entry"===t.type&&2===t.points.length){const i=t.points[0],o=t.points[1],n=this._project3D({x:i.x,y:i.y,z:0}),l=this._project3D({x:o.x,y:o.y,z:0}),c=this._project3D({x:i.x,y:i.y,z:a}),d=this._project3D({x:o.x,y:o.y,z:a});e.beginPath(),e.moveTo(n.x,n.y),e.lineTo(l.x,l.y),e.lineTo(d.x,d.y),e.lineTo(c.x,c.y),e.closePath(),e.fillStyle=s,e.fill(),e.strokeStyle=r,e.lineWidth=2,e.stroke();continue}if(t.points.length<3)continue;e.beginPath();const n=this._project3D({x:t.points[0].x,y:t.points[0].y,z:0});e.moveTo(n.x,n.y);for(let i=1;i<t.points.length;i++){const a=this._project3D({x:t.points[i].x,y:t.points[i].y,z:0});e.lineTo(a.x,a.y)}if(e.closePath(),e.fillStyle=s,e.fill(),e.strokeStyle=r,e.lineWidth=1,e.stroke(),i){e.beginPath();const i=this._project3D({x:t.points[0].x,y:t.points[0].y,z:a});e.moveTo(i.x,i.y);for(let i=1;i<t.points.length;i++){const o=this._project3D({x:t.points[i].x,y:t.points[i].y,z:a});e.lineTo(o.x,o.y)}e.closePath(),e.fillStyle=s,e.fill(),e.strokeStyle=r,e.lineWidth=1,e.stroke();for(let i=0;i<t.points.length;i++){const o=this._project3D({x:t.points[i].x,y:t.points[i].y,z:0}),s=this._project3D({x:t.points[i].x,y:t.points[i].y,z:a});e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(s.x,s.y),e.strokeStyle=r,e.lineWidth=.5,e.stroke()}}}}_draw3DSensor(e,t){const i=t.sensor;if(!i)return;const a=i.x||0,o=i.y||0,s=1500,r=this._project3D({x:a,y:o,z:s}),n=this._project3D({x:a,y:o,z:0});e.beginPath(),e.moveTo(n.x,n.y),e.lineTo(r.x,r.y),e.strokeStyle="rgba(59, 130, 246, 0.5)",e.lineWidth=2,e.stroke(),e.beginPath(),e.arc(r.x,r.y,10,0,2*Math.PI),e.fillStyle="#3b82f6",e.fill(),e.strokeStyle="white",e.lineWidth=2,e.stroke();const l=i.fov||120,c=Math.min(i.range||6e3,4e3),d=((i.rotation||270)-90)*Math.PI/180,h=l/2*Math.PI/180,p=a+Math.cos(d-h)*c,g=o+Math.sin(d-h)*c,u=a+Math.cos(d+h)*c,m=o+Math.sin(d+h)*c,f=this._project3D({x:a,y:o,z:s}),v=this._project3D({x:p,y:g,z:s}),_=this._project3D({x:u,y:m,z:s});e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(v.x,v.y),e.lineTo(_.x,_.y),e.closePath(),e.fillStyle="rgba(59, 130, 246, 0.15)",e.fill(),e.strokeStyle="rgba(59, 130, 246, 0.4)",e.lineWidth=1,e.stroke()}_draw3DTargetsCard(e,t){const i=t.sensor;if(!i)return;const a=this._targets.filter(e=>e.active||0!==e.x||0!==e.y),o=((i.rotation||270)-90)*Math.PI/180;for(let t=0;t<a.length;t++){const s=a[t],r=i.x+s.y*Math.cos(o)-s.x*Math.sin(o),n=i.y+s.y*Math.sin(o)+s.x*Math.cos(o),l=110,c=1650,d=1450,h=850,p=1400,g=1e3,u=850,m=8,f="#94a3b8",v=[];for(let e=0;e<m;e++){const t=e/m*Math.PI*2,i=(e+1)/m*Math.PI*2,a=90,o=r+Math.cos(t)*a,s=n+Math.sin(t)*a,l=r+Math.cos(i)*a,c=n+Math.sin(i)*a,p=this._project3D({x:o,y:s,z:h}),g=this._project3D({x:l,y:c,z:h}),u=this._project3D({x:l,y:c,z:d}),f=this._project3D({x:o,y:s,z:d}),_=(h+d)/2+this._camera3d.distance;v.push({proj:[p,g,u,f],depth:_})}for(const e of[-1,1]){const t=r+70*e;for(let e=0;e<m;e++){const i=e/m*Math.PI*2,a=(e+1)/m*Math.PI*2,o=45,s=t+Math.cos(i)*o,r=n+Math.sin(i)*o,l=t+Math.cos(a)*o,c=n+Math.sin(a)*o,d=this._project3D({x:s,y:r,z:0}),h=this._project3D({x:l,y:c,z:0}),p=this._project3D({x:l,y:c,z:u}),g=this._project3D({x:s,y:r,z:u});v.push({proj:[d,h,p,g],depth:u/2+this._camera3d.distance})}}for(const e of[-1,1]){const t=r+180*e;for(let e=0;e<m;e++){const i=e/m*Math.PI*2,a=(e+1)/m*Math.PI*2,o=35,s=t+Math.cos(i)*o,r=n+Math.sin(i)*o,l=t+Math.cos(a)*o,c=n+Math.sin(a)*o,d=this._project3D({x:s,y:r,z:g}),h=this._project3D({x:l,y:c,z:g}),u=this._project3D({x:l,y:c,z:p}),f=this._project3D({x:s,y:r,z:p});v.push({proj:[d,h,u,f],depth:(g+p)/2+this._camera3d.distance})}}v.sort((e,t)=>t.depth-e.depth);for(const t of v){e.beginPath(),e.moveTo(t.proj[0].x,t.proj[0].y);for(let i=1;i<t.proj.length;i++)e.lineTo(t.proj[i].x,t.proj[i].y);e.closePath(),e.fillStyle=f,e.globalAlpha=.3,e.fill(),e.globalAlpha=.6,e.strokeStyle=f,e.lineWidth=.5,e.stroke(),e.globalAlpha=1}const _=this._project3D({x:r,y:n,z:c}),y=e.createRadialGradient(_.x-4,_.y-4,0,_.x,_.y,15);y.addColorStop(0,"#ffffff"),y.addColorStop(.5,"#e2e8f0"),y.addColorStop(1,"#94a3b8"),e.beginPath(),e.arc(_.x,_.y,15,0,2*Math.PI),e.fillStyle=y,e.fill(),e.strokeStyle="#64748b",e.lineWidth=1,e.stroke();const b=this._project3D({x:r,y:n,z:0});e.beginPath(),e.ellipse(b.x,b.y,25,12,0,0,2*Math.PI),e.fillStyle="rgba(0, 0, 0, 0.2)",e.fill();const w=this._project3D({x:r,y:n,z:c+l+80});e.beginPath(),e.arc(w.x,w.y,12,0,2*Math.PI),e.fillStyle="rgba(239, 68, 68, 0.9)",e.fill(),e.strokeStyle="#ef4444",e.lineWidth=1,e.stroke(),e.fillStyle="white",e.font="bold 12px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText(`${t+1}`,w.x,w.y)}}_getCo2BarPosition(e){return(Math.max(400,Math.min(2e3,e))-400)/1600*100}_getPm25Status(e){return e<=12?{label:"Uitstekend",labelEn:"Excellent",class:"excellent",color:"#4caf50"}:e<=35.4?{label:"Goed",labelEn:"Good",class:"good",color:"#8bc34a"}:e<=55.4?{label:"Matig",labelEn:"Moderate",class:"moderate",color:"#ffeb3b"}:e<=150.4?{label:"Ongezond gevoelig",labelEn:"Unhealthy for Sensitive",class:"unhealthy-sensitive",color:"#ff9800"}:e<=250.4?{label:"Ongezond",labelEn:"Unhealthy",class:"unhealthy",color:"#f44336"}:e<=350.4?{label:"Zeer ongezond",labelEn:"Very Unhealthy",class:"very-unhealthy",color:"#9c27b0"}:{label:"Gevaarlijk",labelEn:"Hazardous",class:"hazardous",color:"#880e4f"}}_getPm25BarPosition(e){return e<=12?e/12*8.3:e<=35.4?8.3+(e-12)/23.4*8.3:e<=55.4?16.6+(e-35.4)/20*8.4:e<=150.4?25+(e-55.4)/95*8.3:e<=250.4?33.3+(e-150.4)/100*16.7:e<=350.4?50+(e-250.4)/100*16.6:Math.min(100,66.6+(e-350.4)/150*33.4)}_hasAirQualityData(){const{pm1_0:e,pm2_5:t,pm4_0:i,pm10:a}=this._environment;return null!==e||null!==t||null!==i||null!==a}_findRoomQualityEntity(){if(!this.hass)return null;for(const[e,t]of Object.entries(this.hass.states))if(e.startsWith("sensor.")&&e.includes("room_quality")&&!e.includes("label")&&!e.includes("percentage")&&void 0!==t.attributes?.recommendations&&void 0!==t.attributes?.color)return console.log("SmartHomeShop: Found Room Quality entity:",e,"score:",t.state),{entityId:e,state:t};return console.log("SmartHomeShop: No Room Quality entity found, using local calculation"),null}_calculateRoomScore(){const e=this._findRoomQualityEntity();if(e){const{state:t}=e,i=parseFloat(t.state)||0,a=t.attributes||{},o=(a.recommendations||[]).map(e=>{let t="mdi:information";return e.includes("CO₂")||e.includes("Ventileer")?t="mdi:molecule-co2":e.includes("Fijnstof")||e.includes("stof")?t="mdi:weather-dust":e.includes("VOC")?t="mdi:air-purifier":e.includes("koel")||e.includes("koud")||e.includes("Verwarm")?t="mdi:thermometer-low":e.includes("warm")||e.includes("heet")||e.includes("Koel")?t="mdi:thermometer-high":e.includes("droog")?t="mdi:water-percent":e.includes("vochtig")&&(t="mdi:water-percent-alert"),{icon:t,text:e}}).slice(0,3);return{score:i,color:a.color||"#ffc107",label:a.label||"Onbekend",recommendations:o}}return this._calculateRoomScoreLocal()}_calculateRoomScoreLocal(){const{temperature:e,humidity:t,co2:i,voc:a,pm2_5:o}=this._environment,s=[];let r=0,n=0;if(null!==i){let e=10;i>2e3?(e=1,s.push({icon:"mdi:molecule-co2",text:"Ventileer nu!",priority:10})):i>1500?(e=3,s.push({icon:"mdi:molecule-co2",text:"CO₂ ongezond, ventileer",priority:8})):i>1e3?(e=5,s.push({icon:"mdi:air-filter",text:"Ventileren aanbevolen",priority:6})):i>800?e=7:i>600&&(e=9),r+=.3*e,n+=.3}if(null!==o){let e=10;o>150?(e=1,s.push({icon:"mdi:weather-dust",text:"Fijnstof gevaarlijk!",priority:9})):o>55?(e=3,s.push({icon:"mdi:weather-dust",text:"Fijnstof hoog",priority:7})):o>35?(e=5,s.push({icon:"mdi:weather-dust",text:"Fijnstof verhoogd",priority:5})):o>12&&(e=7),r+=.25*e,n+=.25}if(null!==a){let e=10;a>400?(e=2,s.push({icon:"mdi:air-purifier",text:"Hoge VOC, ventileer",priority:7})):a>250?(e=5,s.push({icon:"mdi:air-purifier",text:"Verhoogde VOC",priority:5})):a>150?e=7:a>100&&(e=9),r+=.15*e,n+=.15}if(null!==e){let t=10;e<16?(t=4,s.push({icon:"mdi:thermometer-low",text:"Verwarm de ruimte",priority:4})):e<18?(t=7,s.push({icon:"mdi:thermometer-low",text:"Het is wat koel",priority:2})):e>28?(t=3,s.push({icon:"mdi:thermometer-high",text:"Koel de ruimte af",priority:4})):e>25?(t=6,s.push({icon:"mdi:thermometer-high",text:"Het is wat warm",priority:2})):e>22&&(t=8),r+=.15*t,n+=.15}if(null!==t){let e=10;t<25?(e=4,s.push({icon:"mdi:water-percent-alert",text:"Lucht te droog",priority:4})):t<35?(e=7,s.push({icon:"mdi:water-percent",text:"Lucht is droog",priority:2})):t>75?(e=4,s.push({icon:"mdi:water-percent-alert",text:"Lucht te vochtig",priority:4})):t>65&&(e=7,s.push({icon:"mdi:water-percent",text:"Lucht is vochtig",priority:2})),r+=.15*e,n+=.15}const l=n>0?r/n:0;let c="#22C55E",d="Uitstekend";l<4?(c="#EF4444",d="Slecht"):l<5.5?(c="#F97316",d="Matig"):l<7?(c="#F59E0B",d="Redelijk"):l<8.5&&(c="#84CC16",d="Goed");const h=s.sort((e,t)=>t.priority-e.priority),p=h.slice(0,3).map(e=>({icon:e.icon,text:e.text}));return{score:l,color:c,label:d,recommendations:p}}_hasEnvironmentData(){const{temperature:e,humidity:t,co2:i,voc:a,pm2_5:o}=this._environment;return null!==e||null!==t||null!==i||null!==a||null!==o}_hasAnyEnvironmentEnabled(){const{temperature:e,humidity:t,co2:i,illuminance:a,voc:o}=this._environment;return null!==e&&!1!==this._config.show_temperature||null!==t&&!1!==this._config.show_humidity||null!==i&&!1!==this._config.show_co2||null!==a&&!1!==this._config.show_illuminance||null!==o&&!1!==this._config.show_voc}render(){if(!this.hass)return Z;if(!this._entityPrefix)return G`
        <ha-card>
          <div class="no-device">
            <ha-icon icon="mdi:radar"></ha-icon>
            <div>Selecteer een UltimateSensor apparaat</div>
            <div style="font-size: 0.8rem; margin-top: 8px;">
              Open de card editor om een apparaat te kiezen
            </div>
          </div>
      </ha-card>
      `;const e=this._targets.filter(e=>e.active).length,t=this._config.title||this._deviceName||"UltimateSensor",{temperature:i,humidity:a,co2:o,illuminance:s,voc:r,nox:n,pm1_0:l,pm2_5:c,pm4_0:d,pm10:h,typical_particle_size:p}=this._environment,g=null!==o?this._getCo2Status(o):null;return G`
      <ha-card>
        <div class="card-header">
          <div class="header-title">
            <ha-icon icon="mdi:home-automation"></ha-icon>
            ${t}
          </div>
          <div class="header-actions">
            <div class="target-count">
            ${e} ${1===e?"persoon":"personen"}
          </div>
        </div>
        </div>

        ${this._hasEnvironmentData()&&!1!==this._config.show_room_score?(()=>{const e=this._calculateRoomScore();return G`
            <div class="room-score-section">
              <div class="room-score-header">
                <div class="room-score-title">
                  <ha-icon icon="mdi:home-heart"></ha-icon>
                  Kamer Kwaliteit
                </div>
                <div class="room-score-badge" style="background: ${e.color}">
                  ${e.label}
                </div>
              </div>
              <div class="room-score-main">
                <div class="room-score-gauge">
                  <svg viewBox="0 0 120 65" class="score-arc">
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#f44336"/>
                        <stop offset="40%" style="stop-color:#ff9800"/>
                        <stop offset="60%" style="stop-color:#ffc107"/>
                        <stop offset="80%" style="stop-color:#8bc34a"/>
                        <stop offset="100%" style="stop-color:#4caf50"/>
                      </linearGradient>
                    </defs>
                    <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8" stroke-linecap="round"/>
                    <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="url(#scoreGradient)" stroke-width="8" stroke-linecap="round"
                          stroke-dasharray="${e.score/10*Math.PI*50} ${50*Math.PI}" />
                    <circle
                      cx="${60+50*Math.cos(Math.PI*(1-e.score/10))}"
                      cy="${55-50*Math.sin(Math.PI*(1-e.score/10))}"
                      r="6" fill="${e.color}" stroke="white" stroke-width="2"/>
                  </svg>
                  <div class="room-score-value" style="color: ${e.color}">${e.score.toFixed(1)}</div>
                </div>
              </div>
              ${e.recommendations.length>0?G`
                <div class="room-score-recommendations">
                  ${e.recommendations.map(e=>G`
                    <div class="recommendation-item"><ha-icon icon="${e.icon}"></ha-icon>${e.text}</div>
                  `)}
                </div>
              `:G`
                <div class="room-score-recommendations">
                  <div class="recommendation-item positive"><ha-icon icon="mdi:check-circle"></ha-icon>Alle waarden optimaal</div>
                </div>
              `}
            </div>
          `})():Z}

        ${this._hasAnyEnvironmentEnabled()?G`
          <div class="environment-section">
            <div class="environment-grid">
              ${null!==i&&!1!==this._config.show_temperature?G`
                <div class="env-card temperature" @click=${()=>this._fireMoreInfo(this._entityIds.temperature)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:thermometer"></ha-icon>
                    <span class="env-card-label">Temperatuur</span>
                  </div>
                  <div class="env-card-value">${i.toFixed(1)}<span>°C</span></div>
                </div>
              `:Z}

              ${null!==a&&!1!==this._config.show_humidity?G`
                <div class="env-card humidity" @click=${()=>this._fireMoreInfo(this._entityIds.humidity)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:water-percent"></ha-icon>
                    <span class="env-card-label">Luchtvochtigheid</span>
                  </div>
                  <div class="env-card-value">${a.toFixed(0)}<span>%</span></div>
                </div>
              `:Z}

              ${null!==o&&!1!==this._config.show_co2?G`
                <div class="env-card co2" @click=${()=>this._fireMoreInfo(this._entityIds.co2)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:molecule-co2"></ha-icon>
                    <span class="env-card-label">CO₂</span>
                  </div>
                  <div class="env-card-value">${o.toFixed(0)}<span>ppm</span></div>
                </div>
              `:Z}

              ${null!==s&&!1!==this._config.show_illuminance?G`
                <div class="env-card illuminance" @click=${()=>this._fireMoreInfo(this._entityIds.illuminance)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:brightness-6"></ha-icon>
                    <span class="env-card-label">Lichtsterkte</span>
                  </div>
                  <div class="env-card-value">${s.toFixed(0)}<span>lx</span></div>
                </div>
              `:Z}

              ${null!==r&&!1!==this._config.show_voc?G`
                <div class="env-card voc" @click=${()=>this._fireMoreInfo(this._entityIds.voc)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:air-filter"></ha-icon>
                    <span class="env-card-label">VOC Index</span>
                  </div>
                  <div class="env-card-value">${r.toFixed(0)}<span></span></div>
                </div>
              `:Z}
            </div>

            ${null!==o&&g&&!1!==this._config.show_co2_bar?G`
              <div class="co2-quality" @click=${()=>this._fireMoreInfo(this._entityIds.co2)}>
                <div class="co2-quality-header">
                  <div class="co2-quality-label">
                    <ha-icon icon="mdi:molecule-co2"></ha-icon>
                    CO₂ Kwaliteit
                  </div>
                  <div class="co2-quality-status ${g.class}">${g.label}</div>
                </div>
                <div class="co2-bar-container">
                  <div class="co2-bar-indicator" style="left: calc(${this._getCo2BarPosition(o)}% - 2px)"></div>
                </div>
                <div class="co2-bar-labels">
                  <span>400</span>
                  <span>800</span>
                  <span>1200</span>
                  <span>1600</span>
                  <span>2000</span>
                </div>
              </div>
            `:Z}
          </div>
        `:Z}


        ${this._hasAirQualityData()&&!1!==this._config.show_air_quality?G`
          <div class="air-quality-section">
            <div class="air-quality-header">
              <div class="air-quality-title">
                <ha-icon icon="mdi:weather-dust"></ha-icon>
                Fijnstof (PM)
              </div>
              ${null!==c?G`
                <div class="air-quality-status ${this._getPm25Status(c).class}">
                  ${this._getPm25Status(c).label}
                </div>
              `:Z}
            </div>

            ${null!==c?G`
              <div class="pm-gauge-container" @click=${()=>this._fireMoreInfo(this._entityIds.pm2_5)}>
                <div class="pm-gauge-label">
                  <span class="pm-gauge-label-text">PM2.5 (Fine Particles)</span>
                  <span class="pm-gauge-value" style="color: ${this._getPm25Status(c).color}">
                    ${c.toFixed(1)}<span>µg/m³</span>
                  </span>
                </div>
                <div class="pm-gauge-bar">
                  <div class="pm-gauge-indicator" style="left: calc(${this._getPm25BarPosition(c)}% - 2px)"></div>
                </div>
                <div class="pm-gauge-scale">
                  <span>0</span>
                  <span>35</span>
                  <span>55</span>
                  <span>150</span>
                  <span>250</span>
                  <span>350</span>
                  <span>500+</span>
                </div>
              </div>
            `:Z}

            <div class="pm-grid">
              ${null!==l?G`
                <div class="pm-item pm1" @click=${()=>this._fireMoreInfo(this._entityIds.pm1_0)}>
                  <div class="pm-item-label">PM1.0</div>
                  <div class="pm-item-value">${l.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Z}
              ${null!==c?G`
                <div class="pm-item pm2_5" @click=${()=>this._fireMoreInfo(this._entityIds.pm2_5)}>
                  <div class="pm-item-label">PM2.5</div>
                  <div class="pm-item-value">${c.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Z}
              ${null!==d?G`
                <div class="pm-item pm4" @click=${()=>this._fireMoreInfo(this._entityIds.pm4_0)}>
                  <div class="pm-item-label">PM4.0</div>
                  <div class="pm-item-value">${d.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Z}
              ${null!==h?G`
                <div class="pm-item pm10" @click=${()=>this._fireMoreInfo(this._entityIds.pm10)}>
                  <div class="pm-item-label">PM10</div>
                  <div class="pm-item-value">${h.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Z}
            </div>

            ${null!==n?G`
              <div class="voc-nox-grid" style="margin-top: 12px;">
                <div class="env-card nox" @click=${()=>this._fireMoreInfo(this._entityIds.nox)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:molecule"></ha-icon>
                    <span class="env-card-label">NOx Index</span>
                  </div>
                  <div class="env-card-value">${n.toFixed(0)}</div>
                </div>
              </div>
            `:Z}
          </div>
        `:Z}

        ${!1!==this._config.show_radar?G`
          ${!1!==this._config.show_environment?G`<div class="section-divider"></div>`:Z}

          <div class="radar-section">
            ${"room"===this._config.view_mode?G`
              <div class="room-view-container">
                ${this._renderRoomView()}
              </div>
            `:G`
              <div class="radar-container">
                <canvas class="radar-canvas"></canvas>
              </div>
            `}

            <div class="target-info">
              ${this._targets.map((e,t)=>G`
                <div class="target-info-item ${e.active?"":"inactive"}"
                     @click=${()=>this._fireMoreInfo(this._entityIds.targets[t])}>
                  <div class="target-info-dot target-${t+1}"></div>
                  <div class="target-info-label">Persoon ${t+1}</div>
                  <div class="target-info-value">
                    ${e.active?`${(e.distance/1e3).toFixed(1)}m`:"-"}
                  </div>
                </div>
              `)}
            </div>
          </div>
        `:Z}
      <smarthomeshop-sensor-settings
          .hass=${this.hass}
          .entityPrefix=${this._entityPrefix}
          .deviceName=${this._deviceName}
          .isOpen=${this._showSettings}
          @close=${()=>this._showSettings=!1}
        ></smarthomeshop-sensor-settings>
      </ha-card>
    `}};Te.styles=n`
    :host {
      display: block;
    }
    ha-card {
      padding: 16px;
      overflow: hidden;
    }

    /* Header */
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .header-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-title ha-icon {
      color: #9c27b0;
      --mdc-icon-size: 24px;
    }
    .view-toggle {
      display: flex;
      background: var(--secondary-background-color, rgba(255,255,255,0.1));
      border-radius: 8px;
      padding: 4px;
      gap: 4px;
    }
    .view-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      background: transparent;
      color: var(--secondary-text-color);
      transition: all 0.2s;
    }
    .view-btn.active {
      background: var(--primary-color, #3b82f6);
      color: white;
    }
    .view-btn:hover:not(.active) {
      background: rgba(255,255,255,0.1);
    }
    .room-selector {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin: 12px 16px;
    }
    .room-btn {
      padding: 6px 12px;
      background: var(--secondary-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      color: var(--secondary-text-color);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .room-btn.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .target-count {
      background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
      color: white;
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3);
    }

    /* Room Quality Score Section */
    .room-score-section {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(33, 150, 243, 0.08) 100%);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .room-score-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .room-score-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .room-score-title ha-icon {
      color: #4caf50;
      --mdc-icon-size: 18px;
    }
    .room-score-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .room-score-main {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .room-score-gauge {
      position: relative;
      width: 140px;
      height: 80px;
    }
    .score-arc {
      width: 100%;
      height: 100%;
    }
    .room-score-value {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      font-size: 1.5rem;
      font-weight: 700;
    }
    .room-score-recommendations {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 8px;
    }
    .recommendation-item {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 152, 0, 0.12);
      border-left: 2px solid #ff9800;
      padding: 6px 10px;
      border-radius: 0 6px 6px 0;
      font-size: 0.8rem;
      color: var(--primary-text-color);
    }
    .recommendation-item ha-icon {
      --mdc-icon-size: 16px;
      color: #ff9800;
      flex-shrink: 0;
    }
    .recommendation-item.positive {
      background: rgba(76, 175, 80, 0.12);
      border-left-color: #4caf50;
    }
    .recommendation-item.positive ha-icon {
      color: #4caf50;
    }

    /* Environment Section */
    .environment-section {
      margin-bottom: 16px;
    }
    .environment-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .env-card {
      background: var(--secondary-background-color);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .env-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .env-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .env-card-header ha-icon {
      --mdc-icon-size: 20px;
    }
    .env-card-label {
      font-size: 0.75rem;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .env-card-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-text-color);
    }
    .env-card-value span {
      font-size: 0.9rem;
      font-weight: 400;
      color: var(--secondary-text-color);
    }
    .env-card.temperature ha-icon { color: #ff5722; }
    .env-card.humidity ha-icon { color: #2196f3; }
    .env-card.co2 ha-icon { color: #4caf50; }
    .env-card.illuminance ha-icon { color: #ffc107; }
    .env-card.voc ha-icon { color: #9c27b0; }

    /* CO2 Quality Bar */
    .co2-quality {
      margin-top: 12px;
      padding: 14px;
      background: var(--secondary-background-color);
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .co2-quality:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .co2-quality-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .co2-quality-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .co2-quality-label ha-icon {
      --mdc-icon-size: 20px;
      color: #26a69a;
    }
    .co2-quality-status {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
    }
    .co2-quality-status.excellent { background: #e8f5e9; color: #2e7d32; }
    .co2-quality-status.good { background: #e8f5e9; color: #388e3c; }
    .co2-quality-status.moderate { background: #fff3e0; color: #f57c00; }
    .co2-quality-status.poor { background: #ffebee; color: #d32f2f; }
    .co2-quality-status.unhealthy { background: #fce4ec; color: #c2185b; }

    .co2-bar-container {
      position: relative;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      background: linear-gradient(90deg,
        #4caf50 0%,
        #8bc34a 25%,
        #ffeb3b 40%,
        #ff9800 60%,
        #f44336 80%,
        #9c27b0 100%
      );
    }
    .co2-bar-indicator {
      position: absolute;
      top: -4px;
      width: 4px;
      height: 20px;
      background: var(--primary-text-color);
      border-radius: 2px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: left 0.5s ease;
    }
    .co2-bar-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 0.65rem;
      color: var(--secondary-text-color);
    }

    /* Air Quality Section - SPS30 */
    .air-quality-section {
      margin-top: 16px;
      padding: 16px;
      background: linear-gradient(135deg,
        rgba(var(--rgb-primary-color), 0.08) 0%,
        rgba(var(--rgb-primary-color), 0.02) 100%);
      border-radius: 12px;
      border: 1px solid rgba(var(--rgb-primary-color), 0.1);
    }
    .air-quality-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .air-quality-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .air-quality-title ha-icon {
      color: #26a69a;
      --mdc-icon-size: 20px;
    }
    .air-quality-status {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .air-quality-status.excellent { background: #e8f5e9; color: #2e7d32; }
    .air-quality-status.good { background: #e8f5e9; color: #43a047; }
    .air-quality-status.moderate { background: #fff8e1; color: #f9a825; }
    .air-quality-status.unhealthy-sensitive { background: #fff3e0; color: #ef6c00; }
    .air-quality-status.unhealthy { background: #ffebee; color: #e53935; }
    .air-quality-status.very-unhealthy { background: #f3e5f5; color: #8e24aa; }
    .air-quality-status.hazardous { background: #fce4ec; color: #880e4f; }

    /* PM Gauge */
    .pm-gauge-container {
      margin-bottom: 20px;
      cursor: pointer;
    }
    .pm-gauge-container:hover {
      opacity: 0.9;
    }
    .pm-gauge-label {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .pm-gauge-label-text {
      font-size: 0.85rem;
      color: var(--secondary-text-color);
    }
    .pm-gauge-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .pm-gauge-value span {
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--secondary-text-color);
      margin-left: 4px;
    }
    .pm-gauge-bar {
      height: 12px;
      background: linear-gradient(to right,
        #4caf50 0%,
        #4caf50 8.3%,
        #8bc34a 8.3%,
        #8bc34a 16.6%,
        #ffeb3b 16.6%,
        #ffeb3b 25%,
        #ff9800 25%,
        #ff9800 33.3%,
        #f44336 33.3%,
        #f44336 50%,
        #9c27b0 50%,
        #9c27b0 66.6%,
        #880e4f 66.6%,
        #880e4f 100%);
      border-radius: 6px;
      position: relative;
      overflow: visible;
    }
    .pm-gauge-indicator {
      position: absolute;
      top: -4px;
      width: 4px;
      height: 20px;
      background: var(--primary-text-color);
      border-radius: 2px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      transition: left 0.5s ease;
    }
    .pm-gauge-scale {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 0.6rem;
      color: var(--secondary-text-color);
    }

    /* PM Grid for all values */
    .pm-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .pm-item {
      background: var(--card-background-color);
      padding: 12px 8px;
      border-radius: 10px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid rgba(var(--rgb-primary-color), 0.1);
    }
    .pm-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .pm-item-label {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
      font-weight: 500;
    }
    .pm-item-value {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .pm-item-unit {
      font-size: 0.6rem;
      color: var(--secondary-text-color);
      display: block;
      margin-top: 2px;
    }
    .pm-item.pm1 .pm-item-value { color: #26a69a; }
    .pm-item.pm2_5 .pm-item-value { color: #42a5f5; }
    .pm-item.pm4 .pm-item-value { color: #7e57c2; }
    .pm-item.pm10 .pm-item-value { color: #ef5350; }

    /* VOC/NOx section */
    .voc-nox-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 12px;
    }
    .env-card.nox ha-icon { color: #ff7043; }

    /* Radar Section */
    .radar-section {
      margin-top: 16px;
    }

    .room-view-container {
      padding: 16px;
    }
    .room-view-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }
    .room-view-toggle {
      display: flex;
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
      padding: 2px;
      gap: 2px;
    }
    .room-view-toggle button {
      padding: 4px 10px;
      border: none;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      background: transparent;
      color: var(--secondary-text-color);
      transition: all 0.2s;
    }
    .room-view-toggle button.active {
      background: var(--primary-color, #3b82f6);
      color: white;
    }
    .canvas-3d {
      width: 100%;
      height: 300px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      cursor: grab;
    }
    .canvas-3d:active {
      cursor: grabbing;
    }
    .no-room-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .no-room-message ha-icon {
      --mdc-icon-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    .radar-container {
      position: relative;
      width: 100%;
      height: 200px;
      background: linear-gradient(180deg, #0d1b2a 0%, #1b263b 50%, #0d1b2a 100%);
      border-radius: 12px;
      overflow: hidden;
    }
    .radar-canvas {
      width: 100%;
      height: 100%;
    }

    /* Target Info */
    .target-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 12px;
    }
    .target-info-item {
      background: var(--secondary-background-color);
      padding: 10px;
      border-radius: 8px;
      text-align: center;
      transition: opacity 0.3s, transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .target-info-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .target-info-item.inactive {
      opacity: 0.4;
    }
    .target-info-item.inactive:hover {
      transform: none;
      box-shadow: none;
    }
    .target-info-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin: 0 auto 6px;
    }
    .target-info-dot.target-1 { background: #e91e63; box-shadow: 0 0 8px rgba(233, 30, 99, 0.5); }
    .target-info-dot.target-2 { background: #9c27b0; box-shadow: 0 0 8px rgba(156, 39, 176, 0.5); }
    .target-info-dot.target-3 { background: #3f51b5; box-shadow: 0 0 8px rgba(63, 81, 181, 0.5); }
    .target-info-label {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
      margin-bottom: 2px;
    }
    .target-info-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    /* No Device State */
    .no-device {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text-color);
    }
    .no-device ha-icon {
      --mdc-icon-size: 48px;
      opacity: 0.5;
      margin-bottom: 12px;
    }

    /* Section Divider */
    .section-divider {
      height: 1px;
      background: var(--divider-color);
      margin: 16px 0;
    }
  `,e([ue({attribute:!1})],Te.prototype,"hass",void 0),e([me()],Te.prototype,"_config",void 0),e([me()],Te.prototype,"_targets",void 0),e([me()],Te.prototype,"_zones",void 0),e([me()],Te.prototype,"_environment",void 0),e([me()],Te.prototype,"_entityPrefix",void 0),e([me()],Te.prototype,"_deviceName",void 0),e([me()],Te.prototype,"_entityIds",void 0),e([me()],Te.prototype,"_showSettings",void 0),e([me()],Te.prototype,"_viewMode",void 0),e([me()],Te.prototype,"_rooms",void 0),e([me()],Te.prototype,"_selectedRoomId",void 0),e([me()],Te.prototype,"_roomViewMode",void 0),Te=e([he("smarthomeshop-ultimatesensor-card")],Te);let Ie=class extends ce{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&this._findDevices()}_findDevices(){if(!this.hass?.devices||!this.hass?.entities)return;const e=[];for(const[t,i]of Object.entries(this.hass.devices)){const a=Object.entries(this.hass.entities).filter(([e,i])=>i.device_id===t).map(([e])=>e),o=a.some(e=>e.includes("target_1_x")),s=a.some(e=>e.includes("scd41")||e.includes("bh1750")||e.includes("co2"));(o||s)&&e.push({id:t,name:i.name||i.name_by_user||"UltimateSensor"})}this._devices=e}_valueChanged(e,t){const i={...this._config,[e]:t};"device_id"===e&&delete i.entity_prefix,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){return G`
      <div class="info-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="info-banner-content">
          <div class="info-banner-title">Kamer & Zones instellen</div>
          <div class="info-banner-text">
            Teken je kamer, plaats de sensor en configureer zones in het
            <a href="/smarthomeshop" target="_top">SmartHomeShop Panel</a>.
          </div>
        </div>
      </div>

      <div class="form-row">
        <label>UltimateSensor Apparaat</label>
        <select @change=${e=>this._valueChanged("device_id",e.target.value||void 0)}>
          <option value="">-- Selecteer apparaat --</option>
          ${this._devices.map(e=>G`
            <option value=${e.id} ?selected=${e.id===this._config.device_id}>${e.name}</option>
          `)}
        </select>
        <div class="info">Selecteer een UltimateSensor apparaat met radar en/of omgevingssensoren.</div>
      </div>

      <div class="form-row">
        <label>Titel (optioneel)</label>
        <input type="text" .value=${this._config.title||""} placeholder="UltimateSensor"
          @input=${e=>this._valueChanged("title",e.target.value||void 0)} />
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <label>Secties</label>
        <div class="checkbox-row">
          <input type="checkbox" id="show_room_score" .checked=${!1!==this._config.show_room_score}
            @change=${e=>this._valueChanged("show_room_score",e.target.checked)} />
          <label for="show_room_score">Kamer Kwaliteit Score</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_radar" .checked=${!1!==this._config.show_radar}
            @change=${e=>this._valueChanged("show_radar",e.target.checked)} />
          <label for="show_radar">Radar/aanwezigheid</label>
        </div>
      </div>

      <div class="form-row">
        <label>Omgevingssensoren</label>
        <div class="checkbox-row">
          <input type="checkbox" id="show_temperature" .checked=${!1!==this._config.show_temperature}
            @change=${e=>this._valueChanged("show_temperature",e.target.checked)} />
          <label for="show_temperature">Temperatuur</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_humidity" .checked=${!1!==this._config.show_humidity}
            @change=${e=>this._valueChanged("show_humidity",e.target.checked)} />
          <label for="show_humidity">Luchtvochtigheid</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_co2" .checked=${!1!==this._config.show_co2}
            @change=${e=>this._valueChanged("show_co2",e.target.checked)} />
          <label for="show_co2">CO₂</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_co2_bar" .checked=${!1!==this._config.show_co2_bar}
            @change=${e=>this._valueChanged("show_co2_bar",e.target.checked)} />
          <label for="show_co2_bar">CO₂ Kwaliteitsmeter</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_illuminance" .checked=${!1!==this._config.show_illuminance}
            @change=${e=>this._valueChanged("show_illuminance",e.target.checked)} />
          <label for="show_illuminance">Lichtsterkte</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_voc" .checked=${!1!==this._config.show_voc}
            @change=${e=>this._valueChanged("show_voc",e.target.checked)} />
          <label for="show_voc">VOC Index</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_air_quality" .checked=${!1!==this._config.show_air_quality}
            @change=${e=>this._valueChanged("show_air_quality",e.target.checked)} />
          <label for="show_air_quality">Fijnstof (PM)</label>
        </div>
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <label>Weergave modus</label>
        <select @change=${e=>this._valueChanged("view_mode",e.target.value)}>
          <option value="radar" ?selected=${"room"!==this._config.view_mode}>📡 Radar weergave</option>
          <option value="room" ?selected=${"room"===this._config.view_mode}>🏠 Kamer weergave</option>
        </select>
        <div class="info">Radar toont de sensor view, Kamer toont je getekende kamer met live tracking</div>
      </div>

      ${"room"!==this._config.view_mode?G`
        <div class="divider"></div>

        <div class="form-row">
          <label>Radar opties</label>
          <div class="checkbox-row">
            <input type="checkbox" id="show_zones" .checked=${!1!==this._config.show_zones}
              @change=${e=>this._valueChanged("show_zones",e.target.checked)} />
            <label for="show_zones">Toon zones</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_grid" .checked=${!1!==this._config.show_grid}
              @change=${e=>this._valueChanged("show_grid",e.target.checked)} />
            <label for="show_grid">Toon rasterlijnen</label>
          </div>
        </div>

        <div class="form-row">
          <label>Maximale afstand (mm)</label>
          <input type="number" .value=${this._config.max_distance||6e3} min="1000" max="8000" step="500"
            @input=${e=>this._valueChanged("max_distance",parseInt(e.target.value))} />
        </div>
      `:Z}
    `}};Ie.styles=n`
    .form-row {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
      color: var(--primary-text-color);
    }
    select, input[type='text'], input[type='number'] {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 14px;
      box-sizing: border-box;
    }
    select:focus, input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .checkbox-row input { width: 18px; height: 18px; }
    .checkbox-row label { margin-bottom: 0; }
    .info {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 8px;
    }
    .divider {
      height: 1px;
      background: var(--divider-color);
      margin: 16px 0;
    }
    .info-banner {
      background: linear-gradient(135deg, rgba(156, 39, 176, 0.15), rgba(63, 81, 181, 0.15));
      border: 1px solid rgba(156, 39, 176, 0.3);
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .info-banner ha-icon {
      color: var(--primary-color, #9c27b0);
      flex-shrink: 0;
      margin-top: 2px;
    }
    .info-banner-content {
      flex: 1;
    }
    .info-banner-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--primary-text-color);
    }
    .info-banner-text {
      font-size: 13px;
      color: var(--secondary-text-color);
      line-height: 1.4;
    }
    .info-banner a {
      color: var(--primary-color, #9c27b0);
      text-decoration: none;
      font-weight: 500;
    }
    .info-banner a:hover {
      text-decoration: underline;
    }
  `,e([ue({attribute:!1})],Ie.prototype,"hass",void 0),e([me()],Ie.prototype,"_config",void 0),e([me()],Ie.prototype,"_devices",void 0),Ie=e([he("smarthomeshop-ultimatesensor-card-editor")],Ie);let We=class extends ce{constructor(){super(...arguments),this.entityPrefix="",this.deviceName="",this.isOpen=!1,this.maxDistance=6e3,this._zones=[],this._targets=[],this._selectedZone=null,this._dragMode="none",this._dragStart=null,this._saving=!1,this._hasChanges=!1,this._viewMode="2d",this._detectionRange=6e3,this._canvasWidth=600,this._canvasHeight=450,this._canvas3D=null,this._ctx=null,this._animationFrame=null,this._liveInterval=null,this._camera={azimuth:0,elevation:.22*Math.PI,distance:1200,targetX:0,targetY:0,targetZ:300},this._orbitDragging=!1,this._orbitLastX=0,this._orbitLastY=0,this.WALL_HEIGHT=200,this.FOV_DEG=120,this.CAMERA_FOV=55,this._zoneColors=["#3b82f6","#8b5cf6","#ec4899","#f59e0b"],this._handleOrbitStart=e=>{this._orbitDragging=!0,this._orbitLastX=e.clientX,this._orbitLastY=e.clientY},this._handleOrbitMove=e=>{if(!this._orbitDragging)return;const t=e.clientX-this._orbitLastX,i=e.clientY-this._orbitLastY;if(e.shiftKey){const e=.002*this._camera.distance,a=Math.cos(this._camera.azimuth),o=Math.sin(this._camera.azimuth);this._camera.targetX-=t*a*e,this._camera.targetZ-=t*o*e,this._camera.targetY+=i*e*.5}else this._camera.azimuth+=.008*t,this._camera.elevation=Math.max(.05,Math.min(.45*Math.PI,this._camera.elevation-.008*i));this._orbitLastX=e.clientX,this._orbitLastY=e.clientY},this._handleOrbitEnd=()=>{this._orbitDragging=!1},this._handleWheel=e=>{e.preventDefault();const t=e.deltaY>0?1.1:.9;this._camera.distance=Math.max(400,Math.min(3e3,this._camera.distance*t))},this._handleMouseMove=e=>{if(!this._dragStart||"none"===this._dragMode)return;const t=this._getSvgPoint(e),i=this._fromSvg(this._dragStart.x,this._dragStart.y),a=this._fromSvg(t.x,t.y),o=a.x-i.x,s=a.y-i.y,r=this._zones.find(e=>e.id===this._selectedZone);if(!r)return;const n=this._dragStart.zone,l=100;"move"===this._dragMode?(r.beginX=Math.round((n.beginX+o)/l)*l,r.endX=Math.round((n.endX+o)/l)*l,r.beginY=Math.round((n.beginY+s)/l)*l,r.endY=Math.round((n.endY+s)/l)*l):(this._dragMode.includes("w")&&(r.beginX=Math.round((n.beginX+o)/l)*l),this._dragMode.includes("e")&&(r.endX=Math.round((n.endX+o)/l)*l),this._dragMode.includes("n")&&(r.endY=Math.round((n.endY+s)/l)*l),this._dragMode.includes("s")&&(r.beginY=Math.round((n.beginY+s)/l)*l)),r.beginX=Math.max(-4e3,Math.min(4e3,r.beginX)),r.endX=Math.max(-4e3,Math.min(4e3,r.endX)),r.beginY=Math.max(0,Math.min(6e3,r.beginY)),r.endY=Math.max(0,Math.min(6e3,r.endY)),this._hasChanges=!0,this.requestUpdate()},this._handleMouseUp=()=>{this._dragMode="none",this._dragStart=null,window.removeEventListener("mousemove",this._handleMouseMove),window.removeEventListener("mouseup",this._handleMouseUp)}}connectedCallback(){super.connectedCallback(),this.isOpen&&(this._loadZones(),this._startLiveUpdates())}disconnectedCallback(){super.disconnectedCallback(),this._stopLiveUpdates(),this._stopAnimation()}updated(e){e.has("isOpen")&&(this.isOpen?(this._loadZones(),this._startLiveUpdates(),"3d"===this._viewMode&&this._setup3DCanvas()):(this._stopLiveUpdates(),this._stopAnimation())),e.has("_viewMode")&&this.isOpen&&("3d"===this._viewMode?this._setup3DCanvas():this._stopAnimation())}_setup3DCanvas(){requestAnimationFrame(()=>{this._canvas3D=this.shadowRoot?.querySelector(".canvas-3d"),this._canvas3D&&(this._ctx=this._canvas3D.getContext("2d",{alpha:!0}),this._setupCanvasEvents(),this._startAnimation())})}_setupCanvasEvents(){this._canvas3D&&(this._canvas3D.addEventListener("mousedown",this._handleOrbitStart),this._canvas3D.addEventListener("wheel",this._handleWheel,{passive:!1}),window.addEventListener("mousemove",this._handleOrbitMove),window.addEventListener("mouseup",this._handleOrbitEnd))}_startAnimation(){const e=()=>{this._render3D(),this._animationFrame=requestAnimationFrame(e)};e()}_stopAnimation(){this._animationFrame&&(cancelAnimationFrame(this._animationFrame),this._animationFrame=null)}_startLiveUpdates(){this._updateTargets(),this._liveInterval=window.setInterval(()=>this._updateTargets(),100)}_stopLiveUpdates(){this._liveInterval&&(clearInterval(this._liveInterval),this._liveInterval=null)}_updateTargets(){if(!this.hass||!this.entityPrefix)return;const e=[];for(let t=1;t<=3;t++){const i=`sensor.${this.entityPrefix}_target_${t}_x`,a=`sensor.${this.entityPrefix}_target_${t}_y`,o=`binary_sensor.${this.entityPrefix}_target_${t}`,s=parseFloat(this.hass.states[i]?.state||"0"),r=parseFloat(this.hass.states[a]?.state||"0"),n="on"===this.hass.states[o]?.state;e.push({id:t,x:s,y:r,active:n&&(0!==s||0!==r)})}this._targets=e}_loadZones(){if(!this.hass||!this.entityPrefix)return;const e=[];for(let t=1;t<=4;t++)e.push({id:t,beginX:this._getNum(`zone_${t}_begin_x`),endX:this._getNum(`zone_${t}_end_x`),beginY:this._getNum(`zone_${t}_begin_y`),endY:this._getNum(`zone_${t}_end_y`),color:this._zoneColors[t-1]});this._zones=e,this._hasChanges=!1;const t=`number.${this.entityPrefix}_max_distance`,i=parseFloat(this.hass.states[t]?.state||"6000");this._detectionRange=i}_getNum(e){const t=`number.${this.entityPrefix}_${e}`,i=this.hass?.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_render3D(){if(!this._ctx||!this._canvas3D)return;const e=this._canvas3D,t=this._ctx,i=window.devicePixelRatio||1,a=e.getBoundingClientRect();e.width=a.width*i,e.height=a.height*i,t.scale(i,i);const o=a.width,s=a.height;t.fillStyle="#0a0e14",t.fillRect(0,0,o,s);const r=this._camera,n=r.targetX+r.distance*Math.cos(r.elevation)*Math.sin(r.azimuth),l=r.targetY+r.distance*Math.sin(r.elevation),c=r.targetZ+r.distance*Math.cos(r.elevation)*Math.cos(r.azimuth),d=Math.cos(r.azimuth),h=Math.sin(r.azimuth),p=Math.cos(r.elevation),g=Math.sin(r.elevation),u=this.CAMERA_FOV*Math.PI/180,m=.5*s/Math.tan(u/2),f=o/2,v=s/2,_=(e,t,i)=>{const a=e-n,o=t-l,s=i-c,r=h*a+d*s,u=-(g*o+p*r);return u<=.1?null:{x:f+(d*a-h*s)*m/u,y:v-(p*o-g*r)*m/u,z:u}};this._drawGrid3D(t,_),this._drawFov3D(t,_),this._drawZones3D(t,_),this._drawTargets3D(t,_),this._drawSensor3D(t,_)}_drawGrid3D(e,t){const i=this._detectionRange,a=1e3;e.strokeStyle="rgba(59, 130, 246, 0.15)",e.lineWidth=.5;for(let o=-4e3;o<=4e3;o+=a){const a=t(o,0,0),s=t(o,0,i);a&&s&&(e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(s.x,s.y),e.stroke())}for(let o=0;o<=i;o+=a){const i=t(-4e3,0,o),a=t(4e3,0,o);i&&a&&(e.beginPath(),e.moveTo(i.x,i.y),e.lineTo(a.x,a.y),e.stroke())}e.fillStyle="rgba(148, 163, 184, 0.5)",e.font="11px system-ui, sans-serif";for(let o=a;o<=i;o+=a){const i=t(4200,0,o);i&&e.fillText(o/1e3+"m",i.x,i.y+4)}}_drawFov3D(e,t){const i=this._detectionRange,a=this.FOV_DEG/2*Math.PI/180,o=[{x:0,z:0}];for(let e=-a;e<=a;e+=.05)o.push({x:i*Math.sin(e),z:i*Math.cos(e)});o.push({x:0,z:0}),e.beginPath();let s=!0;for(const i of o){const a=t(i.x,0,i.z);a&&(s?(e.moveTo(a.x,a.y),s=!1):e.lineTo(a.x,a.y))}e.closePath();const r=e.createRadialGradient(e.canvas.width/2/(window.devicePixelRatio||1),e.canvas.height/(window.devicePixelRatio||1),0,e.canvas.width/2/(window.devicePixelRatio||1),e.canvas.height/(window.devicePixelRatio||1),300);r.addColorStop(0,"rgba(59, 130, 246, 0.25)"),r.addColorStop(1,"rgba(59, 130, 246, 0.02)"),e.fillStyle=r,e.fill(),e.strokeStyle="rgba(59, 130, 246, 0.3)",e.lineWidth=1,e.stroke()}_drawZones3D(e,t){const i=this.WALL_HEIGHT;for(const a of this._zones){if(!(0!==a.beginX||0!==a.endX||0!==a.beginY||0!==a.endY))continue;const o=Math.min(a.beginX,a.endX),s=Math.max(a.beginX,a.endX),r=Math.min(a.beginY,a.endY),n=Math.max(a.beginY,a.endY),l=this._selectedZone===a.id,c=[t(o,0,r),t(s,0,r),t(s,0,n),t(o,0,n)].filter(e=>null!==e);if(4===c.length){e.beginPath(),e.moveTo(c[0].x,c[0].y);for(let t=1;t<c.length;t++)e.lineTo(c[t].x,c[t].y);e.closePath(),e.fillStyle=a.color+"30",e.fill(),e.strokeStyle=a.color+"80",e.lineWidth=l?2.5:1.5,e.stroke()}const d=[{pts:[[o,r],[s,r]],label:"front"},{pts:[[s,r],[s,n]],label:"right"},{pts:[[s,n],[o,n]],label:"back"},{pts:[[o,n],[o,r]],label:"left"}];for(const o of d){const[[s,r],[n,c]]=o.pts,d=t(s,0,r),h=t(n,0,c),p=t(s,i,r),g=t(n,i,c);d&&h&&p&&g&&(e.beginPath(),e.moveTo(d.x,d.y),e.lineTo(h.x,h.y),e.lineTo(g.x,g.y),e.lineTo(p.x,p.y),e.closePath(),e.fillStyle=a.color+"20",e.fill(),e.strokeStyle=a.color+(l?"cc":"60"),e.lineWidth=l?2:1,e.stroke())}const h=t((o+s)/2,i+30,(r+n)/2);h&&(e.fillStyle=a.color,e.font="bold 13px system-ui, sans-serif",e.textAlign="center",e.fillText(`Zone ${a.id}`,h.x,h.y))}}_drawTargets3D(e,t){for(const i of this._targets){if(!i.active)continue;const a=170;if(!t(i.x,a/2,i.y))continue;const o=t(i.x,a,i.y),s=t(i.x,0,i.y);o&&s&&(e.strokeStyle="#22c55e",e.lineWidth=8,e.lineCap="round",e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(o.x,o.y),e.stroke(),e.fillStyle="#22c55e",e.beginPath(),e.arc(o.x,o.y,12,0,2*Math.PI),e.fill(),e.shadowColor="#22c55e",e.shadowBlur=20,e.beginPath(),e.arc(o.x,o.y,8,0,2*Math.PI),e.fill(),e.shadowBlur=0,e.fillStyle="#22c55e",e.font="bold 11px system-ui, sans-serif",e.textAlign="center",e.fillText(`T${i.id}`,o.x,o.y-20));const r=t(i.x,0,i.y);r&&(e.beginPath(),e.arc(r.x,r.y,6,0,2*Math.PI),e.fillStyle="rgba(34, 197, 94, 0.5)",e.fill())}}_drawSensor3D(e,t){const i=t(0,10,0);i&&(e.fillStyle="#3b82f6",e.shadowColor="#3b82f6",e.shadowBlur=15,e.beginPath(),e.arc(i.x,i.y,10,0,2*Math.PI),e.fill(),e.shadowBlur=0,e.fillStyle="#60a5fa",e.beginPath(),e.arc(i.x,i.y,4,0,2*Math.PI),e.fill(),e.fillStyle="rgba(148, 163, 184, 0.7)",e.font="10px system-ui, sans-serif",e.textAlign="center",e.fillText("SENSOR",i.x,i.y+25))}_toSvg(e,t){const i=this._detectionRange,a=this._canvasWidth/2,o=this._canvasHeight-40,s=(this._canvasHeight-80)/i;return{x:a+e*s,y:o-t*s}}_fromSvg(e,t){const i=this._detectionRange,a=this._canvasWidth/2,o=this._canvasHeight-40,s=(this._canvasHeight-80)/i;return{x:(e-a)/s,y:(o-t)/s}}_getSvgPoint(e){const t=this.shadowRoot?.querySelector(".editor-svg");if(!t)return{x:0,y:0};const i=t.getBoundingClientRect(),a=e.clientX-i.left,o=e.clientY-i.top;return{x:a*(this._canvasWidth/i.width),y:o*(this._canvasHeight/i.height)}}_handleMouseDown(e,t,i){e.stopPropagation(),e.preventDefault();const a=this._zones.find(e=>e.id===t);a&&(this._selectedZone=t,this._dragMode=i,this._dragStart={...this._getSvgPoint(e),zone:{...a}},window.addEventListener("mousemove",this._handleMouseMove),window.addEventListener("mouseup",this._handleMouseUp))}async _saveAllZones(){if(this.hass&&this.entityPrefix){this._saving=!0;try{const e=[];for(const t of this._zones){const i={...t,beginX:Math.max(-4e3,Math.min(4e3,t.beginX)),endX:Math.max(-4e3,Math.min(4e3,t.endX)),beginY:Math.max(0,Math.min(6e3,t.beginY)),endY:Math.max(0,Math.min(6e3,t.endY))};e.push(this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_begin_x`,value:i.beginX}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_end_x`,value:i.endX}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_begin_y`,value:i.beginY}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_end_y`,value:i.endY}))}await Promise.all(e),this._hasChanges=!1}catch(e){console.error("Failed to save zones:",e)}finally{this._saving=!1}}}_close(){this._stopLiveUpdates(),this._stopAnimation(),this.dispatchEvent(new CustomEvent("close"))}_renderGrid(){const e=[],t=[],i=this._detectionRange;for(let a=1e3;a<=i;a+=1e3){const o=this._toSvg(0,a),s=(this._canvasHeight-80)*(a/i);e.push(V`
        <circle
          cx="${this._canvasWidth/2}"
          cy="${this._canvasHeight-40}"
          r="${s}"
          class="grid-line"
          fill="none"
        />
      `),t.push(V`
        <text x="${this._canvasWidth-15}" y="${o.y+4}" class="grid-label" text-anchor="end">
          ${a/1e3}m
        </text>
      `)}return e.push(V`
      <line
        x1="${this._canvasWidth/2}"
        y1="${this._canvasHeight-40}"
        x2="${this._canvasWidth/2}"
        y2="20"
        class="grid-line"
      />
    `),[...e,...t]}_renderCoverageArc(){const e=this._canvasWidth/2,t=this._canvasHeight-40,i=this._detectionRange,a=(this._canvasHeight-80)*(i/i),o=this.FOV_DEG/2*Math.PI/180,s=e+a*Math.sin(-o),r=t-a*Math.cos(-o),n=e+a*Math.sin(o),l=t-a*Math.cos(o);return V`
      <defs>
        <radialGradient id="coverageGradient" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stop-color="rgba(59, 130, 246, 0.35)" />
          <stop offset="100%" stop-color="rgba(59, 130, 246, 0.02)" />
        </radialGradient>
      </defs>
      <path
        class="coverage-arc"
        d="M ${e} ${t} L ${s} ${r} A ${a} ${a} 0 0 1 ${n} ${l} Z"
      />
    `}_renderTargets(){return this._targets.filter(e=>e.active).map(e=>{const t=this._toSvg(e.x,e.y);return V`
        <g class="target-marker">
          <circle class="target-pulse" cx="${t.x}" cy="${t.y}" r="6" />
          <circle cx="${t.x}" cy="${t.y}" r="8" fill="#22c55e" />
          <circle cx="${t.x}" cy="${t.y}" r="4" fill="#4ade80" />
          <text x="${t.x}" y="${t.y-15}" fill="#22c55e" font-size="11" font-weight="bold" text-anchor="middle">
            T${e.id}
          </text>
        </g>
      `})}_renderZone(e){if(!(0!==e.beginX||0!==e.endX||0!==e.beginY||0!==e.endY))return Z;const t=this._toSvg(Math.min(e.beginX,e.endX),Math.max(e.beginY,e.endY)),i=this._toSvg(Math.max(e.beginX,e.endX),Math.min(e.beginY,e.endY)),a=t.x,o=t.y,s=i.x-t.x,r=i.y-t.y,n=this._selectedZone===e.id,l=n?[{name:"nw",x:a,y:o},{name:"ne",x:a+s,y:o},{name:"sw",x:a,y:o+r},{name:"se",x:a+s,y:o+r},{name:"n",x:a+s/2,y:o},{name:"s",x:a+s/2,y:o+r},{name:"w",x:a,y:o+r/2},{name:"e",x:a+s,y:o+r/2}]:[];return V`
      <g>
        <rect
          x="${a}" y="${o}"
          width="${s}" height="${r}"
          fill="${e.color}35"
          stroke="${e.color}"
          stroke-width="${n?3:2}"
          rx="6"
          class="zone-rect ${n?"selected":""}"
          @mousedown=${t=>this._handleMouseDown(t,e.id,"move")}
        />
        <text
          x="${a+s/2}" y="${o+22}"
          fill="white"
          font-size="13"
          font-weight="700"
          text-anchor="middle"
          pointer-events="none"
          style="text-shadow: 0 2px 6px rgba(0,0,0,0.9)"
        >
          Zone ${e.id}
        </text>
        ${l.map(t=>V`
          <circle
            cx="${t.x}" cy="${t.y}"
            r="${8}"
            class="resize-handle ${t.name}"
            stroke="${e.color}"
            @mousedown=${i=>this._handleMouseDown(i,e.id,`resize-${t.name}`)}
          />
        `)}
      </g>
    `}render(){return this.isOpen?G`
      <div class="modal-overlay" @click=${e=>e.target===e.currentTarget&&this._close()}>
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              <ha-icon icon="mdi:vector-square-edit"></ha-icon>
              Zone Editor - ${this.deviceName||"UltimateSensor"}
            </div>
            <button class="close-btn" @click=${this._close}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>

          <div class="editor-container">
            <div class="canvas-section">
              <div class="view-toggle">
                <button 
                  class="view-toggle-btn ${"2d"===this._viewMode?"active":""}"
                  @click=${()=>this._viewMode="2d"}
                >
                  2D
                </button>
                <button 
                  class="view-toggle-btn ${"3d"===this._viewMode?"active":""}"
                  @click=${()=>this._viewMode="3d"}
                >
                  3D
                </button>
              </div>

              <div class="canvas-container">
                <!-- 2D SVG View -->
                <svg
                  class="editor-svg ${"3d"===this._viewMode?"hidden":""}"
                  viewBox="0 0 ${this._canvasWidth} ${this._canvasHeight}"
                  @click=${()=>this._selectedZone=null}
                >
                  ${this._renderGrid()}
                  ${this._renderCoverageArc()}
                  ${this._zones.map(e=>this._renderZone(e))}
                  ${this._renderTargets()}

                  <!-- Sensor marker -->
                  <circle class="sensor-pulse" cx="${this._canvasWidth/2}" cy="${this._canvasHeight-40}" r="8" />
                  <circle cx="${this._canvasWidth/2}" cy="${this._canvasHeight-40}" r="10" class="sensor-marker" />
                  <circle cx="${this._canvasWidth/2}" cy="${this._canvasHeight-40}" r="4" fill="#60a5fa" />
                  <text x="${this._canvasWidth/2}" y="${this._canvasHeight-15}" fill="rgba(148,163,184,0.7)" font-size="10" text-anchor="middle" font-weight="600">SENSOR</text>
                </svg>

                <!-- 3D Canvas View -->
                <canvas class="canvas-3d ${"2d"===this._viewMode?"hidden":""}"></canvas>

                ${"3d"===this._viewMode?G`
                  <div class="help-overlay">
                    <div class="help-item">
                      <span class="help-key">Drag</span>
                      <span>Rotate</span>
                    </div>
                    <div class="help-item">
                      <span class="help-key">Shift+Drag</span>
                      <span>Pan</span>
                    </div>
                    <div class="help-item">
                      <span class="help-key">Scroll</span>
                      <span>Zoom</span>
                    </div>
                  </div>
                `:Z}
              </div>
            </div>

            <div class="sidebar">
              <div>
                <div class="section-title">Zones</div>
                <div class="zone-list">
                  ${this._zones.map(e=>{const t=0!==e.beginX||0!==e.endX||0!==e.beginY||0!==e.endY;return G`
                      <div
                        class="zone-item ${this._selectedZone===e.id?"selected":""}"
                        @click=${()=>this._selectedZone=e.id}
                      >
                        <div class="zone-color" style="background: ${e.color}"></div>
                        <span class="zone-name">Zone ${e.id}</span>
                        <span class="zone-status ${t?"":"inactive"}">${t?"Actief":"Leeg"}</span>
                      </div>
                    `})}
                </div>
              </div>

              <div class="info-card">
                <h4>Live Targets</h4>
                ${this._targets.filter(e=>e.active).length>0?this._targets.filter(e=>e.active).map(e=>G`
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></div>
                        <span style="color: #e2e8f0; font-size: 0.85rem;">Target ${e.id}: ${Math.round(e.x)}mm, ${Math.round(e.y)}mm</span>
                      </div>
                    `):G`<span style="color: #64748b; font-size: 0.85rem;">Geen actieve targets</span>`}
              </div>

              <div class="info-card">
                <h4>${"3d"===this._viewMode?"3D Controls":"Instructies"}</h4>
                <ul>
                  ${"3d"===this._viewMode?G`
                    <li>Sleep om te roteren</li>
                    <li>Shift + sleep om te pannen</li>
                    <li>Scroll om te zoomen</li>
                    <li>Zones bewerken in 2D modus</li>
                  `:G`
                    <li>Klik op een zone om te selecteren</li>
                    <li>Sleep de zone om te verplaatsen</li>
                    <li>Gebruik de handles om te resizen</li>
                    <li>Coördinaten snappen naar 100mm</li>
                  `}
                </ul>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <div class="changes-badge">
              ${this._hasChanges?G`
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                Onopgeslagen wijzigingen
              `:Z}
            </div>
            <div class="btn-group">
              <button class="btn btn-secondary" @click=${this._loadZones}>Reset</button>
              <button class="btn btn-primary" @click=${this._saveAllZones} ?disabled=${!this._hasChanges||this._saving}>
                ${this._saving?"Opslaan...":"Opslaan naar sensor"}
              </button>
            </div>
          </div>
        </div>
      </div>
    `:Z}};We.styles=n`
    :host { display: block; }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.92);
      backdrop-filter: blur(12px);
      z-index: 1001;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal {
      background: linear-gradient(165deg, #0f1419 0%, #1a1f2e 50%, #0d1117 100%);
      border-radius: 24px;
      width: 95%;
      max-width: 1000px;
      max-height: 92vh;
      overflow: hidden;
      box-shadow: 
        0 50px 100px rgba(0, 0, 0, 0.7),
        0 0 0 1px rgba(255, 255, 255, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(30px) scale(0.97);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 28px;
      background: linear-gradient(135deg, 
        rgba(59, 130, 246, 0.15) 0%, 
        rgba(139, 92, 246, 0.1) 50%,
        rgba(236, 72, 153, 0.08) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 14px;
      color: #f0f4f8;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .modal-title ha-icon {
      color: #60a5fa;
    }

    .close-btn {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.1);
      color: #94a3b8;
      width: 40px; height: 40px;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: rgba(255,255,255,0.12);
      color: #f0f4f8;
      transform: scale(1.05);
    }

    .editor-container {
      display: flex;
      gap: 20px;
      padding: 24px;
    }

    .canvas-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .view-toggle {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      width: fit-content;
      align-self: flex-end;
    }

    .view-toggle-btn {
      padding: 8px 20px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .view-toggle-btn.active {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }

    .view-toggle-btn:not(.active):hover {
      background: rgba(255, 255, 255, 0.08);
      color: #94a3b8;
    }

    .canvas-container {
      position: relative;
      background: linear-gradient(180deg, #0a0e14 0%, #0f1419 100%);
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.06);
      box-shadow: 
        inset 0 2px 20px rgba(0, 0, 0, 0.4),
        0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .editor-svg {
      width: 100%;
      height: 450px;
      cursor: crosshair;
      display: block;
    }

    .canvas-3d {
      width: 100%;
      height: 450px;
      cursor: grab;
      display: block;
    }

    .canvas-3d:active {
      cursor: grabbing;
    }

    .canvas-3d.hidden {
      display: none;
    }

    .editor-svg.hidden {
      display: none;
    }

    .zone-rect {
      cursor: move;
      transition: opacity 0.15s;
    }

    .zone-rect:hover {
      opacity: 0.9;
    }

    .zone-rect.selected {
      stroke-width: 3;
    }

    .resize-handle {
      fill: white;
      stroke-width: 2;
      cursor: pointer;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .resize-handle.nw, .resize-handle.se { cursor: nwse-resize; }
    .resize-handle.ne, .resize-handle.sw { cursor: nesw-resize; }
    .resize-handle.n, .resize-handle.s { cursor: ns-resize; }
    .resize-handle.e, .resize-handle.w { cursor: ew-resize; }

    .sidebar {
      width: 240px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 8px;
    }

    .zone-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .zone-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .zone-item:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateX(2px);
    }

    .zone-item.selected {
      border-color: rgba(59, 130, 246, 0.6);
      background: rgba(59, 130, 246, 0.1);
    }

    .zone-color {
      width: 18px;
      height: 18px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .zone-name {
      flex: 1;
      font-weight: 600;
      font-size: 0.9rem;
      color: #e2e8f0;
    }

    .zone-status {
      font-size: 0.7rem;
      padding: 4px 8px;
      border-radius: 6px;
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      font-weight: 600;
    }

    .zone-status.inactive {
      background: rgba(100, 116, 139, 0.15);
      color: #64748b;
    }

    .info-card {
      padding: 16px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .info-card h4 {
      margin: 0 0 12px 0;
      color: #e2e8f0;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .info-card ul {
      margin: 0;
      padding-left: 18px;
      color: #94a3b8;
      font-size: 0.8rem;
      line-height: 1.7;
    }

    .info-card li {
      margin-bottom: 4px;
    }

    .range-control {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .range-input {
      flex: 1;
      padding: 10px 14px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #e2e8f0;
      font-size: 0.9rem;
      width: 80px;
    }

    .range-input:focus {
      outline: none;
      border-color: rgba(59, 130, 246, 0.5);
    }

    .range-unit {
      color: #64748b;
      font-size: 0.85rem;
    }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 28px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      background: rgba(0, 0, 0, 0.2);
    }

    .changes-badge {
      font-size: 0.85rem;
      color: #f59e0b;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .btn-group {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 25px rgba(59, 130, 246, 0.45);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Grid styling */
    .grid-line {
      stroke: rgba(59, 130, 246, 0.12);
      stroke-width: 0.5;
    }

    .grid-label {
      fill: rgba(148, 163, 184, 0.6);
      font-size: 11px;
      font-weight: 500;
    }

    /* Sensor marker */
    .sensor-marker {
      fill: #3b82f6;
      filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.6));
    }

    .sensor-pulse {
      fill: none;
      stroke: #3b82f6;
      stroke-width: 2;
      animation: pulse 2s ease-out infinite;
    }

    @keyframes pulse {
      0% { 
        r: 8; 
        opacity: 0.8;
        stroke-width: 2;
      }
      100% { 
        r: 30; 
        opacity: 0;
        stroke-width: 0.5;
      }
    }

    /* Coverage arc */
    .coverage-arc {
      fill: url(#coverageGradient);
      stroke: rgba(59, 130, 246, 0.3);
      stroke-width: 1;
    }

    /* Target markers */
    .target-marker {
      filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.7));
    }

    .target-pulse {
      fill: none;
      stroke: #22c55e;
      animation: targetPulse 1.5s ease-out infinite;
    }

    @keyframes targetPulse {
      0% { r: 6; opacity: 0.7; }
      100% { r: 18; opacity: 0; }
    }

    /* 3D help overlay */
    .help-overlay {
      position: absolute;
      bottom: 16px;
      left: 16px;
      display: flex;
      gap: 16px;
      padding: 10px 16px;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      border-radius: 10px;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .help-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .help-key {
      padding: 3px 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      font-weight: 600;
      color: #e2e8f0;
    }
  `,e([ue({attribute:!1})],We.prototype,"hass",void 0),e([ue()],We.prototype,"entityPrefix",void 0),e([ue()],We.prototype,"deviceName",void 0),e([ue({type:Boolean})],We.prototype,"isOpen",void 0),e([ue({type:Number})],We.prototype,"maxDistance",void 0),e([me()],We.prototype,"_zones",void 0),e([me()],We.prototype,"_targets",void 0),e([me()],We.prototype,"_selectedZone",void 0),e([me()],We.prototype,"_dragMode",void 0),e([me()],We.prototype,"_dragStart",void 0),e([me()],We.prototype,"_saving",void 0),e([me()],We.prototype,"_hasChanges",void 0),e([me()],We.prototype,"_viewMode",void 0),e([me()],We.prototype,"_detectionRange",void 0),We=e([he("smarthomeshop-zone-editor")],We);const Ne=n`
  .form-row {
    margin-bottom: 16px;
  }
  label {
    display: block;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--primary-text-color);
  }
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 8px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-size: 14px;
    cursor: pointer;
  }
  select:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .checkbox-row input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  .checkbox-row label {
    margin-bottom: 0;
    cursor: pointer;
  }
  .info {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-top: 8px;
  }
  .device-info {
    margin-top: 8px;
    padding: 10px;
    background: var(--secondary-background-color);
    border-radius: 8px;
    font-size: 12px;
  }
  .device-info span {
    color: var(--secondary-text-color);
  }
  .divider {
    height: 1px;
    background: var(--divider-color, #e0e0e0);
    margin: 16px 0;
  }
  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--secondary-text-color);
    margin-bottom: 10px;
  }
  .feature-info {
    font-size: 11px;
    color: var(--secondary-text-color);
    margin-left: 26px;
    margin-top: -4px;
    margin-bottom: 8px;
  }
`;function Le(e){if(!e)return[];const t=new Map,i=[{pattern:"waterp1meterkit",type:"WaterP1MeterKit"},{pattern:"watermeterkit",type:"WaterMeterKit"},{pattern:"waterflowkit",type:"WaterFlowKit"}];return Object.keys(e.states).forEach(a=>{const o=e.states[a],s=(o?.attributes?.friendly_name||"").toLowerCase(),r=a.toLowerCase();for(const{pattern:e,type:a}of i)if(s.includes(e)||r.includes(e)){const i=r.match(new RegExp(`${e}[_-]?([a-f0-9]{6})`)),s=i?i[1]:e;if(!t.has(s)){const e=(o?.attributes?.friendly_name||"").split(" ").slice(0,2).join(" ")||`${a} ${s.toUpperCase()}`;t.set(s,{id:s,name:e,type:a})}break}}),Array.from(t.values())}let Ue=class extends ce{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&(this._devices=Le(this.hass).filter(e=>"WaterMeterKit"===e.type||"WaterFlowKit"===e.type))}_valueChanged(e,t){if(this._config[e]===t)return;const i={...this._config,[e]:t};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){const e=this._devices.find(e=>e.id===this._config.device_id);return G`
      <div class="form-row">
        <label>Device</label>
        <select
          @change=${e=>this._valueChanged("device_id",e.target.value||void 0)}
        >
          <option value="">Auto detect</option>
          ${this._devices.map(e=>G`
              <option value=${e.id} ?selected=${e.id===this._config.device_id}>
                ${e.name} (${e.type})
              </option>
            `)}
        </select>
        ${e?G`
              <div class="device-info">
                <span>Type:</span> ${e.type}<br />
                <span>ID:</span> ${e.id.toUpperCase()}
              </div>
            `:Z}
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <label>Options</label>
        <div class="checkbox-row">
          <input
            type="checkbox"
            id="show_graph"
            .checked=${!1!==this._config.show_graph}
            @change=${e=>this._valueChanged("show_graph",e.target.checked)}
          />
          <label for="show_graph">Show 24-hour graph</label>
        </div>
        <div class="info">
          If no device is selected, entities are automatically detected.
          Click on the graph to open full Home Assistant history.
        </div>
      </div>
    `}};Ue.styles=Ne,e([ue({attribute:!1})],Ue.prototype,"hass",void 0),e([me()],Ue.prototype,"_config",void 0),e([me()],Ue.prototype,"_devices",void 0),Ue=e([he("smarthomeshop-water-card-editor")],Ue);let Oe=class extends ce{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&(this._devices=Le(this.hass).filter(e=>"WaterP1MeterKit"===e.type))}_valueChanged(e,t){if(this._config[e]===t)return;const i={...this._config,[e]:t};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){const e=this._devices.find(e=>e.id===this._config.device_id);return G`
      <div class="form-row">
        <label>Device</label>
        <select
          @change=${e=>this._valueChanged("device_id",e.target.value||void 0)}
        >
          <option value="">Auto detect</option>
          ${this._devices.map(e=>G`
              <option value=${e.id} ?selected=${e.id===this._config.device_id}>
                ${e.name}
              </option>
            `)}
        </select>
        ${e?G`
              <div class="device-info">
                <span>Type:</span> ${e.type}<br />
                <span>ID:</span> ${e.id.toUpperCase()}
              </div>
            `:Z}
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Sections</div>
        <div class="checkbox-row">
          <input
            type="checkbox"
            id="show_water"
            .checked=${!1!==this._config.show_water}
            @change=${e=>this._valueChanged("show_water",e.target.checked)}
          />
          <label for="show_water">Show water section</label>
        </div>
        <div class="checkbox-row">
          <input
            type="checkbox"
            id="show_energy"
            .checked=${!1!==this._config.show_energy}
            @change=${e=>this._valueChanged("show_energy",e.target.checked)}
          />
          <label for="show_energy">Show energy section</label>
        </div>
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Options</div>
        <div class="checkbox-row">
          <input
            type="checkbox"
            id="show_graph"
            .checked=${!1!==this._config.show_graph}
            @change=${e=>this._valueChanged("show_graph",e.target.checked)}
          />
          <label for="show_graph">Show 24-hour graph</label>
        </div>
        <div class="info">
          Click on the graph to open full Home Assistant history.
        </div>
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Hardware Features (V3)</div>
        <div class="checkbox-row">
          <input
            type="checkbox"
            id="has_water_leak_sensor"
            .checked=${!0===this._config.has_water_leak_sensor}
            @change=${e=>this._valueChanged("has_water_leak_sensor",e.target.checked)}
          />
          <label for="has_water_leak_sensor">I have a water leak sensor connected</label>
        </div>
        <div class="feature-info">
          Enable this if you have connected the optional water leak sensor to your WaterP1MeterKit V3.
          When enabled, the card will show the sensor status and flash a red alert when water is detected.
        </div>
      </div>
    `}};Oe.styles=Ne,e([ue({attribute:!1})],Oe.prototype,"hass",void 0),e([me()],Oe.prototype,"_config",void 0),e([me()],Oe.prototype,"_devices",void 0),Oe=e([he("smarthomeshop-waterp1-card-editor")],Oe);console.info("%c SMARTHOMESHOP-CARDS %c 6.6.1 ","color: white; background: #2196f3; font-weight: bold; padding: 2px 4px; border-radius: 4px 0 0 4px;","color: #2196f3; background: #e3f2fd; font-weight: bold; padding: 2px 4px; border-radius: 0 4px 4px 0;"),window.customCards=window.customCards||[],window.customCards.push({type:"smarthomeshop-water-card",name:"SmartHomeShop Water Card",description:"Water monitoring voor WaterMeterKit en WaterFlowKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-waterp1-card",name:"SmartHomeShop WaterP1 Card",description:"Water + Energy monitoring voor WaterP1MeterKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-ultimatesensor-card",name:"SmartHomeShop UltimateSensor Card",description:"Presence detection & omgevingssensoren voor UltimateSensor en UltimateSensor Mini",preview:!0,documentationURL:"https://docs.smarthomeshop.io/en/ultimatesensor/home-assistant-card"}),window.customCards.push({type:"smarthomeshop-waterflowkit-card",name:"SmartHomeShop WaterFlowKit Card",description:"Dual flow water monitoring met geanimeerde leidingen voor WaterFlowKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),console.log("SmartHomeShop.io Cards loaded successfully!");export{Ae as SmartHomeShopSensorSettings,Te as SmartHomeShopUltimateSensorCard,ke as SmartHomeShopWaterCard,De as SmartHomeShopWaterFlowKitCard,Ee as SmartHomeShopWaterFlowKitCardEditor,$e as SmartHomeShopWaterP1Card,We as SmartHomeShopZoneEditor};
