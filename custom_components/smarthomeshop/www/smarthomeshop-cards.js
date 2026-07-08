/* SmartHomeShop.io Cards v0.0.8 - Build: 2026-07-06T08:00:33.551Z */
function e(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),a=new WeakMap;let r=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=a.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&a.set(t,e))}return e}toString(){return this.cssText}};const s=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[o+1],e[0]);return new r(i,e,o)},n=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new r("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:g}=Object,u=globalThis,m=u.trustedTypes,f=m?m.emptyScript:"",v=u.reactiveElementPolyfillSupport,_=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?f:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},b=(e,t)=>!l(e,t),x={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:b};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(e,i,t);void 0!==o&&c(this.prototype,e,o)}}static getPropertyDescriptor(e,t,i){const{get:o,set:a}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const r=o?.call(this);a?.call(this,t),this.requestUpdate(e,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const e=g(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const e=this.properties,t=[...h(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(i)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of o){const o=document.createElement("style"),a=t.litNonce;void 0!==a&&o.setAttribute("nonce",a),o.textContent=i.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,i);if(void 0!==o&&!0===i.reflect){const a=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(t,i.type);this._$Em=e,null==a?this.removeAttribute(o):this.setAttribute(o,a),this._$Em=null}}_$AK(e,t){const i=this.constructor,o=i._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=i.getPropertyOptions(o),a="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=o;const r=a.fromAttribute(t,e.type);this[o]=r??this._$Ej?.get(o)??r,this._$Em=null}}requestUpdate(e,t,i,o=!1,a){if(void 0!==e){const r=this.constructor;if(!1===o&&(a=this[e]),i??=r.getPropertyOptions(e),!((i.hasChanged??b)(a,t)||i.useDefault&&i.reflect&&a===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:o,wrapped:a},r){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),!0!==a||void 0!==r)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,i,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[_("elementProperties")]=new Map,w[_("finalized")]=new Map,v?.({ReactiveElement:w}),(u.reactiveElementVersions??=[]).push("2.1.2");const k=globalThis,$=e=>e,S=k.trustedTypes,M=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,z="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+C,E=`<${P}>`,T=document,D=()=>T.createComment(""),A=e=>null===e||"object"!=typeof e&&"function"!=typeof e,I=Array.isArray,W="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,L=/-->/g,U=/>/g,O=RegExp(`>|${W}(?:([^\\s"'>=/]+)(${W}*=${W}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),R=/'/g,F=/"/g,H=/^(?:script|style|textarea|title)$/i,j=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),G=j(1),V=j(2),Y=Symbol.for("lit-noChange"),Z=Symbol.for("lit-nothing"),q=new WeakMap,X=T.createTreeWalker(T,129);function B(e,t){if(!I(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==M?M.createHTML(t):t}const K=(e,t)=>{const i=e.length-1,o=[];let a,r=2===t?"<svg>":3===t?"<math>":"",s=N;for(let t=0;t<i;t++){const i=e[t];let n,l,c=-1,d=0;for(;d<i.length&&(s.lastIndex=d,l=s.exec(i),null!==l);)d=s.lastIndex,s===N?"!--"===l[1]?s=L:void 0!==l[1]?s=U:void 0!==l[2]?(H.test(l[2])&&(a=RegExp("</"+l[2],"g")),s=O):void 0!==l[3]&&(s=O):s===O?">"===l[0]?(s=a??N,c=-1):void 0===l[1]?c=-2:(c=s.lastIndex-l[2].length,n=l[1],s=void 0===l[3]?O:'"'===l[3]?F:R):s===F||s===R?s=O:s===L||s===U?s=N:(s=O,a=void 0);const h=s===O&&e[t+1].startsWith("/>")?" ":"";r+=s===N?i+E:c>=0?(o.push(n),i.slice(0,c)+z+i.slice(c)+C+h):i+C+(-2===c?t:h)}return[B(e,r+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class Q{constructor({strings:e,_$litType$:t},i){let o;this.parts=[];let a=0,r=0;const s=e.length-1,n=this.parts,[l,c]=K(e,t);if(this.el=Q.createElement(l,i),X.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=X.nextNode())&&n.length<s;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(z)){const t=c[r++],i=o.getAttribute(e).split(C),s=/([.?@])?(.*)/.exec(t);n.push({type:1,index:a,name:s[2],strings:i,ctor:"."===s[1]?oe:"?"===s[1]?ae:"@"===s[1]?re:ie}),o.removeAttribute(e)}else e.startsWith(C)&&(n.push({type:6,index:a}),o.removeAttribute(e));if(H.test(o.tagName)){const e=o.textContent.split(C),t=e.length-1;if(t>0){o.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)o.append(e[i],D()),X.nextNode(),n.push({type:2,index:++a});o.append(e[t],D())}}}else if(8===o.nodeType)if(o.data===P)n.push({type:2,index:a});else{let e=-1;for(;-1!==(e=o.data.indexOf(C,e+1));)n.push({type:7,index:a}),e+=C.length-1}a++}}static createElement(e,t){const i=T.createElement("template");return i.innerHTML=e,i}}function J(e,t,i=e,o){if(t===Y)return t;let a=void 0!==o?i._$Co?.[o]:i._$Cl;const r=A(t)?void 0:t._$litDirective$;return a?.constructor!==r&&(a?._$AO?.(!1),void 0===r?a=void 0:(a=new r(e),a._$AT(e,i,o)),void 0!==o?(i._$Co??=[])[o]=a:i._$Cl=a),void 0!==a&&(t=J(e,a._$AS(e,t.values),a,o)),t}class ee{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,o=(e?.creationScope??T).importNode(t,!0);X.currentNode=o;let a=X.nextNode(),r=0,s=0,n=i[0];for(;void 0!==n;){if(r===n.index){let t;2===n.type?t=new te(a,a.nextSibling,this,e):1===n.type?t=new n.ctor(a,n.name,n.strings,this,e):6===n.type&&(t=new se(a,this,e)),this._$AV.push(t),n=i[++s]}r!==n?.index&&(a=X.nextNode(),r++)}return X.currentNode=T,o}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class te{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,o){this.type=2,this._$AH=Z,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=J(this,e,t),A(e)?e===Z||null==e||""===e?(this._$AH!==Z&&this._$AR(),this._$AH=Z):e!==this._$AH&&e!==Y&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>I(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==Z&&A(this._$AH)?this._$AA.nextSibling.data=e:this.T(T.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,o="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Q.createElement(B(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new ee(o,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=q.get(e.strings);return void 0===t&&q.set(e.strings,t=new Q(e)),t}k(e){I(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,o=0;for(const a of e)o===t.length?t.push(i=new te(this.O(D()),this.O(D()),this,this.options)):i=t[o],i._$AI(a),o++;o<t.length&&(this._$AR(i&&i._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=$(e).nextSibling;$(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}let ie=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,o,a){this.type=1,this._$AH=Z,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=a,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Z}_$AI(e,t=this,i,o){const a=this.strings;let r=!1;if(void 0===a)e=J(this,e,t,0),r=!A(e)||e!==this._$AH&&e!==Y,r&&(this._$AH=e);else{const o=e;let s,n;for(e=a[0],s=0;s<a.length-1;s++)n=J(this,o[i+s],t,s),n===Y&&(n=this._$AH[s]),r||=!A(n)||n!==this._$AH[s],n===Z?e=Z:e!==Z&&(e+=(n??"")+a[s+1]),this._$AH[s]=n}r&&!o&&this.j(e)}j(e){e===Z?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}};class oe extends ie{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===Z?void 0:e}}class ae extends ie{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==Z)}}class re extends ie{constructor(e,t,i,o,a){super(e,t,i,o,a),this.type=5}_$AI(e,t=this){if((e=J(this,e,t,0)??Z)===Y)return;const i=this._$AH,o=e===Z&&i!==Z||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,a=e!==Z&&(i===Z||o);o&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class se{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){J(this,e)}}const ne=k.litHtmlPolyfillSupport;ne?.(Q,te),(k.litHtmlVersions??=[]).push("3.3.2");const le=globalThis;let ce=class extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const o=i?.renderBefore??t;let a=o._$litPart$;if(void 0===a){const e=i?.renderBefore??null;o._$litPart$=a=new te(t.insertBefore(D(),e),e,void 0,i??{})}return a._$AI(e),a})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Y}};ce._$litElement$=!0,ce.finalized=!0,le.litElementHydrateSupport?.({LitElement:ce});const de=le.litElementPolyfillSupport;de?.({LitElement:ce}),(le.litElementVersions??=[]).push("4.2.2");const he=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},pe={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:b},ge=(e=pe,t,i)=>{const{kind:o,metadata:a}=i;let r=globalThis.litPropertyMetadata.get(a);if(void 0===r&&globalThis.litPropertyMetadata.set(a,r=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),r.set(i.name,e),"accessor"===o){const{name:o}=i;return{set(i){const a=t.get.call(this);t.set.call(this,i),this.requestUpdate(o,a,e,!0,i)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=i;return function(i){const a=this[o];t.call(this,i),this.requestUpdate(o,a,e,!0,i)}}throw Error("Unsupported decorator location: "+o)};function ue(e){return(t,i)=>"object"==typeof i?ge(e,t,i):((e,t,i)=>{const o=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),o?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function me(e){return ue({...e,state:!0,attribute:!1})}const fe=2;class ve{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}class _e extends ve{constructor(e){if(super(e),this.it=Z,e.type!==fe)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===Z||null==e)return this._t=void 0,this.it=e;if(e===Y)return e;if("string"!=typeof e)throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}_e.directiveName="unsafeHTML",_e.resultType=1;const ye=(e=>(...t)=>({_$litDirective$:e,values:t}))(_e);function be(e,t){return e&&t&&e.states[t]?e.states[t]:null}function xe(e,t,i=0){const o=be(e,t);if(!o||"unavailable"===o.state||"unknown"===o.state)return i;const a=parseFloat(o.state);return isNaN(a)?i:a}function we(e){const t=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"just now";if(t<60)return`${t} min ago`;const i=Math.floor(t/60);if(i<24)return`${i} hour${1===i?"":"s"} ago`;const o=Math.floor(i/24);return`${o} day${1===o?"":"s"} ago`}function ke(e,t=1){return null==e||isNaN(e)?"—":e.toFixed(t)}function $e(e,t){t&&e.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}}))}function Se(e,t=300,i=50){const o=24===e?.length?e:new Array(24).fill(0).map((e,t)=>t>6&&t<9?2:t>17&&t<21?3:.5),a=Math.max(...o,.1),r=o.map(e=>e/a*(i-5));let s="M 0 "+(i-r[0]);return r.forEach((e,o)=>{o>0&&(s+=` L ${o*(t/23)} ${i-e}`)}),s}class Me extends ce{constructor(){super(...arguments),this._config={},this._historyData=null,this._historyLoading=!1,this._showMeterForm=!1,this._meterInput="",this._lastHistoryFetch=0,this._toggleMeterForm=()=>{if(this._showMeterForm=!this._showMeterForm,this._showMeterForm){const e=this._getMeterTotal();this._meterInput=e>0?e.toFixed(3):""}},this._saveMeterReading=async()=>{const e=this._config.meter_initial_entity;if(!this.hass||!e)return;const t=parseFloat(this._meterInput.replace(",","."));isNaN(t)||t<0||(await this.hass.callService("number","set_value",{entity_id:e,value:t}),this._showMeterForm=!1,this._meterInput="")}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_graph:!0,_entitiesResolved:!t&&e._entitiesResolved,...e},t&&(this._lastDeviceId=e.device_id)}getCardSize(){return 5}updated(e){if(super.updated(e),e.has("hass")&&this.hass&&(this._config._entitiesResolved&&this._lastDeviceId===this._config.device_id||(this._autoDetectEntities(),this._lastDeviceId=this._config.device_id),this._config.show_graph&&this._config.flow_entity)){(Date.now()-this._lastHistoryFetch>3e5||!this._historyData)&&this._fetchHistory()}}_findEntity(e,t="sensor",i=!1){if(!this.hass)return"";const o=this._config.device_id,a=["waterp1meterkit","watermeterkit","waterflowkit","smarthomeshop"],r=Object.keys(this.hass.states).find(r=>{if(!r.startsWith(t+"."))return!1;const s=this.hass.states[r];if(!s?.attributes)return!1;const n=(s.attributes.friendly_name||"").toLowerCase(),l=r.toLowerCase(),c=a.some(e=>n.includes(e)||l.includes(e));if(!c)return!1;if(o){if(!(n.includes(o.toLowerCase())||l.includes(o.toLowerCase())))return!1}return i?e.some(e=>l.includes(e.toLowerCase())):e.some(e=>n.includes(e.toLowerCase()))});return r||""}_autoDetectEntities(){if(!this.hass)return;const e=this._config.device_id;if(e){const t=Object.keys(this.hass.states);t.some(t=>t.includes("waterp1meterkit")&&t.includes(e))?this._config._productName="WaterP1MeterKit":t.some(t=>t.includes("watermeterkit")&&t.includes(e))?this._config._productName="WaterMeterKit":t.some(t=>t.includes("waterflowkit")&&t.includes(e))?this._config._productName="WaterFlowKit":this._config._productName="SmartHomeShop"}else{const e=Object.keys(this.hass.states);e.some(e=>e.includes("waterp1meterkit"))?this._config._productName="WaterP1MeterKit":e.some(e=>e.includes("watermeterkit"))?this._config._productName="WaterMeterKit":e.some(e=>e.includes("waterflowkit"))?this._config._productName="WaterFlowKit":this._config._productName="SmartHomeShop"}this._config.flow_entity||(this._config.flow_entity=this._findEntity(["current_usage"],"sensor",!0)||this._findEntity(["current water usage"])),this._config.total_entity||(this._config.total_entity=this._findEntity(["water_meter_total","total_consumption"],"sensor",!0)),this._config.today_entity||(this._config.today_entity=this._findEntity(["usage today"])),this._config.week_entity||(this._config.week_entity=this._findEntity(["usage this week"])),this._config.month_entity||(this._config.month_entity=this._findEntity(["usage this month"])),this._config.year_entity||(this._config.year_entity=this._findEntity(["usage this year"])),this._config.leak_entity||(this._config.leak_entity=this._findEntity(["leak alarm"],"binary_sensor")),this._config.meter_initial_entity||(this._config.meter_initial_entity=this._findEntity(["water_meter_initial"],"number",!0)),this._config._entitiesResolved=!0}async _fetchHistory(){if(!this.hass||!this._config.flow_entity||this._historyLoading)return;this._historyLoading=!0;const e=this._config.flow_entity,t=new Date,i=new Date(t.getTime()-864e5);try{const o=await this.hass.callWS({type:"history/history_during_period",start_time:i.toISOString(),end_time:t.toISOString(),entity_ids:[e],minimal_response:!0,no_attributes:!0,significant_changes_only:!1});o?.[e]&&(this._historyData=function(e){if(!e?.length)return[];const t=new Array(24).fill(null).map(()=>({sum:0,count:0})),i=new Date;return e.forEach(e=>{const o=new Date(e.lu?1e3*e.lu:e.last_updated||0),a=Math.floor((i.getTime()-o.getTime())/36e5),r=23-Math.min(a,23),s=parseFloat(e.s||e.state||"0");!isNaN(s)&&r>=0&&r<24&&(t[r].sum+=s,t[r].count++)}),t.map(e=>e.count>0?e.sum/e.count:0)}(o[e]),this._lastHistoryFetch=Date.now())}catch(e){console.error("SmartHomeShop: Error fetching history:",e)}finally{this._historyLoading=!1}}_getFlowRate(){return xe(this.hass,this._config.flow_entity)}_getTodayUsage(){return xe(this.hass,this._config.today_entity)}_getWeekUsage(){return xe(this.hass,this._config.week_entity)}_getMonthUsage(){return xe(this.hass,this._config.month_entity)}_getYearUsage(){return xe(this.hass,this._config.year_entity)}_getMeterTotal(){return xe(this.hass,this._config.total_entity)}_hasLeak(){const e=be(this.hass,this._config.leak_entity);return"on"===e?.state}_getMaxHistoryValue(){return this._historyData?.length?Math.max(...this._historyData):0}_renderMeterSection(){const e=this._config.total_entity;if(!e)return Z;const t=this._getMeterTotal(),i=Math.floor(t),o=Math.round(1e3*(t-i)),a=i.toString().padStart(6,"0").split(""),r=o.toString().padStart(3,"0").split(""),s=!!this._config.meter_initial_entity,n=parseFloat(this._meterInput.replace(",",".")),l=!isNaN(n)&&n>=0;return G`
      <div class="meter-counter-section">
        <div class="meter-counter-header">
          <div class="meter-counter-title" @click=${()=>$e(this,e)}>
            <ha-icon icon="mdi:counter"></ha-icon>
            Meter reading
          </div>
          ${s?G`
            <div class="meter-counter-calibrate" @click=${this._toggleMeterForm}>
              <ha-icon icon="mdi:pencil"></ha-icon>
              ${this._showMeterForm?"Cancel":"Set reading"}
            </div>
          `:Z}
        </div>
        <div class="meter-counter-display" @click=${()=>$e(this,e)}>
          ${a.map(e=>G`<div class="meter-digit">${e}</div>`)}
          <span class="meter-separator">,</span>
          ${r.map(e=>G`<div class="meter-digit decimal">${e}</div>`)}
          <span class="meter-unit">m³</span>
        </div>
        ${s?Z:G`
          <div class="meter-form">
            <div class="meter-form-help">
              Setting the meter reading is done on the device itself and
              requires the latest firmware. Update the firmware of your kit,
              then the <b>Set reading</b> button appears here.
            </div>
          </div>
        `}
        ${this._showMeterForm?G`
          <div class="meter-form">
            <div class="meter-form-help">
              Enter the reading shown on your physical water meter (in m³,
              e.g. 123.456). It is stored on the device itself and the meter
              keeps counting from there — you only need to do this once, or
              when the values drift apart.
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
                @keydown=${e=>{"Enter"===e.key&&l&&this._saveMeterReading()}}
              />
              <span class="meter-form-unit">m³</span>
              <button class="meter-form-save" ?disabled=${!l} @click=${this._saveMeterReading}>
                Save
              </button>
            </div>
          </div>
        `:Z}
      </div>
    `}}e([ue({attribute:!1})],Me.prototype,"hass",void 0),e([me()],Me.prototype,"_config",void 0),e([me()],Me.prototype,"_historyData",void 0),e([me()],Me.prototype,"_historyLoading",void 0),e([me()],Me.prototype,"_showMeterForm",void 0),e([me()],Me.prototype,"_meterInput",void 0);const ze=s`
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

  .header-icon svg {
    width: 26px;
    height: 26px;
    display: block;
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

  /* Meter reading counter - classic meter look (shared by water cards) */
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
    cursor: pointer;
  }
  .meter-counter-title ha-icon {
    --mdc-icon-size: 18px;
    color: var(--info-color);
  }
  .meter-counter-calibrate {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--info-color);
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .meter-counter-calibrate:hover { opacity: 1; }
  .meter-counter-calibrate ha-icon { --mdc-icon-size: 14px; }

  .meter-counter-display {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3px;
    padding: 12px 0;
    cursor: pointer;
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

  /* Inline "set meter reading" form */
  .meter-form {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .meter-form-help {
    font-size: 12px;
    line-height: 1.5;
    color: var(--secondary-text-color);
    margin-bottom: 10px;
  }
  .meter-form-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .meter-form-row input {
    flex: 1;
    min-width: 0;
    background: var(--secondary-background-color, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.15));
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 15px;
    color: var(--primary-text-color);
    outline: none;
  }
  .meter-form-row input:focus {
    border-color: var(--primary-color);
  }
  .meter-form-unit {
    font-size: 13px;
    color: var(--secondary-text-color);
  }
  .meter-form-save {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    border: none;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .meter-form-save:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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
`,Ce={ultimatesensor:'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 612.9 605.2" style="enable-background:new 0 0 612.9 605.2;" xml:space="preserve"> <g> <g> <g> <path fill="currentColor" d="M581.4,299.4c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5l-23.2,239.8c-2,20.2-20,35.1-40.2,33.1l-312.3-30.2 c-20.2-2-35.1-20-33.1-40.2l12.8-132.4l117,11.3c6,0.6,11.5-3.9,12-9.9c0.3-2.9-0.6-5.8-2.5-8.1c-1.9-2.3-4.5-3.7-7.5-4 l-279.6-27c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4l140.6,13.6l-12.8,132.4 c-3.1,32.3,20.6,61.2,53,64.3l312.3,30.2c1.9,0.2,3.8,0.3,5.7,0.3c13.6,0,26.7-4.7,37.4-13.5c12.2-10,19.7-24.1,21.2-39.8 l23.3-240c0.3-2.9-0.6-5.8-2.5-8.1C587,301.1,584.4,299.7,581.4,299.4z"/> <path fill="currentColor" d="M559.2,30.9l-62.3-6c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.6,6.1,3.9,11.5,9.9,12l62.3,6 c20.2,2,35.1,20,33.1,40.2l-14.6,151.2c-0.3,2.9,0.6,5.8,2.5,8.1s4.5,3.7,7.5,4c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10 l14.6-151.2C615.3,62.9,591.6,34.1,559.2,30.9z"/> <path fill="currentColor" d="M285.4,430.9l-5.7,59.1c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4l131.9,12.7c0.4,0,0.7,0.1,1.1,0.1 c5.6,0,10.4-4.3,11-10l5.7-59.1c0.6-6.1-3.9-11.5-9.9-12L297.4,421C291.4,420.4,285.9,424.9,285.4,430.9z M416.2,454.7l-3.6,37.1 l-110-10.6l3.7-37.2L416.2,454.7z"/> <path fill="currentColor" d="M495.4,200.8l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1 l1.6-16.3c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C496,199.7,495.5,200.2,495.4,200.8z"/> <path fill="currentColor" d="M393.8,112.6c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10l0,0l3.6-37.4c0.3-2.9-0.6-5.8-2.5-8.1 s-4.5-3.7-7.5-4c-6-0.6-11.5,3.9-12,9.9l-3.6,37.4C383.3,106.7,387.7,112.1,393.8,112.6z"/> <path fill="currentColor" d="M326.8,120.2c1.8,3,4.9,5,8.5,5.4l0,0c0.4,0,0.7,0.1,1.1,0.1c2,0,3.9-0.5,5.6-1.5c2.5-1.5,4.3-3.9,5.1-6.7 c0.7-2.9,0.3-5.8-1.2-8.4l-19.1-32.4c-1.5-2.5-3.9-4.3-6.7-5.1c-2.8-0.7-5.8-0.3-8.4,1.2c-2.5,1.5-4.3,3.9-5.1,6.7 c-0.7,2.9-0.3,5.8,1.2,8.4L326.8,120.2z"/> <path fill="currentColor" d="M301,149.4l-34.5-15c-5.6-2.4-12.1,0.1-14.5,5.7c-1.2,2.7-1.2,5.7-0.2,8.4c1.1,2.7,3.2,4.9,5.9,6.1l34.5,15 c1.1,0.5,2.2,0.8,3.3,0.9l0,0c0.4,0,0.7,0.1,1.1,0.1c4.4,0,8.3-2.6,10.1-6.6C309.2,158.3,306.6,151.8,301,149.4z"/> <path fill="currentColor" d="M470.8,171.3c-1.6,2.5-2.1,5.4-1.5,8.3c1,4.7,4.9,8.1,9.7,8.6c0.3,0,0.7,0.1,1,0.1c0.8,0,1.6-0.1,2.4-0.3 l36.7-8.1c5.9-1.3,9.7-7.2,8.4-13.2c-0.6-2.9-2.4-5.3-4.8-6.9c-2.5-1.6-5.4-2.1-8.3-1.5l0,0l-36.7,8.1 C474.9,167.1,472.4,168.8,470.8,171.3z"/> <path fill="currentColor" d="M443.2,249.2c13.6-15.4,20.4-35.2,19.2-55.8c-1.3-20.6-10.4-39.4-25.8-53s-35.2-20.5-55.7-19.2 c-20.6,1.3-39.4,10.4-53,25.8c-16.3,18.4-22.7,42.7-17.8,66.7c1.2,5.9,7.1,9.8,13,8.6l0,0c6-1.2,9.8-7.1,8.6-13 c-3.5-17.2,1.1-34.5,12.7-47.6c9.7-11,23.2-17.5,37.8-18.4c14.7-0.9,28.8,4,39.8,13.7s17.5,23.2,18.4,37.8 c0.9,14.7-4,28.8-13.7,39.8c-18.8,21.3-51.4,24.6-74.1,7.6c-4.9-3.6-11.8-2.7-15.4,2.2c-1.8,2.4-2.5,5.3-2.1,8.2s1.9,5.5,4.3,7.3 c11.2,8.4,24.5,13.5,38.5,14.9c2.5,0.2,5,0.4,7.5,0.4C407.4,275.1,428.6,265.7,443.2,249.2z"/> <path fill="currentColor" d="M438.7,126.2c0.2,2.9,1.5,5.6,3.7,7.6c1.8,1.6,3.9,2.5,6.2,2.7c0.4,0,0.7,0.1,1.1,0.1c3.1,0,6.2-1.3,8.3-3.7 l24.9-28.1c2-2.2,2.9-5,2.8-8c-0.2-2.9-1.5-5.6-3.7-7.6s-5-2.9-8-2.8c-2.9,0.2-5.6,1.5-7.6,3.7l-24.9,28.1 C439.5,120.5,438.6,123.3,438.7,126.2z"/> <path fill="currentColor" d="M67.4,281.8L67.4,281.8l103.4,10c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10l21.8-226 c0.9-9.8,5.7-18.6,13.3-24.9s17.2-9.2,27-8.3l201.7,19.5c6.1,0.6,11.5-3.9,12-9.9c0.6-6.1-3.9-11.5-9.9-12L247,0.8 c-32.3-3.1-61.2,20.6-64.3,53l-20.8,215.1L69.5,260c-6.1-0.6-11.5,3.9-12,9.9C56.9,275.9,61.3,281.3,67.4,281.8z"/> <path fill="currentColor" d="M233.7,319.5L88,305.4c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1 c1.9,2.3,4.5,3.7,7.5,4l145.7,14.1c0.4,0,0.7,0.1,1.1,0.1c2.5,0,5-0.9,7-2.5c2.3-1.9,3.7-4.5,4-7.5c0.3-2.9-0.6-5.8-2.5-8.1 C239.2,321.2,236.6,319.8,233.7,319.5z"/> </g> </g> </g> </svg>',ultimatesensor_mini:'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 612.9 605.2" style="enable-background:new 0 0 612.9 605.2;" xml:space="preserve"> <g> <g> <g> <path fill="currentColor" d="M581.4,299.4c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5l-23.2,239.8c-2,20.2-20,35.1-40.2,33.1l-312.3-30.2 c-20.2-2-35.1-20-33.1-40.2l12.8-132.4l117,11.3c6,0.6,11.5-3.9,12-9.9c0.3-2.9-0.6-5.8-2.5-8.1c-1.9-2.3-4.5-3.7-7.5-4 l-279.6-27c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4l140.6,13.6l-12.8,132.4 c-3.1,32.3,20.6,61.2,53,64.3l312.3,30.2c1.9,0.2,3.8,0.3,5.7,0.3c13.6,0,26.7-4.7,37.4-13.5c12.2-10,19.7-24.1,21.2-39.8 l23.3-240c0.3-2.9-0.6-5.8-2.5-8.1C587,301.1,584.4,299.7,581.4,299.4z"/> <path fill="currentColor" d="M559.2,30.9l-62.3-6c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.6,6.1,3.9,11.5,9.9,12l62.3,6 c20.2,2,35.1,20,33.1,40.2l-14.6,151.2c-0.3,2.9,0.6,5.8,2.5,8.1s4.5,3.7,7.5,4c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10 l14.6-151.2C615.3,62.9,591.6,34.1,559.2,30.9z"/> <path fill="currentColor" d="M495.4,199.8l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1l1.6-16.3 c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C496,198.7,495.5,199.2,495.4,199.8z"/> <path fill="currentColor" d="M67.4,281.8L67.4,281.8l103.4,10c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10l21.8-226c0.9-9.8,5.7-18.6,13.3-24.9 s17.2-9.2,27-8.3l201.7,19.5c6.1,0.6,11.5-3.9,12-9.9c0.6-6.1-3.9-11.5-9.9-12L247,0.8c-32.3-3.1-61.2,20.6-64.3,53l-20.8,215.1 L69.5,260c-6.1-0.6-11.5,3.9-12,9.9C56.9,275.9,61.3,281.3,67.4,281.8z"/> <path fill="currentColor" d="M233.7,319.5L88,305.4c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4 l145.7,14.1c0.4,0,0.7,0.1,1.1,0.1c2.5,0,5-0.9,7-2.5c2.3-1.9,3.7-4.5,4-7.5c0.3-2.9-0.6-5.8-2.5-8.1 C239.2,321.2,236.6,319.8,233.7,319.5z"/> <path fill="currentColor" d="M498.4,169.1l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1l1.6-16.3 c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C499,168,498.5,168.5,498.4,169.1z"/> <path fill="currentColor" d="M492.4,230.1l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1l1.6-16.3 c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C493,229,492.5,229.5,492.4,230.1z"/> </g> </g> </g> </svg>',waterp1meterkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 330.6" style="enable-background:new 0 0 360.3 330.6;" xml:space="preserve"> <path fill="currentColor" d="M353.6,215.6c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 s4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,238.6,363,224.1,353.6,215.6z"/> <path fill="currentColor" d="M150.1,56.4h-40.7l15-45.8c1.4-5.3-2.6-10.6-8.2-10.6H65.5c-4.2,0-7.8,3.1-8.4,7.3L45.8,91.9 c-0.7,5.1,3.3,9.6,8.4,9.6H96l-16.2,68.6c-1.3,5.4,2.8,10.4,8.2,10.4c3,0,5.8-1.6,7.3-4.2l62-107.1 C160.6,63.5,156.6,56.4,150.1,56.4z"/> <g id="ZzGCBf_00000049189341060021335730000007757298693458865835_"> <g> <path fill="currentColor" d="M250,2.9c1.4,0,2.9,0,4.4,0c4.9,1.6,7.5,5.2,8.6,10c0.1,0.6,0.1,1.3,0.4,1.8c3.7,8.5,6.8,17.3,11.2,25.3 c5.7,10.3,12.5,20.1,19,30c6,9.1,12.5,17.9,15.7,28.4c1.2,4,1.9,8.2,2.9,12.4c0,3.8,0,7.6,0,11.5c-0.2,1.3-0.3,2.6-0.6,3.9 c-1.8,7.8-4,15.3-8.3,22.2c-7.4,11.9-17.4,20.6-30.6,25.2c-4.7,1.7-9.7,2.6-14.6,3.8c-4,0-8,0-12,0c-1.1-0.2-2.2-0.3-3.3-0.6 c-14.2-2.8-26.4-9.1-35.9-20.3c-6-7.1-10.4-15-12.6-23.9c-0.9-3.6-1.4-7.3-2.2-10.9c0-3.5,0-6.9,0-10.4c0.2-0.4,0.4-0.8,0.5-1.2 c0.4-7.9,3.2-15.2,6.8-22.1c3.2-6,7.4-11.6,11.1-17.4c5.9-9.1,11.8-18.1,17.5-27.3c5.6-8.9,9.5-18.6,12.6-28.6 C242.3,9.8,244,4.7,250,2.9z M250.7,156.4c1.9-0.9,4.3-1.4,5.5-2.9c1-1.2,1.2-3.8,0.7-5.4c-0.7-2.4-3.1-3.1-5.6-3.2 c-14.8-0.4-26.1-12.4-26.6-26.6c-0.1-3.7-2.1-6-5.3-6.1c-3.3-0.1-5.6,2.4-5.5,6.2c0.2,9.5,3.4,17.8,9.8,24.8 C231,150.9,239.9,155,250.7,156.4z"/> <path fill="currentColor" d="M250.7,156.4c-10.9-1.3-19.7-5.5-26.9-13.2c-6.5-7-9.6-15.3-9.8-24.8c-0.1-3.8,2.2-6.3,5.5-6.2 c3.3,0.1,5.2,2.4,5.3,6.1c0.5,14.3,11.8,26.3,26.6,26.6c2.6,0.1,4.9,0.8,5.6,3.2c0.5,1.6,0.3,4.2-0.7,5.4 C255,154.9,252.6,155.4,250.7,156.4z"/> </g> </g> </svg>',watermeterkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 327.7" style="enable-background:new 0 0 360.3 327.7;" xml:space="preserve"> <g id="ZzGCBf_00000097490843262625298010000006643391998989410708_"> <g> <path fill="currentColor" d="M178.5,0c1.4,0,2.9,0,4.4,0c4.9,1.6,7.5,5.2,8.6,10c0.1,0.6,0.1,1.3,0.4,1.8c3.7,8.5,6.8,17.3,11.2,25.3 c5.7,10.3,12.5,20.1,19,30c6,9.1,12.5,17.9,15.7,28.5c1.2,4,1.9,8.2,2.9,12.4c0,3.8,0,7.6,0,11.5c-0.2,1.3-0.3,2.6-0.6,3.9 c-1.8,7.8-4,15.3-8.3,22.2c-7.4,11.9-17.4,20.6-30.6,25.2c-4.7,1.7-9.7,2.6-14.6,3.8c-4,0-8,0-12,0c-1.1-0.2-2.2-0.3-3.3-0.6 c-14.2-2.8-26.4-9.1-35.9-20.3c-6-7.1-10.4-15-12.7-23.9c-0.9-3.6-1.4-7.3-2.2-10.9c0-3.5,0-6.9,0-10.4c0.2-0.4,0.4-0.8,0.5-1.2 c0.4-7.9,3.2-15.2,6.8-22.1c3.2-6,7.4-11.6,11.1-17.4c5.9-9.1,11.8-18.1,17.5-27.3c5.6-8.9,9.5-18.6,12.6-28.6 C170.8,6.8,172.5,1.8,178.5,0z M179.3,153.4c1.9-0.9,4.3-1.4,5.5-2.9c1-1.2,1.2-3.8,0.7-5.4c-0.7-2.4-3.1-3.1-5.6-3.2 c-14.8-0.4-26.1-12.4-26.6-26.6c-0.1-3.7-2.1-6-5.3-6.1c-3.3-0.1-5.6,2.4-5.5,6.2c0.2,9.5,3.4,17.8,9.8,24.8 C159.6,147.9,168.4,152.1,179.3,153.4z"/> </g> </g> <path fill="currentColor" d="M353.6,212.7c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 s4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,235.7,363,221.2,353.6,212.7z"/> </svg>',waterflowkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 332.6" style="enable-background:new 0 0 360.3 332.6;" xml:space="preserve"> <path fill="currentColor" d="M353.6,217.5c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 c0-5.5,4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,240.6,363,226.1,353.6,217.5z"/> <path fill="currentColor" d="M308.8,149.5c-10-1.1-19.7-4.9-27.1-10.7c-6.6-5.2-16-5.3-22.5,0c-17.7,14.2-50.1,14.2-68.1-0.7 c-6.3-5.2-15.4-4.2-21.8,0.8c-17.8,14.1-50,14-67.9-0.8c-6.3-5.2-15.6-4.2-22,0.9c-7.2,5.7-16.8,9.4-27,10.5 c-3.7,0.4-6.4,3.6-6.4,7.3v15.1c0,4.2,3.5,7.9,7.8,7.5c13.5-1.2,26.2-5.3,37.1-12.1c26.4,16.2,64,15.9,89.8,0 c26.4,16.2,64,15.9,89.8,0c10.9,6.6,23.8,10.9,37,12.1c4.2,0.4,7.8-3.2,7.8-7.5v-14.8C315.3,153.4,312.6,149.9,308.8,149.5z M308.8,82.2c-10-1.1-19.7-4.9-27.1-10.7c-6.6-5.2-16-5.3-22.5,0c-17.7,14.2-50.1,14.2-68.1-0.7c-6.3-5.2-15.4-4.2-21.8,0.8 c-17.8,14.1-50,14-67.9-0.8c-6.3-5.2-15.6-4.2-22,0.9c-7.2,5.7-16.8,9.4-27,10.5c-3.7,0.4-6.4,3.7-6.4,7.3v15.1 c0,4.2,3.5,7.8,7.8,7.5c13.5-1.2,26.2-5.3,37.1-12.1c26.4,16.2,64,15.9,89.8,0c26.4,16.2,64,15.9,89.8,0c10.9,6.6,23.8,10.9,37,12.1 c4.2,0.4,7.8-3.2,7.8-7.5V89.8C315.3,86.1,312.6,82.6,308.8,82.2L308.8,82.2z M308.8,14.9c-10-1.2-19.7-4.9-27.1-10.7 c-6.6-5.2-16-5.3-22.5,0c-17.7,14.2-50.1,14.2-68.1-0.7c-6.3-5.2-15.4-4.2-21.8,0.8c-17.8,14.1-50,14-67.9-0.8 c-6.3-5.2-15.6-4.2-22,0.9c-7.2,5.7-16.8,9.4-27,10.5c-3.7,0.4-6.4,3.6-6.4,7.3v15.1c0,4.2,3.5,7.8,7.8,7.5 c13.5-1.2,26.2-5.3,37.1-12.1c26.4,16.2,64,15.9,89.8,0c26.4,16.2,64,15.9,89.8,0c10.9,6.6,23.8,10.9,37,12.1 c4.2,0.4,7.8-3.2,7.8-7.5V22.5C315.3,18.8,312.6,15.3,308.8,14.9L308.8,14.9z"/> </svg>',p1meterkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 330.6" style="enable-background:new 0 0 360.3 330.6;" xml:space="preserve" fill="none"> <path fill="currentColor" d="M353.6,215.6c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 c0-5.5,4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,238.6,363,224.1,353.6,215.6z"/> <path fill="currentColor" d="M228.1,56.4h-40.7l15-45.8c1.4-5.3-2.6-10.6-8.2-10.6h-50.8c-4.2,0-7.8,3.1-8.4,7.3l-11.3,84.6 c-0.7,5.1,3.3,9.6,8.4,9.6h41.8l-16.2,68.6c-1.3,5.4,2.8,10.4,8.2,10.4c3,0,5.8-1.6,7.3-4.2l62-107.1 C238.6,63.5,234.6,56.4,228.1,56.4z"/> </svg>'};function Pe(e){return e?Ce[e]??null:null}let Ee=class extends Me{constructor(){super(...arguments),this._config={}}static getConfigElement(){return document.createElement("smarthomeshop-water-card-editor")}static getStubConfig(){return{show_graph:!0,graph_type:"sparkline"}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_graph:!0,_entitiesResolved:!t&&e._entitiesResolved,...e}}_handleClick(e){e&&$e(this,e)}render(){if(!this.hass)return Z;const e=this._getFlowRate(),t=this._getTodayUsage(),i=this._getWeekUsage(),o=this._getMonthUsage(),a=this._getYearUsage(),r=this._getMeterTotal(),s=this._hasLeak(),n=this._config._productName||"SmartHomeShop";return G`
      <ha-card>
        <div class="card-content">
          ${this._renderHeader(n,e,s)}
          ${this._renderFlowDisplay(e)}
          ${this._renderStats(t,i,o,a)}
          ${this._config.show_graph?this._renderGraph():Z}
          ${this._renderLeakBar(s,r)}
          ${this._renderMeterSection()}
        </div>
      </ha-card>
    `}_renderHeader(e,t,i){let o,a,r;return i?(o="mdi:alert",a="Leak detected",r="status-alert"):t>0?(o="mdi:water",a="Water flowing",r="status-active"):(o="mdi:check-circle",a="No usage",r="status-ok"),G`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${t>0?"flowing":""}">
            ${Pe("watermeterkit")?ye(Pe("watermeterkit")):G`<ha-icon icon="mdi:water"></ha-icon>`}
          </div>
          <div>
            <h2 class="header-title">${e}</h2>
            <div class="header-subtitle">Water Monitoring</div>
          </div>
        </div>
        <div class="status-badge ${r}">
          <ha-icon icon="${o}"></ha-icon>
          <span>${a}</span>
        </div>
      </div>
    `}_renderFlowDisplay(e){return G`
      <div
        class="value-display ${e>0?"active":""}"
        @click=${()=>this._handleClick(this._config.flow_entity)}
      >
        <span class="value-big">${ke(e,1)}</span>
        <span class="value-unit">L/min</span>
        <div class="value-label">Current water usage</div>
      </div>
    `}_renderStats(e,t,i,o){return G`
      <div class="stats-grid">
        <div class="stat-item" @click=${()=>this._handleClick(this._config.today_entity)}>
          <div class="stat-value">${ke(e,0)}<span class="stat-unit">L</span></div>
          <div class="stat-label">Today</div>
        </div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.week_entity)}>
          <div class="stat-value">${ke(t,0)}<span class="stat-unit">L</span></div>
          <div class="stat-label">Week</div>
        </div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.month_entity)}>
          <div class="stat-value">
            ${ke(i/1e3,1)}<span class="stat-unit">m³</span>
          </div>
          <div class="stat-label">Month</div>
        </div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.year_entity)}>
          <div class="stat-value">${ke(o,1)}<span class="stat-unit">m³</span></div>
          <div class="stat-label">Year</div>
        </div>
      </div>
    `}_renderGraph(){const e=Se(this._historyData),t=this._getMaxHistoryValue();return G`
      <div class="graph-section" @click=${()=>this._handleClick(this._config.flow_entity)}>
        <div class="graph-header">
          <span class="graph-title">Usage last 24 hours</span>
          <span class="graph-max">
            ${this._historyData?`max: ${ke(t,1)} L/min`:""}
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
            <div class="info-subtext">${e?"Possible leak":"No anomalies"}</div>
          </div>
        </div>
        <div
          class="info-right"
          @click=${e=>{e.stopPropagation(),this._handleClick(this._config.total_entity)}}
        >
          <div class="info-value">${ke(t,3)} m³</div>
          <div class="info-label">Meter reading</div>
        </div>
      </div>
    `}};Ee.styles=[ze],e([me()],Ee.prototype,"_config",void 0),Ee=e([he("smarthomeshop-water-card")],Ee);const Te="smarthomeshop_debug";let De=!1;try{De="1"===localStorage.getItem(Te)}catch{De=!1}const Ae=window;function Ie(...e){De&&console.log("[SmartHomeShop]",...e)}Ae.__shsDebugSetters=Ae.__shsDebugSetters||[],Ae.__shsDebugSetters.push(e=>{De=e}),Ae.shsDebug||(Ae.shsDebug={enable(){try{localStorage.setItem(Te,"1")}catch{}(Ae.__shsDebugSetters||[]).forEach(e=>e(!0)),console.info("[SmartHomeShop] Debug logging enabled")},disable(){try{localStorage.removeItem(Te)}catch{}(Ae.__shsDebugSetters||[]).forEach(e=>e(!1)),console.info("[SmartHomeShop] Debug logging disabled")},get enabled(){try{return"1"===localStorage.getItem(Te)}catch{return!1}}});let We=class extends Me{constructor(){super(...arguments),this._energyTodayFromStats=null,this._lastStatsUpdate=0,this._config={},this._leakPanelExpanded=!1}static getConfigElement(){return document.createElement("smarthomeshop-waterp1-card-editor")}static getStubConfig(){return{show_graph:!0,show_water:!0,show_energy:!0,has_water_leak_sensor:!1}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_graph:!0,show_water:!0,show_energy:!0,has_water_leak_sensor:!1,_entitiesResolved:!t&&e._entitiesResolved,...e}}_autoDetectEntities(){super._autoDetectEntities(),this.hass&&(this._config._productName="WaterP1MeterKit",this._config.power_entity||(this._config.power_entity=this._findEntity(["power_consumed","currently_delivered","power_delivered","active_power","vermogen_actueel","stroom_afgenomen"],"sensor",!0)||this._findEntity(["power consumed","vermogen","current power"])),this._config.power_phase_l1_entity||(this._config.power_phase_l1_entity=this._findEntity(["power_consumed_phase_l1","power_phase_l1","phase_1_power","l1_power"],"sensor",!0)),this._config.power_phase_l2_entity||(this._config.power_phase_l2_entity=this._findEntity(["power_consumed_phase_l2","power_phase_l2","phase_2_power","l2_power"],"sensor",!0)),this._config.power_phase_l3_entity||(this._config.power_phase_l3_entity=this._findEntity(["power_consumed_phase_l3","power_phase_l3","phase_3_power","l3_power"],"sensor",!0)),this._config.energy_today_entity||(this._config.energy_today_entity=this._findEntity(["electricity_today","electricity_daily","energy_today"],"sensor",!0)||this._findEntity(["energy_consumed_tariff"],"sensor",!0)||this._findEntity(["energy consumed"])),this._config.gas_entity||(this._config.gas_entity=this._findEntity(["gas_consumed","gas_delivered"],"sensor",!0)||this._findEntity(["gas consumed"])),this._config.leak_score_entity||(this._config.leak_score_entity=this._findEntity(["leak_score","lek_score"],"sensor",!0)),this._config.continuous_flow_entity||(this._config.continuous_flow_entity=this._findEntity(["continuous_flow","continue_flow"],"binary_sensor",!0)),this._config.night_usage_entity||(this._config.night_usage_entity=this._findEntity(["night_usage","nacht_gebruik"],"binary_sensor",!0)),this._config.micro_leak_entity||(this._config.micro_leak_entity=this._findEntity(["micro_leak","micro_lek"],"binary_sensor",!0)),this._config.has_water_leak_sensor&&!this._config.water_leak_sensor_entity&&(this._config.water_leak_sensor_entity=this._findEntity(["water_leak_sensor","water_leak"],"binary_sensor",!0)||this._findEntity(["water leak sensor","leksensor"],"binary_sensor")))}_handleClick(e){e&&$e(this,e)}_getTotalPower(){const e=be(this.hass,this._config.power_entity),t=e?.attributes?.unit_of_measurement||"W";let i=xe(this.hass,this._config.power_entity);if("kw"===t.toLowerCase()&&(i*=1e3),i>0)return i;const o=e=>{const t=be(this.hass,e),i=t?.attributes?.unit_of_measurement||"W";let o=xe(this.hass,e);return"kw"===i.toLowerCase()&&(o*=1e3),o},a=o(this._config.power_phase_l1_entity),r=o(this._config.power_phase_l2_entity),s=o(this._config.power_phase_l3_entity);return a>0||r>0||s>0?a+r+s:i}_isHardwareLeakSensorWet(){if(!this._config.has_water_leak_sensor||!this._config.water_leak_sensor_entity||!this.hass)return!1;const e=be(this.hass,this._config.water_leak_sensor_entity);return"on"===e?.state}_getLeakScore(){return xe(this.hass,this._config.leak_score_entity)}_isContinuousFlow(){return"on"===be(this.hass,this._config.continuous_flow_entity)?.state}_isNightUsage(){return"on"===be(this.hass,this._config.night_usage_entity)?.state}_isMicroLeak(){return"on"===be(this.hass,this._config.micro_leak_entity)?.state}async _fetchEnergyStatistics(){if(!this.hass)return;const e=Date.now();if(e-this._lastStatsUpdate<6e4&&null!==this._energyTodayFromStats)return;const t=this._findUtilityMeterEntity("energy_daily_t1"),i=this._findUtilityMeterEntity("energy_daily_t2");if(t||i){const o=xe(this.hass,t),a=xe(this.hass,i);return this._energyTodayFromStats=o+a,this._lastStatsUpdate=e,void Ie("WaterP1 Card: Energy today from Utility Meters (CC):",o,"+",a,"=",this._energyTodayFromStats,"kWh")}const o=this._findEntity(["energy_consumed_tariff_1"],"sensor",!0),a=this._findEntity(["energy_consumed_tariff_2"],"sensor",!0);if(!o&&!a)return void Ie("WaterP1 Card: No tariff entities found for statistics");const r=[o,a].filter(Boolean);try{const t=new Date;t.setHours(0,0,0,0);const i=t.toISOString(),o=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:i,statistic_ids:r,period:"day",types:["change"]});let a=0;for(const e of r){const t=o[e];if(t&&t.length>0)for(const e of t)void 0!==e.change&&(a+=e.change)}this._energyTodayFromStats=a,this._lastStatsUpdate=e,Ie("WaterP1 Card: Energy today from Statistics API:",a,"kWh")}catch(e){console.warn("WaterP1 Card: Failed to fetch energy statistics:",e)}}_findUtilityMeterEntity(e){if(!this.hass)return;const t=this._config.device_id;if(!t)return;const i=t.match(/([a-f0-9]{6})/i),o=i?i[1].toLowerCase():"";if(!o)return;const a=`sensor.waterp1_${o}_${e}`;if(this.hass.states[a])return a;for(const t of Object.keys(this.hass.states))if(t.includes(o)&&t.endsWith(e))return t}_getEnergyToday(){if(null!==this._energyTodayFromStats&&this._energyTodayFromStats>0)return this._energyTodayFromStats;const e=xe(this.hass,this._config.energy_today_entity);return e<.5&&null===this._energyTodayFromStats&&this._fetchEnergyStatistics(),this._energyTodayFromStats??e}_getGasToday(){const e=this._findUtilityMeterEntity("gas_daily");return e?xe(this.hass,e):0}firstUpdated(e){super.firstUpdated(e),this._fetchEnergyStatistics()}updated(e){super.updated(e),e.has("hass")&&this._fetchEnergyStatistics()}_getOfflineInfo(){const e=this._config.device_id;if(!this.hass||!e)return{offline:!1,lastSeen:null};const t=this.hass.entities||{};let i=!1,o=null,a=null;for(const[r,s]of Object.entries(t)){if(s.device_id!==e)continue;if("esphome"!==s.platform)continue;if(!r.startsWith("sensor.")&&!r.startsWith("binary_sensor."))continue;const t=this.hass.states[r];if(!t)continue;if("connectivity"===t.attributes?.device_class){if("on"===t.state)return{offline:!1,lastSeen:null};"off"===t.state&&(a=t.last_changed??null);continue}if(i=!0,"unavailable"!==t.state)return{offline:!1,lastSeen:null};const n=t.last_changed;n&&(!o||n>o)&&(o=n)}return a?{offline:!0,lastSeen:a}:{offline:i,lastSeen:o}}render(){if(!this.hass)return Z;const e=this._getOfflineInfo();if(e.offline)return G`
        <ha-card>
          <div class="card-content">
            <div class="header">
              <div class="header-left">
                <div class="header-icon">${Pe("waterp1meterkit")?ye(Pe("waterp1meterkit")):G`<ha-icon icon="mdi:water-flash"></ha-icon>`}</div>
                <div><h2 class="header-title">WaterP1MeterKit</h2><div class="header-subtitle">Water + Energy</div></div>
              </div>
              <div class="status-badge status-alert"><ha-icon icon="mdi:lan-disconnect"></ha-icon><span>Offline</span></div>
            </div>
            <div class="offline-state">
              <ha-icon icon="mdi:lan-disconnect"></ha-icon>
              <div class="offline-title">Device offline</div>
              <div class="offline-sub">
                ${e.lastSeen?`Last seen ${we(e.lastSeen)}`:"Waiting for the device to reconnect"}
              </div>
              <div class="offline-hint">Check the power supply and Wi-Fi connection.</div>
            </div>
          </div>
        </ha-card>
      `;const t=this._getFlowRate(),i=this._getTodayUsage(),o=this._getWeekUsage(),a=this._getMonthUsage(),r=this._getYearUsage(),s=this._getMeterTotal(),n=this._hasLeak(),l=this._getLeakScore(),c=this._isContinuousFlow(),d=this._isNightUsage(),h=this._isMicroLeak(),p=!0===this._config.has_water_leak_sensor,g=this._isHardwareLeakSensorWet(),u=this._getTotalPower(),m=this._getEnergyToday(),f=this._getGasToday();return G`
      <ha-card>
        <div class="card-content">
          ${g?this._renderHardwareLeakAlert():Z}
          ${this._renderHeader(t,u,n,g)}
          ${this._config.show_water?G`
            <div class="water-section">
              ${this._renderWaterSection(t,i,o,a,r,s)}
              ${this._renderLeakDetectionPanel(n,l,c,d,h,p,g)}
            </div>
          `:Z}
          ${this._config.show_water&&this._config.show_energy?G`<div class="section-divider"></div>`:Z}
          ${this._config.show_energy?G`<div class="energy-section">${this._renderEnergySection(u,m,f)}</div>`:Z}
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
    `}_renderHeader(e,t,i,o){let a="mdi:check-circle",r="All normal",s="status-ok";return o?(a="mdi:water-alert",r="WATER LEAK!",s="status-alert"):i?(a="mdi:alert",r="Leak detected",s="status-alert"):(e>0||t>100)&&(a=e>0?"mdi:water":"mdi:flash",r=e>0?"Water flowing":"Energy active",s="status-active"),G`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${e>0||t>100?"flowing":""}">${Pe("waterp1meterkit")?ye(Pe("waterp1meterkit")):G`<ha-icon icon="mdi:water-flash"></ha-icon>`}</div>
          <div><h2 class="header-title">WaterP1MeterKit</h2><div class="header-subtitle">Water + Energy</div></div>
        </div>
        <div class="status-badge ${s}"><ha-icon icon="${a}"></ha-icon><span>${r}</span></div>
      </div>
    `}_renderWaterSection(e,t,i,o,a,r){const s=Se(this._historyData),n=this._getMaxHistoryValue();return G`
      <div class="section-header water"><ha-icon icon="mdi:water"></ha-icon> Water</div>
      <div class="value-display ${e>0?"active":""}" @click=${()=>this._handleClick(this._config.flow_entity)}>
        <span class="value-big">${ke(e,1)}</span><span class="value-unit">L/min</span>
        <div class="value-label">Current water usage</div>
      </div>
      <div class="stats-grid">
        <div class="stat-item" @click=${()=>this._handleClick(this._config.today_entity)}><div class="stat-value">${ke(t,0)}<span class="stat-unit">L</span></div><div class="stat-label">Today</div></div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.week_entity)}><div class="stat-value">${ke(i,0)}<span class="stat-unit">L</span></div><div class="stat-label">Week</div></div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.month_entity)}><div class="stat-value">${ke(o/1e3,1)}<span class="stat-unit">m³</span></div><div class="stat-label">Month</div></div>
        <div class="stat-item" @click=${()=>this._handleClick(this._config.year_entity)}><div class="stat-value">${ke(a,1)}<span class="stat-unit">m³</span></div><div class="stat-label">Year</div></div>
      </div>
      ${this._config.show_graph?G`
        <div class="graph-section" @click=${()=>this._handleClick(this._config.flow_entity)}>
          <div class="graph-header"><span class="graph-title">Water last 24 hours</span><span class="graph-max">${this._historyData?`max: ${ke(n,1)} L/min`:""}</span></div>
          <svg class="sparkline" viewBox="0 0 300 55" preserveAspectRatio="none">
            <defs><linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="var(--info-color)" stop-opacity="0.3"/><stop offset="100%" stop-color="var(--info-color)" stop-opacity="0.02"/></linearGradient></defs>
            <path class="sparkline-fill" d="${s} L 300 55 L 0 55 Z" style="fill: url(#waterGradient);"/>
            <path class="sparkline-line" d="${s}" style="stroke: var(--info-color);"/>
          </svg>
          <div class="graph-labels"><span>-24h</span><span>-18h</span><span>-12h</span><span>-6h</span><span>Now</span></div>
        </div>
      `:Z}
      ${this._renderMeterSection()}
    `}_renderLeakDetectionPanel(e,t,i,o,a,r,s){const n=[i,o,a,s].filter(Boolean).length,l=this._getMeterTotal();let c="ok",d="mdi:shield-check",h="No anomalies";return s?(c="alert",d="mdi:water-alert",h="Water leak detected!"):e||t>=50?(c="alert",d="mdi:alert-circle",h=`${n} issue${1!==n?"s":""} detected`):(t>0||n>0)&&(c="warning",d="mdi:alert",h="Monitoring activity"),G`
      <div class="leak-panel">
        <div class="leak-panel-header" @click=${()=>this._leakPanelExpanded=!this._leakPanelExpanded}>
          <div class="header-icon ${c}"><ha-icon icon="${d}"></ha-icon></div>
          <div class="header-content"><div class="header-title">Leak Detection</div><div class="header-subtitle">${h}</div></div>
          <div class="header-right"><div class="meter-value">${ke(l,3)} m³</div><div class="meter-label">Meter</div></div>
        </div>
        ${this._leakPanelExpanded?G`
          <div class="leak-details">
            <div class="leak-detail-row" @click=${()=>this._handleClick(this._config.continuous_flow_entity)}>
              <div class="detail-icon ${i?"active":""}"><ha-icon icon="mdi:water-sync"></ha-icon></div>
              <div class="detail-info"><div class="detail-name">Continuous flow</div><div class="detail-desc">Water running for extended period</div></div>
              <div class="detail-status ${i?"active":"ok"}">${i?"ACTIVE":"OK"}</div>
            </div>
            <div class="leak-detail-row" @click=${()=>this._handleClick(this._config.night_usage_entity)}>
              <div class="detail-icon ${o?"active":""}"><ha-icon icon="mdi:weather-night"></ha-icon></div>
              <div class="detail-info"><div class="detail-name">Night usage</div><div class="detail-desc">Water usage during night hours</div></div>
              <div class="detail-status ${o?"active":"ok"}">${o?"ACTIVE":"OK"}</div>
            </div>
            <div class="leak-detail-row" @click=${()=>this._handleClick(this._config.micro_leak_entity)}>
              <div class="detail-icon ${a?"active":""}"><ha-icon icon="mdi:water-opacity"></ha-icon></div>
              <div class="detail-info"><div class="detail-name">Micro leak</div><div class="detail-desc">Small constant water flow</div></div>
              <div class="detail-status ${a?"active":"ok"}">${a?"ACTIVE":"OK"}</div>
            </div>
            ${r?G`
              <div class="leak-detail-row hardware ${s?"wet":""}" @click=${()=>this._handleClick(this._config.water_leak_sensor_entity)}>
                <div class="detail-icon"><ha-icon icon="mdi:water-pump"></ha-icon></div>
                <div class="detail-info"><div class="detail-name">Hardware leak sensor</div><div class="detail-desc">Physical water detection (V3)</div></div>
                <div class="detail-status ${s?"active":"ok"}">${s?"WET!":"DRY"}</div>
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
    `}_renderEnergySection(e,t,i){const o=this._getPowerReturned(),a=this._getEnergyReturnedToday();return G`
      <div class="section-header energy"><ha-icon icon="mdi:flash"></ha-icon> Energy</div>

      ${o>0||a>0?G`
        <!-- Solar mode: show consumption and return -->
        <div class="dual-power">
          <div class="value-display ${e>100?"active":""}" @click=${()=>this._handleClick(this._config.power_entity)}>
            <span class="value-big">${ke(e,0)}</span><span class="value-unit">W</span>
            <div class="value-label">Usage</div>
          </div>
          <div class="value-display solar ${o>0?"active":""}" @click=${()=>this._handleClick(this._config.power_returned_entity)}>
            <span class="value-big">${ke(o,0)}</span><span class="value-unit">W</span>
            <div class="value-label">Returned</div>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-item" @click=${()=>this._handleClick(this._config.energy_today_entity)}><div class="stat-value">${ke(t,2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Usage today</div></div>
          <div class="stat-item solar" @click=${()=>this._handleClick(this._config.energy_returned_entity)}><div class="stat-value">${ke(a,2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Returned today</div></div>
          <div class="stat-item" @click=${()=>this._handleClick(this._config.gas_entity)}><div class="stat-value">${ke(i,2)}<span class="stat-unit">m³</span></div><div class="stat-label">Gas today</div></div>
        </div>
      `:G`
        <!-- No solar: simple view -->
        <div class="value-display ${e>100?"active":""}" @click=${()=>this._handleClick(this._config.power_entity)}>
          <span class="value-big">${ke(e,0)}</span><span class="value-unit">W</span>
          <div class="value-label">Current usage</div>
        </div>
        <div class="dual-stats">
          <div class="stat-item" @click=${()=>this._handleClick(this._config.energy_today_entity)}><div class="stat-value">${ke(t,2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Electricity today</div></div>
          <div class="stat-item" @click=${()=>this._handleClick(this._config.gas_entity)}><div class="stat-value">${ke(i,2)}<span class="stat-unit">m³</span></div><div class="stat-label">Gas today</div></div>
        </div>
      `}
    `}_getPowerReturned(){return this._config.power_returned_entity||(this._config.power_returned_entity=this._findEntity(["power_returned","power_delivered_to_grid","power_export"],"sensor",!0)),xe(this.hass,this._config.power_returned_entity)}_getEnergyReturnedToday(){const e=this._findUtilityMeterEntity("energy_returned_daily_t1"),t=this._findUtilityMeterEntity("energy_returned_daily_t2");return e||t?xe(this.hass,e)+xe(this.hass,t):(this._config.energy_returned_entity||(this._config.energy_returned_entity=this._findEntity(["energy_returned_tariff_1","energy_returned_tariff_2","energy_returned","energy_delivered","energy_export"],"sensor",!0)),0)}};We.styles=[ze,s`
      /* Offline state */
      .offline-state {
        text-align: center;
        padding: 32px 20px 40px;
        color: var(--secondary-text-color);
      }
      .offline-state ha-icon {
        --mdc-icon-size: 44px;
        opacity: 0.4;
        margin-bottom: 12px;
      }
      .offline-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
        margin-bottom: 4px;
      }
      .offline-sub {
        font-size: 13px;
        margin-bottom: 12px;
      }
      .offline-hint {
        font-size: 12px;
        opacity: 0.7;
      }

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

    `],e([me()],We.prototype,"_energyTodayFromStats",void 0),e([me()],We.prototype,"_lastStatsUpdate",void 0),e([me()],We.prototype,"_config",void 0),e([me()],We.prototype,"_leakPanelExpanded",void 0),We=e([he("smarthomeshop-waterp1-card")],We);const Ne={common:{loading:"Loading...",error:"Error",unknown:"Unknown",today:"Today",week:"Week",month:"Month",year:"Year",daily:"Daily",weekly:"Weekly",monthly:"Monthly",yearly:"Yearly",current:"Current",total:"Total",temperature:"Temperature",humidity:"Humidity",settings:"Settings",save:"Save",cancel:"Cancel",close:"Close",edit:"Edit",delete:"Delete",add:"Add",name:"Name",value:"Value",unit:"Unit",active:"Active",inactive:"Inactive",on:"On",off:"Off",yes:"Yes",no:"No",show:"Show",hide:"Hide"},waterflowkit:{title:"WaterFlowKit",subtitle:"Dual flow monitoring",pipe1:"Pipe 1",pipe2:"Pipe 2",currentFlow:"Current flow",totalConsumption:"Total consumption",flowRate:"Flow rate",perHour:"per hour",noFlow:"No flow",flowing:"Flowing",waterTemperature:"Water temperature",showPipe1:"Show Pipe 1",showPipe2:"Show Pipe 2",showTemperature:"Show temperature",pipe1Name:"Pipe 1 name",pipe2Name:"Pipe 2 name"},waterp1:{title:"WaterP1MeterKit",water:"Water",energy:"Energy",energyActive:"Energy active",currentUsage:"Current water usage",leakDetection:"Leak Detection",monitoringActivity:"Monitoring activity",meter:"Meter",currentPower:"Current power",electricityToday:"Electricity today",gasToday:"Gas today",waterLast24h:"Water last 24 hours",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Water usage",dailyUsage:"Daily usage",weeklyUsage:"Weekly usage",monthlyUsage:"Monthly usage",yearlyUsage:"Yearly usage",calibration:"Calibration",lastCalibration:"Last calibration",sinceLast:"since calibration"},ultimatesensor:{title:"UltimateSensor",roomScore:"Room Score",excellent:"Excellent",good:"Good",moderate:"Moderate",poor:"Poor",unhealthy:"Unhealthy",hazardous:"Hazardous",presence:"Presence",detected:"Detected",notDetected:"Not detected",targets:"Targets",co2Level:"CO₂ level",vocIndex:"VOC index",noxIndex:"NOx index",illuminance:"Illuminance",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radar view",roomView:"Room view",view2D:"2D",view3D:"3D",zoneOccupancy:"Zone occupancy",zone:"Zone",recommendations:"Recommendations",ventilateNow:"Ventilate now!",openWindow:"Open a window",airQualityPoor:"Air quality is poor",tooHumid:"Too humid",tooDry:"Too dry",tooCold:"Too cold",tooWarm:"Too warm"},editor:{deviceId:"Device ID",selectDevice:"Select device",appearance:"Appearance",showGraph:"Show graph",showWater:"Show water",showEnergy:"Show energy",graphType:"Graph type",historyGraph:"History graph",liveGraph:"Live graph",displayOptions:"Display options"}},Le={en:Ne,nl:{common:{loading:"Laden...",error:"Fout",unknown:"Onbekend",today:"Vandaag",week:"Week",month:"Maand",year:"Jaar",daily:"Dagelijks",weekly:"Wekelijks",monthly:"Maandelijks",yearly:"Jaarlijks",current:"Huidig",total:"Totaal",temperature:"Temperatuur",humidity:"Luchtvochtigheid",settings:"Instellingen",save:"Opslaan",cancel:"Annuleren",close:"Sluiten",edit:"Bewerken",delete:"Verwijderen",add:"Toevoegen",name:"Naam",value:"Waarde",unit:"Eenheid",active:"Actief",inactive:"Inactief",on:"Aan",off:"Uit",yes:"Ja",no:"Nee",show:"Tonen",hide:"Verbergen"},waterflowkit:{title:"WaterFlowKit",subtitle:"Dubbele flowmeting",pipe1:"Leiding 1",pipe2:"Leiding 2",currentFlow:"Huidige flow",totalConsumption:"Totaal verbruik",flowRate:"Debiet",perHour:"per uur",noFlow:"Geen flow",flowing:"Stromend",waterTemperature:"Watertemperatuur",showPipe1:"Toon leiding 1",showPipe2:"Toon leiding 2",showTemperature:"Toon temperatuur",pipe1Name:"Naam leiding 1",pipe2Name:"Naam leiding 2"},waterp1:{title:"WaterP1MeterKit",water:"Water",energy:"Energie",energyActive:"Energie actief",currentUsage:"Huidig waterverbruik",leakDetection:"Lekdetectie",monitoringActivity:"Bewakingsactiviteit",meter:"Meter",currentPower:"Huidig vermogen",electricityToday:"Stroom vandaag",gasToday:"Gas vandaag",waterLast24h:"Water laatste 24 uur",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Waterverbruik",dailyUsage:"Dagelijks verbruik",weeklyUsage:"Wekelijks verbruik",monthlyUsage:"Maandelijks verbruik",yearlyUsage:"Jaarlijks verbruik",calibration:"Kalibratie",lastCalibration:"Laatste kalibratie",sinceLast:"sinds kalibratie"},ultimatesensor:{title:"UltimateSensor",roomScore:"Kamerscore",excellent:"Uitstekend",good:"Goed",moderate:"Matig",poor:"Slecht",unhealthy:"Ongezond",hazardous:"Gevaarlijk",presence:"Aanwezigheid",detected:"Gedetecteerd",notDetected:"Niet gedetecteerd",targets:"Doelen",co2Level:"CO₂-niveau",vocIndex:"VOC-index",noxIndex:"NOx-index",illuminance:"Verlichtingssterkte",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radarweergave",roomView:"Kamerweergave",view2D:"2D",view3D:"3D",zoneOccupancy:"Zone bezetting",zone:"Zone",recommendations:"Aanbevelingen",ventilateNow:"Ventileer nu!",openWindow:"Open een raam",airQualityPoor:"Luchtkwaliteit is slecht",tooHumid:"Te vochtig",tooDry:"Te droog",tooCold:"Te koud",tooWarm:"Te warm"},editor:{deviceId:"Apparaat-ID",selectDevice:"Selecteer apparaat",appearance:"Uiterlijk",showGraph:"Toon grafiek",showWater:"Toon water",showEnergy:"Toon energie",graphType:"Grafiektype",historyGraph:"Historiegrafiek",liveGraph:"Live grafiek",displayOptions:"Weergaveopties"}},de:{common:{loading:"Laden...",error:"Fehler",unknown:"Unbekannt",today:"Heute",week:"Woche",month:"Monat",year:"Jahr",daily:"Täglich",weekly:"Wöchentlich",monthly:"Monatlich",yearly:"Jährlich",current:"Aktuell",total:"Gesamt",temperature:"Temperatur",humidity:"Luftfeuchtigkeit",settings:"Einstellungen",save:"Speichern",cancel:"Abbrechen",close:"Schließen",edit:"Bearbeiten",delete:"Löschen",add:"Hinzufügen",name:"Name",value:"Wert",unit:"Einheit",active:"Aktiv",inactive:"Inaktiv",on:"An",off:"Aus",yes:"Ja",no:"Nein",show:"Anzeigen",hide:"Ausblenden"},waterflowkit:{title:"WaterFlowKit",subtitle:"Doppelte Durchflussmessung",pipe1:"Leitung 1",pipe2:"Leitung 2",currentFlow:"Aktueller Durchfluss",totalConsumption:"Gesamtverbrauch",flowRate:"Durchflussrate",perHour:"pro Stunde",noFlow:"Kein Durchfluss",flowing:"Fließend",waterTemperature:"Wassertemperatur",showPipe1:"Leitung 1 anzeigen",showPipe2:"Leitung 2 anzeigen",showTemperature:"Temperatur anzeigen",pipe1Name:"Name Leitung 1",pipe2Name:"Name Leitung 2"},waterp1:{title:"WaterP1MeterKit",water:"Wasser",energy:"Energie",energyActive:"Energie aktiv",currentUsage:"Aktueller Wasserverbrauch",leakDetection:"Leckerkennung",monitoringActivity:"Überwachungsaktivität",meter:"Zähler",currentPower:"Aktuelle Leistung",electricityToday:"Strom heute",gasToday:"Gas heute",waterLast24h:"Wasser letzte 24 Stunden",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Wasserverbrauch",dailyUsage:"Täglicher Verbrauch",weeklyUsage:"Wöchentlicher Verbrauch",monthlyUsage:"Monatlicher Verbrauch",yearlyUsage:"Jährlicher Verbrauch",calibration:"Kalibrierung",lastCalibration:"Letzte Kalibrierung",sinceLast:"seit Kalibrierung"},ultimatesensor:{title:"UltimateSensor",roomScore:"Raumbewertung",excellent:"Ausgezeichnet",good:"Gut",moderate:"Mäßig",poor:"Schlecht",unhealthy:"Ungesund",hazardous:"Gefährlich",presence:"Anwesenheit",detected:"Erkannt",notDetected:"Nicht erkannt",targets:"Ziele",co2Level:"CO₂-Niveau",vocIndex:"VOC-Index",noxIndex:"NOx-Index",illuminance:"Beleuchtungsstärke",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radaransicht",roomView:"Raumansicht",view2D:"2D",view3D:"3D",zoneOccupancy:"Zonenbelegung",zone:"Zone",recommendations:"Empfehlungen",ventilateNow:"Jetzt lüften!",openWindow:"Öffnen Sie ein Fenster",airQualityPoor:"Luftqualität ist schlecht",tooHumid:"Zu feucht",tooDry:"Zu trocken",tooCold:"Zu kalt",tooWarm:"Zu warm"},editor:{deviceId:"Geräte-ID",selectDevice:"Gerät auswählen",appearance:"Erscheinungsbild",showGraph:"Diagramm anzeigen",showWater:"Wasser anzeigen",showEnergy:"Energie anzeigen",graphType:"Diagrammtyp",historyGraph:"Verlaufsdiagramm",liveGraph:"Live-Diagramm",displayOptions:"Anzeigeoptionen"}},fr:{common:{loading:"Chargement...",error:"Erreur",unknown:"Inconnu",today:"Aujourd'hui",week:"Semaine",month:"Mois",year:"Année",daily:"Quotidien",weekly:"Hebdomadaire",monthly:"Mensuel",yearly:"Annuel",current:"Actuel",total:"Total",temperature:"Température",humidity:"Humidité",settings:"Paramètres",save:"Enregistrer",cancel:"Annuler",close:"Fermer",edit:"Modifier",delete:"Supprimer",add:"Ajouter",name:"Nom",value:"Valeur",unit:"Unité",active:"Actif",inactive:"Inactif",on:"Activé",off:"Désactivé",yes:"Oui",no:"Non",show:"Afficher",hide:"Masquer"},waterflowkit:{title:"WaterFlowKit",subtitle:"Double mesure de débit",pipe1:"Conduite 1",pipe2:"Conduite 2",currentFlow:"Débit actuel",totalConsumption:"Consommation totale",flowRate:"Débit",perHour:"par heure",noFlow:"Pas de débit",flowing:"En cours",waterTemperature:"Température de l'eau",showPipe1:"Afficher conduite 1",showPipe2:"Afficher conduite 2",showTemperature:"Afficher température",pipe1Name:"Nom conduite 1",pipe2Name:"Nom conduite 2"},waterp1:{title:"WaterP1MeterKit",water:"Eau",energy:"Énergie",energyActive:"Énergie active",currentUsage:"Consommation d'eau actuelle",leakDetection:"Détection de fuite",monitoringActivity:"Activité de surveillance",meter:"Compteur",currentPower:"Puissance actuelle",electricityToday:"Électricité aujourd'hui",gasToday:"Gaz aujourd'hui",waterLast24h:"Eau dernières 24 heures",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Consommation d'eau",dailyUsage:"Consommation quotidienne",weeklyUsage:"Consommation hebdomadaire",monthlyUsage:"Consommation mensuelle",yearlyUsage:"Consommation annuelle",calibration:"Calibration",lastCalibration:"Dernière calibration",sinceLast:"depuis calibration"},ultimatesensor:{title:"UltimateSensor",roomScore:"Score de la pièce",excellent:"Excellent",good:"Bon",moderate:"Modéré",poor:"Mauvais",unhealthy:"Malsain",hazardous:"Dangereux",presence:"Présence",detected:"Détectée",notDetected:"Non détectée",targets:"Cibles",co2Level:"Niveau de CO₂",vocIndex:"Indice COV",noxIndex:"Indice NOx",illuminance:"Éclairement",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vue radar",roomView:"Vue de la pièce",view2D:"2D",view3D:"3D",zoneOccupancy:"Occupation de zone",zone:"Zone",recommendations:"Recommandations",ventilateNow:"Aérez maintenant !",openWindow:"Ouvrez une fenêtre",airQualityPoor:"La qualité de l'air est mauvaise",tooHumid:"Trop humide",tooDry:"Trop sec",tooCold:"Trop froid",tooWarm:"Trop chaud"},editor:{deviceId:"ID appareil",selectDevice:"Sélectionner appareil",appearance:"Apparence",showGraph:"Afficher graphique",showWater:"Afficher l'eau",showEnergy:"Afficher l'énergie",graphType:"Type de graphique",historyGraph:"Graphique historique",liveGraph:"Graphique en direct",displayOptions:"Options d'affichage"}},es:{common:{loading:"Cargando...",error:"Error",unknown:"Desconocido",today:"Hoy",week:"Semana",month:"Mes",year:"Año",daily:"Diario",weekly:"Semanal",monthly:"Mensual",yearly:"Anual",current:"Actual",total:"Total",temperature:"Temperatura",humidity:"Humedad",settings:"Configuración",save:"Guardar",cancel:"Cancelar",close:"Cerrar",edit:"Editar",delete:"Eliminar",add:"Añadir",name:"Nombre",value:"Valor",unit:"Unidad",active:"Activo",inactive:"Inactivo",on:"Encendido",off:"Apagado",yes:"Sí",no:"No",show:"Mostrar",hide:"Ocultar"},waterflowkit:{title:"WaterFlowKit",subtitle:"Medición de flujo dual",pipe1:"Tubería 1",pipe2:"Tubería 2",currentFlow:"Flujo actual",totalConsumption:"Consumo total",flowRate:"Caudal",perHour:"por hora",noFlow:"Sin flujo",flowing:"Fluyendo",waterTemperature:"Temperatura del agua",showPipe1:"Mostrar tubería 1",showPipe2:"Mostrar tubería 2",showTemperature:"Mostrar temperatura",pipe1Name:"Nombre tubería 1",pipe2Name:"Nombre tubería 2"},waterp1:{title:"WaterP1MeterKit",water:"Agua",energy:"Energía",energyActive:"Energía activa",currentUsage:"Consumo de agua actual",leakDetection:"Detección de fugas",monitoringActivity:"Actividad de monitoreo",meter:"Medidor",currentPower:"Potencia actual",electricityToday:"Electricidad hoy",gasToday:"Gas hoy",waterLast24h:"Agua últimas 24 horas",max:"máx"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo de agua",dailyUsage:"Consumo diario",weeklyUsage:"Consumo semanal",monthlyUsage:"Consumo mensual",yearlyUsage:"Consumo anual",calibration:"Calibración",lastCalibration:"Última calibración",sinceLast:"desde calibración"},ultimatesensor:{title:"UltimateSensor",roomScore:"Puntuación de habitación",excellent:"Excelente",good:"Bueno",moderate:"Moderado",poor:"Malo",unhealthy:"No saludable",hazardous:"Peligroso",presence:"Presencia",detected:"Detectada",notDetected:"No detectada",targets:"Objetivos",co2Level:"Nivel de CO₂",vocIndex:"Índice COV",noxIndex:"Índice NOx",illuminance:"Iluminancia",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista de habitación",view2D:"2D",view3D:"3D",zoneOccupancy:"Ocupación de zona",zone:"Zona",recommendations:"Recomendaciones",ventilateNow:"¡Ventila ahora!",openWindow:"Abre una ventana",airQualityPoor:"La calidad del aire es mala",tooHumid:"Demasiado húmedo",tooDry:"Demasiado seco",tooCold:"Demasiado frío",tooWarm:"Demasiado caliente"},editor:{deviceId:"ID de dispositivo",selectDevice:"Seleccionar dispositivo",appearance:"Apariencia",showGraph:"Mostrar gráfico",showWater:"Mostrar agua",showEnergy:"Mostrar energía",graphType:"Tipo de gráfico",historyGraph:"Gráfico histórico",liveGraph:"Gráfico en vivo",displayOptions:"Opciones de visualización"}},it:{common:{loading:"Caricamento...",error:"Errore",unknown:"Sconosciuto",today:"Oggi",week:"Settimana",month:"Mese",year:"Anno",daily:"Giornaliero",weekly:"Settimanale",monthly:"Mensile",yearly:"Annuale",current:"Attuale",total:"Totale",temperature:"Temperatura",humidity:"Umidità",settings:"Impostazioni",save:"Salva",cancel:"Annulla",close:"Chiudi",edit:"Modifica",delete:"Elimina",add:"Aggiungi",name:"Nome",value:"Valore",unit:"Unità",active:"Attivo",inactive:"Inattivo",on:"Acceso",off:"Spento",yes:"Sì",no:"No",show:"Mostra",hide:"Nascondi"},waterflowkit:{title:"WaterFlowKit",subtitle:"Misurazione doppio flusso",pipe1:"Tubo 1",pipe2:"Tubo 2",currentFlow:"Flusso attuale",totalConsumption:"Consumo totale",flowRate:"Portata",perHour:"all'ora",noFlow:"Nessun flusso",flowing:"In flusso",waterTemperature:"Temperatura dell'acqua",showPipe1:"Mostra tubo 1",showPipe2:"Mostra tubo 2",showTemperature:"Mostra temperatura",pipe1Name:"Nome tubo 1",pipe2Name:"Nome tubo 2"},waterp1:{title:"WaterP1MeterKit",water:"Acqua",energy:"Energia",energyActive:"Energia attiva",currentUsage:"Consumo d'acqua attuale",leakDetection:"Rilevamento perdite",monitoringActivity:"Attività di monitoraggio",meter:"Contatore",currentPower:"Potenza attuale",electricityToday:"Elettricità oggi",gasToday:"Gas oggi",waterLast24h:"Acqua ultime 24 ore",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo d'acqua",dailyUsage:"Consumo giornaliero",weeklyUsage:"Consumo settimanale",monthlyUsage:"Consumo mensile",yearlyUsage:"Consumo annuale",calibration:"Calibrazione",lastCalibration:"Ultima calibrazione",sinceLast:"dalla calibrazione"},ultimatesensor:{title:"UltimateSensor",roomScore:"Punteggio stanza",excellent:"Eccellente",good:"Buono",moderate:"Moderato",poor:"Scarso",unhealthy:"Non salutare",hazardous:"Pericoloso",presence:"Presenza",detected:"Rilevata",notDetected:"Non rilevata",targets:"Obiettivi",co2Level:"Livello CO₂",vocIndex:"Indice COV",noxIndex:"Indice NOx",illuminance:"Illuminamento",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista stanza",view2D:"2D",view3D:"3D",zoneOccupancy:"Occupazione zona",zone:"Zona",recommendations:"Raccomandazioni",ventilateNow:"Ventila ora!",openWindow:"Apri una finestra",airQualityPoor:"La qualità dell'aria è scarsa",tooHumid:"Troppo umido",tooDry:"Troppo secco",tooCold:"Troppo freddo",tooWarm:"Troppo caldo"},editor:{deviceId:"ID dispositivo",selectDevice:"Seleziona dispositivo",appearance:"Aspetto",showGraph:"Mostra grafico",showWater:"Mostra acqua",showEnergy:"Mostra energia",graphType:"Tipo di grafico",historyGraph:"Grafico storico",liveGraph:"Grafico in tempo reale",displayOptions:"Opzioni di visualizzazione"}},pt:{common:{loading:"Carregando...",error:"Erro",unknown:"Desconhecido",today:"Hoje",week:"Semana",month:"Mês",year:"Ano",daily:"Diário",weekly:"Semanal",monthly:"Mensal",yearly:"Anual",current:"Atual",total:"Total",temperature:"Temperatura",humidity:"Umidade",settings:"Configurações",save:"Salvar",cancel:"Cancelar",close:"Fechar",edit:"Editar",delete:"Excluir",add:"Adicionar",name:"Nome",value:"Valor",unit:"Unidade",active:"Ativo",inactive:"Inativo",on:"Ligado",off:"Desligado",yes:"Sim",no:"Não",show:"Mostrar",hide:"Ocultar"},waterflowkit:{title:"WaterFlowKit",subtitle:"Medição de fluxo duplo",pipe1:"Tubo 1",pipe2:"Tubo 2",currentFlow:"Fluxo atual",totalConsumption:"Consumo total",flowRate:"Vazão",perHour:"por hora",noFlow:"Sem fluxo",flowing:"Fluindo",waterTemperature:"Temperatura da água",showPipe1:"Mostrar tubo 1",showPipe2:"Mostrar tubo 2",showTemperature:"Mostrar temperatura",pipe1Name:"Nome tubo 1",pipe2Name:"Nome tubo 2"},waterp1:{title:"WaterP1MeterKit",water:"Água",energy:"Energia",energyActive:"Energia ativa",currentUsage:"Consumo de água atual",leakDetection:"Detecção de vazamento",monitoringActivity:"Atividade de monitoramento",meter:"Medidor",currentPower:"Potência atual",electricityToday:"Eletricidade hoje",gasToday:"Gás hoje",waterLast24h:"Água últimas 24 horas",max:"máx"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo de água",dailyUsage:"Consumo diário",weeklyUsage:"Consumo semanal",monthlyUsage:"Consumo mensal",yearlyUsage:"Consumo anual",calibration:"Calibração",lastCalibration:"Última calibração",sinceLast:"desde calibração"},ultimatesensor:{title:"UltimateSensor",roomScore:"Pontuação do ambiente",excellent:"Excelente",good:"Bom",moderate:"Moderado",poor:"Ruim",unhealthy:"Não saudável",hazardous:"Perigoso",presence:"Presença",detected:"Detectada",notDetected:"Não detectada",targets:"Alvos",co2Level:"Nível de CO₂",vocIndex:"Índice COV",noxIndex:"Índice NOx",illuminance:"Iluminância",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista do ambiente",view2D:"2D",view3D:"3D",zoneOccupancy:"Ocupação da zona",zone:"Zona",recommendations:"Recomendações",ventilateNow:"Ventile agora!",openWindow:"Abra uma janela",airQualityPoor:"A qualidade do ar está ruim",tooHumid:"Muito úmido",tooDry:"Muito seco",tooCold:"Muito frio",tooWarm:"Muito quente"},editor:{deviceId:"ID do dispositivo",selectDevice:"Selecionar dispositivo",appearance:"Aparência",showGraph:"Mostrar gráfico",showWater:"Mostrar água",showEnergy:"Mostrar energia",graphType:"Tipo de gráfico",historyGraph:"Gráfico histórico",liveGraph:"Gráfico ao vivo",displayOptions:"Opções de exibição"}},pl:{common:{loading:"Ładowanie...",error:"Błąd",unknown:"Nieznany",today:"Dzisiaj",week:"Tydzień",month:"Miesiąc",year:"Rok",daily:"Dziennie",weekly:"Tygodniowo",monthly:"Miesięcznie",yearly:"Rocznie",current:"Bieżący",total:"Łącznie",temperature:"Temperatura",humidity:"Wilgotność",settings:"Ustawienia",save:"Zapisz",cancel:"Anuluj",close:"Zamknij",edit:"Edytuj",delete:"Usuń",add:"Dodaj",name:"Nazwa",value:"Wartość",unit:"Jednostka",active:"Aktywny",inactive:"Nieaktywny",on:"Włączony",off:"Wyłączony",yes:"Tak",no:"Nie",show:"Pokaż",hide:"Ukryj"},waterflowkit:{title:"WaterFlowKit",subtitle:"Podwójny pomiar przepływu",pipe1:"Rura 1",pipe2:"Rura 2",currentFlow:"Bieżący przepływ",totalConsumption:"Całkowite zużycie",flowRate:"Przepływ",perHour:"na godzinę",noFlow:"Brak przepływu",flowing:"Przepływa",waterTemperature:"Temperatura wody",showPipe1:"Pokaż rurę 1",showPipe2:"Pokaż rurę 2",showTemperature:"Pokaż temperaturę",pipe1Name:"Nazwa rury 1",pipe2Name:"Nazwa rury 2"},waterp1:{title:"WaterP1MeterKit",water:"Woda",energy:"Energia",energyActive:"Energia aktywna",currentUsage:"Bieżące zużycie wody",leakDetection:"Wykrywanie wycieków",monitoringActivity:"Aktywność monitorowania",meter:"Licznik",currentPower:"Bieżąca moc",electricityToday:"Prąd dzisiaj",gasToday:"Gaz dzisiaj",waterLast24h:"Woda ostatnie 24 godziny",max:"maks"},watermeter:{title:"WaterMeterKit",waterUsage:"Zużycie wody",dailyUsage:"Dzienne zużycie",weeklyUsage:"Tygodniowe zużycie",monthlyUsage:"Miesięczne zużycie",yearlyUsage:"Roczne zużycie",calibration:"Kalibracja",lastCalibration:"Ostatnia kalibracja",sinceLast:"od kalibracji"},ultimatesensor:{title:"UltimateSensor",roomScore:"Wynik pomieszczenia",excellent:"Doskonały",good:"Dobry",moderate:"Umiarkowany",poor:"Słaby",unhealthy:"Niezdrowy",hazardous:"Niebezpieczny",presence:"Obecność",detected:"Wykryta",notDetected:"Nie wykryta",targets:"Cele",co2Level:"Poziom CO₂",vocIndex:"Indeks LZO",noxIndex:"Indeks NOx",illuminance:"Natężenie oświetlenia",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Widok radaru",roomView:"Widok pomieszczenia",view2D:"2D",view3D:"3D",zoneOccupancy:"Zajętość strefy",zone:"Strefa",recommendations:"Zalecenia",ventilateNow:"Wietrz teraz!",openWindow:"Otwórz okno",airQualityPoor:"Jakość powietrza jest słaba",tooHumid:"Za wilgotno",tooDry:"Za sucho",tooCold:"Za zimno",tooWarm:"Za ciepło"},editor:{deviceId:"ID urządzenia",selectDevice:"Wybierz urządzenie",appearance:"Wygląd",showGraph:"Pokaż wykres",showWater:"Pokaż wodę",showEnergy:"Pokaż energię",graphType:"Typ wykresu",historyGraph:"Wykres historyczny",liveGraph:"Wykres na żywo",displayOptions:"Opcje wyświetlania"}}};let Ue="en",Oe=Ne;function Re(e){return e&&function(e){const t=function(e){return e?(e.language||e.locale?.language||"en").split("-")[0].toLowerCase():"en"}(e);t!==Ue&&(Ue=t,Oe=Le[t]||Ne)}(e),Oe}let Fe=class extends ce{constructor(){super(...arguments),this._config={}}setConfig(e){this._config={show_flow1:!0,show_flow2:!0,show_temperature:!0,...e}}getCardSize(){return 5}updated(e){super.updated(e),e.has("hass")&&this.hass&&!this._config.flow1_flow_entity&&this._autoDetectEntities()}_autoDetectEntities(){if(!this.hass)return;const e=Object.keys(this.hass.states),t={};for(const i of e){const e=i.toLowerCase();e.includes("waterflowkit")&&(e.includes("flow1")&&(e.includes("current")&&e.includes("usage")?t.flow1_flow_entity=i:e.includes("total")&&e.includes("consumption")?t.flow1_total_entity=i:e.includes("temperature")&&(t.flow1_temp_entity=i)),e.includes("flow2")&&(e.includes("current")&&e.includes("usage")?t.flow2_flow_entity=i:e.includes("total")&&e.includes("consumption")?t.flow2_total_entity=i:e.includes("temperature")&&(t.flow2_temp_entity=i)))}Object.keys(t).length>0&&(this._config={...this._config,...t},Ie("WaterFlowKit: Auto-detected entities:",t))}_getFlowData(e){const t=1===e?this._config.flow1_flow_entity:this._config.flow2_flow_entity,i=1===e?this._config.flow1_total_entity:this._config.flow2_total_entity,o=1===e?this._config.flow1_temp_entity:this._config.flow2_temp_entity,a=xe(this.hass,t)??0,r=xe(this.hass,i)??0,s=xe(this.hass,o),n=null!==s&&s>-10;return{flow:a,total:r,temp:n?s:null,hasTemp:n,isFlowing:a>.01}}_getTempClass(e){return null===e?"":e<20?"cold":e<40?"warm":"hot"}_getFlowSpeed(e){return e>5?"fast":e<1?"slow":""}render(){if(!this.hass)return Z;const e=Re(this.hass),t=!1!==this._config.show_flow1,i=!1!==this._config.show_flow2,o=!1!==this._config.flow1_show_temp,a=!1!==this._config.flow2_show_temp,r=this._getFlowData(1),s=this._getFlowData(2),n=this._config.flow1_name||e.waterflowkit.pipe1,l=this._config.flow2_name||e.waterflowkit.pipe2,c=(t&&r.isFlowing?1:0)+(i&&s.isFlowing?1:0),d=(t?r.flow:0)+(i?s.flow:0);return G`
      <ha-card>
        <div class="card-content">
          <div class="header">
            <div class="header-left">
              <div class="header-icon ${c>0?"flowing":""}">
                ${Pe("waterflowkit")?ye(Pe("waterflowkit")):G`<ha-icon icon="mdi:pipe"></ha-icon>`}
              </div>
              <div>
                <h2 class="header-title">${e.waterflowkit.title}</h2>
                <div class="header-subtitle">${e.waterflowkit.subtitle}</div>
              </div>
            </div>
            <div class="status-badge ${c>0?"flowing":"inactive"}">
              <ha-icon icon="${c>0?"mdi:water":"mdi:water-off"}"></ha-icon>
              <span>${c>0?`${ke(d,2)} L/min`:e.waterflowkit.noFlow}</span>
            </div>
          </div>

          <div class="pipe-container">
            ${this._renderPipesSVG(r,s,t,i,o,a)}
          </div>

          ${t?this._renderFlowCard(1,r,n,o):Z}
          ${i?this._renderFlowCard(2,s,l,a):Z}
        </div>
      </ha-card>
    `}_renderPipesSVG(e,t,i,o,a,r){const s=Re(this.hass),n=i&&e.isFlowing,l=o&&t.isFlowing,c=i&&o,d=35,h=c?105:35;return V`
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
        ${i?V`
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
          <text class="pipe-label" x="110" y="${20}">${(this._config.flow1_name||s.waterflowkit.pipe1).toUpperCase()}</text>
          <text class="pipe-value" x="220" y="${40}">${ke(e.flow,2)}</text>
          <text class="pipe-unit" x="265" y="${40}">L/min</text>
          ${a&&e.hasTemp?V`
            <text class="temp-badge ${this._getTempClass(e.temp)}" x="320" y="${40}">${ke(e.temp,1)}°C</text>
          `:""}
        `:""}

        <!-- Flow 2 -->
        ${o?V`
          <!-- Pipe -->
          <path class="pipe" d="M 0 ${h} L 360 ${h}" />
          <path class="pipe-inner" d="M 0 ${h} L 360 ${h}" />

          <!-- Animated water flow -->
          <path class="water-flow flow2 ${l?"active":""} ${this._getFlowSpeed(t.flow)}" d="M 0 ${h} L 360 ${h}" />

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
          <text class="pipe-label" x="110" y="${h-15}">${(this._config.flow2_name||s.waterflowkit.pipe2).toUpperCase()}</text>
          <text class="pipe-value flow2" x="220" y="${h+5}">${ke(t.flow,2)}</text>
          <text class="pipe-unit" x="265" y="${h+5}">L/min</text>
          ${r&&t.hasTemp?V`
            <text class="temp-badge ${this._getTempClass(t.temp)}" x="320" y="${h+5}">${ke(t.temp,1)}°C</text>
          `:""}
        `:""}
      </svg>
    `}_renderYFSensor(e,t,i,o){const a=1===o?"#0ea5e9":"#22c55e";return V`
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
        <rect x="12" y="-4" width="16" height="10" rx="2" fill="${i?a:"#dc2626"}" />
        <rect x="13" y="-3" width="14" height="2" fill="${i?"#fff":"#ef4444"}" opacity="0.4" />

        <!-- Cable -->
        <path d="M 20 -4 Q 20 -10 25 -12 L 30 -12" stroke="#1e293b" stroke-width="2" fill="none" />
        <circle cx="30" cy="-12" r="2" fill="#374151" />

        <!-- Flow direction arrow inside -->
        <path d="M 14 12 L 22 12 L 20 9 M 22 12 L 20 15" stroke="#8b6914" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Active glow -->
        ${i?V`
          <rect x="12" y="-4" width="16" height="10" rx="2" fill="${a}" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1s" repeatCount="indefinite" />
          </rect>
        `:""}
      </g>
    `}_renderFlowCard(e,t,i,o){const a=Re(this.hass),r=1===e?this._config.flow1_flow_entity:this._config.flow2_flow_entity,s=this._getTempClass(t.temp);return G`
      <div class="flow-card flow${e} ${t.isFlowing?"active":""}" @click=${()=>r&&$e(this,r)}>
        <div class="flow-card-header">
          <div class="flow-card-left">
            <div class="flow-icon flow${e}">
              <ha-icon icon="mdi:${t.isFlowing?"water":"water-off"}"></ha-icon>
            </div>
            <div>
              <div class="flow-name">${i}</div>
              <div class="flow-status ${t.isFlowing?"active":""}">${t.isFlowing?`● ${a.waterflowkit.flowing}`:`○ ${a.common.inactive}`}</div>
            </div>
          </div>
          <div class="flow-current">
            <span class="flow-value">${ke(t.flow,2)}</span>
            <span class="flow-unit">L/min</span>
          </div>
        </div>
        <div class="flow-card-stats">
          <div class="flow-stat">
            <div class="flow-stat-label">${a.waterflowkit.totalConsumption}</div>
            <div class="flow-stat-value">${ke(1e3*t.total,0)}</div>
            <div class="flow-stat-unit">liter</div>
          </div>
          ${o&&t.hasTemp?G`
            <div class="flow-stat">
              <div class="flow-stat-label">${a.common.temperature}</div>
              <div class="temp-display ${s}">
                <ha-icon icon="mdi:thermometer"></ha-icon>
                <span class="flow-stat-value">${ke(t.temp,1)}°C</span>
              </div>
            </div>
          `:G`
            <div class="flow-stat">
              <div class="flow-stat-label">Status</div>
              <div class="flow-stat-value">${t.isFlowing?a.common.active:a.common.off}</div>
            </div>
          `}
          <div class="flow-stat">
            <div class="flow-stat-label">${a.waterflowkit.flowRate}</div>
            <div class="flow-stat-value">${ke(60*t.flow,1)}</div>
            <div class="flow-stat-unit">L/h</div>
          </div>
        </div>
      </div>
    `}static getConfigElement(){return document.createElement("smarthomeshop-waterflowkit-card-editor")}static getStubConfig(){return{show_flow1:!0,show_flow2:!0,flow1_show_temp:!0,flow2_show_temp:!0,flow1_name:"Hot water",flow2_name:"Cold water"}}};Fe.styles=[ze,s`
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
    `],e([ue({attribute:!1})],Fe.prototype,"hass",void 0),e([me()],Fe.prototype,"_config",void 0),Fe=e([he("smarthomeshop-waterflowkit-card")],Fe);let He=class extends ce{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&this._findDevices()}_findDevices(){if(!this.hass?.devices||!this.hass?.entities)return;const e=[];for(const[t,i]of Object.entries(this.hass.devices)){const o=Object.entries(this.hass.entities).filter(([e,i])=>i.device_id===t).map(([e])=>e),a=o.some(e=>e.includes("flow1")),r=o.some(e=>e.includes("flow2"));(a||r)&&e.push({id:t,name:i.name||i.name_by_user||"WaterFlowKit"})}this._devices=e}_valueChanged(e,t){const i={...this._config,[e]:t};this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}_getFilteredEntities(e){return this.hass?.states?Object.keys(this.hass.states).filter(t=>t.startsWith("sensor.")&&e(t)).sort():[]}_getFlowEntities(){return this._getFilteredEntities(e=>e.includes("water")||e.includes("flow")||e.includes("usage"))}_getTotalEntities(){return this._getFilteredEntities(e=>e.includes("consumption")||e.includes("total")||e.includes("water"))}_getTempEntities(){return this._getFilteredEntities(e=>e.includes("temp")||e.includes("temperature"))}render(){const e=Re(this.hass),t=this._getFlowEntities(),i=this._getTotalEntities(),o=this._getTempEntities();return G`
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
              ${o.map(e=>G`
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
              ${o.map(e=>G`
                <option value=${e} ?selected=${e===this._config.flow2_temp_entity}>${e}</option>
              `)}
            </select>
          </div>
        `:""}
      </div>
    `}};He.styles=s`
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
  `,e([ue({attribute:!1})],He.prototype,"hass",void 0),e([me()],He.prototype,"_config",void 0),e([me()],He.prototype,"_devices",void 0),He=e([he("smarthomeshop-waterflowkit-card-editor")],He);const je={detection:{fill:"rgba(34, 197, 94, 0.2)",stroke:"#22c55e"},exclusion:{fill:"rgba(239, 68, 68, 0.2)",stroke:"#ef4444"},entry:{fill:"rgba(16, 185, 129, 0.25)",stroke:"#10b981"}},Ge=600;class Ve{constructor(){this.camera={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3},this.wallHeight=2500}resetCamera(e){if(e.length>=3){const t=e.map(e=>e.x),i=e.map(e=>e.y),o=(Math.min(...t)+Math.max(...t))/2,a=(Math.min(...i)+Math.max(...i))/2,r=Math.max(Math.max(...t)-Math.min(...t),Math.max(...i)-Math.min(...i));this.camera={azimuth:45,elevation:35,distance:Math.max(4e3,1.5*r),targetX:o,targetY:a,targetZ:this.wallHeight/2}}else this.camera={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3}}orbit(e,t){this.camera.azimuth=(this.camera.azimuth-.5*e)%360,this.camera.elevation=Math.max(5,Math.min(85,this.camera.elevation+.3*t))}zoomBy(e){this.camera.distance=Math.max(2e3,Math.min(2e4,this.camera.distance*e))}render(e,t){e.width=800,e.height=Ge;const i=e.getContext("2d");if(!i)return;const o=i.createLinearGradient(0,0,0,Ge);o.addColorStop(0,"#1e293b"),o.addColorStop(1,"#0f172a"),i.fillStyle=o,i.fillRect(0,0,800,Ge),this.drawGrid(i),t.roomPoints.length>=3&&(this.drawRoom(i,t),this.drawFurniture(i,t),this.drawDoors(i,t),this.drawWindows(i,t),this.drawZones(i,t)),this.drawSensors(i,t),this.drawTargets(i,t)}project(e){const t=this.camera,i=t.azimuth*Math.PI/180,o=t.elevation*Math.PI/180,a=e.x-t.targetX,r=e.y-t.targetY,s=e.z-t.targetZ,n=a*Math.cos(i)-r*Math.sin(i),l=a*Math.sin(i)+r*Math.cos(i),c=s,d=l*Math.cos(o)-c*Math.sin(o),h=l*Math.sin(o)+c*Math.cos(o),p=1/Math.tan(60*Math.PI/360)*400,g=t.distance+d,u=g>50?p/g:p/50;return{x:400-n*u,y:300-h*u}}drawGrid(e){e.strokeStyle="rgba(71, 85, 105, 0.3)",e.lineWidth=1;const t=5e3;for(let i=-5e3;i<=t;i+=1e3){const o=this.project({x:i,y:-5e3,z:0}),a=this.project({x:i,y:t,z:0});e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(a.x,a.y),e.stroke();const r=this.project({x:-5e3,y:i,z:0}),s=this.project({x:t,y:i,z:0});e.beginPath(),e.moveTo(r.x,r.y),e.lineTo(s.x,s.y),e.stroke()}}drawRoom(e,t){const i=t.roomPoints;e.fillStyle="rgba(67, 97, 238, 0.08)",e.strokeStyle="rgba(67, 97, 238, 0.4)",e.lineWidth=2,e.beginPath();const o=this.project({x:i[0].x,y:i[0].y,z:0});e.moveTo(o.x,o.y);for(let t=1;t<i.length;t++){const o=this.project({x:i[t].x,y:i[t].y,z:0});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();const a=i.map((e,t)=>{const o=i[(t+1)%i.length],a=(e.x+o.x)/2,r=(e.y+o.y)/2;return{index:t,dist:Math.hypot(a-this.camera.targetX,r-this.camera.targetY)}}).sort((e,t)=>t.dist-e.dist);for(const{index:i}of a)this.drawWall(e,t,i)}drawWall(e,t,i){const o=t.roomPoints,a=o[i],r=o[(i+1)%o.length],s=this.project({x:a.x,y:a.y,z:0}),n=this.project({x:r.x,y:r.y,z:0}),l=this.project({x:r.x,y:r.y,z:this.wallHeight}),c=this.project({x:a.x,y:a.y,z:this.wallHeight}),d=r.x-a.x,h=r.y-a.y,p=Math.atan2(h,d)+Math.PI/2,g=this.camera.azimuth*Math.PI/180,u=.3+.4*Math.abs(Math.cos(p-g)),m=e.createLinearGradient((s.x+n.x)/2,Math.max(s.y,n.y),(c.x+l.x)/2,Math.min(c.y,l.y));m.addColorStop(0,`rgba(71, 85, 105, ${.5*u})`),m.addColorStop(1,`rgba(71, 85, 105, ${.2*u})`),e.fillStyle=m,e.strokeStyle="#475569",e.lineWidth=2,e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(n.x,n.y),e.lineTo(l.x,l.y),e.lineTo(c.x,c.y),e.closePath(),e.fill(),e.stroke()}drawFurniture(e,t){for(const i of t.furniture){const t=i.width/2,o=i.height/2,a=400,r=(i.rotation||0)*Math.PI/180,s=Math.cos(r),n=Math.sin(r),l=[[-t,-o],[t,-o],[t,o],[-t,o]].map(([e,t])=>({x:i.x+e*s-t*n,y:i.y+e*n+t*s,z:0})),c=l.map(e=>({...e,z:a})),d=l.map(e=>this.project(e)),h=c.map(e=>this.project(e));e.fillStyle="rgba(148, 163, 184, 0.5)",e.strokeStyle="#64748b",e.lineWidth=1,e.beginPath(),e.moveTo(h[0].x,h[0].y);for(let t=1;t<4;t++)e.lineTo(h[t].x,h[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle="rgba(148, 163, 184, 0.25)",e.beginPath(),e.moveTo(d[t].x,d[t].y),e.lineTo(d[i].x,d[i].y),e.lineTo(h[i].x,h[i].y),e.lineTo(h[t].x,h[t].y),e.closePath(),e.fill(),e.stroke()}const p=this.project({x:i.x,y:i.y,z:a+100});e.fillStyle="#94a3b8",e.font="11px sans-serif",e.textAlign="center",e.fillText(i.name,p.x,p.y)}}drawDoors(e,t){for(const i of t.doors){if(i.wallIndex>=t.roomPoints.length)continue;const o=t.roomPoints[i.wallIndex],a=t.roomPoints[(i.wallIndex+1)%t.roomPoints.length],r=o.x+(a.x-o.x)*i.position,s=o.y+(a.y-o.y)*i.position,n=Math.atan2(a.y-o.y,a.x-o.x),l=i.width/2,c=Math.cos(n),d=Math.sin(n),h=Math.cos(n+Math.PI/2),p=Math.sin(n+Math.PI/2),g=[{x:r-l*c-40*h,y:s-l*d-40*p},{x:r+l*c-40*h,y:s+l*d-40*p},{x:r+l*c+40*h,y:s+l*d+40*p},{x:r-l*c+40*h,y:s-l*d+40*p}],u=g.map(e=>this.project({...e,z:0})),m=g.map(e=>this.project({...e,z:2e3}));e.strokeStyle="#8b5a2b",e.lineWidth=1,e.fillStyle="rgba(139, 90, 43, 0.6)",e.beginPath(),e.moveTo(m[0].x,m[0].y);for(let t=1;t<4;t++)e.lineTo(m[t].x,m[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(139, 90, 43, 0.5)":"rgba(139, 90, 43, 0.35)",e.beginPath(),e.moveTo(u[t].x,u[t].y),e.lineTo(u[i].x,u[i].y),e.lineTo(m[i].x,m[i].y),e.lineTo(m[t].x,m[t].y),e.closePath(),e.fill(),e.stroke()}}}drawWindows(e,t){for(const i of t.windows){if(i.wallIndex>=t.roomPoints.length)continue;const o=t.roomPoints[i.wallIndex],a=t.roomPoints[(i.wallIndex+1)%t.roomPoints.length],r=o.x+(a.x-o.x)*i.position,s=o.y+(a.y-o.y)*i.position,n=Math.atan2(a.y-o.y,a.x-o.x),l=i.width/2,c=i.height||1100,d=Math.cos(n),h=Math.sin(n),p=Math.cos(n+Math.PI/2),g=Math.sin(n+Math.PI/2),u=[{x:r-l*d-25*p,y:s-l*h-25*g},{x:r+l*d-25*p,y:s+l*h-25*g},{x:r+l*d+25*p,y:s+l*h+25*g},{x:r-l*d+25*p,y:s-l*h+25*g}],m=u.map(e=>this.project({...e,z:900})),f=u.map(e=>this.project({...e,z:900+c}));e.strokeStyle="#4a90a4",e.lineWidth=1,e.fillStyle="rgba(135, 206, 235, 0.4)",e.beginPath(),e.moveTo(f[0].x,f[0].y);for(let t=1;t<4;t++)e.lineTo(f[t].x,f[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(135, 206, 235, 0.35)":"rgba(135, 206, 235, 0.25)",e.beginPath(),e.moveTo(m[t].x,m[t].y),e.lineTo(m[i].x,m[i].y),e.lineTo(f[i].x,f[i].y),e.lineTo(f[t].x,f[t].y),e.closePath(),e.fill(),e.stroke()}}}drawZones(e,t){const i=this.wallHeight;for(const o of t.zones){const t=je[o.type]||je.detection,a=o.points;if("entry"===o.type&&2===a.length){const r=a[0],s=a[1],n=this.project({x:r.x,y:r.y,z:0}),l=this.project({x:s.x,y:s.y,z:0}),c=this.project({x:r.x,y:r.y,z:i}),d=this.project({x:s.x,y:s.y,z:i});e.fillStyle=t.fill.replace("0.25","0.4"),e.strokeStyle=t.stroke,e.lineWidth=3,e.beginPath(),e.moveTo(n.x,n.y),e.lineTo(l.x,l.y),e.lineTo(d.x,d.y),e.lineTo(c.x,c.y),e.closePath(),e.fill(),e.stroke();const h=this.project({x:(r.x+s.x)/2,y:(r.y+s.y)/2,z:i/2});e.fillStyle=t.stroke,e.font="bold 14px sans-serif",e.textAlign="center",e.fillText("left"===o.inDirection?"← IN":"IN →",h.x,h.y)}else if(a.length>=3){e.fillStyle=t.fill,e.strokeStyle=t.stroke,e.lineWidth=2,e.beginPath();const r=this.project({x:a[0].x,y:a[0].y,z:10});e.moveTo(r.x,r.y);for(let t=1;t<a.length;t++){const i=this.project({x:a[t].x,y:a[t].y,z:10});e.lineTo(i.x,i.y)}e.closePath(),e.fill(),e.stroke(),e.fillStyle=t.fill.replace("0.2","0.15"),e.beginPath();const s=this.project({x:a[0].x,y:a[0].y,z:i});e.moveTo(s.x,s.y);for(let t=1;t<a.length;t++){const o=this.project({x:a[t].x,y:a[t].y,z:i});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();for(let o=0;o<a.length;o++){const r=a[o],s=a[(o+1)%a.length],n=this.project({x:r.x,y:r.y,z:10}),l=this.project({x:s.x,y:s.y,z:10}),c=this.project({x:s.x,y:s.y,z:i}),d=this.project({x:r.x,y:r.y,z:i});e.fillStyle=t.fill.replace("0.2","0.12"),e.strokeStyle=t.stroke,e.lineWidth=1,e.beginPath(),e.moveTo(n.x,n.y),e.lineTo(l.x,l.y),e.lineTo(c.x,c.y),e.lineTo(d.x,d.y),e.closePath(),e.fill(),e.stroke()}const n=a.reduce((e,t)=>e+t.x,0)/a.length,l=a.reduce((e,t)=>e+t.y,0)/a.length,c=this.project({x:n,y:l,z:i/2});e.fillStyle=t.stroke,e.font="bold 12px sans-serif",e.textAlign="center",e.fillText(o.name,c.x,c.y)}}}drawSensors(e,t){for(const i of t.sensors){const t=i.heightMm??2e3,o=this.project({x:i.x,y:i.y,z:t}),a=i.fov/2*Math.PI/180,r=(i.rotation-90)*Math.PI/180,s=r-a,n=r+a,l=i.x+Math.cos(s)*i.range,c=i.y+Math.sin(s)*i.range,d=i.x+Math.cos(n)*i.range,h=i.y+Math.sin(n)*i.range,p=this.project({x:i.x,y:i.y,z:0}),g=this.project({x:l,y:c,z:0}),u=this.project({x:d,y:h,z:0});e.fillStyle="rgba(67, 97, 238, 0.15)",e.strokeStyle="#4361ee",e.lineWidth=2,e.beginPath(),e.moveTo(p.x,p.y),e.lineTo(g.x,g.y),e.lineTo(u.x,u.y),e.closePath(),e.fill(),e.stroke(),e.strokeStyle="rgba(67, 97, 238, 0.5)",e.lineWidth=1,e.setLineDash([4,4]),e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(p.x,p.y),e.stroke(),e.setLineDash([]),e.fillStyle="#4361ee",e.beginPath(),e.arc(o.x,o.y,12,0,2*Math.PI),e.fill(),e.fillStyle="white",e.font="bold 10px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText("📡",o.x,o.y)}}drawTargets(e,t){for(let i=0;i<t.targets.length;i++){const o=t.targets[i].x,a=t.targets[i].y;e.save();const r=this.project({x:o+80,y:a+80,z:5});e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.ellipse(r.x,r.y,25,10,.3,0,2*Math.PI),e.fill(),this.drawCapsule(e,o-60,a,0,60,700,"#8b9299","#6b7280"),this.drawCapsule(e,o+60,a,0,60,700,"#8b9299","#6b7280"),this.drawCapsule(e,o-160,a,900,50,380,"#8b9299","#6b7280"),this.drawCapsule(e,o+160,a,900,50,380,"#8b9299","#6b7280"),this.drawCapsule(e,o,a,700,120,600,"#b8bfc7","#9ca3af"),this.drawSphere(e,o,a,1500,110);const s=this.project({x:o,y:a,z:1700});e.fillStyle="rgba(239, 68, 68, 0.95)",e.beginPath(),e.arc(s.x,s.y,14,0,2*Math.PI),e.fill(),e.strokeStyle="rgba(255, 255, 255, 0.6)",e.lineWidth=2,e.stroke(),e.fillStyle="white",e.font="bold 12px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText(`${i+1}`,s.x,s.y),e.restore()}}drawCapsule(e,t,i,o,a,r,s,n){const l=.8*a,c=o+r,d=[];for(let e=0;e<8;e++){const r=e/8*Math.PI*2,s=(e+1)/8*Math.PI*2,n=t+Math.cos(r)*a,h=i+Math.sin(r)*l,p=t+Math.cos(s)*a,g=i+Math.sin(s)*l,u=this.project({x:n,y:h,z:o}),m=this.project({x:p,y:g,z:o}),f=this.project({x:p,y:g,z:c}),v=this.project({x:n,y:h,z:c});d.push({points:[u,m,f,v],depth:(h+g)/2,isTop:!1})}const h=[];for(let e=0;e<8;e++){const o=e/8*Math.PI*2;h.push(this.project({x:t+Math.cos(o)*a,y:i+Math.sin(o)*l,z:c}))}d.push({points:h,depth:-1e3,isTop:!0}),d.sort((e,t)=>t.depth-e.depth);for(const t of d){e.beginPath(),e.moveTo(t.points[0].x,t.points[0].y);for(let i=1;i<t.points.length;i++)e.lineTo(t.points[i].x,t.points[i].y);e.closePath(),e.fillStyle=t.isTop?s:this.shadeColor(s,t.depth>0?.85:1),e.fill(),e.strokeStyle=n,e.lineWidth=.5,e.stroke()}}drawSphere(e,t,i,o,a){const r=this.project({x:t,y:i,z:o}),s=this.project({x:t,y:i,z:o+a}),n=Math.abs(r.y-s.y),l=e.createRadialGradient(r.x-.35*n,r.y-.35*n,0,r.x,r.y,n);l.addColorStop(0,"#ffffff"),l.addColorStop(.3,"#e5e7eb"),l.addColorStop(.7,"#d1d5db"),l.addColorStop(1,"#9ca3af"),e.fillStyle=l,e.beginPath(),e.arc(r.x,r.y,n,0,2*Math.PI),e.fill(),e.strokeStyle="#6b7280",e.lineWidth=1,e.stroke()}shadeColor(e,t){const i=e.replace("#","");return`rgb(${Math.round(parseInt(i.substr(0,2),16)*t)}, ${Math.round(parseInt(i.substr(2,2),16)*t)}, ${Math.round(parseInt(i.substr(4,2),16)*t)})`}}function Ye(e,t){const i=[];for(const o of e){if(!o.deviceId)continue;const e=(o.rotation-90)*Math.PI/180;for(let a=1;a<=3;a++){const r=t(`sensor.${o.deviceId}_target_${a}_x`),s=t(`sensor.${o.deviceId}_target_${a}_y`);if(void 0===r||void 0===s)continue;const n=parseFloat(r)||0,l=parseFloat(s)||0;0===n&&0===l||i.push({x:o.x+l*Math.cos(e)-n*Math.sin(e),y:o.y+l*Math.sin(e)+n*Math.cos(e)})}}return i}let Ze=class extends ce{constructor(){super(...arguments),this.entityPrefix="",this.deviceName="",this.isOpen=!1,this._settings=[],this._zones=[],this._activeTab="mmwave",this._showZoneEditor=!1,this._loading=!1,this._saving=!1,this._pendingChanges=new Map}updated(e){e.has("isOpen")&&this.isOpen&&this._loadSettings()}_loadSettings(){if(!this.hass||!this.entityPrefix)return;this._loading=!0;const e=[],t=this.entityPrefix;[{suffix:"max_distance",name:"Max Afstand",unit:"mm",min:100,max:6e3,step:100}].forEach(i=>{const o=`number.${t}_${i.suffix}`,a=this.hass.states[o];a&&"unavailable"!==a.state&&e.push({entityId:o,name:i.name,value:parseFloat(a.state),min:i.min,max:i.max,step:i.step,unit:i.unit,group:"mmwave"})});[{suffix:"temperature_offset",name:"Temp Offset",unit:"°C",min:-10,max:10,step:.1},{suffix:"humidity_offset",name:"Humidity Offset",unit:"%",min:-20,max:20,step:1}].forEach(i=>{const o=`number.${t}_${i.suffix}`,a=this.hass.states[o];a&&"unavailable"!==a.state&&e.push({entityId:o,name:i.name,value:parseFloat(a.state),min:i.min,max:i.max,step:i.step,unit:i.unit,group:"calibration"})});const i=[];for(let e=1;e<=4;e++)i.push({id:e,beginX:this._getNum(`zone_${e}_begin_x`),endX:this._getNum(`zone_${e}_end_x`),beginY:this._getNum(`zone_${e}_begin_y`),endY:this._getNum(`zone_${e}_end_y`)});this._settings=e,this._zones=i,this._loading=!1}_getNum(e){const t=`number.${this.entityPrefix}_${e}`,i=this.hass?.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_handleChange(e,t){this._pendingChanges.set(e,t),this.requestUpdate()}async _saveChanges(){if(this.hass&&0!==this._pendingChanges.size){this._saving=!0;try{for(const[e,t]of this._pendingChanges)await this.hass.callService("number","set_value",{entity_id:e,value:t});this._pendingChanges.clear(),setTimeout(()=>this._loadSettings(),500)}catch(e){console.error("Save failed:",e)}finally{this._saving=!1}}}async _saveZone(e){if(this.hass){this._saving=!0;try{const t=this.entityPrefix;await Promise.all([this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_begin_x`,value:e.beginX}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_end_x`,value:e.endX}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_begin_y`,value:e.beginY}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_end_y`,value:e.endY})])}catch(e){console.error("Zone save failed:",e)}finally{this._saving=!1}}}_close(){this.dispatchEvent(new CustomEvent("close"))}_renderSetting(e){const t=this._pendingChanges.has(e.entityId)?this._pendingChanges.get(e.entityId):e.value;return G`
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
            <span class="zone-badge ${t?"active":"inactive"}">${t?"Active":"Empty"}</span>
          </div>
          <button class="save-zone-btn" @click=${()=>this._saveZone(e)} ?disabled=${this._saving}>Save</button>
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
              `:G`<div class="empty-state">No mmWave settings found</div>`}
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
              `:G`<div class="empty-state">No calibration settings found</div>`}
            `:Z}
          </div>

          <div class="modal-footer">
            <div class="changes-badge">
              ${this._pendingChanges.size>0?G`<ha-icon icon="mdi:alert-circle"></ha-icon> ${this._pendingChanges.size} wijzigingen`:Z}
            </div>
            <div>
              <button class="btn btn-secondary" @click=${this._close}>Close</button>
              <button class="btn btn-primary" @click=${this._saveChanges} ?disabled=${0===this._pendingChanges.size||this._saving}>
                ${this._saving?"Saving...":"Save"}
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
    `}};Ze.styles=s`
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
  `,e([ue({attribute:!1})],Ze.prototype,"hass",void 0),e([ue()],Ze.prototype,"entityPrefix",void 0),e([ue()],Ze.prototype,"deviceName",void 0),e([ue({type:Boolean})],Ze.prototype,"isOpen",void 0),e([me()],Ze.prototype,"_settings",void 0),e([me()],Ze.prototype,"_zones",void 0),e([me()],Ze.prototype,"_activeTab",void 0),e([me()],Ze.prototype,"_showZoneEditor",void 0),e([me()],Ze.prototype,"_loading",void 0),e([me()],Ze.prototype,"_saving",void 0),e([me()],Ze.prototype,"_pendingChanges",void 0),Ze=e([he("smarthomeshop-sensor-settings")],Ze);let qe=class extends ce{constructor(){super(...arguments),this._config={},this._targets=[],this._zones=[],this._environment={temperature:null,humidity:null,co2:null,illuminance:null,voc:null,nox:null,pm1_0:null,pm2_5:null,pm4_0:null,pm10:null,typical_particle_size:null},this._entityPrefix="",this._deviceName="",this._entityIds={targets:[]},this._showSettings=!1,this._viewMode="radar",this._rooms=[],this._selectedRoomId=null,this._roomViewMode="2d",this._room3d=new Ve,this._isDragging3D=!1,this._lastMouseX=0,this._lastMouseY=0,this._roomsLoaded=!1,this._on3DMouseDown=e=>{this._isDragging3D=!0,this._lastMouseX=e.clientX,this._lastMouseY=e.clientY},this._on3DMouseMove=e=>{if(!this._isDragging3D)return;const t=e.clientX-this._lastMouseX,i=e.clientY-this._lastMouseY;this._lastMouseX=e.clientX,this._lastMouseY=e.clientY,this._room3d.orbit(-t,.6*i),this._render3DView()},this._on3DMouseUp=()=>{this._isDragging3D=!1},this._on3DWheel=e=>{e.preventDefault(),this._room3d.zoomBy(e.deltaY>0?1.1:.9),this._render3DView()}}_fireMoreInfo(e){if(!e)return;const t=new CustomEvent("hass-more-info",{detail:{entityId:e},bubbles:!0,composed:!0});this.dispatchEvent(t)}static getConfigElement(){return document.createElement("smarthomeshop-ultimatesensor-card-editor")}static getStubConfig(){return{max_distance:6e3,show_radar:!0,show_environment:!0,show_zones:!0,show_grid:!0}}setConfig(e){this._config={max_distance:6e3,show_radar:!0,show_environment:!0,show_zones:!0,show_grid:!0,...e},this._roomViewMode=this._config.room_view_mode||"2d","3d"===this._roomViewMode&&setTimeout(()=>this._init3DView(),100)}getCardSize(){return 6}connectedCallback(){super.connectedCallback(),this._startUpdates()}disconnectedCallback(){super.disconnectedCallback(),this._stopUpdates()}_startUpdates(){this._updateData(),this._updateInterval=window.setInterval(()=>this._updateData(),1e3)}async _loadRooms(){if(this.hass)if(this._roomsLoaded)Ie("SmartHomeShop: Rooms already loaded, skipping");else try{Ie("SmartHomeShop: Loading rooms via WebSocket...");const e=await this.hass.callWS({type:"smarthomeshop/rooms"});Ie("SmartHomeShop: WebSocket result:",e),this._rooms=Array.isArray(e?.rooms)?e.rooms:[],this._rooms.length>0&&!this._selectedRoomId&&(this._selectedRoomId=this._rooms[0]?.id||null,Ie("SmartHomeShop: Auto-selected room:",this._selectedRoomId)),this._roomsLoaded=!0,Ie("SmartHomeShop: Loaded",this._rooms.length,"rooms:",this._rooms.map(e=>e.name).join(", ")),"3d"===this._roomViewMode&&setTimeout(()=>this._init3DView(),50)}catch(e){console.error("SmartHomeShop: Could not load rooms:",e),this._rooms=[]}else Ie("SmartHomeShop: _loadRooms called but hass not available")}_stopUpdates(){this._updateInterval&&clearInterval(this._updateInterval)}updated(e){super.updated(e),this.hass&&!this._roomsLoaded&&this._loadRooms(),(e.has("hass")||e.has("_config"))&&this._detectEntityPrefix(),(e.has("_targets")||e.has("_zones"))&&(this._drawRadar(),"room"===this._config.view_mode&&"3d"===this._roomViewMode&&this._render3DView()),e.has("_roomViewMode")&&"3d"===this._roomViewMode&&setTimeout(()=>this._render3DView(),50)}firstUpdated(){this._drawRadar(),this.hass&&!this._roomsLoaded&&this._loadRooms()}_detectEntityPrefix(){if(this.hass){if(this._config.device_id){const e=this._getEntitiesForDevice(this._config.device_id).find(e=>e.includes("target_1_x"));if(e){const t=e.match(/^sensor\.(.+)_target_1_x$/);if(t){this._entityPrefix=t[1];const e=this.hass.devices?.[this._config.device_id];return void(this._deviceName=e?.name||"UltimateSensor")}}}if(this._config.entity_prefix)return this._entityPrefix=this._config.entity_prefix,void(this._deviceName=this._config.title||"UltimateSensor");for(const e of Object.keys(this.hass.states))if(e.includes("target_1_x")&&e.startsWith("sensor.")){const t=e.match(/^sensor\.(.+)_target_1_x$/);if(t)return this._entityPrefix=t[1],void(this._deviceName="UltimateSensor")}}}_getEntitiesForDevice(e){return this.hass?.entities?Object.entries(this.hass.entities).filter(([t,i])=>i.device_id===e).map(([e])=>e):[]}_getOfflineInfo(){if(!this.hass)return{offline:!1,lastSeen:null};const e=this._config.device_id,t=this.hass.entities;if(e&&t){let i=!1,o=null,a=null;for(const[r,s]of Object.entries(t)){if(s.device_id!==e)continue;if("esphome"!==s.platform)continue;if(!r.startsWith("sensor.")&&!r.startsWith("binary_sensor."))continue;const t=this.hass.states[r];if(!t)continue;if("connectivity"===t.attributes?.device_class){if("on"===t.state)return{offline:!1,lastSeen:null};"off"===t.state&&(a=t.last_changed??null);continue}if(i=!0,"unavailable"!==t.state)return{offline:!1,lastSeen:null};const n=t.last_changed;n&&(!o||n>o)&&(o=n)}return a?{offline:!0,lastSeen:a}:{offline:i,lastSeen:o}}if(!this._entityPrefix)return{offline:!1,lastSeen:null};const i=[`sensor.${this._entityPrefix}_`,`binary_sensor.${this._entityPrefix}_`];let o=!1,a=null,r=null;for(const[e,t]of Object.entries(this.hass.states)){if(e.endsWith("_cc"))continue;if(!i.some(t=>e.startsWith(t)))continue;if("connectivity"===t.attributes?.device_class){if("on"===t.state)return{offline:!1,lastSeen:null};"off"===t.state&&(r=t.last_changed??null);continue}if(o=!0,"unavailable"!==t.state)return{offline:!1,lastSeen:null};const s=t.last_changed;s&&(!a||s>a)&&(a=s)}return r?{offline:!0,lastSeen:r}:{offline:o,lastSeen:a}}_getSensorState(e){if(!this.hass||!this._entityPrefix)return null;const t=`sensor.${this._entityPrefix}_${e}`,i=this.hass.states[t]?.state;return i&&"unavailable"!==i&&"unknown"!==i?parseFloat(i):null}_findSensorEntityId(e){if(this.hass&&this._entityPrefix)for(const t of e){const e=`sensor.${this._entityPrefix}_${t}`,i=this.hass.states[e]?.state;if(i&&"unavailable"!==i&&"unknown"!==i)return e}}_getNumberState(e){if(!this.hass||!this._entityPrefix)return 0;const t=`number.${this._entityPrefix}_${e}`,i=this.hass.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_getBinaryState(e){if(!this.hass||!this._entityPrefix)return!1;const t=`binary_sensor.${this._entityPrefix}_${e}`;return"on"===this.hass.states[t]?.state}_updateData(){if(!this.hass||!this._entityPrefix)return;const e=[];for(let t=1;t<=3;t++){const i=this._getSensorState(`target_${t}_x`)??0,o=this._getSensorState(`target_${t}_y`)??0,a=this._getBinaryState(`target_${t}_active`),r=this._getSensorState(`target_${t}_distance`)??0;e.push({x:i,y:o,active:a,distance:r})}this._targets=e;const t=[];for(let e=1;e<=4;e++){const i=this._getNumberState(`zone_${e}_begin_x`),o=this._getNumberState(`zone_${e}_begin_y`),a=this._getNumberState(`zone_${e}_end_x`),r=this._getNumberState(`zone_${e}_end_y`);0===i&&0===o&&0===a&&0===r||t.push({beginX:i,beginY:o,endX:a,endY:r})}this._zones=t,this._environment={temperature:this._getSensorState("scd41_temperature")??this._getSensorState("temperature")??this._getSensorState("bme280_temperature"),humidity:this._getSensorState("scd41_humidity")??this._getSensorState("humidity")??this._getSensorState("bme280_humidity"),co2:this._getSensorState("scd41_co2")??this._getSensorState("co2"),illuminance:this._getSensorState("bh1750_illuminance")??this._getSensorState("illuminance"),voc:this._getSensorState("voc_index")??this._getSensorState("sgp41_voc_index")??this._getSensorState("sgp30_voc")??this._getSensorState("voc"),nox:this._getSensorState("nox_index")??this._getSensorState("sgp41_nox_index"),pm1_0:this._getSensorState("pm_1mm_weight_concentration")??this._getSensorState("pm_1_0"),pm2_5:this._getSensorState("pm_2_5mm_weight_concentration")??this._getSensorState("pm_2_5"),pm4_0:this._getSensorState("pm_4mm_weight_concentration")??this._getSensorState("pm_4_0"),pm10:this._getSensorState("pm_10mm_weight_concentration")??this._getSensorState("pm_10"),typical_particle_size:this._getSensorState("typical_particle_size")},this._entityIds={temperature:this._findSensorEntityId(["scd41_temperature","temperature","bme280_temperature"]),humidity:this._findSensorEntityId(["scd41_humidity","humidity","bme280_humidity"]),co2:this._findSensorEntityId(["scd41_co2","co2"]),illuminance:this._findSensorEntityId(["bh1750_illuminance","illuminance"]),voc:this._findSensorEntityId(["voc_index","sgp41_voc_index","sgp30_voc","voc"]),nox:this._findSensorEntityId(["nox_index","sgp41_nox_index"]),pm1_0:this._findSensorEntityId(["pm_1mm_weight_concentration","pm_1_0"]),pm2_5:this._findSensorEntityId(["pm_2_5mm_weight_concentration","pm_2_5"]),pm4_0:this._findSensorEntityId(["pm_4mm_weight_concentration","pm_4_0"]),pm10:this._findSensorEntityId(["pm_10mm_weight_concentration","pm_10"]),typical_particle_size:this._findSensorEntityId(["typical_particle_size"]),targets:[`sensor.${this._entityPrefix}_target_1_distance`,`sensor.${this._entityPrefix}_target_2_distance`,`sensor.${this._entityPrefix}_target_3_distance`]},this._drawRadar()}_drawRadar(){const e=this.shadowRoot?.querySelector(".radar-canvas");if(!e)return;const t=e.getContext("2d");if(!t)return;const i=e.getBoundingClientRect();if(i.width<10||i.height<50)return;const o=window.devicePixelRatio||1;e.width=i.width*o,e.height=i.height*o,t.scale(o,o);const a=i.width,r=i.height,s=a/2,n=r-25,l=this._config.max_distance||6e3,c=Math.max(.001,(r-50)/l);if(t.clearRect(0,0,a,r),!1!==this._config.show_grid){t.strokeStyle="rgba(255, 255, 255, 0.1)",t.lineWidth=1,t.setLineDash([5,5]);for(let e=1e3;e<=l;e+=1e3){const i=e*c;t.beginPath(),t.arc(s,n,i,Math.PI,2*Math.PI),t.stroke()}t.beginPath(),t.moveTo(s,n),t.lineTo(s,10),t.stroke(),t.setLineDash([])}const d=120*Math.PI/180,h=l*c;t.beginPath(),t.moveTo(s,n),t.arc(s,n,h,Math.PI+(Math.PI-d)/2,Math.PI+(Math.PI+d)/2),t.closePath();const p=t.createRadialGradient(s,n,0,s,n,h);if(p.addColorStop(0,"rgba(100, 180, 255, 0.3)"),p.addColorStop(1,"rgba(100, 180, 255, 0.05)"),t.fillStyle=p,t.fill(),t.strokeStyle="rgba(100, 180, 255, 0.5)",t.lineWidth=2,t.stroke(),!1!==this._config.show_zones){const e=["rgba(76, 175, 80, 0.3)","rgba(33, 150, 243, 0.3)","rgba(255, 152, 0, 0.3)","rgba(156, 39, 176, 0.3)"];this._zones.forEach((i,o)=>{const a=s+i.beginX*c,r=n-i.beginY*c,l=s+i.endX*c,d=n-i.endY*c,h=Math.min(a,l),p=Math.min(r,d),g=Math.abs(l-a),u=Math.abs(d-r);if(g>5&&u>5){t.fillStyle=e[o%e.length],t.strokeStyle=e[o%e.length].replace("0.3","0.8"),t.lineWidth=2,t.beginPath();const i=Math.min(4,g/2,u/2);t.roundRect(h,p,g,u,Math.max(0,i)),t.fill(),t.stroke()}})}const g=["#e91e63","#9c27b0","#3f51b5"];this._targets.forEach((e,i)=>{if(!e.active||0===e.x&&0===e.y)return;const o=s+e.x*c,a=n-e.y*c,r=g[i%g.length];t.beginPath(),t.arc(o,a,20,0,2*Math.PI);const l=t.createRadialGradient(o,a,0,o,a,20);l.addColorStop(0,r.replace(")",", 0.4)").replace("rgb","rgba")),l.addColorStop(1,"transparent"),t.fillStyle=l,t.fill(),t.beginPath(),t.arc(o,a,10,0,2*Math.PI),t.fillStyle=r,t.fill(),t.strokeStyle="white",t.lineWidth=2,t.stroke(),t.beginPath(),t.arc(o,a,3,0,2*Math.PI),t.fillStyle="white",t.fill()}),t.fillStyle="#2196f3",t.beginPath(),t.arc(s,n,8,0,2*Math.PI),t.fill(),t.fillStyle="rgba(255, 255, 255, 0.6)",t.font="10px sans-serif",t.textAlign="center",t.fillText("SENSOR",s,n+18),t.fillStyle="rgba(255, 255, 255, 0.5)",t.font="10px sans-serif",t.textAlign="right";for(let e=1;e<=l/1e3;e++){const i=n-1e3*e*c;t.fillText(`${e}m`,a-8,i+4)}}_renderRoomView(){const e=G`
      <div class="room-view-header">
        <div class="room-view-toggle">
          <button class="${"2d"===this._roomViewMode?"active":""}" @click=${()=>this._setRoomViewMode("2d")}>2D</button>
          <button class="${"3d"===this._roomViewMode?"active":""}" @click=${()=>this._setRoomViewMode("3d")}>3D</button>
        </div>
      </div>
    `,t=this._rooms.find(e=>e.id===this._selectedRoomId),i=t?.walls||[],o=i.filter(e=>"number"==typeof e?.x1&&"number"==typeof e?.y1).map(e=>({x:e.x1/1e3,y:e.y1/1e3}));Ie("SmartHomeShop: _renderRoomView",{selectedRoomId:this._selectedRoomId,wallSegments:i.length,cornerPoints:o.length,room:t?.name});const a=o.length>=3;if(!t||!a)return this._roomsLoaded&&this._rooms.length>0&&console.warn("SmartHomeShop: Room validation failed",{roomName:t?.name,wallSegmentsCount:i.length,cornerPointsCount:o.length}),G`
        ${e}
        <div class="no-room-message">
          <ha-icon icon="mdi:floor-plan"></ha-icon>
          <div>${this._roomsLoaded?"No room configured":"Loading rooms..."}</div>
          ${this._roomsLoaded?G`
            <div style="font-size: 0.8rem; margin-top: 8px;">
              Create a room in the SmartHomeShop panel first
            </div>
          `:Z}
        </div>
      `;const r=o.map(e=>e.x).filter(e=>!isNaN(e)),s=o.map(e=>e.y).filter(e=>!isNaN(e));if(0===r.length||0===s.length)return G`
        <div class="no-room-message">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <div>Invalid room data</div>
        </div>
      `;const n=Math.min(...r),l=Math.max(...r),c=Math.min(...s),d=Math.max(...s),h=.5,p=n-h,g=c-h,u=(l-n||1)+1,m=(d-c||1)+1;Ie("SmartHomeShop: ViewBox",{viewMinX:p,viewMinY:g,viewWidth:u,viewHeight:m,minX:n,maxX:l,minY:c,maxY:d});const f=o.map((e,t)=>`${0===t?"M":"L"} ${e.x} ${e.y}`).join(" ")+" Z",v=t.sensor?.x?t.sensor.x/1e3:(n+l)/2,_=t.sensor?.y?t.sensor.y/1e3:c+.5,y=t.sensor?.rotation??270,b=(t.sensor?.range??6e3)/1e3,x=t.sensor?.fov??120,w=isNaN(v)?(n+l)/2:v,k=isNaN(_)?c+.5:_,$=this._targets.filter(e=>e.active||0!==e.x||0!==e.y);Ie("SmartHomeShop: Room targets:",JSON.stringify(this._targets),"Active/visible:",$.length);const S=(y-90)*Math.PI/180,M=x/2*Math.PI/180,z=Math.min(b,3),C=S-M,P=S+M;if("3d"===this._roomViewMode)return G`
        ${e}
        <canvas class="canvas-3d"
          @mousedown=${this._on3DMouseDown}
          @mousemove=${this._on3DMouseMove}
          @mouseup=${this._on3DMouseUp}
          @mouseleave=${this._on3DMouseUp}
          @wheel=${this._on3DWheel}
        ></canvas>
      `;const E=[];for(let e=0;e<=32;e++){const t=C+e/32*(P-C);E.push(`${w+Math.cos(t)*z},${k+Math.sin(t)*z}`)}const T=`M ${w} ${k} L ${E.join(" L ")} Z`;return G`
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
        <path d="${T}" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="0.015"/>
        <!-- Zones from room configuration -->
        ${(()=>{const e=t.zones||[];return Ie("SmartHomeShop: Rendering zones count:",e.length,"entry lines:",e.filter(e=>"entry"===e.type).length),e.map(e=>{if(!e.points||e.points.length<2)return Z;if("entry"===e.type&&2===e.points.length){const t=e.points[0].x/1e3,i=e.points[0].y/1e3,o=e.points[1].x/1e3,a=e.points[1].y/1e3,r=(t+o)/2,s=(i+a)/2,n=o-t,l=a-i,c=Math.sqrt(n*n+l*l);if(c<.01)return Z;const d=-l/c,h=n/c,p="left"===(e.inDirection||"left")?1:-1,g=.12,u=.02,m=r+d*p*(g+u),f=s+h*p*(g+u),v=r-d*p*(g+u),_=s-h*p*(g+u);return V`
                <line x1="${t}" y1="${i}" x2="${o}" y2="${a}" stroke="#10b981" stroke-width="0.04" stroke-linecap="round"/>
                <line x1="${m}" y1="${f}" x2="${r-d*p*u}" y2="${s-h*p*u}" stroke="#22c55e" stroke-width="0.025" marker-end="url(#arrow-in)"/>
                <line x1="${v}" y1="${_}" x2="${r+d*p*u}" y2="${s+h*p*u}" stroke="#ef4444" stroke-width="0.025" marker-end="url(#arrow-out)"/>
                <text x="${m+d*p*.05}" y="${f+h*p*.05+.025}" fill="#22c55e" font-size="0.07" text-anchor="middle" font-weight="bold">IN</text>
                <text x="${v-d*p*.05}" y="${_-h*p*.05+.025}" fill="#ef4444" font-size="0.07" text-anchor="middle" font-weight="bold">UIT</text>
              `}if(e.points.length<3)return Z;const t=e.points.map((e,t)=>`${0===t?"M":"L"} ${e.x/1e3} ${e.y/1e3}`).join(" ")+" Z",i="detection"===e.type;return V`
              <path d="${t}" fill="none" stroke="${i?"#22c55e":"#ef4444"}" stroke-width="0.025"/>
            `})})()}
        <!-- Doors - same style as zones-page (purple) -->
        ${(()=>{const e=t.doors||[],i=o;return i.length<3?Z:e.map(e=>{if(e.wallIndex>=i.length)return Z;const t=i[e.wallIndex],o=i[(e.wallIndex+1)%i.length],a=t.x+(o.x-t.x)*e.position,r=t.y+(o.y-t.y)*e.position,s=Math.atan2(o.y-t.y,o.x-t.x),n=(e.width||800)/1e3/2;return V`
              <line
                x1="${a-Math.cos(s)*n}"
                y1="${r-Math.sin(s)*n}"
                x2="${a+Math.cos(s)*n}"
                y2="${r+Math.sin(s)*n}"
                stroke="#a855f7" stroke-width="0.06" stroke-linecap="round"
              />
            `})})()}
        <!-- Windows - same style as zones-page (light blue) -->
        ${(()=>{const e=t.windows||[],i=o;return i.length<3?Z:e.map(e=>{if(e.wallIndex>=i.length)return Z;const t=i[e.wallIndex],o=i[(e.wallIndex+1)%i.length],a=t.x+(o.x-t.x)*e.position,r=t.y+(o.y-t.y)*e.position,s=Math.atan2(o.y-t.y,o.x-t.x),n=(e.width||1e3)/1e3/2;return V`
              <line
                x1="${a-Math.cos(s)*n}"
                y1="${r-Math.sin(s)*n}"
                x2="${a+Math.cos(s)*n}"
                y2="${r+Math.sin(s)*n}"
                stroke="#0ea5e9" stroke-width="0.06" stroke-linecap="round"
              />
            `})})()}
        <!-- Furniture - same style as zones-page (gray) -->
        ${(()=>{const e=(t.furniture||[]).filter(e=>"number"==typeof e?.x&&"number"==typeof e?.y&&e?.width&&e?.height);return e.map(e=>{const t=e.x/1e3,i=e.y/1e3,o=e.width/1e3,a=e.height/1e3,r=e.rotation||0;return V`
                <g transform="translate(${t}, ${i}) rotate(${r})">
                  <rect x="${-o/2}" y="${-a/2}" width="${o}" height="${a}"
                        fill="#334155" stroke="#475569" stroke-width="0.02" rx="0.03"/>
                </g>
              `})})()}
        <!-- Sensor icon - same style as zones-page -->
        <circle cx="${w}" cy="${k}" r="0.15" fill="#3b82f6" stroke="#1d4ed8" stroke-width="0.02"/>
        <!-- Sensor direction indicator -->
        <line x1="${w}" y1="${k}"
              x2="${w+.2*Math.cos(S)}" y2="${k+.2*Math.sin(S)}"
              stroke="white" stroke-width="0.04" stroke-linecap="round"/>
        <!-- Targets - same style as zones-page (white circle with colored border) -->
        ${(()=>{const e=["#ef4444","#f97316","#eab308"];return $.map((t,i)=>{const o=t.x/1e3,a=t.y/1e3,r=w+a*Math.cos(S)-o*Math.sin(S),s=k+a*Math.sin(S)+o*Math.cos(S);if(isNaN(r)||isNaN(s))return Z;const n=e[i]||"#ef4444";return V`
              <g class="live-target">
                <!-- Outer ring with animation -->
                <circle cx="${r}" cy="${s}" r="0.15" fill="none" stroke="${n}" stroke-width="0.01" opacity="0.6">
                  <animate attributeName="r" values="0.15;0.25;0.15" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <!-- Main circle - white fill with colored border -->
                <circle cx="${r}" cy="${s}" r="0.1" fill="white" stroke="${n}" stroke-width="0.025"/>
                <!-- Number label - colored text -->
                <text x="${r}" y="${s+.035}" text-anchor="middle" fill="${n}" font-size="0.08" font-weight="bold">${i+1}</text>
              </g>
            `})})()}
      </svg>
    `}_getCo2Status(e){return e<600?{label:"Excellent",class:"excellent"}:e<800?{label:"Good",class:"good"}:e<1e3?{label:"Moderate",class:"moderate"}:e<1500?{label:"Poor",class:"poor"}:{label:"Unhealthy",class:"unhealthy"}}_setRoomViewMode(e){this._roomViewMode=e,"3d"===e&&setTimeout(()=>this._init3DView(),50)}_init3DView(){const e=this._rooms.find(e=>e.id===this._selectedRoomId);if(!e)return;const t=(e.walls||[]).map(e=>({x:e.x1,y:e.y1}));this._room3d.resetCamera(t),this._render3DView()}_render3DView(){const e=this.shadowRoot?.querySelector(".canvas-3d");if(!e)return;const t=this._rooms.find(e=>e.id===this._selectedRoomId);t&&this._room3d.render(e,this._buildScene3D(t))}_buildScene3D(e){const t=(e.walls||[]).map(e=>({x:e.x1,y:e.y1})),i=(e.furniture||[]).map(e=>({x:e.x,y:e.y,width:e.width,height:e.height||e.depth||e.width,rotation:e.rotationDeg??e.rotation??0,name:e.name||e.typeId||"Furniture"})),o=(e.sensors&&e.sensors.length>0?e.sensors:e.sensor?[e.sensor]:[]).filter(e=>e&&"number"==typeof e.x).map(e=>({x:e.x,y:e.y,rotation:e.rotation??0,range:e.range??6e3,fov:e.fov??120,heightMm:e.heightMm??2e3,deviceId:e.deviceId??null}));return{roomPoints:t,furniture:i,doors:e.doors||[],windows:e.windows||[],zones:e.zones||[],sensors:o,targets:Ye(o,e=>this.hass?.states[e]?.state)}}_getCo2BarPosition(e){return(Math.max(400,Math.min(2e3,e))-400)/1600*100}_getPm25Status(e){return e<=12?{label:"Excellent",labelEn:"Excellent",class:"excellent",color:"#4caf50"}:e<=35.4?{label:"Good",labelEn:"Good",class:"good",color:"#8bc34a"}:e<=55.4?{label:"Moderate",labelEn:"Moderate",class:"moderate",color:"#ffeb3b"}:e<=150.4?{label:"Unhealthy for Sensitive",labelEn:"Unhealthy for Sensitive",class:"unhealthy-sensitive",color:"#ff9800"}:e<=250.4?{label:"Unhealthy",labelEn:"Unhealthy",class:"unhealthy",color:"#f44336"}:e<=350.4?{label:"Very Unhealthy",labelEn:"Very Unhealthy",class:"very-unhealthy",color:"#9c27b0"}:{label:"Hazardous",labelEn:"Hazardous",class:"hazardous",color:"#880e4f"}}_getPm25BarPosition(e){return e<=12?e/12*8.3:e<=35.4?8.3+(e-12)/23.4*8.3:e<=55.4?16.6+(e-35.4)/20*8.4:e<=150.4?25+(e-55.4)/95*8.3:e<=250.4?33.3+(e-150.4)/100*16.7:e<=350.4?50+(e-250.4)/100*16.6:Math.min(100,66.6+(e-350.4)/150*33.4)}_hasAirQualityData(){const{pm1_0:e,pm2_5:t,pm4_0:i,pm10:o}=this._environment;return null!==e||null!==t||null!==i||null!==o}_findRoomQualityEntity(){if(!this.hass)return null;for(const[e,t]of Object.entries(this.hass.states))if(e.startsWith("sensor.")&&e.includes("room_quality")&&!e.includes("label")&&!e.includes("percentage")&&void 0!==t.attributes?.recommendations&&void 0!==t.attributes?.color)return Ie("SmartHomeShop: Found Room Quality entity:",e,"score:",t.state),{entityId:e,state:t};return Ie("SmartHomeShop: No Room Quality entity found, using local calculation"),null}_calculateRoomScore(){const e=this._findRoomQualityEntity();if(e){const{state:t}=e,i=parseFloat(t.state)||0,o=t.attributes||{},a=(o.recommendations||[]).map(e=>{let t="mdi:information";return e.includes("CO₂")||e.includes("Ventilat")?t="mdi:molecule-co2":e.includes("Particulate")||e.includes("dust")?t="mdi:weather-dust":e.includes("VOC")?t="mdi:air-purifier":e.includes("cool")||e.includes("cold")||e.includes("Warm up")?t="mdi:thermometer-low":e.includes("warm")||e.includes("hot")||e.includes("Cool down")?t="mdi:thermometer-high":e.includes("dry")?t="mdi:water-percent":e.includes("humid")&&(t="mdi:water-percent-alert"),{icon:t,text:e}}).slice(0,3);return{score:i,color:o.color||"#ffc107",label:o.label||"Unknown",recommendations:a}}return this._calculateRoomScoreLocal()}_calculateRoomScoreLocal(){const{temperature:e,humidity:t,co2:i,voc:o,pm2_5:a}=this._environment,r=[];let s=0,n=0;if(null!==i){let e=10;i>2e3?(e=1,r.push({icon:"mdi:molecule-co2",text:"Ventilate now!",priority:10})):i>1500?(e=3,r.push({icon:"mdi:molecule-co2",text:"CO₂ unhealthy, ventilate",priority:8})):i>1e3?(e=5,r.push({icon:"mdi:air-filter",text:"Ventilation recommended",priority:6})):i>800?e=7:i>600&&(e=9),s+=.3*e,n+=.3}if(null!==a){let e=10;a>150?(e=1,r.push({icon:"mdi:weather-dust",text:"Particulate matter dangerous!",priority:9})):a>55?(e=3,r.push({icon:"mdi:weather-dust",text:"Particulate matter high",priority:7})):a>35?(e=5,r.push({icon:"mdi:weather-dust",text:"Particulate matter elevated",priority:5})):a>12&&(e=7),s+=.25*e,n+=.25}if(null!==o){let e=10;o>400?(e=2,r.push({icon:"mdi:air-purifier",text:"High VOC, ventilate",priority:7})):o>250?(e=5,r.push({icon:"mdi:air-purifier",text:"Elevated VOC",priority:5})):o>150?e=7:o>100&&(e=9),s+=.15*e,n+=.15}if(null!==e){let t=10;e<16?(t=4,r.push({icon:"mdi:thermometer-low",text:"Warm up the room",priority:4})):e<18?(t=7,r.push({icon:"mdi:thermometer-low",text:"It is a bit cool",priority:2})):e>28?(t=3,r.push({icon:"mdi:thermometer-high",text:"Cool down the room",priority:4})):e>25?(t=6,r.push({icon:"mdi:thermometer-high",text:"It is a bit warm",priority:2})):e>22&&(t=8),s+=.15*t,n+=.15}if(null!==t){let e=10;t<25?(e=4,r.push({icon:"mdi:water-percent-alert",text:"Air too dry",priority:4})):t<35?(e=7,r.push({icon:"mdi:water-percent",text:"Air is dry",priority:2})):t>75?(e=4,r.push({icon:"mdi:water-percent-alert",text:"Air too humid",priority:4})):t>65&&(e=7,r.push({icon:"mdi:water-percent",text:"Air is humid",priority:2})),s+=.15*e,n+=.15}const l=n>0?s/n:0;let c="#22C55E",d="Excellent";l<4?(c="#EF4444",d="Poor"):l<5.5?(c="#F97316",d="Moderate"):l<7?(c="#F59E0B",d="Fair"):l<8.5&&(c="#84CC16",d="Good");const h=r.sort((e,t)=>t.priority-e.priority),p=h.slice(0,3).map(e=>({icon:e.icon,text:e.text}));return{score:l,color:c,label:d,recommendations:p}}_hasEnvironmentData(){const{temperature:e,humidity:t,co2:i,voc:o,pm2_5:a}=this._environment;return null!==e||null!==t||null!==i||null!==o||null!==a}_hasAnyEnvironmentEnabled(){const{temperature:e,humidity:t,co2:i,illuminance:o,voc:a}=this._environment;return null!==e&&!1!==this._config.show_temperature||null!==t&&!1!==this._config.show_humidity||null!==i&&!1!==this._config.show_co2||null!==o&&!1!==this._config.show_illuminance||null!==a&&!1!==this._config.show_voc}render(){if(!this.hass)return Z;if(!this._entityPrefix)return G`
        <ha-card>
          <div class="no-device">
            <ha-icon icon="mdi:radar"></ha-icon>
            <div>Select an UltimateSensor device</div>
            <div style="font-size: 0.8rem; margin-top: 8px;">
              Open the card editor to choose a device
            </div>
          </div>
      </ha-card>
      `;const e=this._targets.filter(e=>e.active).length,t=this._config.title||this._deviceName||"UltimateSensor",i=Pe(/mini/i.test(this._entityPrefix)?"ultimatesensor_mini":"ultimatesensor"),o=this._getOfflineInfo();if(o.offline)return G`
        <ha-card>
          <div class="header">
            <div class="header-left">
              <div class="header-icon">
                ${i?ye(i):G`<ha-icon icon="mdi:radar"></ha-icon>`}
              </div>
              <div>
                <h2 class="header-title">${t}</h2>
                <div class="header-subtitle">Presence &amp; climate</div>
              </div>
            </div>
            <div class="status-badge status-alert">
              <ha-icon icon="mdi:lan-disconnect"></ha-icon>
              <span>Offline</span>
            </div>
          </div>
          <div class="offline-state">
            <ha-icon icon="mdi:lan-disconnect"></ha-icon>
            <div class="offline-title">Device offline</div>
            <div class="offline-sub">
              ${o.lastSeen?`Last seen ${we(o.lastSeen)}`:"Waiting for the device to reconnect"}
            </div>
            <div class="offline-hint">Check the power supply and Wi-Fi connection.</div>
          </div>
        </ha-card>
      `;const{temperature:a,humidity:r,co2:s,illuminance:n,voc:l,nox:c,pm1_0:d,pm2_5:h,pm4_0:p,pm10:g,typical_particle_size:u}=this._environment,m=null!==s?this._getCo2Status(s):null;return G`
      <ha-card>
        <div class="header">
          <div class="header-left">
            <div class="header-icon ${e>0?"active":""}">
              ${i?ye(i):G`<ha-icon icon="mdi:radar"></ha-icon>`}
            </div>
            <div>
              <h2 class="header-title">${t}</h2>
              <div class="header-subtitle">Presence &amp; climate</div>
            </div>
          </div>
          <div class="status-badge ${e>0?"status-active":"status-ok"}">
            <ha-icon icon="${e>0?"mdi:motion-sensor":"mdi:motion-sensor-off"}"></ha-icon>
            <span>${e} ${1===e?"person":"people"}</span>
          </div>
        </div>

        ${this._hasEnvironmentData()&&!1!==this._config.show_room_score?(()=>{const e=this._calculateRoomScore();return G`
            <div class="room-score-section">
              <div class="room-score-header">
                <div class="room-score-title">
                  <ha-icon icon="mdi:home-heart"></ha-icon>
                  Room Quality
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
                  <div class="recommendation-item positive"><ha-icon icon="mdi:check-circle"></ha-icon>All values optimal</div>
                </div>
              `}
            </div>
          `})():Z}

        ${this._hasAnyEnvironmentEnabled()?G`
          <div class="environment-section">
            <div class="environment-grid">
              ${null!==a&&!1!==this._config.show_temperature?G`
                <div class="env-card temperature" @click=${()=>this._fireMoreInfo(this._entityIds.temperature)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:thermometer"></ha-icon>
                    <span class="env-card-label">Temperature</span>
                  </div>
                  <div class="env-card-value">${a.toFixed(1)}<span>°C</span></div>
                </div>
              `:Z}

              ${null!==r&&!1!==this._config.show_humidity?G`
                <div class="env-card humidity" @click=${()=>this._fireMoreInfo(this._entityIds.humidity)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:water-percent"></ha-icon>
                    <span class="env-card-label">Humidity</span>
                  </div>
                  <div class="env-card-value">${r.toFixed(0)}<span>%</span></div>
                </div>
              `:Z}

              ${null!==s&&!1!==this._config.show_co2?G`
                <div class="env-card co2" @click=${()=>this._fireMoreInfo(this._entityIds.co2)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:molecule-co2"></ha-icon>
                    <span class="env-card-label">CO₂</span>
                  </div>
                  <div class="env-card-value">${s.toFixed(0)}<span>ppm</span></div>
                </div>
              `:Z}

              ${null!==n&&!1!==this._config.show_illuminance?G`
                <div class="env-card illuminance" @click=${()=>this._fireMoreInfo(this._entityIds.illuminance)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:brightness-6"></ha-icon>
                    <span class="env-card-label">Illuminance</span>
                  </div>
                  <div class="env-card-value">${n.toFixed(0)}<span>lx</span></div>
                </div>
              `:Z}

              ${null!==l&&!1!==this._config.show_voc?G`
                <div class="env-card voc" @click=${()=>this._fireMoreInfo(this._entityIds.voc)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:air-filter"></ha-icon>
                    <span class="env-card-label">VOC Index</span>
                  </div>
                  <div class="env-card-value">${l.toFixed(0)}<span></span></div>
                </div>
              `:Z}
            </div>

            ${null!==s&&m&&!1!==this._config.show_co2_bar?G`
              <div class="co2-quality" @click=${()=>this._fireMoreInfo(this._entityIds.co2)}>
                <div class="co2-quality-header">
                  <div class="co2-quality-label">
                    <ha-icon icon="mdi:molecule-co2"></ha-icon>
                    CO₂ Quality
                  </div>
                  <div class="co2-quality-status ${m.class}">${m.label}</div>
                </div>
                <div class="co2-bar-container">
                  <div class="co2-bar-indicator" style="left: calc(${this._getCo2BarPosition(s)}% - 2px)"></div>
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
                Particulate matter (PM)
              </div>
              ${null!==h?G`
                <div class="air-quality-status ${this._getPm25Status(h).class}">
                  ${this._getPm25Status(h).label}
                </div>
              `:Z}
            </div>

            ${null!==h?G`
              <div class="pm-gauge-container" @click=${()=>this._fireMoreInfo(this._entityIds.pm2_5)}>
                <div class="pm-gauge-label">
                  <span class="pm-gauge-label-text">PM2.5 (Fine Particles)</span>
                  <span class="pm-gauge-value" style="color: ${this._getPm25Status(h).color}">
                    ${h.toFixed(1)}<span>µg/m³</span>
                  </span>
                </div>
                <div class="pm-gauge-bar">
                  <div class="pm-gauge-indicator" style="left: calc(${this._getPm25BarPosition(h)}% - 2px)"></div>
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
              ${null!==d?G`
                <div class="pm-item pm1" @click=${()=>this._fireMoreInfo(this._entityIds.pm1_0)}>
                  <div class="pm-item-label">PM1.0</div>
                  <div class="pm-item-value">${d.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Z}
              ${null!==h?G`
                <div class="pm-item pm2_5" @click=${()=>this._fireMoreInfo(this._entityIds.pm2_5)}>
                  <div class="pm-item-label">PM2.5</div>
                  <div class="pm-item-value">${h.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Z}
              ${null!==p?G`
                <div class="pm-item pm4" @click=${()=>this._fireMoreInfo(this._entityIds.pm4_0)}>
                  <div class="pm-item-label">PM4.0</div>
                  <div class="pm-item-value">${p.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Z}
              ${null!==g?G`
                <div class="pm-item pm10" @click=${()=>this._fireMoreInfo(this._entityIds.pm10)}>
                  <div class="pm-item-label">PM10</div>
                  <div class="pm-item-value">${g.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Z}
            </div>

            ${null!==c?G`
              <div class="voc-nox-grid" style="margin-top: 12px;">
                <div class="env-card nox" @click=${()=>this._fireMoreInfo(this._entityIds.nox)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:molecule"></ha-icon>
                    <span class="env-card-label">NOx Index</span>
                  </div>
                  <div class="env-card-value">${c.toFixed(0)}</div>
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
                  <div class="target-info-label">Person ${t+1}</div>
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
    `}};qe.styles=s`
    :host {
      display: block;
    }
    ha-card {
      padding: 16px;
      overflow: hidden;
    }

    /* Header */
    /* Shared card header (aligned with the water cards) */
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
    .header-icon svg {
      width: 26px;
      height: 26px;
      display: block;
    }
    .header-icon.active {
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

    /* Offline state */
    .offline-badge {
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(239, 68, 68, 0.14);
      color: #ef4444;
    }

    .offline-state {
      text-align: center;
      padding: 40px 20px 44px;
      color: var(--secondary-text-color);
    }

    .offline-state ha-icon {
      --mdc-icon-size: 44px;
      opacity: 0.4;
      margin-bottom: 12px;
    }

    .offline-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin-bottom: 4px;
    }

    .offline-sub {
      font-size: 13px;
      margin-bottom: 12px;
    }

    .offline-hint {
      font-size: 12px;
      opacity: 0.7;
    }

    /* Section Divider */
    .section-divider {
      height: 1px;
      background: var(--divider-color);
      margin: 16px 0;
    }
  `,e([ue({attribute:!1})],qe.prototype,"hass",void 0),e([me()],qe.prototype,"_config",void 0),e([me()],qe.prototype,"_targets",void 0),e([me()],qe.prototype,"_zones",void 0),e([me()],qe.prototype,"_environment",void 0),e([me()],qe.prototype,"_entityPrefix",void 0),e([me()],qe.prototype,"_deviceName",void 0),e([me()],qe.prototype,"_entityIds",void 0),e([me()],qe.prototype,"_showSettings",void 0),e([me()],qe.prototype,"_viewMode",void 0),e([me()],qe.prototype,"_rooms",void 0),e([me()],qe.prototype,"_selectedRoomId",void 0),e([me()],qe.prototype,"_roomViewMode",void 0),qe=e([he("smarthomeshop-ultimatesensor-card")],qe);let Xe=class extends ce{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&this._findDevices()}_findDevices(){if(!this.hass?.devices||!this.hass?.entities)return;const e=[];for(const[t,i]of Object.entries(this.hass.devices)){const o=Object.entries(this.hass.entities).filter(([e,i])=>i.device_id===t).map(([e])=>e),a=o.some(e=>e.includes("target_1_x")),r=o.some(e=>e.includes("scd41")||e.includes("bh1750")||e.includes("co2"));(a||r)&&e.push({id:t,name:i.name||i.name_by_user||"UltimateSensor"})}this._devices=e}_valueChanged(e,t){const i={...this._config,[e]:t};"device_id"===e&&delete i.entity_prefix,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){return G`
      <div class="info-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="info-banner-content">
          <div class="info-banner-title">Set up room & zones</div>
          <div class="info-banner-text">
            Draw your room, place the sensor and configure zones in the
            <a href="/smarthomeshop" target="_top">SmartHomeShop Panel</a>.
          </div>
        </div>
      </div>

      <div class="form-row">
        <label>UltimateSensor Device</label>
        <select @change=${e=>this._valueChanged("device_id",e.target.value||void 0)}>
          <option value="">-- Select device --</option>
          ${this._devices.map(e=>G`
            <option value=${e.id} ?selected=${e.id===this._config.device_id}>${e.name}</option>
          `)}
        </select>
        <div class="info">Select an UltimateSensor device with radar and/or environmental sensors.</div>
      </div>

      <div class="form-row">
        <label>Title (optional)</label>
        <input type="text" .value=${this._config.title||""} placeholder="UltimateSensor"
          @input=${e=>this._valueChanged("title",e.target.value||void 0)} />
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <label>Sections</label>
        <div class="checkbox-row">
          <input type="checkbox" id="show_room_score" .checked=${!1!==this._config.show_room_score}
            @change=${e=>this._valueChanged("show_room_score",e.target.checked)} />
          <label for="show_room_score">Room Quality Score</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_radar" .checked=${!1!==this._config.show_radar}
            @change=${e=>this._valueChanged("show_radar",e.target.checked)} />
          <label for="show_radar">Radar/presence</label>
        </div>
      </div>

      <div class="form-row">
        <label>Environmental sensors</label>
        <div class="checkbox-row">
          <input type="checkbox" id="show_temperature" .checked=${!1!==this._config.show_temperature}
            @change=${e=>this._valueChanged("show_temperature",e.target.checked)} />
          <label for="show_temperature">Temperature</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_humidity" .checked=${!1!==this._config.show_humidity}
            @change=${e=>this._valueChanged("show_humidity",e.target.checked)} />
          <label for="show_humidity">Humidity</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_co2" .checked=${!1!==this._config.show_co2}
            @change=${e=>this._valueChanged("show_co2",e.target.checked)} />
          <label for="show_co2">CO₂</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_co2_bar" .checked=${!1!==this._config.show_co2_bar}
            @change=${e=>this._valueChanged("show_co2_bar",e.target.checked)} />
          <label for="show_co2_bar">CO₂ quality meter</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_illuminance" .checked=${!1!==this._config.show_illuminance}
            @change=${e=>this._valueChanged("show_illuminance",e.target.checked)} />
          <label for="show_illuminance">Illuminance</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_voc" .checked=${!1!==this._config.show_voc}
            @change=${e=>this._valueChanged("show_voc",e.target.checked)} />
          <label for="show_voc">VOC Index</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_air_quality" .checked=${!1!==this._config.show_air_quality}
            @change=${e=>this._valueChanged("show_air_quality",e.target.checked)} />
          <label for="show_air_quality">Particulate matter (PM)</label>
        </div>
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <label>View mode</label>
        <select @change=${e=>this._valueChanged("view_mode",e.target.value)}>
          <option value="radar" ?selected=${"room"!==this._config.view_mode}>📡 Radar view</option>
          <option value="room" ?selected=${"room"===this._config.view_mode}>🏠 Room view</option>
        </select>
        <div class="info">Radar shows the sensor view, Room shows your drawn room with live tracking</div>
      </div>

      ${"room"===this._config.view_mode?G`
        <div class="form-row">
          <label>Default room view</label>
          <select @change=${e=>this._valueChanged("room_view_mode",e.target.value)}>
            <option value="2d" ?selected=${"3d"!==this._config.room_view_mode}>2D floor plan</option>
            <option value="3d" ?selected=${"3d"===this._config.room_view_mode}>3D view</option>
          </select>
          <div class="info">The view the card starts in. You can still toggle 2D/3D on the card itself.</div>
        </div>
      `:Z}

      ${"room"!==this._config.view_mode?G`
        <div class="divider"></div>

        <div class="form-row">
          <label>Radar options</label>
          <div class="checkbox-row">
            <input type="checkbox" id="show_zones" .checked=${!1!==this._config.show_zones}
              @change=${e=>this._valueChanged("show_zones",e.target.checked)} />
            <label for="show_zones">Show zones</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_grid" .checked=${!1!==this._config.show_grid}
              @change=${e=>this._valueChanged("show_grid",e.target.checked)} />
            <label for="show_grid">Show grid lines</label>
          </div>
        </div>

        <div class="form-row">
          <label>Maximum distance (mm)</label>
          <input type="number" .value=${this._config.max_distance||6e3} min="1000" max="8000" step="500"
            @input=${e=>this._valueChanged("max_distance",parseInt(e.target.value))} />
        </div>
      `:Z}
    `}};Xe.styles=s`
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
  `,e([ue({attribute:!1})],Xe.prototype,"hass",void 0),e([me()],Xe.prototype,"_config",void 0),e([me()],Xe.prototype,"_devices",void 0),Xe=e([he("smarthomeshop-ultimatesensor-card-editor")],Xe);let Be=class extends ce{constructor(){super(...arguments),this.entityPrefix="",this.deviceName="",this.isOpen=!1,this.maxDistance=6e3,this._zones=[],this._targets=[],this._selectedZone=null,this._dragMode="none",this._dragStart=null,this._saving=!1,this._hasChanges=!1,this._viewMode="2d",this._detectionRange=6e3,this._canvasWidth=600,this._canvasHeight=450,this._canvas3D=null,this._ctx=null,this._animationFrame=null,this._liveInterval=null,this._camera={azimuth:0,elevation:.22*Math.PI,distance:1200,targetX:0,targetY:0,targetZ:300},this._orbitDragging=!1,this._orbitLastX=0,this._orbitLastY=0,this.WALL_HEIGHT=200,this.FOV_DEG=120,this.CAMERA_FOV=55,this._zoneColors=["#3b82f6","#8b5cf6","#ec4899","#f59e0b"],this._handleOrbitStart=e=>{this._orbitDragging=!0,this._orbitLastX=e.clientX,this._orbitLastY=e.clientY},this._handleOrbitMove=e=>{if(!this._orbitDragging)return;const t=e.clientX-this._orbitLastX,i=e.clientY-this._orbitLastY;if(e.shiftKey){const e=.002*this._camera.distance,o=Math.cos(this._camera.azimuth),a=Math.sin(this._camera.azimuth);this._camera.targetX-=t*o*e,this._camera.targetZ-=t*a*e,this._camera.targetY+=i*e*.5}else this._camera.azimuth+=.008*t,this._camera.elevation=Math.max(.05,Math.min(.45*Math.PI,this._camera.elevation-.008*i));this._orbitLastX=e.clientX,this._orbitLastY=e.clientY},this._handleOrbitEnd=()=>{this._orbitDragging=!1},this._handleWheel=e=>{e.preventDefault();const t=e.deltaY>0?1.1:.9;this._camera.distance=Math.max(400,Math.min(3e3,this._camera.distance*t))},this._handleMouseMove=e=>{if(!this._dragStart||"none"===this._dragMode)return;const t=this._getSvgPoint(e),i=this._fromSvg(this._dragStart.x,this._dragStart.y),o=this._fromSvg(t.x,t.y),a=o.x-i.x,r=o.y-i.y,s=this._zones.find(e=>e.id===this._selectedZone);if(!s)return;const n=this._dragStart.zone,l=100;"move"===this._dragMode?(s.beginX=Math.round((n.beginX+a)/l)*l,s.endX=Math.round((n.endX+a)/l)*l,s.beginY=Math.round((n.beginY+r)/l)*l,s.endY=Math.round((n.endY+r)/l)*l):(this._dragMode.includes("w")&&(s.beginX=Math.round((n.beginX+a)/l)*l),this._dragMode.includes("e")&&(s.endX=Math.round((n.endX+a)/l)*l),this._dragMode.includes("n")&&(s.endY=Math.round((n.endY+r)/l)*l),this._dragMode.includes("s")&&(s.beginY=Math.round((n.beginY+r)/l)*l)),s.beginX=Math.max(-4e3,Math.min(4e3,s.beginX)),s.endX=Math.max(-4e3,Math.min(4e3,s.endX)),s.beginY=Math.max(0,Math.min(6e3,s.beginY)),s.endY=Math.max(0,Math.min(6e3,s.endY)),this._hasChanges=!0,this.requestUpdate()},this._handleMouseUp=()=>{this._dragMode="none",this._dragStart=null,window.removeEventListener("mousemove",this._handleMouseMove),window.removeEventListener("mouseup",this._handleMouseUp)}}connectedCallback(){super.connectedCallback(),this.isOpen&&(this._loadZones(),this._startLiveUpdates())}disconnectedCallback(){super.disconnectedCallback(),this._stopLiveUpdates(),this._stopAnimation()}updated(e){e.has("isOpen")&&(this.isOpen?(this._loadZones(),this._startLiveUpdates(),"3d"===this._viewMode&&this._setup3DCanvas()):(this._stopLiveUpdates(),this._stopAnimation())),e.has("_viewMode")&&this.isOpen&&("3d"===this._viewMode?this._setup3DCanvas():this._stopAnimation())}_setup3DCanvas(){requestAnimationFrame(()=>{this._canvas3D=this.shadowRoot?.querySelector(".canvas-3d"),this._canvas3D&&(this._ctx=this._canvas3D.getContext("2d",{alpha:!0}),this._setupCanvasEvents(),this._startAnimation())})}_setupCanvasEvents(){this._canvas3D&&(this._canvas3D.addEventListener("mousedown",this._handleOrbitStart),this._canvas3D.addEventListener("wheel",this._handleWheel,{passive:!1}),window.addEventListener("mousemove",this._handleOrbitMove),window.addEventListener("mouseup",this._handleOrbitEnd))}_startAnimation(){const e=()=>{this._render3D(),this._animationFrame=requestAnimationFrame(e)};e()}_stopAnimation(){this._animationFrame&&(cancelAnimationFrame(this._animationFrame),this._animationFrame=null)}_startLiveUpdates(){this._updateTargets(),this._liveInterval=window.setInterval(()=>this._updateTargets(),100)}_stopLiveUpdates(){this._liveInterval&&(clearInterval(this._liveInterval),this._liveInterval=null)}_updateTargets(){if(!this.hass||!this.entityPrefix)return;const e=[];for(let t=1;t<=3;t++){const i=`sensor.${this.entityPrefix}_target_${t}_x`,o=`sensor.${this.entityPrefix}_target_${t}_y`,a=`binary_sensor.${this.entityPrefix}_target_${t}`,r=parseFloat(this.hass.states[i]?.state||"0"),s=parseFloat(this.hass.states[o]?.state||"0"),n="on"===this.hass.states[a]?.state;e.push({id:t,x:r,y:s,active:n&&(0!==r||0!==s)})}this._targets=e}_loadZones(){if(!this.hass||!this.entityPrefix)return;const e=[];for(let t=1;t<=4;t++)e.push({id:t,beginX:this._getNum(`zone_${t}_begin_x`),endX:this._getNum(`zone_${t}_end_x`),beginY:this._getNum(`zone_${t}_begin_y`),endY:this._getNum(`zone_${t}_end_y`),color:this._zoneColors[t-1]});this._zones=e,this._hasChanges=!1;const t=`number.${this.entityPrefix}_max_distance`,i=parseFloat(this.hass.states[t]?.state||"6000");this._detectionRange=i}_getNum(e){const t=`number.${this.entityPrefix}_${e}`,i=this.hass?.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_render3D(){if(!this._ctx||!this._canvas3D)return;const e=this._canvas3D,t=this._ctx,i=window.devicePixelRatio||1,o=e.getBoundingClientRect();e.width=o.width*i,e.height=o.height*i,t.scale(i,i);const a=o.width,r=o.height;t.fillStyle="#0a0e14",t.fillRect(0,0,a,r);const s=this._camera,n=s.targetX+s.distance*Math.cos(s.elevation)*Math.sin(s.azimuth),l=s.targetY+s.distance*Math.sin(s.elevation),c=s.targetZ+s.distance*Math.cos(s.elevation)*Math.cos(s.azimuth),d=Math.cos(s.azimuth),h=Math.sin(s.azimuth),p=Math.cos(s.elevation),g=Math.sin(s.elevation),u=this.CAMERA_FOV*Math.PI/180,m=.5*r/Math.tan(u/2),f=a/2,v=r/2,_=(e,t,i)=>{const o=e-n,a=t-l,r=i-c,s=h*o+d*r,u=-(g*a+p*s);return u<=.1?null:{x:f+(d*o-h*r)*m/u,y:v-(p*a-g*s)*m/u,z:u}};this._drawGrid3D(t,_),this._drawFov3D(t,_),this._drawZones3D(t,_),this._drawTargets3D(t,_),this._drawSensor3D(t,_)}_drawGrid3D(e,t){const i=this._detectionRange,o=1e3;e.strokeStyle="rgba(59, 130, 246, 0.15)",e.lineWidth=.5;for(let a=-4e3;a<=4e3;a+=o){const o=t(a,0,0),r=t(a,0,i);o&&r&&(e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(r.x,r.y),e.stroke())}for(let a=0;a<=i;a+=o){const i=t(-4e3,0,a),o=t(4e3,0,a);i&&o&&(e.beginPath(),e.moveTo(i.x,i.y),e.lineTo(o.x,o.y),e.stroke())}e.fillStyle="rgba(148, 163, 184, 0.5)",e.font="11px system-ui, sans-serif";for(let a=o;a<=i;a+=o){const i=t(4200,0,a);i&&e.fillText(a/1e3+"m",i.x,i.y+4)}}_drawFov3D(e,t){const i=this._detectionRange,o=this.FOV_DEG/2*Math.PI/180,a=[{x:0,z:0}];for(let e=-o;e<=o;e+=.05)a.push({x:i*Math.sin(e),z:i*Math.cos(e)});a.push({x:0,z:0}),e.beginPath();let r=!0;for(const i of a){const o=t(i.x,0,i.z);o&&(r?(e.moveTo(o.x,o.y),r=!1):e.lineTo(o.x,o.y))}e.closePath();const s=e.createRadialGradient(e.canvas.width/2/(window.devicePixelRatio||1),e.canvas.height/(window.devicePixelRatio||1),0,e.canvas.width/2/(window.devicePixelRatio||1),e.canvas.height/(window.devicePixelRatio||1),300);s.addColorStop(0,"rgba(59, 130, 246, 0.25)"),s.addColorStop(1,"rgba(59, 130, 246, 0.02)"),e.fillStyle=s,e.fill(),e.strokeStyle="rgba(59, 130, 246, 0.3)",e.lineWidth=1,e.stroke()}_drawZones3D(e,t){const i=this.WALL_HEIGHT;for(const o of this._zones){if(!(0!==o.beginX||0!==o.endX||0!==o.beginY||0!==o.endY))continue;const a=Math.min(o.beginX,o.endX),r=Math.max(o.beginX,o.endX),s=Math.min(o.beginY,o.endY),n=Math.max(o.beginY,o.endY),l=this._selectedZone===o.id,c=[t(a,0,s),t(r,0,s),t(r,0,n),t(a,0,n)].filter(e=>null!==e);if(4===c.length){e.beginPath(),e.moveTo(c[0].x,c[0].y);for(let t=1;t<c.length;t++)e.lineTo(c[t].x,c[t].y);e.closePath(),e.fillStyle=o.color+"30",e.fill(),e.strokeStyle=o.color+"80",e.lineWidth=l?2.5:1.5,e.stroke()}const d=[{pts:[[a,s],[r,s]],label:"front"},{pts:[[r,s],[r,n]],label:"right"},{pts:[[r,n],[a,n]],label:"back"},{pts:[[a,n],[a,s]],label:"left"}];for(const a of d){const[[r,s],[n,c]]=a.pts,d=t(r,0,s),h=t(n,0,c),p=t(r,i,s),g=t(n,i,c);d&&h&&p&&g&&(e.beginPath(),e.moveTo(d.x,d.y),e.lineTo(h.x,h.y),e.lineTo(g.x,g.y),e.lineTo(p.x,p.y),e.closePath(),e.fillStyle=o.color+"20",e.fill(),e.strokeStyle=o.color+(l?"cc":"60"),e.lineWidth=l?2:1,e.stroke())}const h=t((a+r)/2,i+30,(s+n)/2);h&&(e.fillStyle=o.color,e.font="bold 13px system-ui, sans-serif",e.textAlign="center",e.fillText(`Zone ${o.id}`,h.x,h.y))}}_drawTargets3D(e,t){for(const i of this._targets){if(!i.active)continue;const o=170;if(!t(i.x,o/2,i.y))continue;const a=t(i.x,o,i.y),r=t(i.x,0,i.y);a&&r&&(e.strokeStyle="#22c55e",e.lineWidth=8,e.lineCap="round",e.beginPath(),e.moveTo(r.x,r.y),e.lineTo(a.x,a.y),e.stroke(),e.fillStyle="#22c55e",e.beginPath(),e.arc(a.x,a.y,12,0,2*Math.PI),e.fill(),e.shadowColor="#22c55e",e.shadowBlur=20,e.beginPath(),e.arc(a.x,a.y,8,0,2*Math.PI),e.fill(),e.shadowBlur=0,e.fillStyle="#22c55e",e.font="bold 11px system-ui, sans-serif",e.textAlign="center",e.fillText(`T${i.id}`,a.x,a.y-20));const s=t(i.x,0,i.y);s&&(e.beginPath(),e.arc(s.x,s.y,6,0,2*Math.PI),e.fillStyle="rgba(34, 197, 94, 0.5)",e.fill())}}_drawSensor3D(e,t){const i=t(0,10,0);i&&(e.fillStyle="#3b82f6",e.shadowColor="#3b82f6",e.shadowBlur=15,e.beginPath(),e.arc(i.x,i.y,10,0,2*Math.PI),e.fill(),e.shadowBlur=0,e.fillStyle="#60a5fa",e.beginPath(),e.arc(i.x,i.y,4,0,2*Math.PI),e.fill(),e.fillStyle="rgba(148, 163, 184, 0.7)",e.font="10px system-ui, sans-serif",e.textAlign="center",e.fillText("SENSOR",i.x,i.y+25))}_toSvg(e,t){const i=this._detectionRange,o=this._canvasWidth/2,a=this._canvasHeight-40,r=(this._canvasHeight-80)/i;return{x:o+e*r,y:a-t*r}}_fromSvg(e,t){const i=this._detectionRange,o=this._canvasWidth/2,a=this._canvasHeight-40,r=(this._canvasHeight-80)/i;return{x:(e-o)/r,y:(a-t)/r}}_getSvgPoint(e){const t=this.shadowRoot?.querySelector(".editor-svg");if(!t)return{x:0,y:0};const i=t.getBoundingClientRect(),o=e.clientX-i.left,a=e.clientY-i.top;return{x:o*(this._canvasWidth/i.width),y:a*(this._canvasHeight/i.height)}}_handleMouseDown(e,t,i){e.stopPropagation(),e.preventDefault();const o=this._zones.find(e=>e.id===t);o&&(this._selectedZone=t,this._dragMode=i,this._dragStart={...this._getSvgPoint(e),zone:{...o}},window.addEventListener("mousemove",this._handleMouseMove),window.addEventListener("mouseup",this._handleMouseUp))}async _saveAllZones(){if(this.hass&&this.entityPrefix){this._saving=!0;try{const e=[];for(const t of this._zones){const i={...t,beginX:Math.max(-4e3,Math.min(4e3,t.beginX)),endX:Math.max(-4e3,Math.min(4e3,t.endX)),beginY:Math.max(0,Math.min(6e3,t.beginY)),endY:Math.max(0,Math.min(6e3,t.endY))};e.push(this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_begin_x`,value:i.beginX}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_end_x`,value:i.endX}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_begin_y`,value:i.beginY}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_end_y`,value:i.endY}))}await Promise.all(e),this._hasChanges=!1}catch(e){console.error("Failed to save zones:",e)}finally{this._saving=!1}}}_close(){this._stopLiveUpdates(),this._stopAnimation(),this.dispatchEvent(new CustomEvent("close"))}_renderGrid(){const e=[],t=[],i=this._detectionRange;for(let o=1e3;o<=i;o+=1e3){const a=this._toSvg(0,o),r=(this._canvasHeight-80)*(o/i);e.push(V`
        <circle
          cx="${this._canvasWidth/2}"
          cy="${this._canvasHeight-40}"
          r="${r}"
          class="grid-line"
          fill="none"
        />
      `),t.push(V`
        <text x="${this._canvasWidth-15}" y="${a.y+4}" class="grid-label" text-anchor="end">
          ${o/1e3}m
        </text>
      `)}return e.push(V`
      <line
        x1="${this._canvasWidth/2}"
        y1="${this._canvasHeight-40}"
        x2="${this._canvasWidth/2}"
        y2="20"
        class="grid-line"
      />
    `),[...e,...t]}_renderCoverageArc(){const e=this._canvasWidth/2,t=this._canvasHeight-40,i=this._detectionRange,o=(this._canvasHeight-80)*(i/i),a=this.FOV_DEG/2*Math.PI/180,r=e+o*Math.sin(-a),s=t-o*Math.cos(-a),n=e+o*Math.sin(a),l=t-o*Math.cos(a);return V`
      <defs>
        <radialGradient id="coverageGradient" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stop-color="rgba(59, 130, 246, 0.35)" />
          <stop offset="100%" stop-color="rgba(59, 130, 246, 0.02)" />
        </radialGradient>
      </defs>
      <path
        class="coverage-arc"
        d="M ${e} ${t} L ${r} ${s} A ${o} ${o} 0 0 1 ${n} ${l} Z"
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
      `})}_renderZone(e){if(!(0!==e.beginX||0!==e.endX||0!==e.beginY||0!==e.endY))return Z;const t=this._toSvg(Math.min(e.beginX,e.endX),Math.max(e.beginY,e.endY)),i=this._toSvg(Math.max(e.beginX,e.endX),Math.min(e.beginY,e.endY)),o=t.x,a=t.y,r=i.x-t.x,s=i.y-t.y,n=this._selectedZone===e.id,l=n?[{name:"nw",x:o,y:a},{name:"ne",x:o+r,y:a},{name:"sw",x:o,y:a+s},{name:"se",x:o+r,y:a+s},{name:"n",x:o+r/2,y:a},{name:"s",x:o+r/2,y:a+s},{name:"w",x:o,y:a+s/2},{name:"e",x:o+r,y:a+s/2}]:[];return V`
      <g>
        <rect
          x="${o}" y="${a}"
          width="${r}" height="${s}"
          fill="${e.color}35"
          stroke="${e.color}"
          stroke-width="${n?3:2}"
          rx="6"
          class="zone-rect ${n?"selected":""}"
          @mousedown=${t=>this._handleMouseDown(t,e.id,"move")}
        />
        <text
          x="${o+r/2}" y="${a+22}"
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
                        <span class="zone-status ${t?"":"inactive"}">${t?"Active":"Empty"}</span>
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
                    `):G`<span style="color: #64748b; font-size: 0.85rem;">No active targets</span>`}
              </div>

              <div class="info-card">
                <h4>${"3d"===this._viewMode?"3D Controls":"Instructies"}</h4>
                <ul>
                  ${"3d"===this._viewMode?G`
                    <li>Drag to rotate</li>
                    <li>Shift + drag to pan</li>
                    <li>Scroll to zoom</li>
                    <li>Edit zones in 2D mode</li>
                  `:G`
                    <li>Click a zone to select it</li>
                    <li>Drag the zone to move it</li>
                    <li>Use the handles to resize</li>
                    <li>Coordinates snap to 100mm</li>
                  `}
                </ul>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <div class="changes-badge">
              ${this._hasChanges?G`
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                Unsaved changes
              `:Z}
            </div>
            <div class="btn-group">
              <button class="btn btn-secondary" @click=${this._loadZones}>Reset</button>
              <button class="btn btn-primary" @click=${this._saveAllZones} ?disabled=${!this._hasChanges||this._saving}>
                ${this._saving?"Saving...":"Save to sensor"}
              </button>
            </div>
          </div>
        </div>
      </div>
    `:Z}};Be.styles=s`
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
  `,e([ue({attribute:!1})],Be.prototype,"hass",void 0),e([ue()],Be.prototype,"entityPrefix",void 0),e([ue()],Be.prototype,"deviceName",void 0),e([ue({type:Boolean})],Be.prototype,"isOpen",void 0),e([ue({type:Number})],Be.prototype,"maxDistance",void 0),e([me()],Be.prototype,"_zones",void 0),e([me()],Be.prototype,"_targets",void 0),e([me()],Be.prototype,"_selectedZone",void 0),e([me()],Be.prototype,"_dragMode",void 0),e([me()],Be.prototype,"_dragStart",void 0),e([me()],Be.prototype,"_saving",void 0),e([me()],Be.prototype,"_hasChanges",void 0),e([me()],Be.prototype,"_viewMode",void 0),e([me()],Be.prototype,"_detectionRange",void 0),Be=e([he("smarthomeshop-zone-editor")],Be);const Ke=s`
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
`;function Qe(e){if(!e)return[];const t=new Map,i=[{pattern:"waterp1meterkit",type:"WaterP1MeterKit"},{pattern:"watermeterkit",type:"WaterMeterKit"},{pattern:"waterflowkit",type:"WaterFlowKit"}];return Object.keys(e.states).forEach(o=>{const a=e.states[o],r=(a?.attributes?.friendly_name||"").toLowerCase(),s=o.toLowerCase();for(const{pattern:e,type:o}of i)if(r.includes(e)||s.includes(e)){const i=s.match(new RegExp(`${e}[_-]?([a-f0-9]{6})`)),r=i?i[1]:e;if(!t.has(r)){const e=(a?.attributes?.friendly_name||"").split(" ").slice(0,2).join(" ")||`${o} ${r.toUpperCase()}`;t.set(r,{id:r,name:e,type:o})}break}}),Array.from(t.values())}let Je=class extends ce{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&(this._devices=Qe(this.hass).filter(e=>"WaterMeterKit"===e.type||"WaterFlowKit"===e.type))}_valueChanged(e,t){if(this._config[e]===t)return;const i={...this._config,[e]:t};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){const e=this._devices.find(e=>e.id===this._config.device_id);return G`
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
    `}};Je.styles=Ke,e([ue({attribute:!1})],Je.prototype,"hass",void 0),e([me()],Je.prototype,"_config",void 0),e([me()],Je.prototype,"_devices",void 0),Je=e([he("smarthomeshop-water-card-editor")],Je);let et=class extends ce{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&(this._devices=Qe(this.hass).filter(e=>"WaterP1MeterKit"===e.type))}_valueChanged(e,t){if(this._config[e]===t)return;const i={...this._config,[e]:t};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){const e=this._devices.find(e=>e.id===this._config.device_id);return G`
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
    `}};et.styles=Ke,e([ue({attribute:!1})],et.prototype,"hass",void 0),e([me()],et.prototype,"_config",void 0),e([me()],et.prototype,"_devices",void 0),et=e([he("smarthomeshop-waterp1-card-editor")],et);console.info("%c SMARTHOMESHOP-CARDS %c 0.0.8 ","color: white; background: #2196f3; font-weight: bold; padding: 2px 4px; border-radius: 4px 0 0 4px;","color: #2196f3; background: #e3f2fd; font-weight: bold; padding: 2px 4px; border-radius: 0 4px 4px 0;"),window.customCards=window.customCards||[],window.customCards.push({type:"smarthomeshop-water-card",name:"SmartHomeShop Water Card",description:"Water monitoring voor WaterMeterKit en WaterFlowKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-waterp1-card",name:"SmartHomeShop WaterP1 Card",description:"Water + Energy monitoring voor WaterP1MeterKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-ultimatesensor-card",name:"SmartHomeShop UltimateSensor Card",description:"Presence detection & omgevingssensoren voor UltimateSensor en UltimateSensor Mini",preview:!0,documentationURL:"https://docs.smarthomeshop.io/en/ultimatesensor/home-assistant-card"}),window.customCards.push({type:"smarthomeshop-waterflowkit-card",name:"SmartHomeShop WaterFlowKit Card",description:"Dual flow water monitoring met geanimeerde leidingen voor WaterFlowKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),console.log("SmartHomeShop.io Cards loaded successfully!");export{Ze as SmartHomeShopSensorSettings,qe as SmartHomeShopUltimateSensorCard,Ee as SmartHomeShopWaterCard,Fe as SmartHomeShopWaterFlowKitCard,He as SmartHomeShopWaterFlowKitCardEditor,We as SmartHomeShopWaterP1Card,Be as SmartHomeShopZoneEditor};
