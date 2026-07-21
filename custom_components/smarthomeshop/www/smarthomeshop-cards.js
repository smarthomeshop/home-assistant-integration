/* SmartHomeShop.io Cards v1.2.0 - Build: 2026-07-21T16:03:36.060Z */
function e(e,t,i,o){var a,r=arguments.length,s=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(s=(r<3?a(s):r>3?a(t,i,s):a(t,i))||s);return r>3&&s&&Object.defineProperty(t,i,s),s}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),a=new WeakMap;let r=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=a.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&a.set(t,e))}return e}toString(){return this.cssText}};const s=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[o+1],e[0]);return new r(i,e,o)},n=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new r("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:c,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,g=globalThis,m=g.trustedTypes,f=m?m.emptyScript:"",v=g.reactiveElementPolyfillSupport,_=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?f:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},x=(e,t)=>!c(e,t),w={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=w){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(e,i,t);void 0!==o&&l(this.prototype,e,o)}}static getPropertyDescriptor(e,t,i){const{get:o,set:a}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const r=o?.call(this);a?.call(this,t),this.requestUpdate(e,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??w}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const e=u(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const e=this.properties,t=[...h(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(i)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of o){const o=document.createElement("style"),a=t.litNonce;void 0!==a&&o.setAttribute("nonce",a),o.textContent=i.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,i);if(void 0!==o&&!0===i.reflect){const a=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(t,i.type);this._$Em=e,null==a?this.removeAttribute(o):this.setAttribute(o,a),this._$Em=null}}_$AK(e,t){const i=this.constructor,o=i._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=i.getPropertyOptions(o),a="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=o;const r=a.fromAttribute(t,e.type);this[o]=r??this._$Ej?.get(o)??r,this._$Em=null}}requestUpdate(e,t,i,o=!1,a){if(void 0!==e){const r=this.constructor;if(!1===o&&(a=this[e]),i??=r.getPropertyOptions(e),!((i.hasChanged??x)(a,t)||i.useDefault&&i.reflect&&a===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:o,wrapped:a},r){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),!0!==a||void 0!==r)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,i,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[_("elementProperties")]=new Map,b[_("finalized")]=new Map,v?.({ReactiveElement:b}),(g.reactiveElementVersions??=[]).push("2.1.2");const k=globalThis,$=e=>e,C=k.trustedTypes,z=C?C.createPolicy("lit-html",{createHTML:e=>e}):void 0,M="$lit$",S=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+S,E=`<${P}>`,L=document,T=()=>L.createComment(""),D=e=>null===e||"object"!=typeof e&&"function"!=typeof e,A=Array.isArray,I="[ \t\n\f\r]",W=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,U=/>/g,O=RegExp(`>|${I}(?:([^\\s"'>=/]+)(${I}*=${I}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),R=/'/g,F=/"/g,H=/^(?:script|style|textarea|title)$/i,j=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),V=j(1),G=j(2),q=Symbol.for("lit-noChange"),Y=Symbol.for("lit-nothing"),Z=new WeakMap,X=L.createTreeWalker(L,129);function B(e,t){if(!A(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==z?z.createHTML(t):t}const K=(e,t)=>{const i=e.length-1,o=[];let a,r=2===t?"<svg>":3===t?"<math>":"",s=W;for(let t=0;t<i;t++){const i=e[t];let n,c,l=-1,d=0;for(;d<i.length&&(s.lastIndex=d,c=s.exec(i),null!==c);)d=s.lastIndex,s===W?"!--"===c[1]?s=N:void 0!==c[1]?s=U:void 0!==c[2]?(H.test(c[2])&&(a=RegExp("</"+c[2],"g")),s=O):void 0!==c[3]&&(s=O):s===O?">"===c[0]?(s=a??W,l=-1):void 0===c[1]?l=-2:(l=s.lastIndex-c[2].length,n=c[1],s=void 0===c[3]?O:'"'===c[3]?F:R):s===F||s===R?s=O:s===N||s===U?s=W:(s=O,a=void 0);const h=s===O&&e[t+1].startsWith("/>")?" ":"";r+=s===W?i+E:l>=0?(o.push(n),i.slice(0,l)+M+i.slice(l)+S+h):i+S+(-2===l?t:h)}return[B(e,r+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class Q{constructor({strings:e,_$litType$:t},i){let o;this.parts=[];let a=0,r=0;const s=e.length-1,n=this.parts,[c,l]=K(e,t);if(this.el=Q.createElement(c,i),X.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=X.nextNode())&&n.length<s;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(M)){const t=l[r++],i=o.getAttribute(e).split(S),s=/([.?@])?(.*)/.exec(t);n.push({type:1,index:a,name:s[2],strings:i,ctor:"."===s[1]?oe:"?"===s[1]?ae:"@"===s[1]?re:ie}),o.removeAttribute(e)}else e.startsWith(S)&&(n.push({type:6,index:a}),o.removeAttribute(e));if(H.test(o.tagName)){const e=o.textContent.split(S),t=e.length-1;if(t>0){o.textContent=C?C.emptyScript:"";for(let i=0;i<t;i++)o.append(e[i],T()),X.nextNode(),n.push({type:2,index:++a});o.append(e[t],T())}}}else if(8===o.nodeType)if(o.data===P)n.push({type:2,index:a});else{let e=-1;for(;-1!==(e=o.data.indexOf(S,e+1));)n.push({type:7,index:a}),e+=S.length-1}a++}}static createElement(e,t){const i=L.createElement("template");return i.innerHTML=e,i}}function J(e,t,i=e,o){if(t===q)return t;let a=void 0!==o?i._$Co?.[o]:i._$Cl;const r=D(t)?void 0:t._$litDirective$;return a?.constructor!==r&&(a?._$AO?.(!1),void 0===r?a=void 0:(a=new r(e),a._$AT(e,i,o)),void 0!==o?(i._$Co??=[])[o]=a:i._$Cl=a),void 0!==a&&(t=J(e,a._$AS(e,t.values),a,o)),t}class ee{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,o=(e?.creationScope??L).importNode(t,!0);X.currentNode=o;let a=X.nextNode(),r=0,s=0,n=i[0];for(;void 0!==n;){if(r===n.index){let t;2===n.type?t=new te(a,a.nextSibling,this,e):1===n.type?t=new n.ctor(a,n.name,n.strings,this,e):6===n.type&&(t=new se(a,this,e)),this._$AV.push(t),n=i[++s]}r!==n?.index&&(a=X.nextNode(),r++)}return X.currentNode=L,o}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class te{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,o){this.type=2,this._$AH=Y,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=J(this,e,t),D(e)?e===Y||null==e||""===e?(this._$AH!==Y&&this._$AR(),this._$AH=Y):e!==this._$AH&&e!==q&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>A(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==Y&&D(this._$AH)?this._$AA.nextSibling.data=e:this.T(L.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,o="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Q.createElement(B(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new ee(o,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=Z.get(e.strings);return void 0===t&&Z.set(e.strings,t=new Q(e)),t}k(e){A(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,o=0;for(const a of e)o===t.length?t.push(i=new te(this.O(T()),this.O(T()),this,this.options)):i=t[o],i._$AI(a),o++;o<t.length&&(this._$AR(i&&i._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=$(e).nextSibling;$(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}let ie=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,o,a){this.type=1,this._$AH=Y,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=a,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Y}_$AI(e,t=this,i,o){const a=this.strings;let r=!1;if(void 0===a)e=J(this,e,t,0),r=!D(e)||e!==this._$AH&&e!==q,r&&(this._$AH=e);else{const o=e;let s,n;for(e=a[0],s=0;s<a.length-1;s++)n=J(this,o[i+s],t,s),n===q&&(n=this._$AH[s]),r||=!D(n)||n!==this._$AH[s],n===Y?e=Y:e!==Y&&(e+=(n??"")+a[s+1]),this._$AH[s]=n}r&&!o&&this.j(e)}j(e){e===Y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}};class oe extends ie{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===Y?void 0:e}}class ae extends ie{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==Y)}}class re extends ie{constructor(e,t,i,o,a){super(e,t,i,o,a),this.type=5}_$AI(e,t=this){if((e=J(this,e,t,0)??Y)===q)return;const i=this._$AH,o=e===Y&&i!==Y||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,a=e!==Y&&(i===Y||o);o&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class se{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){J(this,e)}}const ne=k.litHtmlPolyfillSupport;ne?.(Q,te),(k.litHtmlVersions??=[]).push("3.3.2");const ce=globalThis;let le=class extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const o=i?.renderBefore??t;let a=o._$litPart$;if(void 0===a){const e=i?.renderBefore??null;o._$litPart$=a=new te(t.insertBefore(T(),e),e,void 0,i??{})}return a._$AI(e),a})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}};le._$litElement$=!0,le.finalized=!0,ce.litElementHydrateSupport?.({LitElement:le});const de=ce.litElementPolyfillSupport;de?.({LitElement:le}),(ce.litElementVersions??=[]).push("4.2.2");const he=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},pe={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:x},ue=(e=pe,t,i)=>{const{kind:o,metadata:a}=i;let r=globalThis.litPropertyMetadata.get(a);if(void 0===r&&globalThis.litPropertyMetadata.set(a,r=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),r.set(i.name,e),"accessor"===o){const{name:o}=i;return{set(i){const a=t.get.call(this);t.set.call(this,i),this.requestUpdate(o,a,e,!0,i)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=i;return function(i){const a=this[o];t.call(this,i),this.requestUpdate(o,a,e,!0,i)}}throw Error("Unsupported decorator location: "+o)};function ge(e){return(t,i)=>"object"==typeof i?ue(e,t,i):((e,t,i)=>{const o=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),o?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function me(e){return ge({...e,state:!0,attribute:!1})}const fe=2;class ve{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}class _e extends ve{constructor(e){if(super(e),this.it=Y,e.type!==fe)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===Y||null==e)return this._t=void 0,this.it=e;if(e===q)return e;if("string"!=typeof e)throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}_e.directiveName="unsafeHTML",_e.resultType=1;const ye=(e=>(...t)=>({_$litDirective$:e,values:t}))(_e);function xe(e,t){return e&&t&&e.states[t]?e.states[t]:null}function we(e,t,i=0){const o=xe(e,t);if(!o||"unavailable"===o.state||"unknown"===o.state)return i;const a=parseFloat(o.state);return isNaN(a)?i:a}function be(e){const t=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"just now";if(t<60)return`${t} min ago`;const i=Math.floor(t/60);if(i<24)return`${i} hour${1===i?"":"s"} ago`;const o=Math.floor(i/24);return`${o} day${1===o?"":"s"} ago`}function ke(e,t=1){return null==e||isNaN(e)?"—":e.toFixed(t)}function $e(e,t){t&&e.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}}))}function Ce(e,t=300,i=50){const o=24===e?.length?e:new Array(24).fill(0).map((e,t)=>t>6&&t<9?2:t>17&&t<21?3:.5),a=Math.max(...o,.1),r=o.map(e=>e/a*(i-5));let s="M 0 "+(i-r[0]);return r.forEach((e,o)=>{o>0&&(s+=` L ${o*(t/23)} ${i-e}`)}),s}class ze extends le{constructor(){super(...arguments),this._config={},this._historyData=null,this._historyLoading=!1,this._showMeterForm=!1,this._meterInput="",this._lastHistoryFetch=0,this._toggleMeterForm=()=>{if(this._showMeterForm=!this._showMeterForm,this._showMeterForm){const e=this._getMeterTotal();this._meterInput=e>0?e.toFixed(3):""}},this._saveMeterReading=async()=>{const e=this._config.meter_initial_entity;if(!this.hass||!e)return;const t=parseFloat(this._meterInput.replace(",","."));isNaN(t)||t<0||(await this.hass.callService("number","set_value",{entity_id:e,value:t}),this._showMeterForm=!1,this._meterInput="")}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_header:!0,show_status:!0,show_water_current:!0,show_water_totals:!0,show_today:!0,show_week:!0,show_month:!0,show_year:!0,show_graph:!0,show_meter_reading:!0,show_leak_detection:!0,_entitiesResolved:!t&&e._entitiesResolved,...e},t&&(this._lastDeviceId=e.device_id)}getCardSize(){return 5}updated(e){if(super.updated(e),e.has("hass")&&this.hass&&(this._config._entitiesResolved&&this._lastDeviceId===this._config.device_id||(this._autoDetectEntities(),this._lastDeviceId=this._config.device_id),this._preferPersistentWaterTotal(),this._config.show_graph&&this._config.flow_entity)){(Date.now()-this._lastHistoryFetch>3e5||!this._historyData)&&this._fetchHistory()}}_findEntity(e,t="sensor",i=!1){if(!this.hass)return"";const o=this._config.device_id,a=["waterp1meterkit","watermeterkit","waterflowkit","smarthomeshop"],r=Object.keys(this.hass.states).find(r=>{if(!r.startsWith(t+"."))return!1;const s=this.hass.states[r];if(!s?.attributes)return!1;const n=(s.attributes.friendly_name||"").toLowerCase(),c=r.toLowerCase(),l=this.hass.entities?.[r]?.device_id,d=!!o&&l===o,h=!!o&&(n.includes(o.toLowerCase())||c.includes(o.toLowerCase())),p=a.some(e=>n.includes(e)||c.includes(e));return!(!p&&!d)&&(!(o&&!d&&!h)&&(i?e.some(e=>c.includes(e.toLowerCase())):e.some(e=>n.includes(e.toLowerCase()))))});return r||""}_autoDetectEntities(){if(!this.hass)return;const e=this._config.device_id;if(e){const t=Object.keys(this.hass.states).filter(t=>{const i=this.hass.entities?.[t]?.device_id;return i===e||t.includes(e)});t.some(e=>e.includes("waterp1meterkit"))?this._config._productName="WaterP1MeterKit":t.some(e=>e.includes("watermeterkit"))?this._config._productName="WaterMeterKit":t.some(e=>e.includes("waterflowkit"))?this._config._productName="WaterFlowKit":this._config._productName="SmartHomeShop"}else{const e=Object.keys(this.hass.states);e.some(e=>e.includes("waterp1meterkit"))?this._config._productName="WaterP1MeterKit":e.some(e=>e.includes("watermeterkit"))?this._config._productName="WaterMeterKit":e.some(e=>e.includes("waterflowkit"))?this._config._productName="WaterFlowKit":this._config._productName="SmartHomeShop"}this._config.flow_entity||(this._config.flow_entity=this._findEntity(["current_usage"],"sensor",!0)||this._findEntity(["current water usage"]));const t=this._findEntity(["water_meter_total"],"sensor",!0)||this._findEntity(["water meter total"]);!t||this._config.total_entity&&!this._isRawWaterTotal(this._config.total_entity)?this._config.total_entity||(this._config.total_entity=this._findEntity(["total_consumption"],"sensor",!0)):this._config.total_entity=t,this._config.today_entity||(this._config.today_entity=this._findEntity(["usage today"])),this._config.week_entity||(this._config.week_entity=this._findEntity(["usage this week"])),this._config.month_entity||(this._config.month_entity=this._findEntity(["usage this month"])),this._config.year_entity||(this._config.year_entity=this._findEntity(["usage this year"])),this._config.leak_entity||(this._config.leak_entity=this._findEntity(["leak alarm"],"binary_sensor")),this._config.meter_initial_entity||(this._config.meter_initial_entity=this._findEntity(["water_meter_initial"],"number",!0)),this._config._entitiesResolved=!0}_isRawWaterTotal(e){if(!e)return!1;if(e.toLowerCase().includes("water_total_consumption"))return!0;const t=this.hass?.states[e]?.attributes.friendly_name;return"string"==typeof t&&t.toLowerCase().includes("water total consumption")}_preferPersistentWaterTotal(){const e=this._config.total_entity;if(e&&!this._isRawWaterTotal(e))return;const t=this._findEntity(["water_meter_total"],"sensor",!0)||this._findEntity(["water meter total"]);t&&t!==e&&(this._config={...this._config,total_entity:t})}async _fetchHistory(){if(!this.hass||!this._config.flow_entity||this._historyLoading)return;this._historyLoading=!0;const e=this._config.flow_entity,t=new Date,i=new Date(t.getTime()-864e5);try{const o=await this.hass.callWS({type:"history/history_during_period",start_time:i.toISOString(),end_time:t.toISOString(),entity_ids:[e],minimal_response:!0,no_attributes:!0,significant_changes_only:!1});o?.[e]&&(this._historyData=function(e){if(!e?.length)return[];const t=new Array(24).fill(null).map(()=>({sum:0,count:0})),i=new Date;return e.forEach(e=>{const o=new Date(e.lu?1e3*e.lu:e.last_updated||0),a=Math.floor((i.getTime()-o.getTime())/36e5),r=23-Math.min(a,23),s=parseFloat(e.s||e.state||"0");!isNaN(s)&&r>=0&&r<24&&(t[r].sum+=s,t[r].count++)}),t.map(e=>e.count>0?e.sum/e.count:0)}(o[e]),this._lastHistoryFetch=Date.now())}catch(e){console.error("SmartHomeShop: Error fetching history:",e)}finally{this._historyLoading=!1}}_getFlowRate(){return we(this.hass,this._config.flow_entity)}_getTodayUsage(){return we(this.hass,this._config.today_entity)}_getWeekUsage(){return we(this.hass,this._config.week_entity)}_getMonthUsage(){return we(this.hass,this._config.month_entity)}_getYearUsage(){return we(this.hass,this._config.year_entity)}_getMeterTotal(){return we(this.hass,this._config.total_entity)}_hasLeak(){const e=xe(this.hass,this._config.leak_entity);return"on"===e?.state}_getMaxHistoryValue(){return this._historyData?.length?Math.max(...this._historyData):0}_renderMeterSection(){const e=this._config.total_entity;if(!e||!1===this._config.show_meter_reading)return Y;if("WaterP1MeterKit"===this._config._productName&&this._isRawWaterTotal(e))return V`
        <div class="meter-counter-section meter-counter-upgrade">
          <span class="meter-counter-icon"><ha-icon icon="mdi:update"></ha-icon></span>
          <span class="meter-counter-copy">
            <span class="meter-counter-title">Persistent meter reading unavailable</span>
            <span class="meter-counter-subtitle">
              Update the WaterP1MeterKit firmware to enable Water Meter Total.
            </span>
          </span>
        </div>
      `;const t=this._getMeterTotal(),i=!!this._config.meter_initial_entity,o=parseFloat(this._meterInput.replace(",",".")),a=!isNaN(o)&&o>=0;return V`
      <div class="meter-counter-section">
        <div class="meter-counter-main">
          <button type="button" class="meter-counter-reading" @click=${()=>$e(this,e)}>
            <span class="meter-counter-icon"><ha-icon icon="mdi:counter"></ha-icon></span>
            <span class="meter-counter-copy">
              <span class="meter-counter-title">Meter reading</span>
              <span class="meter-counter-subtitle">
                ${i?"Synchronized with your device":"Total registered water"}
              </span>
            </span>
            <span class="meter-counter-value">${t.toFixed(3)}<span>m³</span></span>
          </button>
          ${i?V`
            <button
              type="button"
              class="meter-counter-calibrate"
              aria-label=${this._showMeterForm?"Cancel setting meter reading":"Set meter reading"}
              aria-expanded=${String(this._showMeterForm)}
              @click=${this._toggleMeterForm}
            >
              <ha-icon icon=${this._showMeterForm?"mdi:close":"mdi:pencil"}></ha-icon>
              <span>${this._showMeterForm?"Cancel":"Set"}</span>
            </button>
          `:Y}
        </div>
        ${i&&this._showMeterForm?V`
          <div class="meter-form">
            <div class="meter-form-help">
              Enter the reading shown on your physical water meter in m³, for
              example 123.456. The value is stored on the device itself.
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
                @keydown=${e=>{"Enter"===e.key&&a&&this._saveMeterReading()}}
              />
              <span class="meter-form-unit">m³</span>
              <button class="meter-form-save" ?disabled=${!a} @click=${this._saveMeterReading}>
                Save
              </button>
            </div>
          </div>
        `:Y}
      </div>
    `}}e([ge({attribute:!1})],ze.prototype,"hass",void 0),e([me()],ze.prototype,"_config",void 0),e([me()],ze.prototype,"_historyData",void 0),e([me()],ze.prototype,"_historyLoading",void 0),e([me()],ze.prototype,"_showMeterForm",void 0),e([me()],ze.prototype,"_meterInput",void 0);const Me=s`
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
    container-type: inline-size;
    --shs-surface: color-mix(
      in srgb,
      var(--secondary-background-color) 78%,
      var(--card-background-color)
    );
    --shs-surface-hover: color-mix(
      in srgb,
      var(--primary-color) 6%,
      var(--shs-surface)
    );
    --shs-outline: color-mix(in srgb, var(--divider-color) 88%, transparent);
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
    gap: 12px;
    margin-bottom: 14px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .header-icon {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
    transition: transform 180ms ease-out, background-color 180ms ease-out;
  }

  .header-icon ha-icon {
    --mdc-icon-size: 24px;
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
    font-size: 1rem;
    font-weight: 600;
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
    flex: 0 0 auto;
    padding: 6px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    transition: background-color 180ms ease-out, color 180ms ease-out;
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

  /* Compact meter calibration (shared by water cards) */
  .meter-counter-section {
    background: var(--shs-surface);
    border-radius: 12px;
    padding: 10px;
    margin-top: 12px;
    border: 1px solid var(--shs-outline);
  }

  .meter-counter-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .meter-counter-upgrade {
    display: flex;
    align-items: center;
    gap: 10px;
    background: color-mix(in srgb, var(--warning-color) 8%, var(--shs-surface));
    border-color: color-mix(in srgb, var(--warning-color) 35%, var(--shs-outline));
  }

  .meter-counter-upgrade .meter-counter-icon {
    background: color-mix(in srgb, var(--warning-color) 14%, transparent);
    color: var(--warning-color);
  }

  .meter-counter-reading {
    appearance: none;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    min-width: 0;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px;
    text-align: left;
    cursor: pointer;
  }

  .meter-counter-icon {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--info-color) 13%, transparent);
    color: var(--info-color);
  }

  .meter-counter-icon ha-icon { --mdc-icon-size: 20px; }

  .meter-counter-copy {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .meter-counter-title {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--primary-text-color);
  }

  .meter-counter-subtitle {
    font-size: 11px;
    line-height: 1.2;
    color: var(--secondary-text-color);
  }

  .meter-counter-value {
    margin-left: auto;
    white-space: nowrap;
    font-size: 16px;
    font-weight: 650;
    color: var(--primary-text-color);
  }

  .meter-counter-value span {
    margin-left: 3px;
    font-size: 11px;
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  .meter-counter-calibrate {
    appearance: none;
    border: 1px solid var(--shs-outline);
    background: var(--card-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 36px;
    padding: 0 10px;
    border-radius: 10px;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    color: var(--info-color);
    cursor: pointer;
    transition: background-color 180ms ease-out, border-color 180ms ease-out;
  }

  .meter-counter-calibrate:hover,
  .meter-counter-calibrate[aria-expanded='true'] {
    border-color: color-mix(in srgb, var(--info-color) 45%, var(--divider-color));
    background: color-mix(in srgb, var(--info-color) 9%, var(--card-background-color));
  }

  .meter-counter-calibrate ha-icon { --mdc-icon-size: 16px; }

  /* Inline "set meter reading" form */
  .meter-form {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--shs-outline);
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
    background: var(--shs-surface);
    border: 1px solid var(--shs-outline);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: background-color 180ms ease-out, border-color 180ms ease-out;
  }

  .value-display:hover {
    background: var(--shs-surface-hover);
    border-color: color-mix(in srgb, var(--primary-color) 28%, var(--divider-color));
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
    font-size: 2rem;
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
    letter-spacing: 0;
    font-weight: 500;
  }

  /* Stats grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }

  .stat-item {
    background: var(--shs-surface);
    border: 1px solid var(--shs-outline);
    border-radius: 12px;
    padding: 12px 8px;
    text-align: center;
    cursor: pointer;
    transition: background-color 180ms ease-out, border-color 180ms ease-out;
  }

  .stat-item:hover {
    background: var(--shs-surface-hover);
    border-color: color-mix(in srgb, var(--primary-color) 25%, var(--divider-color));
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
    letter-spacing: 0;
  }

  /* Graph section */
  .graph-section {
    background: var(--shs-surface);
    border: 1px solid var(--shs-outline);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .graph-section:hover {
    background: var(--shs-surface-hover);
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
    background: var(--shs-surface);
    border: 1px solid var(--shs-outline);
    border-radius: 12px;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .info-bar:hover {
    background: var(--shs-surface-hover);
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

  .info-right ha-icon {
    --mdc-icon-size: 20px;
    color: var(--secondary-text-color);
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
    letter-spacing: 0;
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

  @container (max-width: 430px) {
    .card-content {
      padding: 14px;
    }

    .header {
      align-items: flex-start;
    }

    .header-icon {
      width: 40px;
      height: 40px;
      flex-basis: 40px;
    }

    .status-badge {
      padding: 6px 8px;
    }

    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .meter-counter-main {
      align-items: stretch;
      flex-wrap: wrap;
    }

    .meter-counter-reading {
      flex-basis: calc(100% - 48px);
    }

    .meter-counter-calibrate {
      width: 40px;
      padding: 0;
    }

    .meter-counter-calibrate span {
      display: none;
    }

    .meter-form-row {
      flex-wrap: wrap;
    }

    .meter-form-row input {
      flex-basis: calc(100% - 42px);
    }

    .meter-form-save {
      width: 100%;
    }
  }
`,Se={ultimatesensor:'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 612.9 605.2" style="enable-background:new 0 0 612.9 605.2;" xml:space="preserve"> <g> <g> <g> <path fill="currentColor" d="M581.4,299.4c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5l-23.2,239.8c-2,20.2-20,35.1-40.2,33.1l-312.3-30.2 c-20.2-2-35.1-20-33.1-40.2l12.8-132.4l117,11.3c6,0.6,11.5-3.9,12-9.9c0.3-2.9-0.6-5.8-2.5-8.1c-1.9-2.3-4.5-3.7-7.5-4 l-279.6-27c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4l140.6,13.6l-12.8,132.4 c-3.1,32.3,20.6,61.2,53,64.3l312.3,30.2c1.9,0.2,3.8,0.3,5.7,0.3c13.6,0,26.7-4.7,37.4-13.5c12.2-10,19.7-24.1,21.2-39.8 l23.3-240c0.3-2.9-0.6-5.8-2.5-8.1C587,301.1,584.4,299.7,581.4,299.4z"/> <path fill="currentColor" d="M559.2,30.9l-62.3-6c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.6,6.1,3.9,11.5,9.9,12l62.3,6 c20.2,2,35.1,20,33.1,40.2l-14.6,151.2c-0.3,2.9,0.6,5.8,2.5,8.1s4.5,3.7,7.5,4c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10 l14.6-151.2C615.3,62.9,591.6,34.1,559.2,30.9z"/> <path fill="currentColor" d="M285.4,430.9l-5.7,59.1c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4l131.9,12.7c0.4,0,0.7,0.1,1.1,0.1 c5.6,0,10.4-4.3,11-10l5.7-59.1c0.6-6.1-3.9-11.5-9.9-12L297.4,421C291.4,420.4,285.9,424.9,285.4,430.9z M416.2,454.7l-3.6,37.1 l-110-10.6l3.7-37.2L416.2,454.7z"/> <path fill="currentColor" d="M495.4,200.8l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1 l1.6-16.3c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C496,199.7,495.5,200.2,495.4,200.8z"/> <path fill="currentColor" d="M393.8,112.6c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10l0,0l3.6-37.4c0.3-2.9-0.6-5.8-2.5-8.1 s-4.5-3.7-7.5-4c-6-0.6-11.5,3.9-12,9.9l-3.6,37.4C383.3,106.7,387.7,112.1,393.8,112.6z"/> <path fill="currentColor" d="M326.8,120.2c1.8,3,4.9,5,8.5,5.4l0,0c0.4,0,0.7,0.1,1.1,0.1c2,0,3.9-0.5,5.6-1.5c2.5-1.5,4.3-3.9,5.1-6.7 c0.7-2.9,0.3-5.8-1.2-8.4l-19.1-32.4c-1.5-2.5-3.9-4.3-6.7-5.1c-2.8-0.7-5.8-0.3-8.4,1.2c-2.5,1.5-4.3,3.9-5.1,6.7 c-0.7,2.9-0.3,5.8,1.2,8.4L326.8,120.2z"/> <path fill="currentColor" d="M301,149.4l-34.5-15c-5.6-2.4-12.1,0.1-14.5,5.7c-1.2,2.7-1.2,5.7-0.2,8.4c1.1,2.7,3.2,4.9,5.9,6.1l34.5,15 c1.1,0.5,2.2,0.8,3.3,0.9l0,0c0.4,0,0.7,0.1,1.1,0.1c4.4,0,8.3-2.6,10.1-6.6C309.2,158.3,306.6,151.8,301,149.4z"/> <path fill="currentColor" d="M470.8,171.3c-1.6,2.5-2.1,5.4-1.5,8.3c1,4.7,4.9,8.1,9.7,8.6c0.3,0,0.7,0.1,1,0.1c0.8,0,1.6-0.1,2.4-0.3 l36.7-8.1c5.9-1.3,9.7-7.2,8.4-13.2c-0.6-2.9-2.4-5.3-4.8-6.9c-2.5-1.6-5.4-2.1-8.3-1.5l0,0l-36.7,8.1 C474.9,167.1,472.4,168.8,470.8,171.3z"/> <path fill="currentColor" d="M443.2,249.2c13.6-15.4,20.4-35.2,19.2-55.8c-1.3-20.6-10.4-39.4-25.8-53s-35.2-20.5-55.7-19.2 c-20.6,1.3-39.4,10.4-53,25.8c-16.3,18.4-22.7,42.7-17.8,66.7c1.2,5.9,7.1,9.8,13,8.6l0,0c6-1.2,9.8-7.1,8.6-13 c-3.5-17.2,1.1-34.5,12.7-47.6c9.7-11,23.2-17.5,37.8-18.4c14.7-0.9,28.8,4,39.8,13.7s17.5,23.2,18.4,37.8 c0.9,14.7-4,28.8-13.7,39.8c-18.8,21.3-51.4,24.6-74.1,7.6c-4.9-3.6-11.8-2.7-15.4,2.2c-1.8,2.4-2.5,5.3-2.1,8.2s1.9,5.5,4.3,7.3 c11.2,8.4,24.5,13.5,38.5,14.9c2.5,0.2,5,0.4,7.5,0.4C407.4,275.1,428.6,265.7,443.2,249.2z"/> <path fill="currentColor" d="M438.7,126.2c0.2,2.9,1.5,5.6,3.7,7.6c1.8,1.6,3.9,2.5,6.2,2.7c0.4,0,0.7,0.1,1.1,0.1c3.1,0,6.2-1.3,8.3-3.7 l24.9-28.1c2-2.2,2.9-5,2.8-8c-0.2-2.9-1.5-5.6-3.7-7.6s-5-2.9-8-2.8c-2.9,0.2-5.6,1.5-7.6,3.7l-24.9,28.1 C439.5,120.5,438.6,123.3,438.7,126.2z"/> <path fill="currentColor" d="M67.4,281.8L67.4,281.8l103.4,10c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10l21.8-226 c0.9-9.8,5.7-18.6,13.3-24.9s17.2-9.2,27-8.3l201.7,19.5c6.1,0.6,11.5-3.9,12-9.9c0.6-6.1-3.9-11.5-9.9-12L247,0.8 c-32.3-3.1-61.2,20.6-64.3,53l-20.8,215.1L69.5,260c-6.1-0.6-11.5,3.9-12,9.9C56.9,275.9,61.3,281.3,67.4,281.8z"/> <path fill="currentColor" d="M233.7,319.5L88,305.4c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1 c1.9,2.3,4.5,3.7,7.5,4l145.7,14.1c0.4,0,0.7,0.1,1.1,0.1c2.5,0,5-0.9,7-2.5c2.3-1.9,3.7-4.5,4-7.5c0.3-2.9-0.6-5.8-2.5-8.1 C239.2,321.2,236.6,319.8,233.7,319.5z"/> </g> </g> </g> </svg>',ultimatesensor_mini:'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 612.9 605.2" style="enable-background:new 0 0 612.9 605.2;" xml:space="preserve"> <g> <g> <g> <path fill="currentColor" d="M581.4,299.4c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5l-23.2,239.8c-2,20.2-20,35.1-40.2,33.1l-312.3-30.2 c-20.2-2-35.1-20-33.1-40.2l12.8-132.4l117,11.3c6,0.6,11.5-3.9,12-9.9c0.3-2.9-0.6-5.8-2.5-8.1c-1.9-2.3-4.5-3.7-7.5-4 l-279.6-27c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4l140.6,13.6l-12.8,132.4 c-3.1,32.3,20.6,61.2,53,64.3l312.3,30.2c1.9,0.2,3.8,0.3,5.7,0.3c13.6,0,26.7-4.7,37.4-13.5c12.2-10,19.7-24.1,21.2-39.8 l23.3-240c0.3-2.9-0.6-5.8-2.5-8.1C587,301.1,584.4,299.7,581.4,299.4z"/> <path fill="currentColor" d="M559.2,30.9l-62.3-6c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.6,6.1,3.9,11.5,9.9,12l62.3,6 c20.2,2,35.1,20,33.1,40.2l-14.6,151.2c-0.3,2.9,0.6,5.8,2.5,8.1s4.5,3.7,7.5,4c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10 l14.6-151.2C615.3,62.9,591.6,34.1,559.2,30.9z"/> <path fill="currentColor" d="M495.4,199.8l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1l1.6-16.3 c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C496,198.7,495.5,199.2,495.4,199.8z"/> <path fill="currentColor" d="M67.4,281.8L67.4,281.8l103.4,10c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10l21.8-226c0.9-9.8,5.7-18.6,13.3-24.9 s17.2-9.2,27-8.3l201.7,19.5c6.1,0.6,11.5-3.9,12-9.9c0.6-6.1-3.9-11.5-9.9-12L247,0.8c-32.3-3.1-61.2,20.6-64.3,53l-20.8,215.1 L69.5,260c-6.1-0.6-11.5,3.9-12,9.9C56.9,275.9,61.3,281.3,67.4,281.8z"/> <path fill="currentColor" d="M233.7,319.5L88,305.4c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4 l145.7,14.1c0.4,0,0.7,0.1,1.1,0.1c2.5,0,5-0.9,7-2.5c2.3-1.9,3.7-4.5,4-7.5c0.3-2.9-0.6-5.8-2.5-8.1 C239.2,321.2,236.6,319.8,233.7,319.5z"/> <path fill="currentColor" d="M498.4,169.1l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1l1.6-16.3 c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C499,168,498.5,168.5,498.4,169.1z"/> <path fill="currentColor" d="M492.4,230.1l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1l1.6-16.3 c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C493,229,492.5,229.5,492.4,230.1z"/> </g> </g> </g> </svg>',waterp1meterkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 330.6" style="enable-background:new 0 0 360.3 330.6;" xml:space="preserve"> <path fill="currentColor" d="M353.6,215.6c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 s4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,238.6,363,224.1,353.6,215.6z"/> <path fill="currentColor" d="M150.1,56.4h-40.7l15-45.8c1.4-5.3-2.6-10.6-8.2-10.6H65.5c-4.2,0-7.8,3.1-8.4,7.3L45.8,91.9 c-0.7,5.1,3.3,9.6,8.4,9.6H96l-16.2,68.6c-1.3,5.4,2.8,10.4,8.2,10.4c3,0,5.8-1.6,7.3-4.2l62-107.1 C160.6,63.5,156.6,56.4,150.1,56.4z"/> <g id="ZzGCBf_00000049189341060021335730000007757298693458865835_"> <g> <path fill="currentColor" d="M250,2.9c1.4,0,2.9,0,4.4,0c4.9,1.6,7.5,5.2,8.6,10c0.1,0.6,0.1,1.3,0.4,1.8c3.7,8.5,6.8,17.3,11.2,25.3 c5.7,10.3,12.5,20.1,19,30c6,9.1,12.5,17.9,15.7,28.4c1.2,4,1.9,8.2,2.9,12.4c0,3.8,0,7.6,0,11.5c-0.2,1.3-0.3,2.6-0.6,3.9 c-1.8,7.8-4,15.3-8.3,22.2c-7.4,11.9-17.4,20.6-30.6,25.2c-4.7,1.7-9.7,2.6-14.6,3.8c-4,0-8,0-12,0c-1.1-0.2-2.2-0.3-3.3-0.6 c-14.2-2.8-26.4-9.1-35.9-20.3c-6-7.1-10.4-15-12.6-23.9c-0.9-3.6-1.4-7.3-2.2-10.9c0-3.5,0-6.9,0-10.4c0.2-0.4,0.4-0.8,0.5-1.2 c0.4-7.9,3.2-15.2,6.8-22.1c3.2-6,7.4-11.6,11.1-17.4c5.9-9.1,11.8-18.1,17.5-27.3c5.6-8.9,9.5-18.6,12.6-28.6 C242.3,9.8,244,4.7,250,2.9z M250.7,156.4c1.9-0.9,4.3-1.4,5.5-2.9c1-1.2,1.2-3.8,0.7-5.4c-0.7-2.4-3.1-3.1-5.6-3.2 c-14.8-0.4-26.1-12.4-26.6-26.6c-0.1-3.7-2.1-6-5.3-6.1c-3.3-0.1-5.6,2.4-5.5,6.2c0.2,9.5,3.4,17.8,9.8,24.8 C231,150.9,239.9,155,250.7,156.4z"/> <path fill="currentColor" d="M250.7,156.4c-10.9-1.3-19.7-5.5-26.9-13.2c-6.5-7-9.6-15.3-9.8-24.8c-0.1-3.8,2.2-6.3,5.5-6.2 c3.3,0.1,5.2,2.4,5.3,6.1c0.5,14.3,11.8,26.3,26.6,26.6c2.6,0.1,4.9,0.8,5.6,3.2c0.5,1.6,0.3,4.2-0.7,5.4 C255,154.9,252.6,155.4,250.7,156.4z"/> </g> </g> </svg>',watermeterkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 327.7" style="enable-background:new 0 0 360.3 327.7;" xml:space="preserve"> <g id="ZzGCBf_00000097490843262625298010000006643391998989410708_"> <g> <path fill="currentColor" d="M178.5,0c1.4,0,2.9,0,4.4,0c4.9,1.6,7.5,5.2,8.6,10c0.1,0.6,0.1,1.3,0.4,1.8c3.7,8.5,6.8,17.3,11.2,25.3 c5.7,10.3,12.5,20.1,19,30c6,9.1,12.5,17.9,15.7,28.5c1.2,4,1.9,8.2,2.9,12.4c0,3.8,0,7.6,0,11.5c-0.2,1.3-0.3,2.6-0.6,3.9 c-1.8,7.8-4,15.3-8.3,22.2c-7.4,11.9-17.4,20.6-30.6,25.2c-4.7,1.7-9.7,2.6-14.6,3.8c-4,0-8,0-12,0c-1.1-0.2-2.2-0.3-3.3-0.6 c-14.2-2.8-26.4-9.1-35.9-20.3c-6-7.1-10.4-15-12.7-23.9c-0.9-3.6-1.4-7.3-2.2-10.9c0-3.5,0-6.9,0-10.4c0.2-0.4,0.4-0.8,0.5-1.2 c0.4-7.9,3.2-15.2,6.8-22.1c3.2-6,7.4-11.6,11.1-17.4c5.9-9.1,11.8-18.1,17.5-27.3c5.6-8.9,9.5-18.6,12.6-28.6 C170.8,6.8,172.5,1.8,178.5,0z M179.3,153.4c1.9-0.9,4.3-1.4,5.5-2.9c1-1.2,1.2-3.8,0.7-5.4c-0.7-2.4-3.1-3.1-5.6-3.2 c-14.8-0.4-26.1-12.4-26.6-26.6c-0.1-3.7-2.1-6-5.3-6.1c-3.3-0.1-5.6,2.4-5.5,6.2c0.2,9.5,3.4,17.8,9.8,24.8 C159.6,147.9,168.4,152.1,179.3,153.4z"/> </g> </g> <path fill="currentColor" d="M353.6,212.7c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 s4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,235.7,363,221.2,353.6,212.7z"/> </svg>',waterflowkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 332.6" style="enable-background:new 0 0 360.3 332.6;" xml:space="preserve"> <path fill="currentColor" d="M353.6,217.5c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 c0-5.5,4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,240.6,363,226.1,353.6,217.5z"/> <path fill="currentColor" d="M308.8,149.5c-10-1.1-19.7-4.9-27.1-10.7c-6.6-5.2-16-5.3-22.5,0c-17.7,14.2-50.1,14.2-68.1-0.7 c-6.3-5.2-15.4-4.2-21.8,0.8c-17.8,14.1-50,14-67.9-0.8c-6.3-5.2-15.6-4.2-22,0.9c-7.2,5.7-16.8,9.4-27,10.5 c-3.7,0.4-6.4,3.6-6.4,7.3v15.1c0,4.2,3.5,7.9,7.8,7.5c13.5-1.2,26.2-5.3,37.1-12.1c26.4,16.2,64,15.9,89.8,0 c26.4,16.2,64,15.9,89.8,0c10.9,6.6,23.8,10.9,37,12.1c4.2,0.4,7.8-3.2,7.8-7.5v-14.8C315.3,153.4,312.6,149.9,308.8,149.5z M308.8,82.2c-10-1.1-19.7-4.9-27.1-10.7c-6.6-5.2-16-5.3-22.5,0c-17.7,14.2-50.1,14.2-68.1-0.7c-6.3-5.2-15.4-4.2-21.8,0.8 c-17.8,14.1-50,14-67.9-0.8c-6.3-5.2-15.6-4.2-22,0.9c-7.2,5.7-16.8,9.4-27,10.5c-3.7,0.4-6.4,3.7-6.4,7.3v15.1 c0,4.2,3.5,7.8,7.8,7.5c13.5-1.2,26.2-5.3,37.1-12.1c26.4,16.2,64,15.9,89.8,0c26.4,16.2,64,15.9,89.8,0c10.9,6.6,23.8,10.9,37,12.1 c4.2,0.4,7.8-3.2,7.8-7.5V89.8C315.3,86.1,312.6,82.6,308.8,82.2L308.8,82.2z M308.8,14.9c-10-1.2-19.7-4.9-27.1-10.7 c-6.6-5.2-16-5.3-22.5,0c-17.7,14.2-50.1,14.2-68.1-0.7c-6.3-5.2-15.4-4.2-21.8,0.8c-17.8,14.1-50,14-67.9-0.8 c-6.3-5.2-15.6-4.2-22,0.9c-7.2,5.7-16.8,9.4-27,10.5c-3.7,0.4-6.4,3.6-6.4,7.3v15.1c0,4.2,3.5,7.8,7.8,7.5 c13.5-1.2,26.2-5.3,37.1-12.1c26.4,16.2,64,15.9,89.8,0c26.4,16.2,64,15.9,89.8,0c10.9,6.6,23.8,10.9,37,12.1 c4.2,0.4,7.8-3.2,7.8-7.5V22.5C315.3,18.8,312.6,15.3,308.8,14.9L308.8,14.9z"/> </svg>',p1meterkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 330.6" style="enable-background:new 0 0 360.3 330.6;" xml:space="preserve" fill="none"> <path fill="currentColor" d="M353.6,215.6c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 c0-5.5,4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,238.6,363,224.1,353.6,215.6z"/> <path fill="currentColor" d="M228.1,56.4h-40.7l15-45.8c1.4-5.3-2.6-10.6-8.2-10.6h-50.8c-4.2,0-7.8,3.1-8.4,7.3l-11.3,84.6 c-0.7,5.1,3.3,9.6,8.4,9.6h41.8l-16.2,68.6c-1.3,5.4,2.8,10.4,8.2,10.4c3,0,5.8-1.6,7.3-4.2l62-107.1 C238.6,63.5,234.6,56.4,228.1,56.4z"/> </svg>',ceilsense:'\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 226.772 226.772">\n<path fill-rule="nonzero" fill="currentColor" d="M 152.335938 185.832031 C 152.058594 185.832031 151.835938 185.605469 151.835938 185.332031 L 151.835938 167.378906 C 151.835938 167.214844 151.914062 167.066406 152.046875 166.972656 L 156.625 163.753906 C 156.742188 163.671875 156.890625 163.644531 157.03125 163.675781 L 160.382812 164.515625 C 160.398438 164.519531 160.414062 164.523438 160.429688 164.527344 L 169.527344 166.804688 C 169.796875 166.871094 169.960938 167.144531 169.890625 167.410156 C 169.824219 167.675781 169.550781 167.839844 169.285156 167.773438 L 160.222656 165.503906 C 160.207031 165.5 160.1875 165.5 160.175781 165.496094 L 157.011719 164.703125 L 152.835938 167.636719 L 152.835938 185.332031 C 152.835938 185.605469 152.609375 185.832031 152.335938 185.832031 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.226562 124.132812 C 52.546875 124.132812 12.945312 104.03125 12.945312 79.328125 C 12.945312 59.148438 39.675781 41.367188 77.953125 36.085938 C 78.230469 36.046875 78.476562 36.238281 78.515625 36.511719 C 78.550781 36.785156 78.363281 37.039062 78.089844 37.074219 C 40.320312 42.285156 13.945312 59.660156 13.945312 79.328125 C 13.945312 103.480469 53.097656 123.132812 101.226562 123.132812 C 149.347656 123.132812 188.5 103.480469 188.5 79.328125 C 188.5 59.589844 162.011719 42.199219 124.085938 37.035156 C 123.8125 36.996094 123.621094 36.746094 123.660156 36.472656 C 123.695312 36.199219 123.953125 36.011719 124.222656 36.046875 C 162.65625 41.277344 189.5 59.074219 189.5 79.328125 C 189.5 104.03125 149.898438 124.132812 101.226562 124.132812 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.148438 103.402344 C 59.601562 103.402344 25.800781 87.953125 25.800781 68.957031 C 25.800781 54.054688 46.566406 40.902344 77.464844 36.234375 C 77.738281 36.199219 77.992188 36.382812 78.035156 36.65625 C 78.074219 36.929688 77.886719 37.183594 77.617188 37.222656 C 47.222656 41.8125 26.800781 54.566406 26.800781 68.957031 C 26.800781 87.402344 60.152344 102.40625 101.148438 102.40625 C 142.148438 102.40625 175.503906 87.402344 175.503906 68.957031 C 175.503906 54.558594 155.078125 41.804688 124.679688 37.222656 C 124.40625 37.183594 124.21875 36.929688 124.257812 36.65625 C 124.300781 36.382812 124.558594 36.199219 124.828125 36.234375 C 155.734375 40.894531 176.5 54.042969 176.5 68.957031 C 176.5 87.953125 142.695312 103.402344 101.148438 103.402344 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.152344 33.855469 C 79.148438 33.855469 61.246094 41.664062 61.246094 51.261719 C 61.246094 60.855469 79.148438 68.664062 101.152344 68.664062 C 123.15625 68.664062 141.058594 60.855469 141.058594 51.261719 C 141.058594 41.664062 123.15625 33.855469 101.152344 33.855469 M 101.152344 69.664062 C 78.59375 69.664062 60.246094 61.410156 60.246094 51.261719 C 60.246094 41.113281 78.59375 32.859375 101.152344 32.859375 C 123.707031 32.859375 142.058594 41.113281 142.058594 51.261719 C 142.058594 61.410156 123.707031 69.664062 101.152344 69.664062 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.15625 78.546875 C 74.402344 78.546875 52.636719 68.5 52.636719 56.152344 C 52.636719 48.917969 60.195312 42.113281 72.859375 37.945312 C 73.121094 37.859375 73.402344 38 73.488281 38.261719 C 73.574219 38.523438 73.433594 38.808594 73.171875 38.894531 C 60.9375 42.921875 53.632812 49.371094 53.632812 56.152344 C 53.632812 67.949219 74.953125 77.550781 101.15625 77.550781 C 127.355469 77.550781 148.667969 67.949219 148.667969 56.152344 C 148.667969 49.371094 141.367188 42.921875 129.132812 38.894531 C 128.871094 38.808594 128.726562 38.523438 128.8125 38.261719 C 128.902344 38 129.183594 37.859375 129.445312 37.945312 C 142.109375 42.113281 149.667969 48.917969 149.667969 56.152344 C 149.667969 68.5 127.90625 78.546875 101.15625 78.546875 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.148438 89.496094 C 73.960938 89.496094 51.847656 79.203125 51.847656 66.550781 C 51.847656 64.417969 52.460938 62.316406 53.675781 60.300781 C 53.820312 60.0625 54.125 59.984375 54.359375 60.128906 C 54.597656 60.269531 54.671875 60.578125 54.53125 60.816406 C 53.414062 62.671875 52.84375 64.605469 52.84375 66.550781 C 52.84375 78.652344 74.511719 88.5 101.148438 88.5 C 127.785156 88.5 149.457031 78.652344 149.457031 66.550781 C 149.457031 64.605469 148.890625 62.671875 147.769531 60.816406 C 147.628906 60.578125 147.707031 60.269531 147.941406 60.128906 C 148.179688 59.988281 148.484375 60.0625 148.628906 60.300781 C 149.84375 62.316406 150.457031 64.421875 150.457031 66.550781 C 150.457031 79.203125 128.335938 89.496094 101.148438 89.496094 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.148438 103.382812 C 64.4375 103.382812 34.574219 89.308594 34.574219 72.003906 C 34.574219 63.339844 41.851562 55.289062 55.066406 49.332031 C 55.320312 49.21875 55.613281 49.332031 55.726562 49.582031 C 55.839844 49.832031 55.730469 50.128906 55.480469 50.242188 C 42.640625 56.027344 35.574219 63.757812 35.574219 72.003906 C 35.574219 88.757812 64.988281 102.382812 101.148438 102.382812 C 137.308594 102.382812 166.730469 88.757812 166.730469 72.003906 C 166.730469 63.800781 159.730469 56.105469 147.023438 50.332031 C 146.773438 50.21875 146.660156 49.921875 146.777344 49.671875 C 146.890625 49.421875 147.1875 49.308594 147.4375 49.421875 C 160.523438 55.367188 167.730469 63.386719 167.730469 72.003906 C 167.730469 89.308594 137.859375 103.382812 101.148438 103.382812 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 70.765625 43.140625 C 68.675781 43.140625 67.222656 43.890625 67.222656 44.570312 C 67.222656 45.246094 68.675781 46 70.765625 46 C 72.851562 46 74.304688 45.246094 74.304688 44.570312 C 74.304688 43.890625 72.851562 43.140625 70.765625 43.140625 M 70.765625 46.5 C 68.5 46.5 66.722656 45.652344 66.722656 44.570312 C 66.722656 43.488281 68.5 42.640625 70.765625 42.640625 C 73.03125 42.640625 74.804688 43.488281 74.804688 44.570312 C 74.804688 45.652344 73.03125 46.5 70.765625 46.5 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 100.878906 121.882812 C 55.847656 121.882812 18.136719 104.917969 13.15625 82.421875 C 13.097656 82.152344 13.265625 81.886719 13.535156 81.828125 C 13.800781 81.765625 14.074219 81.9375 14.132812 82.207031 C 19.011719 104.257812 56.304688 120.886719 100.878906 120.886719 C 149.003906 120.886719 188.160156 101.386719 188.160156 77.417969 C 188.160156 76.386719 188.085938 75.363281 187.945312 74.382812 C 187.90625 74.113281 188.09375 73.859375 188.367188 73.820312 C 188.632812 73.773438 188.894531 73.96875 188.933594 74.242188 C 189.082031 75.269531 189.160156 76.339844 189.160156 77.417969 C 189.160156 101.9375 149.554688 121.882812 100.878906 121.882812 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 141.078125 79.96875 C 140.800781 79.96875 140.578125 79.742188 140.578125 79.46875 L 140.578125 75.242188 C 140.578125 72.984375 140.039062 70.875 139.140625 69.59375 C 138.980469 69.367188 139.035156 69.058594 139.261719 68.898438 C 139.484375 68.742188 139.796875 68.792969 139.957031 69.019531 C 141.417969 71.101562 141.578125 74.0625 141.578125 75.242188 L 141.578125 79.46875 C 141.578125 79.742188 141.351562 79.96875 141.078125 79.96875 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 127.71875 85.871094 C 127.445312 85.871094 127.21875 85.648438 127.21875 85.371094 L 127.21875 80.566406 C 127.21875 78.421875 126.722656 76.367188 125.890625 75.070312 C 125.742188 74.839844 125.808594 74.53125 126.039062 74.382812 C 126.273438 74.234375 126.582031 74.296875 126.730469 74.53125 C 128.074219 76.625 128.21875 79.449219 128.21875 80.566406 L 128.21875 85.371094 C 128.21875 85.648438 127.996094 85.871094 127.71875 85.871094 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 61.226562 79.96875 C 60.953125 79.96875 60.726562 79.742188 60.726562 79.46875 L 60.726562 75.242188 C 60.726562 74.0625 60.886719 71.097656 62.347656 69.019531 C 62.503906 68.792969 62.816406 68.738281 63.042969 68.898438 C 63.269531 69.058594 63.324219 69.367188 63.164062 69.59375 C 62.265625 70.875 61.726562 72.984375 61.726562 75.242188 L 61.726562 79.46875 C 61.726562 79.742188 61.503906 79.96875 61.226562 79.96875 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 74.582031 85.871094 C 74.308594 85.871094 74.082031 85.648438 74.082031 85.371094 L 74.082031 80.566406 C 74.082031 79.449219 74.230469 76.625 75.570312 74.53125 C 75.722656 74.300781 76.03125 74.230469 76.261719 74.382812 C 76.496094 74.53125 76.5625 74.839844 76.414062 75.070312 C 75.582031 76.367188 75.082031 78.421875 75.082031 80.566406 L 75.082031 85.371094 C 75.082031 85.648438 74.859375 85.871094 74.582031 85.871094 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 79.511719 195.695312 C 79.484375 195.695312 79.457031 195.695312 79.429688 195.6875 C 50.789062 190.800781 31.550781 176.945312 31.550781 161.210938 L 31.550781 106.597656 C 31.550781 106.320312 31.773438 106.097656 32.050781 106.097656 C 32.324219 106.097656 32.550781 106.320312 32.550781 106.597656 L 32.550781 161.210938 C 32.550781 176.441406 51.457031 189.902344 79.59375 194.703125 C 79.867188 194.75 80.050781 195.007812 80.003906 195.28125 C 79.960938 195.523438 79.75 195.695312 79.511719 195.695312 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 139.816406 191.414062 C 139.609375 191.414062 139.417969 191.285156 139.34375 191.078125 C 139.257812 190.820312 139.394531 190.535156 139.652344 190.441406 C 144.191406 188.863281 148.359375 187.007812 152.042969 184.925781 C 152.332031 184.707031 152.835938 184.9375 152.835938 185.320312 C 152.835938 185.5 152.738281 185.675781 152.582031 185.765625 C 148.832031 187.890625 144.59375 189.78125 139.980469 191.386719 C 139.925781 191.40625 139.871094 191.414062 139.816406 191.414062 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 169.398438 167.789062 C 169.121094 167.789062 168.898438 167.566406 168.898438 167.289062 L 168.898438 153.621094 C 168.898438 153.347656 169.121094 153.125 169.398438 153.125 C 169.671875 153.125 169.898438 153.347656 169.898438 153.621094 L 169.898438 167.289062 C 169.898438 167.566406 169.671875 167.789062 169.398438 167.789062 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 169.398438 167.789062 C 169.34375 167.789062 169.292969 167.78125 169.242188 167.765625 C 168.976562 167.675781 168.835938 167.394531 168.921875 167.132812 C 169.570312 165.195312 169.898438 163.203125 169.898438 161.214844 L 169.898438 106.601562 C 169.898438 106.324219 170.121094 106.101562 170.398438 106.101562 C 170.671875 106.101562 170.898438 106.324219 170.898438 106.601562 L 170.898438 161.214844 C 170.898438 163.3125 170.550781 165.40625 169.871094 167.445312 C 169.800781 167.65625 169.605469 167.789062 169.398438 167.789062 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 80.011719 173.550781 L 80.011719 189.144531 C 80.363281 187.207031 80.738281 185.386719 81.003906 184.722656 C 81.789062 182.761719 84.886719 180.753906 89.097656 180.835938 C 92.234375 180.914062 96.960938 181.148438 99.78125 181.289062 C 100.824219 181.339844 101.613281 181.378906 101.984375 181.394531 C 104.265625 181.480469 106.085938 181.742188 107.847656 181.996094 C 109.703125 182.265625 111.449219 182.503906 113.488281 182.503906 C 115.808594 182.488281 118.65625 181.875 121.167969 181.332031 C 123.195312 180.894531 124.945312 180.519531 126.105469 180.519531 L 126.316406 180.519531 C 128.746094 180.519531 134.996094 180.488281 139.320312 188.691406 L 139.320312 150.816406 C 138.089844 151.207031 136.960938 151.546875 135.878906 151.851562 C 130.910156 153.269531 125.339844 154.5 119.320312 155.519531 L 119.320312 175.742188 C 119.320312 176.507812 118.75 177.15625 117.996094 177.253906 C 114.625 177.6875 111.191406 177.984375 107.789062 178.144531 C 107.367188 178.179688 106.96875 178.011719 106.667969 177.722656 C 106.367188 177.4375 106.195312 177.035156 106.195312 176.621094 L 106.195312 175.15625 C 104.554688 175.222656 102.882812 175.257812 101.21875 175.257812 C 93.96875 175.257812 86.835938 174.683594 80.011719 173.550781 M 79.511719 195.695312 C 79.5 195.695312 79.488281 195.695312 79.472656 195.695312 C 79.214844 195.675781 79.011719 195.457031 79.011719 195.195312 L 79.011719 172.960938 C 79.011719 172.8125 79.078125 172.671875 79.191406 172.578125 C 79.300781 172.484375 79.449219 172.441406 79.59375 172.464844 C 86.542969 173.65625 93.816406 174.257812 101.21875 174.257812 C 103.042969 174.257812 104.878906 174.21875 106.671875 174.140625 C 106.804688 174.117188 106.941406 174.183594 107.039062 174.277344 C 107.136719 174.371094 107.195312 174.5 107.195312 174.636719 L 107.195312 176.621094 C 107.195312 176.765625 107.25 176.898438 107.355469 177 C 107.460938 177.101562 107.601562 177.144531 107.742188 177.148438 C 111.117188 176.988281 114.523438 176.691406 117.871094 176.265625 C 118.128906 176.230469 118.324219 176.007812 118.324219 175.742188 L 118.324219 155.097656 C 118.324219 154.851562 118.5 154.644531 118.738281 154.605469 C 124.882812 153.578125 130.554688 152.328125 135.609375 150.890625 C 136.867188 150.535156 138.195312 150.132812 139.667969 149.65625 C 139.816406 149.609375 139.988281 149.636719 140.113281 149.726562 C 140.242188 149.824219 140.320312 149.972656 140.320312 150.132812 L 140.320312 190.910156 C 140.320312 191.007812 140.292969 191.097656 140.246094 191.171875 C 140.191406 191.261719 140.113281 191.332031 140.011719 191.375 C 139.753906 191.484375 139.464844 191.363281 139.355469 191.109375 C 135.308594 181.484375 128.765625 181.507812 126.320312 181.515625 L 126.105469 181.519531 C 125.050781 181.519531 123.265625 181.902344 121.378906 182.3125 C 118.820312 182.859375 115.917969 183.488281 113.496094 183.5 C 111.378906 183.492188 109.597656 183.257812 107.703125 182.984375 C 105.96875 182.734375 104.175781 182.480469 101.945312 182.390625 C 101.570312 182.375 100.777344 182.335938 99.734375 182.285156 C 96.914062 182.144531 92.199219 181.914062 89.074219 181.835938 C 84.855469 181.730469 82.457031 183.777344 81.933594 185.09375 C 81.429688 186.351562 80.371094 192.867188 80.003906 195.273438 C 79.96875 195.515625 79.757812 195.695312 79.511719 195.695312 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 129.839844 181.582031 C 129.703125 181.582031 129.589844 181.46875 129.589844 181.332031 L 129.589844 162.238281 C 129.589844 162.101562 129.703125 161.988281 129.839844 161.988281 C 129.980469 161.988281 130.089844 162.101562 130.089844 162.238281 L 130.089844 181.332031 C 130.089844 181.46875 129.980469 181.582031 129.839844 181.582031 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 84.277344 182.550781 C 84.140625 182.550781 84.027344 182.4375 84.027344 182.300781 L 84.027344 173.667969 C 84.027344 173.53125 84.140625 173.417969 84.277344 173.417969 C 84.414062 173.417969 84.527344 173.53125 84.527344 173.667969 L 84.527344 182.300781 C 84.527344 182.4375 84.414062 182.550781 84.277344 182.550781 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 18.488281 60.40625 C 18.429688 60.40625 18.371094 60.398438 18.316406 60.375 C 18.183594 60.328125 18.082031 60.226562 18.027344 60.101562 L 10.996094 43.359375 L 5.683594 41.289062 C 5.386719 41.175781 5.1875 40.894531 5.171875 40.578125 C 5.15625 40.261719 5.328125 39.964844 5.613281 39.824219 L 22.753906 31.183594 C 23.476562 30.820312 24.300781 30.75 25.070312 30.984375 L 30.605469 32.6875 C 30.746094 32.730469 30.859375 32.832031 30.917969 32.964844 L 37.792969 48.742188 C 37.902344 48.992188 37.785156 49.289062 37.53125 49.398438 C 37.277344 49.507812 36.984375 49.390625 36.875 49.140625 L 30.09375 33.574219 L 24.777344 31.941406 C 24.253906 31.78125 23.695312 31.828125 23.203125 32.074219 L 6.453125 40.519531 L 11.558594 42.503906 C 11.683594 42.554688 11.785156 42.652344 11.835938 42.777344 L 18.742188 59.222656 L 21.777344 57.714844 L 17.953125 49.164062 C 17.84375 48.921875 17.941406 48.640625 18.175781 48.519531 L 29.652344 42.4375 C 29.773438 42.371094 29.914062 42.359375 30.046875 42.402344 C 30.175781 42.445312 30.28125 42.542969 30.339844 42.667969 L 34.125 50.820312 C 34.242188 51.066406 34.132812 51.367188 33.882812 51.480469 C 33.632812 51.601562 33.335938 51.488281 33.21875 51.238281 L 29.65625 43.566406 L 19.054688 49.183594 L 22.882812 57.746094 C 22.996094 57.992188 22.890625 58.277344 22.652344 58.398438 L 18.710938 60.355469 C 18.640625 60.390625 18.566406 60.40625 18.488281 60.40625 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 11.375 43.46875 C 11.195312 43.46875 11.019531 43.371094 10.929688 43.199219 C 10.804688 42.953125 10.902344 42.652344 11.148438 42.523438 L 30.230469 32.71875 C 30.476562 32.59375 30.777344 32.691406 30.902344 32.9375 C 31.027344 33.179688 30.933594 33.480469 30.6875 33.609375 L 11.605469 43.414062 C 11.53125 43.453125 11.453125 43.46875 11.375 43.46875 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 32.40625 52.3125 C 32.21875 52.3125 32.039062 52.207031 31.953125 52.023438 L 28.148438 43.769531 C 28.03125 43.515625 28.140625 43.21875 28.390625 43.105469 C 28.644531 42.988281 28.9375 43.097656 29.054688 43.347656 L 32.863281 51.605469 C 32.976562 51.855469 32.867188 52.152344 32.617188 52.269531 C 32.546875 52.300781 32.476562 52.3125 32.40625 52.3125 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 16.902344 60.917969 C 16.707031 60.917969 16.523438 60.804688 16.445312 60.617188 L 9.734375 45.25 L 5.476562 43.425781 C 5.292969 43.347656 5.171875 43.164062 5.171875 42.964844 L 5.171875 40.570312 C 5.171875 40.292969 5.398438 40.070312 5.671875 40.070312 C 5.949219 40.070312 6.171875 40.292969 6.171875 40.570312 L 6.171875 42.636719 L 10.3125 44.410156 C 10.429688 44.460938 10.519531 44.554688 10.574219 44.667969 L 17.179688 59.804688 L 18.335938 59.433594 C 18.597656 59.351562 18.878906 59.492188 18.964844 59.753906 C 19.046875 60.015625 18.902344 60.296875 18.640625 60.382812 L 17.054688 60.894531 C 17.003906 60.910156 16.953125 60.917969 16.902344 60.917969 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 20.738281 62.125 C 20.550781 62.125 20.375 62.019531 20.289062 61.84375 L 19.179688 59.554688 C 19.058594 59.308594 19.164062 59.007812 19.410156 58.886719 C 19.660156 58.769531 19.957031 58.871094 20.078125 59.121094 L 21.1875 61.40625 C 21.308594 61.65625 21.203125 61.957031 20.957031 62.074219 C 20.886719 62.109375 20.8125 62.125 20.738281 62.125 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 21.207031 61.59375 C 21.023438 61.59375 20.84375 61.492188 20.757812 61.3125 L 19.769531 59.265625 C 19.648438 59.015625 19.753906 58.71875 20 58.597656 C 20.25 58.480469 20.546875 58.582031 20.667969 58.832031 L 21.65625 60.878906 C 21.777344 61.128906 21.671875 61.425781 21.425781 61.546875 C 21.355469 61.578125 21.28125 61.59375 21.207031 61.59375 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 220.402344 95.371094 Z M 198.226562 104.019531 L 206.140625 107.429688 C 206.46875 107.574219 206.839844 107.511719 207.109375 107.273438 L 220.300781 95.460938 L 212.8125 92.550781 C 212.503906 92.429688 212.152344 92.484375 211.886719 92.695312 Z M 188.996094 120.066406 C 188.878906 120.066406 188.761719 120.027344 188.667969 119.941406 L 186.921875 118.402344 C 186.726562 118.234375 186.695312 117.945312 186.84375 117.738281 L 196.867188 103.871094 C 196.886719 103.84375 196.90625 103.820312 196.925781 103.800781 C 196.9375 103.789062 196.953125 103.777344 196.96875 103.765625 L 211.257812 91.917969 C 211.808594 91.480469 212.542969 91.367188 213.179688 91.621094 L 220.785156 94.574219 C 221.085938 94.6875 221.300781 94.949219 221.359375 95.273438 C 221.414062 95.59375 221.304688 95.910156 221.0625 96.117188 L 207.773438 108.023438 C 207.214844 108.511719 206.417969 108.636719 205.742188 108.347656 L 197.449219 104.769531 L 187.921875 117.953125 L 189.054688 118.949219 L 191.507812 117.476562 L 196.894531 109.863281 C 196.933594 109.808594 196.980469 109.765625 197.035156 109.730469 L 199.28125 108.300781 C 199.417969 108.214844 199.582031 108.199219 199.730469 108.257812 L 201.359375 108.882812 L 201.679688 108.414062 C 201.835938 108.1875 202.148438 108.128906 202.375 108.285156 C 202.601562 108.441406 202.660156 108.753906 202.503906 108.980469 L 201.957031 109.773438 C 201.828125 109.964844 201.582031 110.039062 201.367188 109.957031 L 199.605469 109.28125 L 197.652344 110.519531 L 192.265625 118.136719 C 192.222656 118.195312 192.171875 118.242188 192.113281 118.277344 L 189.253906 119.996094 C 189.175781 120.042969 189.085938 120.066406 188.996094 120.066406 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 189 120.0625 C 188.898438 120.0625 188.792969 120.035156 188.707031 119.96875 C 188.480469 119.808594 188.433594 119.496094 188.59375 119.273438 L 197.636719 106.710938 C 197.773438 106.523438 198.015625 106.453125 198.234375 106.542969 L 206.472656 109.988281 C 206.652344 110.0625 206.863281 110.027344 207.011719 109.898438 L 220.3125 98.171875 C 220.339844 98.148438 220.355469 98.113281 220.355469 98.074219 L 220.355469 95.578125 C 220.355469 95.300781 220.578125 95.078125 220.855469 95.078125 C 221.132812 95.078125 221.355469 95.300781 221.355469 95.578125 L 221.355469 98.074219 C 221.355469 98.394531 221.21875 98.703125 220.976562 98.917969 L 207.675781 110.644531 C 207.246094 111.027344 206.621094 111.132812 206.089844 110.910156 L 198.21875 107.617188 L 189.402344 119.855469 C 189.304688 119.992188 189.152344 120.0625 189 120.0625 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 206.71875 110.976562 C 206.441406 110.976562 206.21875 110.753906 206.21875 110.476562 L 206.21875 107.988281 C 206.21875 107.710938 206.441406 107.488281 206.71875 107.488281 C 206.992188 107.488281 207.21875 107.710938 207.21875 107.988281 L 207.21875 110.476562 C 207.21875 110.753906 206.992188 110.976562 206.71875 110.976562 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 152.835938 172.527344 C 153.308594 172.734375 153.855469 172.8125 154.402344 172.765625 C 154.753906 172.730469 155.09375 172.640625 155.410156 172.492188 C 156.046875 172.191406 156.554688 171.679688 156.832031 171.050781 C 156.960938 170.773438 157.035156 170.472656 157.0625 170.148438 C 157.070312 170.066406 157.070312 169.996094 157.070312 169.9375 C 157.070312 168.359375 155.730469 167.078125 154.082031 167.078125 C 154.058594 167.082031 153.941406 167.089844 153.914062 167.089844 C 153.800781 167.089844 153.6875 167.097656 153.574219 167.121094 L 152.835938 167.636719 Z M 154.082031 173.78125 C 153.371094 173.78125 152.679688 173.605469 152.089844 173.265625 C 151.933594 173.179688 151.835938 173.011719 151.835938 172.832031 L 151.835938 167.378906 C 151.835938 167.21875 151.914062 167.066406 152.046875 166.972656 L 153.085938 166.242188 C 153.140625 166.203125 153.203125 166.175781 153.265625 166.164062 C 153.480469 166.113281 153.699219 166.089844 153.914062 166.089844 C 153.921875 166.082031 153.996094 166.082031 154.082031 166.082031 C 156.28125 166.082031 158.070312 167.808594 158.070312 169.9375 C 158.070312 170.035156 158.070312 170.148438 158.054688 170.246094 C 158.023438 170.667969 157.917969 171.085938 157.746094 171.464844 C 157.367188 172.304688 156.691406 172.992188 155.835938 173.394531 C 155.417969 173.59375 154.964844 173.714844 154.492188 173.761719 C 154.351562 173.773438 154.21875 173.78125 154.082031 173.78125 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 153.328125 169.792969 C 153.558594 170.113281 153.835938 170.375 154.152344 170.574219 C 154.175781 170.589844 154.207031 170.617188 154.230469 170.636719 C 154.644531 170.898438 155.21875 171.066406 155.820312 171.066406 C 155.886719 171.066406 155.945312 171.066406 155.980469 171.058594 C 156.425781 171.027344 156.765625 170.949219 157.082031 170.800781 C 157.644531 170.550781 158.117188 170.136719 158.40625 169.636719 C 158.671875 169.203125 158.808594 168.714844 158.808594 168.21875 C 158.808594 166.710938 157.613281 165.488281 156.058594 165.367188 L 152.910156 167.585938 C 152.882812 167.703125 152.863281 167.820312 152.851562 167.941406 C 152.84375 168.035156 152.835938 168.128906 152.835938 168.21875 C 152.835938 168.765625 153 169.300781 153.308594 169.773438 C 153.316406 169.777344 153.320312 169.785156 153.328125 169.792969 Z M 155.820312 172.0625 C 155.023438 172.0625 154.261719 171.84375 153.621094 171.421875 C 153.203125 171.15625 152.839844 170.816406 152.539062 170.40625 C 152.527344 170.390625 152.515625 170.375 152.503906 170.355469 C 152.066406 169.714844 151.835938 168.976562 151.835938 168.21875 C 151.835938 168.089844 151.847656 167.960938 151.859375 167.84375 C 151.878906 167.609375 151.925781 167.371094 151.996094 167.136719 C 152.03125 167.027344 152.097656 166.933594 152.1875 166.871094 L 155.625 164.453125 C 155.710938 164.390625 155.835938 164.367188 155.925781 164.363281 C 158.101562 164.417969 159.808594 166.113281 159.808594 168.21875 C 159.808594 168.898438 159.621094 169.566406 159.261719 170.148438 C 158.875 170.820312 158.242188 171.375 157.492188 171.710938 C 157.066406 171.910156 156.597656 172.019531 156.113281 172.042969 C 156.058594 172.0625 155.925781 172.0625 155.820312 172.0625 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 157.378906 170.695312 C 156.742188 170.695312 156.132812 170.550781 155.558594 170.261719 C 154.953125 169.964844 154.433594 169.523438 154.0625 168.980469 C 153.941406 168.8125 153.835938 168.632812 153.753906 168.449219 C 153.519531 167.964844 153.394531 167.421875 153.394531 166.851562 C 153.394531 166.761719 153.394531 166.648438 153.414062 166.535156 C 153.417969 166.402344 153.441406 166.273438 153.460938 166.152344 C 153.484375 166.023438 153.558594 165.90625 153.664062 165.832031 L 155.625 164.453125 C 155.851562 164.292969 156.160156 164.347656 156.320312 164.574219 C 156.480469 164.800781 156.425781 165.113281 156.199219 165.269531 L 154.414062 166.527344 C 154.414062 166.546875 154.414062 166.566406 154.414062 166.589844 C 154.414062 166.628906 154.40625 166.671875 154.398438 166.707031 C 154.394531 166.730469 154.394531 166.804688 154.394531 166.851562 C 154.394531 167.265625 154.484375 167.664062 154.660156 168.027344 C 154.722656 168.164062 154.792969 168.285156 154.878906 168.40625 C 155.160156 168.816406 155.546875 169.144531 156 169.367188 C 156.449219 169.59375 156.925781 169.695312 157.421875 169.695312 C 157.441406 169.695312 157.460938 169.695312 157.480469 169.695312 C 157.933594 169.667969 158.300781 169.585938 158.628906 169.433594 C 159.6875 168.964844 160.367188 167.953125 160.367188 166.851562 C 160.367188 166.324219 160.21875 165.808594 159.933594 165.351562 C 159.914062 165.335938 159.898438 165.3125 159.882812 165.292969 C 159.445312 164.644531 158.75 164.195312 157.972656 164.054688 C 157.699219 164.003906 157.519531 163.746094 157.566406 163.472656 C 157.617188 163.203125 157.878906 163.027344 158.148438 163.070312 C 159.160156 163.253906 160.070312 163.832031 160.660156 164.65625 C 160.683594 164.679688 160.707031 164.707031 160.722656 164.734375 C 161.144531 165.375 161.367188 166.101562 161.367188 166.851562 C 161.367188 168.347656 160.453125 169.71875 159.039062 170.34375 C 158.601562 170.546875 158.109375 170.660156 157.582031 170.683594 C 157.550781 170.695312 157.464844 170.695312 157.378906 170.695312 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 152.835938 168.386719 L 152.835938 174.074219 C 153.234375 174.050781 153.617188 173.953125 153.957031 173.792969 C 154.480469 173.539062 154.910156 173.15625 155.195312 172.683594 C 155.429688 172.308594 155.5625 171.914062 155.59375 171.503906 C 155.601562 171.410156 155.613281 171.316406 155.613281 171.234375 C 155.613281 170.820312 155.519531 170.414062 155.332031 170.035156 C 155.054688 169.464844 154.578125 168.988281 153.988281 168.695312 C 153.628906 168.515625 153.242188 168.410156 152.835938 168.386719 M 152.625 175.082031 C 152.492188 175.082031 152.375 175.078125 152.238281 175.054688 C 152.003906 175.007812 151.835938 174.800781 151.835938 174.5625 L 151.835938 167.898438 C 151.835938 167.765625 151.886719 167.640625 151.980469 167.546875 C 152.066406 167.460938 152.175781 167.414062 152.292969 167.402344 C 152.417969 167.378906 152.53125 167.378906 152.625 167.378906 C 153.269531 167.378906 153.878906 167.523438 154.4375 167.800781 C 155.222656 168.195312 155.859375 168.832031 156.230469 169.597656 C 156.484375 170.113281 156.609375 170.664062 156.609375 171.234375 C 156.609375 171.351562 156.601562 171.480469 156.585938 171.597656 C 156.542969 172.152344 156.363281 172.695312 156.046875 173.207031 C 155.660156 173.839844 155.089844 174.355469 154.390625 174.691406 C 153.855469 174.945312 153.246094 175.082031 152.625 175.082031 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 152.835938 170.628906 L 152.835938 175.109375 C 153.214844 174.824219 153.519531 174.457031 153.722656 174.027344 C 153.835938 173.78125 153.914062 173.507812 153.945312 173.207031 C 153.964844 173.085938 153.972656 172.980469 153.972656 172.875 C 153.972656 172.324219 153.8125 171.785156 153.503906 171.316406 C 153.492188 171.308594 153.484375 171.296875 153.480469 171.289062 C 153.292969 171.03125 153.078125 170.808594 152.835938 170.628906 M 152.335938 176.460938 C 152.238281 176.460938 152.140625 176.429688 152.054688 176.375 C 151.917969 176.28125 151.835938 176.125 151.835938 175.960938 L 151.835938 169.777344 C 151.835938 169.613281 151.917969 169.457031 152.050781 169.363281 C 152.1875 169.273438 152.359375 169.25 152.511719 169.3125 C 152.753906 169.402344 152.976562 169.519531 153.191406 169.660156 C 153.203125 169.667969 153.214844 169.675781 153.222656 169.683594 C 153.625 169.941406 153.976562 170.277344 154.269531 170.675781 C 154.28125 170.691406 154.296875 170.710938 154.308594 170.726562 C 154.742188 171.367188 154.972656 172.109375 154.972656 172.875 C 154.972656 173.027344 154.960938 173.183594 154.9375 173.335938 C 154.894531 173.726562 154.785156 174.109375 154.625 174.453125 C 154.203125 175.347656 153.457031 176.042969 152.523438 176.421875 C 152.464844 176.449219 152.398438 176.460938 152.335938 176.460938 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 152.335938 172.273438 C 152.234375 172.273438 152.136719 172.246094 152.050781 172.183594 C 151.824219 172.027344 151.769531 171.714844 151.925781 171.488281 L 188.417969 119.132812 C 188.578125 118.902344 188.890625 118.851562 189.113281 119.007812 C 189.339844 119.164062 189.398438 119.476562 189.238281 119.703125 L 152.746094 172.0625 C 152.648438 172.199219 152.492188 172.273438 152.335938 172.273438 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 160.65625 166.21875 C 160.558594 166.21875 160.460938 166.191406 160.375 166.132812 C 160.148438 165.976562 160.089844 165.664062 160.246094 165.4375 L 199.214844 108.476562 C 199.371094 108.25 199.683594 108.191406 199.910156 108.347656 C 200.136719 108.503906 200.195312 108.8125 200.039062 109.039062 L 161.070312 166.003906 C 160.972656 166.144531 160.816406 166.21875 160.65625 166.21875 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 152.335938 167.878906 C 152.164062 167.878906 151.996094 167.789062 151.90625 167.632812 C 151.765625 167.394531 151.84375 167.089844 152.082031 166.949219 C 152.105469 166.925781 152.171875 166.882812 152.199219 166.863281 C 153.253906 166.15625 154.371094 165.371094 155.617188 164.457031 C 155.769531 164.359375 155.898438 164.265625 156.015625 164.175781 C 160.769531 160.710938 165.148438 157.042969 169.050781 153.265625 C 169.25 153.074219 169.566406 153.078125 169.757812 153.277344 C 169.949219 153.472656 169.945312 153.789062 169.746094 153.980469 C 165.8125 157.792969 161.394531 161.492188 156.617188 164.976562 C 156.484375 165.078125 156.332031 165.183594 156.183594 165.28125 C 154.949219 166.183594 153.820312 166.980469 152.753906 167.695312 C 152.742188 167.71875 152.648438 167.773438 152.589844 167.808594 C 152.507812 167.855469 152.421875 167.878906 152.335938 167.878906 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 133.378906 154.457031 C 132.59375 154.457031 131.761719 154.757812 131.039062 155.308594 C 130.4375 155.765625 129.984375 156.34375 129.730469 156.988281 C 129.542969 157.445312 129.472656 157.90625 129.527344 158.324219 C 129.5625 158.6875 129.6875 159.015625 129.898438 159.292969 C 130.21875 159.714844 130.703125 159.980469 131.300781 160.0625 C 132.183594 160.179688 133.207031 159.871094 134.042969 159.234375 C 134.96875 158.527344 135.554688 157.488281 135.574219 156.53125 C 135.582031 156.085938 135.476562 155.699219 135.257812 155.378906 C 135.222656 155.3125 135.203125 155.285156 135.183594 155.257812 C 134.863281 154.835938 134.375 154.566406 133.777344 154.484375 C 133.644531 154.46875 133.511719 154.457031 133.378906 154.457031 M 131.695312 160.589844 C 131.539062 160.589844 131.386719 160.578125 131.234375 160.558594 C 130.503906 160.457031 129.902344 160.125 129.5 159.59375 C 129.234375 159.238281 129.074219 158.832031 129.03125 158.378906 C 128.96875 157.886719 129.050781 157.339844 129.269531 156.800781 C 129.554688 156.078125 130.0625 155.421875 130.734375 154.910156 C 131.691406 154.1875 132.820312 153.847656 133.84375 153.988281 C 134.578125 154.089844 135.179688 154.425781 135.582031 154.957031 C 135.617188 155.003906 135.664062 155.066406 135.695312 155.148438 C 135.941406 155.5 136.082031 155.996094 136.070312 156.542969 C 136.050781 157.664062 135.40625 158.820312 134.347656 159.632812 C 133.535156 160.25 132.59375 160.589844 131.695312 160.589844 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 131.171875 159.914062 C 130.484375 159.914062 129.835938 159.710938 129.328125 159.296875 C 129.222656 159.210938 129.207031 159.050781 129.296875 158.945312 C 129.382812 158.839844 129.539062 158.824219 129.648438 158.910156 C 130.582031 159.679688 132.140625 159.5625 133.351562 158.636719 C 134.015625 158.132812 134.488281 157.457031 134.683594 156.722656 C 134.8125 156.273438 134.820312 155.847656 134.703125 155.445312 C 134.636719 155.179688 134.53125 154.957031 134.375 154.75 C 134.316406 154.671875 134.273438 154.621094 134.222656 154.578125 C 134.210938 154.570312 134.203125 154.5625 134.195312 154.550781 C 134.148438 154.507812 134.125 154.445312 134.125 154.378906 C 134.125 154.171875 134.414062 154.066406 134.558594 154.207031 C 134.628906 154.273438 134.699219 154.351562 134.773438 154.449219 C 134.96875 154.707031 135.105469 155 135.1875 155.316406 C 135.324219 155.804688 135.320312 156.324219 135.164062 156.855469 C 134.941406 157.691406 134.40625 158.464844 133.65625 159.03125 C 132.894531 159.617188 132.003906 159.914062 131.171875 159.914062 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 134.921875 156.785156 L 129.277344 158.355469 C 129.21875 157.886719 129.300781 157.386719 129.5 156.894531 L 134.941406 155.378906 C 135.074219 155.828125 135.0625 156.308594 134.921875 156.785156 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 123.285156 156.851562 C 122.492188 156.851562 121.65625 157.15625 120.9375 157.703125 C 120.335938 158.15625 119.882812 158.738281 119.628906 159.382812 C 119.441406 159.839844 119.371094 160.300781 119.425781 160.71875 C 119.460938 161.082031 119.585938 161.40625 119.796875 161.691406 C 120.117188 162.109375 120.601562 162.375 121.203125 162.457031 C 122.09375 162.578125 123.109375 162.269531 123.941406 161.628906 C 124.863281 160.921875 125.453125 159.886719 125.472656 158.925781 C 125.480469 158.484375 125.375 158.09375 125.15625 157.773438 C 125.121094 157.707031 125.101562 157.683594 125.082031 157.652344 C 124.691406 157.136719 124.050781 156.851562 123.285156 156.851562 M 121.59375 162.984375 C 121.4375 162.984375 121.285156 162.972656 121.132812 162.953125 C 120.398438 162.851562 119.800781 162.519531 119.398438 161.988281 C 119.132812 161.632812 118.972656 161.222656 118.929688 160.773438 C 118.867188 160.28125 118.949219 159.734375 119.167969 159.195312 C 119.453125 158.472656 119.960938 157.816406 120.636719 157.304688 C 121.441406 156.691406 122.382812 156.355469 123.285156 156.355469 C 124.210938 156.355469 124.992188 156.707031 125.480469 157.351562 C 125.519531 157.40625 125.5625 157.460938 125.59375 157.539062 C 125.84375 157.894531 125.984375 158.394531 125.96875 158.9375 C 125.949219 160.058594 125.304688 161.214844 124.246094 162.027344 C 123.433594 162.648438 122.492188 162.984375 121.59375 162.984375 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 121.070312 162.3125 C 120.382812 162.3125 119.734375 162.105469 119.230469 161.691406 C 119.121094 161.605469 119.105469 161.449219 119.195312 161.339844 C 119.28125 161.234375 119.4375 161.21875 119.546875 161.304688 C 120.480469 162.074219 122.039062 161.960938 123.25 161.03125 C 123.914062 160.53125 124.382812 159.851562 124.582031 159.117188 C 124.710938 158.667969 124.71875 158.242188 124.601562 157.839844 C 124.535156 157.578125 124.429688 157.351562 124.273438 157.144531 C 124.214844 157.066406 124.167969 157.015625 124.121094 156.972656 C 124.109375 156.964844 124.101562 156.957031 124.09375 156.945312 C 124.046875 156.902344 124.023438 156.839844 124.023438 156.773438 C 124.023438 156.566406 124.3125 156.457031 124.457031 156.605469 C 124.546875 156.683594 124.617188 156.773438 124.671875 156.84375 C 124.867188 157.101562 125.003906 157.394531 125.082031 157.710938 C 125.222656 158.195312 125.21875 158.714844 125.0625 159.25 C 124.835938 160.085938 124.300781 160.863281 123.554688 161.425781 C 122.792969 162.011719 121.902344 162.3125 121.070312 162.3125 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 124.820312 159.179688 L 119.175781 160.75 C 119.117188 160.28125 119.199219 159.78125 119.398438 159.292969 L 124.839844 157.773438 C 124.972656 158.222656 124.960938 158.703125 124.820312 159.179688 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 118.824219 165.519531 C 118.601562 165.519531 118.398438 165.367188 118.34375 165.140625 C 118.273438 164.875 118.4375 164.601562 118.703125 164.535156 L 136.886719 159.945312 L 136.886719 150.894531 C 136.886719 150.617188 137.113281 150.394531 137.386719 150.394531 C 137.664062 150.394531 137.886719 150.617188 137.886719 150.894531 L 137.886719 160.335938 C 137.886719 160.566406 137.730469 160.761719 137.507812 160.820312 L 118.949219 165.503906 C 118.90625 165.515625 118.867188 165.519531 118.824219 165.519531 "/>\n</svg>\n'};function Pe(e){return e?Se[e]??null:null}let Ee=class extends ze{constructor(){super(...arguments),this._config={}}static getConfigElement(){return document.createElement("smarthomeshop-water-card-editor")}static getStubConfig(){return{show_header:!0,show_status:!0,show_water_current:!0,show_water_totals:!0,show_graph:!0,show_meter_reading:!0,show_leak_detection:!0}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_header:!0,show_status:!0,show_water_current:!0,show_water_totals:!0,show_today:!0,show_week:!0,show_month:!0,show_year:!0,show_graph:!0,show_meter_reading:!0,show_leak_detection:!0,_entitiesResolved:!t&&e._entitiesResolved,...e}}_handleClick(e){e&&$e(this,e)}render(){if(!this.hass)return Y;const e=this._getFlowRate(),t=this._getTodayUsage(),i=this._getWeekUsage(),o=this._getMonthUsage(),a=this._getYearUsage(),r=this._hasLeak(),s=this._config._productName||"SmartHomeShop";return V`
      <ha-card>
        <div class="card-content">
          ${!1!==this._config.show_header?this._renderHeader(s,e,r):Y}
          ${!1!==this._config.show_water_current?this._renderFlowDisplay(e):Y}
          ${!1!==this._config.show_water_totals?this._renderStats(t,i,o,a):Y}
          ${this._config.show_graph?this._renderGraph():Y}
          ${this._renderMeterSection()}
          ${!1!==this._config.show_leak_detection?this._renderLeakBar(r):Y}
        </div>
      </ha-card>
    `}_renderHeader(e,t,i){let o,a,r;return i?(o="mdi:alert",a="Leak detected",r="status-alert"):t>0?(o="mdi:water",a="Water flowing",r="status-active"):(o="mdi:check-circle",a="No usage",r="status-ok"),V`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${t>0?"flowing":""}">
            ${Pe("watermeterkit")?ye(Pe("watermeterkit")):V`<ha-icon icon="mdi:water"></ha-icon>`}
          </div>
          <div>
            <h2 class="header-title">${e}</h2>
            <div class="header-subtitle">Water Monitoring</div>
          </div>
        </div>
        ${!1!==this._config.show_status?V`
          <div class="status-badge ${r}">
            <ha-icon icon="${o}"></ha-icon>
            <span>${a}</span>
          </div>
        `:Y}
      </div>
    `}_renderFlowDisplay(e){return V`
      <div
        class="value-display ${e>0?"active":""}"
        @click=${()=>this._handleClick(this._config.flow_entity)}
      >
        <span class="value-big">${ke(e,1)}</span>
        <span class="value-unit">L/min</span>
        <div class="value-label">Current water usage</div>
      </div>
    `}_renderStats(e,t,i,o){const a=!1!==this._config.show_today,r=!1!==this._config.show_week,s=!1!==this._config.show_month,n=!1!==this._config.show_year;return a||r||s||n?V`
      <div class="stats-grid">
        ${a?V`
          <div class="stat-item" @click=${()=>this._handleClick(this._config.today_entity)}>
            <div class="stat-value">${ke(e,0)}<span class="stat-unit">L</span></div>
            <div class="stat-label">Today</div>
          </div>
        `:Y}
        ${r?V`
          <div class="stat-item" @click=${()=>this._handleClick(this._config.week_entity)}>
            <div class="stat-value">${ke(t,0)}<span class="stat-unit">L</span></div>
            <div class="stat-label">Week</div>
          </div>
        `:Y}
        ${s?V`
          <div class="stat-item" @click=${()=>this._handleClick(this._config.month_entity)}>
            <div class="stat-value">
              ${ke(i/1e3,1)}<span class="stat-unit">m³</span>
            </div>
            <div class="stat-label">Month</div>
          </div>
        `:Y}
        ${n?V`
          <div class="stat-item" @click=${()=>this._handleClick(this._config.year_entity)}>
            <div class="stat-value">${ke(o,1)}<span class="stat-unit">m³</span></div>
            <div class="stat-label">Year</div>
          </div>
        `:Y}
      </div>
    `:Y}_renderGraph(){const e=Ce(this._historyData),t=this._getMaxHistoryValue();return V`
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
    `}_renderLeakBar(e){return V`
      <div
        class="info-bar ${e?"alert":""}"
        @click=${()=>this._handleClick(this._config.leak_entity)}
      >
        <div class="info-left">
          <div class="info-icon ${e?"alert":"ok"}">
            <ha-icon icon="${e?"mdi:alert":"mdi:check-circle"}"></ha-icon>
          </div>
          <div>
            <div class="info-text">Leak detection</div>
            <div class="info-subtext">${e?"Possible leak":"No anomalies"}</div>
          </div>
        </div>
        <div class="info-right" aria-hidden="true">
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </div>
      </div>
    `}};Ee.styles=[Me],e([me()],Ee.prototype,"_config",void 0),Ee=e([he("smarthomeshop-water-card")],Ee);const Le="smarthomeshop_debug";let Te=!1;try{Te="1"===localStorage.getItem(Le)}catch{Te=!1}const De=window;function Ae(...e){Te&&console.log("[SmartHomeShop]",...e)}De.__shsDebugSetters=De.__shsDebugSetters||[],De.__shsDebugSetters.push(e=>{Te=e}),De.shsDebug||(De.shsDebug={enable(){try{localStorage.setItem(Le,"1")}catch{}(De.__shsDebugSetters||[]).forEach(e=>e(!0)),console.info("[SmartHomeShop] Debug logging enabled")},disable(){try{localStorage.removeItem(Le)}catch{}(De.__shsDebugSetters||[]).forEach(e=>e(!1)),console.info("[SmartHomeShop] Debug logging disabled")},get enabled(){try{return"1"===localStorage.getItem(Le)}catch{return!1}}});let Ie=class extends ze{constructor(){super(...arguments),this._energyTodayFromStats=null,this._lastStatsUpdate=0,this._config={},this._leakPanelExpanded=!1}static getConfigElement(){return document.createElement("smarthomeshop-waterp1-card-editor")}static getStubConfig(){return{show_header:!0,show_status:!0,show_water:!0,show_water_current:!0,show_water_totals:!0,show_graph:!0,show_meter_reading:!0,show_leak_detection:!0,show_energy:!0,show_energy_current:!0,show_energy_today:!0,show_energy_returned:!0,show_gas_today:!0,has_water_leak_sensor:!1}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_header:!0,show_status:!0,show_graph:!0,show_water:!0,show_water_current:!0,show_water_totals:!0,show_today:!0,show_week:!0,show_month:!0,show_year:!0,show_meter_reading:!0,show_leak_detection:!0,show_energy:!0,show_energy_current:!0,show_energy_today:!0,show_energy_returned:!0,show_gas_today:!0,has_water_leak_sensor:!1,_entitiesResolved:!t&&e._entitiesResolved,...e}}_autoDetectEntities(){super._autoDetectEntities(),this.hass&&(this._config._productName="WaterP1MeterKit",this._config.power_entity||(this._config.power_entity=this._findEntity(["power_consumed","currently_delivered","power_delivered","active_power","vermogen_actueel","stroom_afgenomen"],"sensor",!0)||this._findEntity(["power consumed","vermogen","current power"])),this._config.power_phase_l1_entity||(this._config.power_phase_l1_entity=this._findEntity(["power_consumed_phase_l1","power_phase_l1","phase_1_power","l1_power"],"sensor",!0)),this._config.power_phase_l2_entity||(this._config.power_phase_l2_entity=this._findEntity(["power_consumed_phase_l2","power_phase_l2","phase_2_power","l2_power"],"sensor",!0)),this._config.power_phase_l3_entity||(this._config.power_phase_l3_entity=this._findEntity(["power_consumed_phase_l3","power_phase_l3","phase_3_power","l3_power"],"sensor",!0)),this._config.energy_today_entity||(this._config.energy_today_entity=this._findEntity(["electricity_today","electricity_daily","energy_today"],"sensor",!0)||this._findEntity(["energy_consumed_tariff"],"sensor",!0)||this._findEntity(["energy consumed"])),this._config.gas_entity||(this._config.gas_entity=this._findEntity(["gas_consumed","gas_delivered"],"sensor",!0)||this._findEntity(["gas consumed"])),this._config.leak_score_entity||(this._config.leak_score_entity=this._findEntity(["leak_score","lek_score"],"sensor",!0)),this._config.continuous_flow_entity||(this._config.continuous_flow_entity=this._findEntity(["continuous_flow","continue_flow"],"binary_sensor",!0)),this._config.night_usage_entity||(this._config.night_usage_entity=this._findEntity(["night_usage","nacht_gebruik"],"binary_sensor",!0)),this._config.micro_leak_entity||(this._config.micro_leak_entity=this._findEntity(["micro_leak","micro_lek"],"binary_sensor",!0)),this._config.has_water_leak_sensor&&!this._config.water_leak_sensor_entity&&(this._config.water_leak_sensor_entity=this._findEntity(["water_leak_sensor","water_leak"],"binary_sensor",!0)||this._findEntity(["water leak sensor","leksensor"],"binary_sensor")))}_handleClick(e){e&&$e(this,e)}_getTotalPower(){const e=xe(this.hass,this._config.power_entity),t=e?.attributes?.unit_of_measurement||"W";let i=we(this.hass,this._config.power_entity);if("kw"===t.toLowerCase()&&(i*=1e3),i>0)return i;const o=e=>{const t=xe(this.hass,e),i=t?.attributes?.unit_of_measurement||"W";let o=we(this.hass,e);return"kw"===i.toLowerCase()&&(o*=1e3),o},a=o(this._config.power_phase_l1_entity),r=o(this._config.power_phase_l2_entity),s=o(this._config.power_phase_l3_entity);return a>0||r>0||s>0?a+r+s:i}_isHardwareLeakSensorWet(){if(!this._config.has_water_leak_sensor||!this._config.water_leak_sensor_entity||!this.hass)return!1;const e=xe(this.hass,this._config.water_leak_sensor_entity);return"on"===e?.state}_getLeakScore(){return we(this.hass,this._config.leak_score_entity)}_isContinuousFlow(){return"on"===xe(this.hass,this._config.continuous_flow_entity)?.state}_isNightUsage(){return"on"===xe(this.hass,this._config.night_usage_entity)?.state}_isMicroLeak(){return"on"===xe(this.hass,this._config.micro_leak_entity)?.state}async _fetchEnergyStatistics(){if(!this.hass)return;const e=Date.now();if(e-this._lastStatsUpdate<6e4&&null!==this._energyTodayFromStats)return;const t=this._findUtilityMeterEntity("energy_daily_t1"),i=this._findUtilityMeterEntity("energy_daily_t2");if(t||i){const o=we(this.hass,t),a=we(this.hass,i);return this._energyTodayFromStats=o+a,this._lastStatsUpdate=e,void Ae("WaterP1 Card: Energy today from Utility Meters (CC):",o,"+",a,"=",this._energyTodayFromStats,"kWh")}const o=this._findEntity(["energy_consumed_tariff_1"],"sensor",!0),a=this._findEntity(["energy_consumed_tariff_2"],"sensor",!0);if(!o&&!a)return void Ae("WaterP1 Card: No tariff entities found for statistics");const r=[o,a].filter(Boolean);try{const t=new Date;t.setHours(0,0,0,0);const i=t.toISOString(),o=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:i,statistic_ids:r,period:"day",types:["change"]});let a=0;for(const e of r){const t=o[e];if(t&&t.length>0)for(const e of t)void 0!==e.change&&(a+=e.change)}this._energyTodayFromStats=a,this._lastStatsUpdate=e,Ae("WaterP1 Card: Energy today from Statistics API:",a,"kWh")}catch(e){console.warn("WaterP1 Card: Failed to fetch energy statistics:",e)}}_findUtilityMeterEntity(e){if(!this.hass)return;const t=this._config.device_id;if(!t)return;const i=t.match(/([a-f0-9]{6})/i),o=i?i[1].toLowerCase():"";if(!o)return;const a=`sensor.waterp1_${o}_${e}`;if(this.hass.states[a])return a;for(const t of Object.keys(this.hass.states))if(t.includes(o)&&t.endsWith(e))return t}_getEnergyToday(){if(null!==this._energyTodayFromStats&&this._energyTodayFromStats>0)return this._energyTodayFromStats;const e=we(this.hass,this._config.energy_today_entity);return e<.5&&null===this._energyTodayFromStats&&this._fetchEnergyStatistics(),this._energyTodayFromStats??e}_getGasToday(){const e=this._findUtilityMeterEntity("gas_daily");return e?we(this.hass,e):0}firstUpdated(e){super.firstUpdated(e),this._fetchEnergyStatistics()}updated(e){super.updated(e),e.has("hass")&&this._fetchEnergyStatistics()}_getOfflineInfo(){const e=this._config.device_id;if(!this.hass||!e)return{offline:!1,lastSeen:null};const t=this.hass.entities||{};let i=!1,o=null,a=null;for(const[r,s]of Object.entries(t)){if(s.device_id!==e)continue;if("esphome"!==s.platform)continue;if(!r.startsWith("sensor.")&&!r.startsWith("binary_sensor."))continue;const t=this.hass.states[r];if(!t)continue;if("connectivity"===t.attributes?.device_class){if("on"===t.state)return{offline:!1,lastSeen:null};"off"===t.state&&(a=t.last_changed??null);continue}if(i=!0,"unavailable"!==t.state)return{offline:!1,lastSeen:null};const n=t.last_changed;n&&(!o||n>o)&&(o=n)}return a?{offline:!0,lastSeen:a}:{offline:i,lastSeen:o}}render(){if(!this.hass)return Y;const e=this._getOfflineInfo();if(e.offline)return V`
        <ha-card>
          <div class="card-content">
            <div class="header">
              <div class="header-left">
                <div class="header-icon">${Pe("waterp1meterkit")?ye(Pe("waterp1meterkit")):V`<ha-icon icon="mdi:water-flash"></ha-icon>`}</div>
                <div><h2 class="header-title">WaterP1MeterKit</h2><div class="header-subtitle">Water + Energy</div></div>
              </div>
              <div class="status-badge status-alert"><ha-icon icon="mdi:lan-disconnect"></ha-icon><span>Offline</span></div>
            </div>
            <div class="offline-state">
              <ha-icon icon="mdi:lan-disconnect"></ha-icon>
              <div class="offline-title">Device offline</div>
              <div class="offline-sub">
                ${e.lastSeen?`Last seen ${be(e.lastSeen)}`:"Waiting for the device to reconnect"}
              </div>
              <div class="offline-hint">Check the power supply and Wi-Fi connection.</div>
            </div>
          </div>
        </ha-card>
      `;const t=this._getFlowRate(),i=this._getTodayUsage(),o=this._getWeekUsage(),a=this._getMonthUsage(),r=this._getYearUsage(),s=this._hasLeak(),n=this._getLeakScore(),c=this._isContinuousFlow(),l=this._isNightUsage(),d=this._isMicroLeak(),h=!0===this._config.has_water_leak_sensor,p=this._isHardwareLeakSensorWet(),u=this._getTotalPower(),g=this._getEnergyToday(),m=this._getGasToday(),f=!1!==this._config.show_water&&this._hasVisibleWaterContent(),v=!1!==this._config.show_energy&&this._hasVisibleEnergyContent();return V`
      <ha-card>
        <div class="card-content">
          ${p?this._renderHardwareLeakAlert():Y}
          ${!1!==this._config.show_header?this._renderHeader(t,u,s,p):Y}
          ${f?V`
            <div class="water-section">
              ${this._renderWaterSection(t,i,o,a,r)}
              ${!1!==this._config.show_leak_detection?this._renderLeakDetectionPanel(s,n,c,l,d,h,p):Y}
            </div>
          `:Y}
          ${f&&v?V`<div class="section-divider"></div>`:Y}
          ${v?V`<div class="energy-section">${this._renderEnergySection(u,g,m)}</div>`:Y}
        </div>
      </ha-card>
    `}_renderHardwareLeakAlert(){return V`
      <div class="hardware-leak-alert" @click=${()=>this._handleClick(this._config.water_leak_sensor_entity)}>
        <div class="alert-icon"><ha-icon icon="mdi:water-alert"></ha-icon></div>
        <div class="alert-content">
          <div class="alert-title">⚠️ Water Leak Detected!</div>
          <div class="alert-message">The leak sensor detected water. Check immediately!</div>
        </div>
        <div class="alert-badge">WET</div>
      </div>
    `}_renderHeader(e,t,i,o){let a="mdi:check-circle",r="All normal",s="status-ok";return o?(a="mdi:water-alert",r="WATER LEAK!",s="status-alert"):i?(a="mdi:alert",r="Leak detected",s="status-alert"):(e>0||t>100)&&(a=e>0?"mdi:water":"mdi:flash",r=e>0?"Water flowing":"Energy active",s="status-active"),V`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${e>0||t>100?"flowing":""}">${Pe("waterp1meterkit")?ye(Pe("waterp1meterkit")):V`<ha-icon icon="mdi:water-flash"></ha-icon>`}</div>
          <div><h2 class="header-title">WaterP1MeterKit</h2><div class="header-subtitle">Water + Energy</div></div>
        </div>
        ${!1!==this._config.show_status?V`
          <div class="status-badge ${s}"><ha-icon icon="${a}"></ha-icon><span>${r}</span></div>
        `:Y}
      </div>
    `}_hasVisibleWaterContent(){const e=!1!==this._config.show_water_totals&&[this._config.show_today,this._config.show_week,this._config.show_month,this._config.show_year].some(e=>!1!==e);return!1!==this._config.show_water_current||e||!1!==this._config.show_graph||!1!==this._config.show_meter_reading||!1!==this._config.show_leak_detection}_hasVisibleEnergyContent(){return!1!==this._config.show_energy_current||!1!==this._config.show_energy_today||!1!==this._config.show_energy_returned||!1!==this._config.show_gas_today}_renderWaterSection(e,t,i,o,a){const r=Ce(this._historyData),s=this._getMaxHistoryValue(),n=!1!==this._config.show_today,c=!1!==this._config.show_week,l=!1!==this._config.show_month,d=!1!==this._config.show_year,h=!1!==this._config.show_water_totals&&(n||c||l||d);return V`
      <div class="section-header water"><ha-icon icon="mdi:water"></ha-icon> Water</div>
      ${!1!==this._config.show_water_current?V`
        <div class="value-display ${e>0?"active":""}" @click=${()=>this._handleClick(this._config.flow_entity)}>
          <span class="value-big">${ke(e,1)}</span><span class="value-unit">L/min</span>
          <div class="value-label">Current water usage</div>
        </div>
      `:Y}
      ${h?V`
        <div class="stats-grid">
          ${n?V`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.today_entity)}><div class="stat-value">${ke(t,0)}<span class="stat-unit">L</span></div><div class="stat-label">Today</div></div>
          `:Y}
          ${c?V`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.week_entity)}><div class="stat-value">${ke(i,0)}<span class="stat-unit">L</span></div><div class="stat-label">Week</div></div>
          `:Y}
          ${l?V`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.month_entity)}><div class="stat-value">${ke(o/1e3,1)}<span class="stat-unit">m³</span></div><div class="stat-label">Month</div></div>
          `:Y}
          ${d?V`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.year_entity)}><div class="stat-value">${ke(a,1)}<span class="stat-unit">m³</span></div><div class="stat-label">Year</div></div>
          `:Y}
        </div>
      `:Y}
      ${this._config.show_graph?V`
        <div class="graph-section" @click=${()=>this._handleClick(this._config.flow_entity)}>
          <div class="graph-header"><span class="graph-title">Water last 24 hours</span><span class="graph-max">${this._historyData?`max: ${ke(s,1)} L/min`:""}</span></div>
          <svg class="sparkline" viewBox="0 0 300 55" preserveAspectRatio="none">
            <defs><linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="var(--info-color)" stop-opacity="0.3"/><stop offset="100%" stop-color="var(--info-color)" stop-opacity="0.02"/></linearGradient></defs>
            <path class="sparkline-fill" d="${r} L 300 55 L 0 55 Z" style="fill: url(#waterGradient);"/>
            <path class="sparkline-line" d="${r}" style="stroke: var(--info-color);"/>
          </svg>
          <div class="graph-labels"><span>-24h</span><span>-18h</span><span>-12h</span><span>-6h</span><span>Now</span></div>
        </div>
      `:Y}
      ${this._renderMeterSection()}
    `}_renderLeakDetectionPanel(e,t,i,o,a,r,s){const n=[i,o,a,s].filter(Boolean).length;let c="ok",l="mdi:shield-check",d="No anomalies";return s?(c="alert",l="mdi:water-alert",d="Water leak detected!"):e||t>=50?(c="alert",l="mdi:alert-circle",d=`${n} issue${1!==n?"s":""} detected`):(t>0||n>0)&&(c="warning",l="mdi:alert",d="Monitoring activity"),V`
      <div class="leak-panel">
        <div class="leak-panel-header" @click=${()=>this._leakPanelExpanded=!this._leakPanelExpanded}>
          <div class="header-icon ${c}"><ha-icon icon="${l}"></ha-icon></div>
          <div class="header-content"><div class="header-title">Leak Detection</div><div class="header-subtitle">${d}</div></div>
          <ha-icon
            class="expand-icon"
            icon=${this._leakPanelExpanded?"mdi:chevron-up":"mdi:chevron-down"}
          ></ha-icon>
        </div>
        ${this._leakPanelExpanded?V`
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
            ${r?V`
              <div class="leak-detail-row hardware ${s?"wet":""}" @click=${()=>this._handleClick(this._config.water_leak_sensor_entity)}>
                <div class="detail-icon"><ha-icon icon="mdi:water-pump"></ha-icon></div>
                <div class="detail-info"><div class="detail-name">Hardware leak sensor</div><div class="detail-desc">Physical water detection (V3)</div></div>
                <div class="detail-status ${s?"active":"ok"}">${s?"WET!":"DRY"}</div>
              </div>
            `:Y}
            ${t>0?V`
              <div class="leak-detail-row" @click=${()=>this._handleClick(this._config.leak_score_entity)}>
                <div class="detail-icon ${t>=50?"active":""}"><ha-icon icon="mdi:gauge"></ha-icon></div>
                <div class="detail-info"><div class="detail-name">Leak score</div><div class="detail-desc">Overall risk assessment</div></div>
                <div class="detail-status ${t>=50?"active":"ok"}">${t}%</div>
              </div>
            `:Y}
          </div>
        `:Y}
      </div>
    `}_renderEnergySection(e,t,i){const o=this._getPowerReturned(),a=this._getEnergyReturnedToday(),r=o>0||a>0,s=!1!==this._config.show_energy_current,n=!1!==this._config.show_energy_today,c=!1!==this._config.show_energy_returned&&r,l=!1!==this._config.show_gas_today,d=n||c||l;return V`
      <div class="section-header energy"><ha-icon icon="mdi:flash"></ha-icon> Energy</div>
      ${s||c?V`
        <div class="dual-power">
          ${s?V`
            <div class="value-display ${e>100?"active":""}" @click=${()=>this._handleClick(this._config.power_entity)}>
              <span class="value-big">${ke(e,0)}</span><span class="value-unit">W</span>
              <div class="value-label">${r?"Usage":"Current usage"}</div>
            </div>
          `:Y}
          ${c?V`
            <div class="value-display solar ${o>0?"active":""}" @click=${()=>this._handleClick(this._config.power_returned_entity)}>
              <span class="value-big">${ke(o,0)}</span><span class="value-unit">W</span>
              <div class="value-label">Returned</div>
            </div>
          `:Y}
        </div>
      `:Y}
      ${d?V`
        <div class="stats-grid">
          ${n?V`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.energy_today_entity)}><div class="stat-value">${ke(t,2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Electricity today</div></div>
          `:Y}
          ${c?V`
            <div class="stat-item solar" @click=${()=>this._handleClick(this._config.energy_returned_entity)}><div class="stat-value">${ke(a,2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Returned today</div></div>
          `:Y}
          ${l?V`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.gas_entity)}><div class="stat-value">${ke(i,2)}<span class="stat-unit">m³</span></div><div class="stat-label">Gas today</div></div>
          `:Y}
        </div>
      `:Y}
    `}_getPowerReturned(){return this._config.power_returned_entity||(this._config.power_returned_entity=this._findEntity(["power_returned","power_delivered_to_grid","power_export"],"sensor",!0)),we(this.hass,this._config.power_returned_entity)}_getEnergyReturnedToday(){const e=this._findUtilityMeterEntity("energy_returned_daily_t1"),t=this._findUtilityMeterEntity("energy_returned_daily_t2");return e||t?we(this.hass,e)+we(this.hass,t):(this._config.energy_returned_entity||(this._config.energy_returned_entity=this._findEntity(["energy_returned_tariff_1","energy_returned_tariff_2","energy_returned","energy_delivered","energy_export"],"sensor",!0)),0)}};Ie.styles=[Me,s`
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
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
        background: color-mix(in srgb, var(--warning-color) 8%, var(--shs-surface));
        border-color: color-mix(in srgb, var(--warning-color) 28%, var(--divider-color));
      }
      .dual-power .value-display.solar::before {
        background: var(--warning-color);
      }
      .dual-power .value-display.solar .value-big,
      .dual-power .value-display.solar .value-unit {
        color: var(--warning-color);
      }

      /* Solar stat item styling */
      .stat-item.solar {
        background: color-mix(in srgb, var(--warning-color) 8%, var(--shs-surface));
        border-color: color-mix(in srgb, var(--warning-color) 28%, var(--divider-color));
      }
      .stat-item.solar .stat-value {
        color: var(--warning-color);
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
        background: color-mix(in srgb, var(--error-color) 14%, var(--card-background-color));
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        border: 1px solid color-mix(in srgb, var(--error-color) 45%, var(--divider-color));
      }

      .hardware-leak-alert .alert-icon {
        width: 40px;
        height: 40px;
        flex: 0 0 40px;
        background: color-mix(in srgb, var(--error-color) 18%, transparent);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .hardware-leak-alert .alert-icon ha-icon { --mdc-icon-size: 24px; color: var(--error-color); }
      .hardware-leak-alert .alert-content { flex: 1; }
      .hardware-leak-alert .alert-title { font-size: 14px; font-weight: 700; color: var(--error-color); margin-bottom: 3px; }
      .hardware-leak-alert .alert-message { font-size: 12px; color: var(--primary-text-color); }
      .hardware-leak-alert .alert-badge { background: var(--error-color); color: var(--text-primary-color); padding: 5px 9px; border-radius: 12px; font-size: 11px; font-weight: 700; }

      .leak-panel {
        background: var(--card-background-color);
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
      .leak-panel-header .expand-icon {
        --mdc-icon-size: 20px;
        color: var(--secondary-text-color);
      }

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

      @container (max-width: 430px) {
        .dual-power {
          gap: 8px;
        }

        .dual-power .value-display {
          padding: 14px 10px;
        }

        .dual-power .value-display .value-big {
          font-size: 24px;
        }

        .hardware-leak-alert {
          align-items: flex-start;
        }
      }

    `],e([me()],Ie.prototype,"_energyTodayFromStats",void 0),e([me()],Ie.prototype,"_lastStatsUpdate",void 0),e([me()],Ie.prototype,"_config",void 0),e([me()],Ie.prototype,"_leakPanelExpanded",void 0),Ie=e([he("smarthomeshop-waterp1-card")],Ie);const We={common:{loading:"Loading...",error:"Error",unknown:"Unknown",today:"Today",week:"Week",month:"Month",year:"Year",daily:"Daily",weekly:"Weekly",monthly:"Monthly",yearly:"Yearly",current:"Current",total:"Total",temperature:"Temperature",humidity:"Humidity",settings:"Settings",save:"Save",cancel:"Cancel",close:"Close",edit:"Edit",delete:"Delete",add:"Add",name:"Name",value:"Value",unit:"Unit",active:"Active",inactive:"Inactive",on:"On",off:"Off",yes:"Yes",no:"No",show:"Show",hide:"Hide"},waterflowkit:{title:"WaterFlowKit",subtitle:"Dual flow monitoring",pipe1:"Pipe 1",pipe2:"Pipe 2",currentFlow:"Current flow",totalConsumption:"Total consumption",flowRate:"Flow rate",perHour:"per hour",noFlow:"No flow",flowing:"Flowing",waterTemperature:"Water temperature",showPipe1:"Show Pipe 1",showPipe2:"Show Pipe 2",showTemperature:"Show temperature",pipe1Name:"Pipe 1 name",pipe2Name:"Pipe 2 name"},waterp1:{title:"WaterP1MeterKit",water:"Water",energy:"Energy",energyActive:"Energy active",currentUsage:"Current water usage",leakDetection:"Leak Detection",monitoringActivity:"Monitoring activity",meter:"Meter",currentPower:"Current power",electricityToday:"Electricity today",gasToday:"Gas today",waterLast24h:"Water last 24 hours",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Water usage",dailyUsage:"Daily usage",weeklyUsage:"Weekly usage",monthlyUsage:"Monthly usage",yearlyUsage:"Yearly usage",calibration:"Calibration",lastCalibration:"Last calibration",sinceLast:"since calibration"},ultimatesensor:{title:"UltimateSensor",roomScore:"Room Score",excellent:"Excellent",good:"Good",moderate:"Moderate",poor:"Poor",unhealthy:"Unhealthy",hazardous:"Hazardous",presence:"Presence",detected:"Detected",notDetected:"Not detected",targets:"Targets",co2Level:"CO₂ level",vocIndex:"VOC index",noxIndex:"NOx index",illuminance:"Illuminance",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radar view",roomView:"Room view",view2D:"2D",view3D:"3D",zoneOccupancy:"Zone occupancy",zone:"Zone",recommendations:"Recommendations",ventilateNow:"Ventilate now!",openWindow:"Open a window",airQualityPoor:"Air quality is poor",tooHumid:"Too humid",tooDry:"Too dry",tooCold:"Too cold",tooWarm:"Too warm"},editor:{deviceId:"Device ID",selectDevice:"Select device",appearance:"Appearance",showGraph:"Show graph",showWater:"Show water",showEnergy:"Show energy",graphType:"Graph type",historyGraph:"History graph",liveGraph:"Live graph",displayOptions:"Display options"}},Ne={en:We,nl:{common:{loading:"Laden...",error:"Fout",unknown:"Onbekend",today:"Vandaag",week:"Week",month:"Maand",year:"Jaar",daily:"Dagelijks",weekly:"Wekelijks",monthly:"Maandelijks",yearly:"Jaarlijks",current:"Huidig",total:"Totaal",temperature:"Temperatuur",humidity:"Luchtvochtigheid",settings:"Instellingen",save:"Opslaan",cancel:"Annuleren",close:"Sluiten",edit:"Bewerken",delete:"Verwijderen",add:"Toevoegen",name:"Naam",value:"Waarde",unit:"Eenheid",active:"Actief",inactive:"Inactief",on:"Aan",off:"Uit",yes:"Ja",no:"Nee",show:"Tonen",hide:"Verbergen"},waterflowkit:{title:"WaterFlowKit",subtitle:"Dubbele flowmeting",pipe1:"Leiding 1",pipe2:"Leiding 2",currentFlow:"Huidige flow",totalConsumption:"Totaal verbruik",flowRate:"Debiet",perHour:"per uur",noFlow:"Geen flow",flowing:"Stromend",waterTemperature:"Watertemperatuur",showPipe1:"Toon leiding 1",showPipe2:"Toon leiding 2",showTemperature:"Toon temperatuur",pipe1Name:"Naam leiding 1",pipe2Name:"Naam leiding 2"},waterp1:{title:"WaterP1MeterKit",water:"Water",energy:"Energie",energyActive:"Energie actief",currentUsage:"Huidig waterverbruik",leakDetection:"Lekdetectie",monitoringActivity:"Bewakingsactiviteit",meter:"Meter",currentPower:"Huidig vermogen",electricityToday:"Stroom vandaag",gasToday:"Gas vandaag",waterLast24h:"Water laatste 24 uur",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Waterverbruik",dailyUsage:"Dagelijks verbruik",weeklyUsage:"Wekelijks verbruik",monthlyUsage:"Maandelijks verbruik",yearlyUsage:"Jaarlijks verbruik",calibration:"Kalibratie",lastCalibration:"Laatste kalibratie",sinceLast:"sinds kalibratie"},ultimatesensor:{title:"UltimateSensor",roomScore:"Kamerscore",excellent:"Uitstekend",good:"Goed",moderate:"Matig",poor:"Slecht",unhealthy:"Ongezond",hazardous:"Gevaarlijk",presence:"Aanwezigheid",detected:"Gedetecteerd",notDetected:"Niet gedetecteerd",targets:"Doelen",co2Level:"CO₂-niveau",vocIndex:"VOC-index",noxIndex:"NOx-index",illuminance:"Verlichtingssterkte",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radarweergave",roomView:"Kamerweergave",view2D:"2D",view3D:"3D",zoneOccupancy:"Zone bezetting",zone:"Zone",recommendations:"Aanbevelingen",ventilateNow:"Ventileer nu!",openWindow:"Open een raam",airQualityPoor:"Luchtkwaliteit is slecht",tooHumid:"Te vochtig",tooDry:"Te droog",tooCold:"Te koud",tooWarm:"Te warm"},editor:{deviceId:"Apparaat-ID",selectDevice:"Selecteer apparaat",appearance:"Uiterlijk",showGraph:"Toon grafiek",showWater:"Toon water",showEnergy:"Toon energie",graphType:"Grafiektype",historyGraph:"Historiegrafiek",liveGraph:"Live grafiek",displayOptions:"Weergaveopties"}},de:{common:{loading:"Laden...",error:"Fehler",unknown:"Unbekannt",today:"Heute",week:"Woche",month:"Monat",year:"Jahr",daily:"Täglich",weekly:"Wöchentlich",monthly:"Monatlich",yearly:"Jährlich",current:"Aktuell",total:"Gesamt",temperature:"Temperatur",humidity:"Luftfeuchtigkeit",settings:"Einstellungen",save:"Speichern",cancel:"Abbrechen",close:"Schließen",edit:"Bearbeiten",delete:"Löschen",add:"Hinzufügen",name:"Name",value:"Wert",unit:"Einheit",active:"Aktiv",inactive:"Inaktiv",on:"An",off:"Aus",yes:"Ja",no:"Nein",show:"Anzeigen",hide:"Ausblenden"},waterflowkit:{title:"WaterFlowKit",subtitle:"Doppelte Durchflussmessung",pipe1:"Leitung 1",pipe2:"Leitung 2",currentFlow:"Aktueller Durchfluss",totalConsumption:"Gesamtverbrauch",flowRate:"Durchflussrate",perHour:"pro Stunde",noFlow:"Kein Durchfluss",flowing:"Fließend",waterTemperature:"Wassertemperatur",showPipe1:"Leitung 1 anzeigen",showPipe2:"Leitung 2 anzeigen",showTemperature:"Temperatur anzeigen",pipe1Name:"Name Leitung 1",pipe2Name:"Name Leitung 2"},waterp1:{title:"WaterP1MeterKit",water:"Wasser",energy:"Energie",energyActive:"Energie aktiv",currentUsage:"Aktueller Wasserverbrauch",leakDetection:"Leckerkennung",monitoringActivity:"Überwachungsaktivität",meter:"Zähler",currentPower:"Aktuelle Leistung",electricityToday:"Strom heute",gasToday:"Gas heute",waterLast24h:"Wasser letzte 24 Stunden",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Wasserverbrauch",dailyUsage:"Täglicher Verbrauch",weeklyUsage:"Wöchentlicher Verbrauch",monthlyUsage:"Monatlicher Verbrauch",yearlyUsage:"Jährlicher Verbrauch",calibration:"Kalibrierung",lastCalibration:"Letzte Kalibrierung",sinceLast:"seit Kalibrierung"},ultimatesensor:{title:"UltimateSensor",roomScore:"Raumbewertung",excellent:"Ausgezeichnet",good:"Gut",moderate:"Mäßig",poor:"Schlecht",unhealthy:"Ungesund",hazardous:"Gefährlich",presence:"Anwesenheit",detected:"Erkannt",notDetected:"Nicht erkannt",targets:"Ziele",co2Level:"CO₂-Niveau",vocIndex:"VOC-Index",noxIndex:"NOx-Index",illuminance:"Beleuchtungsstärke",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radaransicht",roomView:"Raumansicht",view2D:"2D",view3D:"3D",zoneOccupancy:"Zonenbelegung",zone:"Zone",recommendations:"Empfehlungen",ventilateNow:"Jetzt lüften!",openWindow:"Öffnen Sie ein Fenster",airQualityPoor:"Luftqualität ist schlecht",tooHumid:"Zu feucht",tooDry:"Zu trocken",tooCold:"Zu kalt",tooWarm:"Zu warm"},editor:{deviceId:"Geräte-ID",selectDevice:"Gerät auswählen",appearance:"Erscheinungsbild",showGraph:"Diagramm anzeigen",showWater:"Wasser anzeigen",showEnergy:"Energie anzeigen",graphType:"Diagrammtyp",historyGraph:"Verlaufsdiagramm",liveGraph:"Live-Diagramm",displayOptions:"Anzeigeoptionen"}},fr:{common:{loading:"Chargement...",error:"Erreur",unknown:"Inconnu",today:"Aujourd'hui",week:"Semaine",month:"Mois",year:"Année",daily:"Quotidien",weekly:"Hebdomadaire",monthly:"Mensuel",yearly:"Annuel",current:"Actuel",total:"Total",temperature:"Température",humidity:"Humidité",settings:"Paramètres",save:"Enregistrer",cancel:"Annuler",close:"Fermer",edit:"Modifier",delete:"Supprimer",add:"Ajouter",name:"Nom",value:"Valeur",unit:"Unité",active:"Actif",inactive:"Inactif",on:"Activé",off:"Désactivé",yes:"Oui",no:"Non",show:"Afficher",hide:"Masquer"},waterflowkit:{title:"WaterFlowKit",subtitle:"Double mesure de débit",pipe1:"Conduite 1",pipe2:"Conduite 2",currentFlow:"Débit actuel",totalConsumption:"Consommation totale",flowRate:"Débit",perHour:"par heure",noFlow:"Pas de débit",flowing:"En cours",waterTemperature:"Température de l'eau",showPipe1:"Afficher conduite 1",showPipe2:"Afficher conduite 2",showTemperature:"Afficher température",pipe1Name:"Nom conduite 1",pipe2Name:"Nom conduite 2"},waterp1:{title:"WaterP1MeterKit",water:"Eau",energy:"Énergie",energyActive:"Énergie active",currentUsage:"Consommation d'eau actuelle",leakDetection:"Détection de fuite",monitoringActivity:"Activité de surveillance",meter:"Compteur",currentPower:"Puissance actuelle",electricityToday:"Électricité aujourd'hui",gasToday:"Gaz aujourd'hui",waterLast24h:"Eau dernières 24 heures",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Consommation d'eau",dailyUsage:"Consommation quotidienne",weeklyUsage:"Consommation hebdomadaire",monthlyUsage:"Consommation mensuelle",yearlyUsage:"Consommation annuelle",calibration:"Calibration",lastCalibration:"Dernière calibration",sinceLast:"depuis calibration"},ultimatesensor:{title:"UltimateSensor",roomScore:"Score de la pièce",excellent:"Excellent",good:"Bon",moderate:"Modéré",poor:"Mauvais",unhealthy:"Malsain",hazardous:"Dangereux",presence:"Présence",detected:"Détectée",notDetected:"Non détectée",targets:"Cibles",co2Level:"Niveau de CO₂",vocIndex:"Indice COV",noxIndex:"Indice NOx",illuminance:"Éclairement",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vue radar",roomView:"Vue de la pièce",view2D:"2D",view3D:"3D",zoneOccupancy:"Occupation de zone",zone:"Zone",recommendations:"Recommandations",ventilateNow:"Aérez maintenant !",openWindow:"Ouvrez une fenêtre",airQualityPoor:"La qualité de l'air est mauvaise",tooHumid:"Trop humide",tooDry:"Trop sec",tooCold:"Trop froid",tooWarm:"Trop chaud"},editor:{deviceId:"ID appareil",selectDevice:"Sélectionner appareil",appearance:"Apparence",showGraph:"Afficher graphique",showWater:"Afficher l'eau",showEnergy:"Afficher l'énergie",graphType:"Type de graphique",historyGraph:"Graphique historique",liveGraph:"Graphique en direct",displayOptions:"Options d'affichage"}},es:{common:{loading:"Cargando...",error:"Error",unknown:"Desconocido",today:"Hoy",week:"Semana",month:"Mes",year:"Año",daily:"Diario",weekly:"Semanal",monthly:"Mensual",yearly:"Anual",current:"Actual",total:"Total",temperature:"Temperatura",humidity:"Humedad",settings:"Configuración",save:"Guardar",cancel:"Cancelar",close:"Cerrar",edit:"Editar",delete:"Eliminar",add:"Añadir",name:"Nombre",value:"Valor",unit:"Unidad",active:"Activo",inactive:"Inactivo",on:"Encendido",off:"Apagado",yes:"Sí",no:"No",show:"Mostrar",hide:"Ocultar"},waterflowkit:{title:"WaterFlowKit",subtitle:"Medición de flujo dual",pipe1:"Tubería 1",pipe2:"Tubería 2",currentFlow:"Flujo actual",totalConsumption:"Consumo total",flowRate:"Caudal",perHour:"por hora",noFlow:"Sin flujo",flowing:"Fluyendo",waterTemperature:"Temperatura del agua",showPipe1:"Mostrar tubería 1",showPipe2:"Mostrar tubería 2",showTemperature:"Mostrar temperatura",pipe1Name:"Nombre tubería 1",pipe2Name:"Nombre tubería 2"},waterp1:{title:"WaterP1MeterKit",water:"Agua",energy:"Energía",energyActive:"Energía activa",currentUsage:"Consumo de agua actual",leakDetection:"Detección de fugas",monitoringActivity:"Actividad de monitoreo",meter:"Medidor",currentPower:"Potencia actual",electricityToday:"Electricidad hoy",gasToday:"Gas hoy",waterLast24h:"Agua últimas 24 horas",max:"máx"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo de agua",dailyUsage:"Consumo diario",weeklyUsage:"Consumo semanal",monthlyUsage:"Consumo mensual",yearlyUsage:"Consumo anual",calibration:"Calibración",lastCalibration:"Última calibración",sinceLast:"desde calibración"},ultimatesensor:{title:"UltimateSensor",roomScore:"Puntuación de habitación",excellent:"Excelente",good:"Bueno",moderate:"Moderado",poor:"Malo",unhealthy:"No saludable",hazardous:"Peligroso",presence:"Presencia",detected:"Detectada",notDetected:"No detectada",targets:"Objetivos",co2Level:"Nivel de CO₂",vocIndex:"Índice COV",noxIndex:"Índice NOx",illuminance:"Iluminancia",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista de habitación",view2D:"2D",view3D:"3D",zoneOccupancy:"Ocupación de zona",zone:"Zona",recommendations:"Recomendaciones",ventilateNow:"¡Ventila ahora!",openWindow:"Abre una ventana",airQualityPoor:"La calidad del aire es mala",tooHumid:"Demasiado húmedo",tooDry:"Demasiado seco",tooCold:"Demasiado frío",tooWarm:"Demasiado caliente"},editor:{deviceId:"ID de dispositivo",selectDevice:"Seleccionar dispositivo",appearance:"Apariencia",showGraph:"Mostrar gráfico",showWater:"Mostrar agua",showEnergy:"Mostrar energía",graphType:"Tipo de gráfico",historyGraph:"Gráfico histórico",liveGraph:"Gráfico en vivo",displayOptions:"Opciones de visualización"}},it:{common:{loading:"Caricamento...",error:"Errore",unknown:"Sconosciuto",today:"Oggi",week:"Settimana",month:"Mese",year:"Anno",daily:"Giornaliero",weekly:"Settimanale",monthly:"Mensile",yearly:"Annuale",current:"Attuale",total:"Totale",temperature:"Temperatura",humidity:"Umidità",settings:"Impostazioni",save:"Salva",cancel:"Annulla",close:"Chiudi",edit:"Modifica",delete:"Elimina",add:"Aggiungi",name:"Nome",value:"Valore",unit:"Unità",active:"Attivo",inactive:"Inattivo",on:"Acceso",off:"Spento",yes:"Sì",no:"No",show:"Mostra",hide:"Nascondi"},waterflowkit:{title:"WaterFlowKit",subtitle:"Misurazione doppio flusso",pipe1:"Tubo 1",pipe2:"Tubo 2",currentFlow:"Flusso attuale",totalConsumption:"Consumo totale",flowRate:"Portata",perHour:"all'ora",noFlow:"Nessun flusso",flowing:"In flusso",waterTemperature:"Temperatura dell'acqua",showPipe1:"Mostra tubo 1",showPipe2:"Mostra tubo 2",showTemperature:"Mostra temperatura",pipe1Name:"Nome tubo 1",pipe2Name:"Nome tubo 2"},waterp1:{title:"WaterP1MeterKit",water:"Acqua",energy:"Energia",energyActive:"Energia attiva",currentUsage:"Consumo d'acqua attuale",leakDetection:"Rilevamento perdite",monitoringActivity:"Attività di monitoraggio",meter:"Contatore",currentPower:"Potenza attuale",electricityToday:"Elettricità oggi",gasToday:"Gas oggi",waterLast24h:"Acqua ultime 24 ore",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo d'acqua",dailyUsage:"Consumo giornaliero",weeklyUsage:"Consumo settimanale",monthlyUsage:"Consumo mensile",yearlyUsage:"Consumo annuale",calibration:"Calibrazione",lastCalibration:"Ultima calibrazione",sinceLast:"dalla calibrazione"},ultimatesensor:{title:"UltimateSensor",roomScore:"Punteggio stanza",excellent:"Eccellente",good:"Buono",moderate:"Moderato",poor:"Scarso",unhealthy:"Non salutare",hazardous:"Pericoloso",presence:"Presenza",detected:"Rilevata",notDetected:"Non rilevata",targets:"Obiettivi",co2Level:"Livello CO₂",vocIndex:"Indice COV",noxIndex:"Indice NOx",illuminance:"Illuminamento",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista stanza",view2D:"2D",view3D:"3D",zoneOccupancy:"Occupazione zona",zone:"Zona",recommendations:"Raccomandazioni",ventilateNow:"Ventila ora!",openWindow:"Apri una finestra",airQualityPoor:"La qualità dell'aria è scarsa",tooHumid:"Troppo umido",tooDry:"Troppo secco",tooCold:"Troppo freddo",tooWarm:"Troppo caldo"},editor:{deviceId:"ID dispositivo",selectDevice:"Seleziona dispositivo",appearance:"Aspetto",showGraph:"Mostra grafico",showWater:"Mostra acqua",showEnergy:"Mostra energia",graphType:"Tipo di grafico",historyGraph:"Grafico storico",liveGraph:"Grafico in tempo reale",displayOptions:"Opzioni di visualizzazione"}},pt:{common:{loading:"Carregando...",error:"Erro",unknown:"Desconhecido",today:"Hoje",week:"Semana",month:"Mês",year:"Ano",daily:"Diário",weekly:"Semanal",monthly:"Mensal",yearly:"Anual",current:"Atual",total:"Total",temperature:"Temperatura",humidity:"Umidade",settings:"Configurações",save:"Salvar",cancel:"Cancelar",close:"Fechar",edit:"Editar",delete:"Excluir",add:"Adicionar",name:"Nome",value:"Valor",unit:"Unidade",active:"Ativo",inactive:"Inativo",on:"Ligado",off:"Desligado",yes:"Sim",no:"Não",show:"Mostrar",hide:"Ocultar"},waterflowkit:{title:"WaterFlowKit",subtitle:"Medição de fluxo duplo",pipe1:"Tubo 1",pipe2:"Tubo 2",currentFlow:"Fluxo atual",totalConsumption:"Consumo total",flowRate:"Vazão",perHour:"por hora",noFlow:"Sem fluxo",flowing:"Fluindo",waterTemperature:"Temperatura da água",showPipe1:"Mostrar tubo 1",showPipe2:"Mostrar tubo 2",showTemperature:"Mostrar temperatura",pipe1Name:"Nome tubo 1",pipe2Name:"Nome tubo 2"},waterp1:{title:"WaterP1MeterKit",water:"Água",energy:"Energia",energyActive:"Energia ativa",currentUsage:"Consumo de água atual",leakDetection:"Detecção de vazamento",monitoringActivity:"Atividade de monitoramento",meter:"Medidor",currentPower:"Potência atual",electricityToday:"Eletricidade hoje",gasToday:"Gás hoje",waterLast24h:"Água últimas 24 horas",max:"máx"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo de água",dailyUsage:"Consumo diário",weeklyUsage:"Consumo semanal",monthlyUsage:"Consumo mensal",yearlyUsage:"Consumo anual",calibration:"Calibração",lastCalibration:"Última calibração",sinceLast:"desde calibração"},ultimatesensor:{title:"UltimateSensor",roomScore:"Pontuação do ambiente",excellent:"Excelente",good:"Bom",moderate:"Moderado",poor:"Ruim",unhealthy:"Não saudável",hazardous:"Perigoso",presence:"Presença",detected:"Detectada",notDetected:"Não detectada",targets:"Alvos",co2Level:"Nível de CO₂",vocIndex:"Índice COV",noxIndex:"Índice NOx",illuminance:"Iluminância",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista do ambiente",view2D:"2D",view3D:"3D",zoneOccupancy:"Ocupação da zona",zone:"Zona",recommendations:"Recomendações",ventilateNow:"Ventile agora!",openWindow:"Abra uma janela",airQualityPoor:"A qualidade do ar está ruim",tooHumid:"Muito úmido",tooDry:"Muito seco",tooCold:"Muito frio",tooWarm:"Muito quente"},editor:{deviceId:"ID do dispositivo",selectDevice:"Selecionar dispositivo",appearance:"Aparência",showGraph:"Mostrar gráfico",showWater:"Mostrar água",showEnergy:"Mostrar energia",graphType:"Tipo de gráfico",historyGraph:"Gráfico histórico",liveGraph:"Gráfico ao vivo",displayOptions:"Opções de exibição"}},pl:{common:{loading:"Ładowanie...",error:"Błąd",unknown:"Nieznany",today:"Dzisiaj",week:"Tydzień",month:"Miesiąc",year:"Rok",daily:"Dziennie",weekly:"Tygodniowo",monthly:"Miesięcznie",yearly:"Rocznie",current:"Bieżący",total:"Łącznie",temperature:"Temperatura",humidity:"Wilgotność",settings:"Ustawienia",save:"Zapisz",cancel:"Anuluj",close:"Zamknij",edit:"Edytuj",delete:"Usuń",add:"Dodaj",name:"Nazwa",value:"Wartość",unit:"Jednostka",active:"Aktywny",inactive:"Nieaktywny",on:"Włączony",off:"Wyłączony",yes:"Tak",no:"Nie",show:"Pokaż",hide:"Ukryj"},waterflowkit:{title:"WaterFlowKit",subtitle:"Podwójny pomiar przepływu",pipe1:"Rura 1",pipe2:"Rura 2",currentFlow:"Bieżący przepływ",totalConsumption:"Całkowite zużycie",flowRate:"Przepływ",perHour:"na godzinę",noFlow:"Brak przepływu",flowing:"Przepływa",waterTemperature:"Temperatura wody",showPipe1:"Pokaż rurę 1",showPipe2:"Pokaż rurę 2",showTemperature:"Pokaż temperaturę",pipe1Name:"Nazwa rury 1",pipe2Name:"Nazwa rury 2"},waterp1:{title:"WaterP1MeterKit",water:"Woda",energy:"Energia",energyActive:"Energia aktywna",currentUsage:"Bieżące zużycie wody",leakDetection:"Wykrywanie wycieków",monitoringActivity:"Aktywność monitorowania",meter:"Licznik",currentPower:"Bieżąca moc",electricityToday:"Prąd dzisiaj",gasToday:"Gaz dzisiaj",waterLast24h:"Woda ostatnie 24 godziny",max:"maks"},watermeter:{title:"WaterMeterKit",waterUsage:"Zużycie wody",dailyUsage:"Dzienne zużycie",weeklyUsage:"Tygodniowe zużycie",monthlyUsage:"Miesięczne zużycie",yearlyUsage:"Roczne zużycie",calibration:"Kalibracja",lastCalibration:"Ostatnia kalibracja",sinceLast:"od kalibracji"},ultimatesensor:{title:"UltimateSensor",roomScore:"Wynik pomieszczenia",excellent:"Doskonały",good:"Dobry",moderate:"Umiarkowany",poor:"Słaby",unhealthy:"Niezdrowy",hazardous:"Niebezpieczny",presence:"Obecność",detected:"Wykryta",notDetected:"Nie wykryta",targets:"Cele",co2Level:"Poziom CO₂",vocIndex:"Indeks LZO",noxIndex:"Indeks NOx",illuminance:"Natężenie oświetlenia",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Widok radaru",roomView:"Widok pomieszczenia",view2D:"2D",view3D:"3D",zoneOccupancy:"Zajętość strefy",zone:"Strefa",recommendations:"Zalecenia",ventilateNow:"Wietrz teraz!",openWindow:"Otwórz okno",airQualityPoor:"Jakość powietrza jest słaba",tooHumid:"Za wilgotno",tooDry:"Za sucho",tooCold:"Za zimno",tooWarm:"Za ciepło"},editor:{deviceId:"ID urządzenia",selectDevice:"Wybierz urządzenie",appearance:"Wygląd",showGraph:"Pokaż wykres",showWater:"Pokaż wodę",showEnergy:"Pokaż energię",graphType:"Typ wykresu",historyGraph:"Wykres historyczny",liveGraph:"Wykres na żywo",displayOptions:"Opcje wyświetlania"}}};let Ue="en",Oe=We;function Re(e){return e&&function(e){const t=function(e){return e?(e.language||e.locale?.language||"en").split("-")[0].toLowerCase():"en"}(e);t!==Ue&&(Ue=t,Oe=Ne[t]||We)}(e),Oe}let Fe=class extends le{constructor(){super(...arguments),this._config={}}setConfig(e){this._config={show_header:!0,show_status:!0,show_pipe_visualization:!0,show_flow_cards:!0,show_total_consumption:!0,show_hourly_rate:!0,show_flow1:!0,show_flow2:!0,...e}}getCardSize(){return 5}updated(e){super.updated(e),e.has("hass")&&this.hass&&!this._config.flow1_flow_entity&&this._autoDetectEntities()}_autoDetectEntities(){if(!this.hass)return;const e=Object.keys(this.hass.states),t={};for(const i of e){const e=i.toLowerCase();e.includes("waterflowkit")&&(e.includes("flow1")&&(e.includes("current")&&e.includes("usage")?t.flow1_flow_entity=i:e.includes("total")&&e.includes("consumption")?t.flow1_total_entity=i:e.includes("temperature")&&(t.flow1_temp_entity=i)),e.includes("flow2")&&(e.includes("current")&&e.includes("usage")?t.flow2_flow_entity=i:e.includes("total")&&e.includes("consumption")?t.flow2_total_entity=i:e.includes("temperature")&&(t.flow2_temp_entity=i)))}Object.keys(t).length>0&&(this._config={...this._config,...t},Ae("WaterFlowKit: Auto-detected entities:",t))}_getFlowData(e){const t=1===e?this._config.flow1_flow_entity:this._config.flow2_flow_entity,i=1===e?this._config.flow1_total_entity:this._config.flow2_total_entity,o=1===e?this._config.flow1_temp_entity:this._config.flow2_temp_entity,a=we(this.hass,t)??0,r=we(this.hass,i)??0,s=we(this.hass,o),n=null!==s&&s>-10;return{flow:a,total:r,temp:n?s:null,hasTemp:n,isFlowing:a>.01}}_getTempClass(e){return null===e?"":e<20?"cold":e<40?"warm":"hot"}_getFlowSpeed(e){return e>5?"fast":e<1?"slow":""}render(){if(!this.hass)return Y;const e=Re(this.hass),t=!1!==this._config.show_flow1,i=!1!==this._config.show_flow2,o=!1!==this._config.flow1_show_temp,a=!1!==this._config.flow2_show_temp,r=this._getFlowData(1),s=this._getFlowData(2),n=this._config.flow1_name||e.waterflowkit.pipe1,c=this._config.flow2_name||e.waterflowkit.pipe2,l=(t&&r.isFlowing?1:0)+(i&&s.isFlowing?1:0),d=(t?r.flow:0)+(i?s.flow:0);return V`
      <ha-card>
        <div class="card-content">
          ${!1!==this._config.show_header?V`
            <div class="header">
              <div class="header-left">
                <div class="header-icon ${l>0?"flowing":""}">
                  ${Pe("waterflowkit")?ye(Pe("waterflowkit")):V`<ha-icon icon="mdi:pipe"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${e.waterflowkit.title}</h2>
                  <div class="header-subtitle">${e.waterflowkit.subtitle}</div>
                </div>
              </div>
              ${!1!==this._config.show_status?V`
                <div class="status-badge ${l>0?"flowing":"inactive"}">
                  <ha-icon icon="${l>0?"mdi:water":"mdi:water-off"}"></ha-icon>
                  <span>${l>0?`${ke(d,2)} L/min`:e.waterflowkit.noFlow}</span>
                </div>
              `:Y}
            </div>
          `:Y}

          ${!1!==this._config.show_pipe_visualization?V`
            <div class="pipe-container">
              ${this._renderPipesSVG(r,s,t,i,o,a)}
            </div>
          `:Y}

          ${!1!==this._config.show_flow_cards&&t?this._renderFlowCard(1,r,n,o):Y}
          ${!1!==this._config.show_flow_cards&&i?this._renderFlowCard(2,s,c,a):Y}
        </div>
      </ha-card>
    `}_renderPipesSVG(e,t,i,o,a,r){const s=Re(this.hass),n=i&&e.isFlowing,c=o&&t.isFlowing,l=i&&o,d=35,h=l?105:35;return G`
      <svg class="pipes-svg" viewBox="0 0 360 ${l?140:70}" preserveAspectRatio="xMidYMid meet">
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
        ${i?G`
          <!-- Pipe -->
          <path class="pipe" d="M 0 ${d} L 360 ${d}" />
          <path class="pipe-inner" d="M 0 ${d} L 360 ${d}" />

          <!-- Animated water flow -->
          <path class="water-flow flow1 ${n?"active":""} ${this._getFlowSpeed(e.flow)}" d="M 0 ${d} L 360 ${d}" />

          <!-- Water bubbles animation when flowing -->
          ${n?G`
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
          ${a&&e.hasTemp?G`
            <text class="temp-badge ${this._getTempClass(e.temp)}" x="320" y="${40}">${ke(e.temp,1)}°C</text>
          `:""}
        `:""}

        <!-- Flow 2 -->
        ${o?G`
          <!-- Pipe -->
          <path class="pipe" d="M 0 ${h} L 360 ${h}" />
          <path class="pipe-inner" d="M 0 ${h} L 360 ${h}" />

          <!-- Animated water flow -->
          <path class="water-flow flow2 ${c?"active":""} ${this._getFlowSpeed(t.flow)}" d="M 0 ${h} L 360 ${h}" />

          <!-- Water bubbles animation when flowing -->
          ${c?G`
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
          ${this._renderYFSensor(55,h,c,2)}

          <!-- Labels -->
          <text class="pipe-label" x="110" y="${h-15}">${(this._config.flow2_name||s.waterflowkit.pipe2).toUpperCase()}</text>
          <text class="pipe-value flow2" x="220" y="${h+5}">${ke(t.flow,2)}</text>
          <text class="pipe-unit" x="265" y="${h+5}">L/min</text>
          ${r&&t.hasTemp?G`
            <text class="temp-badge ${this._getTempClass(t.temp)}" x="320" y="${h+5}">${ke(t.temp,1)}°C</text>
          `:""}
        `:""}
      </svg>
    `}_renderYFSensor(e,t,i,o){const a=1===o?"#0ea5e9":"#22c55e";return G`
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
        ${i?G`
          <rect x="12" y="-4" width="16" height="10" rx="2" fill="${a}" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1s" repeatCount="indefinite" />
          </rect>
        `:""}
      </g>
    `}_renderFlowCard(e,t,i,o){const a=Re(this.hass),r=1===e?this._config.flow1_flow_entity:this._config.flow2_flow_entity,s=this._getTempClass(t.temp),n=!1!==this._config.show_total_consumption,c=o&&t.hasTemp,l=!1!==this._config.show_hourly_rate,d=n||c||l;return V`
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
        ${d?V`
          <div class="flow-card-stats">
            ${n?V`
              <div class="flow-stat">
                <div class="flow-stat-label">${a.waterflowkit.totalConsumption}</div>
                <div class="flow-stat-value">${ke(1e3*t.total,0)}</div>
                <div class="flow-stat-unit">liter</div>
              </div>
            `:Y}
            ${c?V`
              <div class="flow-stat">
                <div class="flow-stat-label">${a.common.temperature}</div>
                <div class="temp-display ${s}">
                  <ha-icon icon="mdi:thermometer"></ha-icon>
                  <span class="flow-stat-value">${ke(t.temp,1)}°C</span>
                </div>
              </div>
            `:Y}
            ${l?V`
              <div class="flow-stat">
                <div class="flow-stat-label">${a.waterflowkit.flowRate}</div>
                <div class="flow-stat-value">${ke(60*t.flow,1)}</div>
                <div class="flow-stat-unit">L/h</div>
              </div>
            `:Y}
          </div>
        `:Y}
      </div>
    `}static getConfigElement(){return document.createElement("smarthomeshop-waterflowkit-card-editor")}static getStubConfig(){return{show_header:!0,show_status:!0,show_pipe_visualization:!0,show_flow_cards:!0,show_total_consumption:!0,show_hourly_rate:!0,show_flow1:!0,show_flow2:!0,flow1_show_temp:!0,flow2_show_temp:!0,flow1_name:"Hot water",flow2_name:"Cold water"}}};Fe.styles=[Me,s`
      :host {
        display: block;
      }

      .card-content {
        padding: 16px;
      }

      /* Status badge styling for water flow */
      .status-badge.flowing {
        background: color-mix(in srgb, var(--info-color) 15%, transparent);
        color: var(--info-color);
      }
      .status-badge.inactive {
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
      }

      /* Pipe visualization container */
      .pipe-container {
        position: relative;
        background: var(--shs-surface);
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 12px;
        overflow: hidden;
        border: 1px solid var(--shs-outline);
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
        background: var(--shs-surface);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: background-color 180ms ease-out, border-color 180ms ease-out;
        border: 1px solid var(--shs-outline);
      }

      .flow-card:last-child { margin-bottom: 0; }
      .flow-card:hover {
        background: var(--shs-surface-hover);
        border-color: color-mix(in srgb, var(--info-color) 30%, var(--divider-color));
      }

      .flow-card.active {
        border-color: color-mix(in srgb, var(--info-color) 55%, var(--divider-color));
        background: color-mix(in srgb, var(--info-color) 9%, var(--card-background-color));
      }

      .flow-card.flow2.active {
        border-color: color-mix(in srgb, var(--success-color) 55%, var(--divider-color));
        background: color-mix(in srgb, var(--success-color) 9%, var(--card-background-color));
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

      .flow-icon.flow1 { background: color-mix(in srgb, var(--info-color) 14%, transparent); color: var(--info-color); }
      .flow-icon.flow2 { background: color-mix(in srgb, var(--success-color) 14%, transparent); color: var(--success-color); }
      .flow-icon ha-icon { --mdc-icon-size: 22px; color: currentColor; }

      .flow-name { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
      .flow-status { font-size: 11px; color: var(--secondary-text-color); opacity: 0.7; }
      .flow-status.active { color: #22c55e; opacity: 1; }

      .flow-current { text-align: right; }
      .flow-value { font-size: 24px; font-weight: 700; color: var(--primary-text-color); line-height: 1; }
      .flow-unit { font-size: 12px; color: var(--secondary-text-color); margin-left: 2px; }

      .flow-card-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
        gap: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--shs-outline);
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

      @container (max-width: 430px) {
        .pipe-container {
          padding: 10px;
        }

        .flow-card {
          padding: 12px;
        }

        .flow-value {
          font-size: 21px;
        }

        .flow-card-stats {
          gap: 8px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .water-flow.active,
        .header-icon.flowing {
          animation: none;
        }
      }
    `],e([ge({attribute:!1})],Fe.prototype,"hass",void 0),e([me()],Fe.prototype,"_config",void 0),Fe=e([he("smarthomeshop-waterflowkit-card")],Fe);let He=class extends le{constructor(){super(...arguments),this._config={}}setConfig(e){this._config=e}_valueChanged(e,t){const i={...this._config,[e]:t};this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}_getFilteredEntities(e){return this.hass?.states?Object.keys(this.hass.states).filter(t=>t.startsWith("sensor.")&&e(t)).sort():[]}_getFlowEntities(){return this._getFilteredEntities(e=>e.includes("water")||e.includes("flow")||e.includes("usage"))}_getTotalEntities(){return this._getFilteredEntities(e=>e.includes("consumption")||e.includes("total")||e.includes("water"))}_getTempEntities(){return this._getFilteredEntities(e=>e.includes("temp")||e.includes("temperature"))}render(){const e=Re(this.hass),t=this._getFlowEntities(),i=this._getTotalEntities(),o=this._getTempEntities();return V`
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

      <div class="form-row">
        <div class="section-title">
          <ha-icon icon="mdi:view-dashboard-outline"></ha-icon>
          Visible content
        </div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_header"
              .checked=${!1!==this._config.show_header}
              @change=${e=>this._valueChanged("show_header",e.target.checked)} />
            <label for="show_header">Header</label>
          </div>
          ${!1!==this._config.show_header?V`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_status"
                  .checked=${!1!==this._config.show_status}
                  @change=${e=>this._valueChanged("show_status",e.target.checked)} />
                <label for="show_status">Combined flow status</label>
              </div>
            </div>
          `:Y}
        </div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_pipe_visualization"
              .checked=${!1!==this._config.show_pipe_visualization}
              @change=${e=>this._valueChanged("show_pipe_visualization",e.target.checked)} />
            <label for="show_pipe_visualization">Pipe visualization</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_flow_cards"
              .checked=${!1!==this._config.show_flow_cards}
              @change=${e=>this._valueChanged("show_flow_cards",e.target.checked)} />
            <label for="show_flow_cards">Pipe detail cards</label>
          </div>
          ${!1!==this._config.show_flow_cards?V`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_total_consumption"
                  .checked=${!1!==this._config.show_total_consumption}
                  @change=${e=>this._valueChanged("show_total_consumption",e.target.checked)} />
                <label for="show_total_consumption">Total consumption</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_hourly_rate"
                  .checked=${!1!==this._config.show_hourly_rate}
                  @change=${e=>this._valueChanged("show_hourly_rate",e.target.checked)} />
                <label for="show_hourly_rate">Calculated hourly rate</label>
              </div>
            </div>
          `:Y}
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
            ${t.map(e=>V`
              <option value=${e} ?selected=${e===this._config.flow1_flow_entity}>${e}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <label>Total consumption sensor</label>
          <select @change=${e=>this._valueChanged("flow1_total_entity",e.target.value||void 0)}>
            <option value="">-- Select entity --</option>
            ${i.map(e=>V`
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
        ${!1!==this._config.flow1_show_temp?V`
          <div class="form-row">
            <label>Temperature sensor</label>
            <select @change=${e=>this._valueChanged("flow1_temp_entity",e.target.value||void 0)}>
              <option value="">-- Select entity --</option>
              ${o.map(e=>V`
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
            ${t.map(e=>V`
              <option value=${e} ?selected=${e===this._config.flow2_flow_entity}>${e}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <label>Total consumption sensor</label>
          <select @change=${e=>this._valueChanged("flow2_total_entity",e.target.value||void 0)}>
            <option value="">-- Select entity --</option>
            ${i.map(e=>V`
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
        ${!1!==this._config.flow2_show_temp?V`
          <div class="form-row">
            <label>Temperature sensor</label>
            <select @change=${e=>this._valueChanged("flow2_temp_entity",e.target.value||void 0)}>
              <option value="">-- Select entity --</option>
              ${o.map(e=>V`
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
    .option-group {
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: color-mix(
        in srgb,
        var(--secondary-background-color) 72%,
        var(--card-background-color)
      );
      margin-bottom: 10px;
    }
    .nested-options {
      margin: 8px 0 0 25px;
      padding: 8px 0 0 12px;
      border-left: 2px solid var(--divider-color);
    }
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
      background: color-mix(in srgb, var(--primary-color) 8%, var(--card-background-color));
      border: 1px solid color-mix(in srgb, var(--primary-color) 28%, var(--divider-color));
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
  `,e([ge({attribute:!1})],He.prototype,"hass",void 0),e([me()],He.prototype,"_config",void 0),He=e([he("smarthomeshop-waterflowkit-card-editor")],He);const je={detection:{fill:"rgba(34, 197, 94, 0.2)",stroke:"#22c55e"},exclusion:{fill:"rgba(239, 68, 68, 0.2)",stroke:"#ef4444"},entry:{fill:"rgba(16, 185, 129, 0.25)",stroke:"#10b981"}},Ve=600;class Ge{constructor(){this.camera={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3},this.wallHeight=2500}resetCamera(e){if(e.length>=3){const t=e.map(e=>e.x),i=e.map(e=>e.y),o=(Math.min(...t)+Math.max(...t))/2,a=(Math.min(...i)+Math.max(...i))/2,r=Math.max(Math.max(...t)-Math.min(...t),Math.max(...i)-Math.min(...i));this.camera={azimuth:45,elevation:35,distance:Math.max(4e3,1.5*r),targetX:o,targetY:a,targetZ:this.wallHeight/2}}else this.camera={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3}}orbit(e,t){this.camera.azimuth=(this.camera.azimuth-.5*e)%360,this.camera.elevation=Math.max(5,Math.min(85,this.camera.elevation+.3*t))}zoomBy(e){this.camera.distance=Math.max(2e3,Math.min(2e4,this.camera.distance*e))}render(e,t){e.width=800,e.height=Ve;const i=e.getContext("2d");if(!i)return;const o=i.createLinearGradient(0,0,0,Ve);o.addColorStop(0,"#1e293b"),o.addColorStop(1,"#0f172a"),i.fillStyle=o,i.fillRect(0,0,800,Ve),this.drawGrid(i),t.roomPoints.length>=3&&(this.drawRoom(i,t),this.drawFurniture(i,t),this.drawDoors(i,t),this.drawWindows(i,t),this.drawZones(i,t)),this.drawSensors(i,t),this.drawTargets(i,t)}project(e){const t=this.camera,i=t.azimuth*Math.PI/180,o=t.elevation*Math.PI/180,a=e.x-t.targetX,r=e.y-t.targetY,s=e.z-t.targetZ,n=a*Math.cos(i)-r*Math.sin(i),c=a*Math.sin(i)+r*Math.cos(i),l=s,d=c*Math.cos(o)-l*Math.sin(o),h=c*Math.sin(o)+l*Math.cos(o),p=1/Math.tan(60*Math.PI/360)*400,u=t.distance+d,g=u>50?p/u:p/50;return{x:400-n*g,y:300-h*g}}drawGrid(e){e.strokeStyle="rgba(71, 85, 105, 0.3)",e.lineWidth=1;const t=5e3;for(let i=-5e3;i<=t;i+=1e3){const o=this.project({x:i,y:-5e3,z:0}),a=this.project({x:i,y:t,z:0});e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(a.x,a.y),e.stroke();const r=this.project({x:-5e3,y:i,z:0}),s=this.project({x:t,y:i,z:0});e.beginPath(),e.moveTo(r.x,r.y),e.lineTo(s.x,s.y),e.stroke()}}drawRoom(e,t){const i=t.roomPoints;e.fillStyle="rgba(67, 97, 238, 0.08)",e.strokeStyle="rgba(67, 97, 238, 0.4)",e.lineWidth=2,e.beginPath();const o=this.project({x:i[0].x,y:i[0].y,z:0});e.moveTo(o.x,o.y);for(let t=1;t<i.length;t++){const o=this.project({x:i[t].x,y:i[t].y,z:0});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();const a=i.map((e,t)=>{const o=i[(t+1)%i.length],a=(e.x+o.x)/2,r=(e.y+o.y)/2;return{index:t,dist:Math.hypot(a-this.camera.targetX,r-this.camera.targetY)}}).sort((e,t)=>t.dist-e.dist);for(const{index:i}of a)this.drawWall(e,t,i)}drawWall(e,t,i){const o=t.roomPoints,a=o[i],r=o[(i+1)%o.length],s=this.project({x:a.x,y:a.y,z:0}),n=this.project({x:r.x,y:r.y,z:0}),c=this.project({x:r.x,y:r.y,z:this.wallHeight}),l=this.project({x:a.x,y:a.y,z:this.wallHeight}),d=r.x-a.x,h=r.y-a.y,p=Math.atan2(h,d)+Math.PI/2,u=this.camera.azimuth*Math.PI/180,g=.3+.4*Math.abs(Math.cos(p-u)),m=e.createLinearGradient((s.x+n.x)/2,Math.max(s.y,n.y),(l.x+c.x)/2,Math.min(l.y,c.y));m.addColorStop(0,`rgba(71, 85, 105, ${.5*g})`),m.addColorStop(1,`rgba(71, 85, 105, ${.2*g})`),e.fillStyle=m,e.strokeStyle="#475569",e.lineWidth=2,e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(n.x,n.y),e.lineTo(c.x,c.y),e.lineTo(l.x,l.y),e.closePath(),e.fill(),e.stroke()}drawFurniture(e,t){for(const i of t.furniture){const t=i.width/2,o=i.height/2,a=400,r=(i.rotation||0)*Math.PI/180,s=Math.cos(r),n=Math.sin(r),c=[[-t,-o],[t,-o],[t,o],[-t,o]].map(([e,t])=>({x:i.x+e*s-t*n,y:i.y+e*n+t*s,z:0})),l=c.map(e=>({...e,z:a})),d=c.map(e=>this.project(e)),h=l.map(e=>this.project(e));e.fillStyle="rgba(148, 163, 184, 0.5)",e.strokeStyle="#64748b",e.lineWidth=1,e.beginPath(),e.moveTo(h[0].x,h[0].y);for(let t=1;t<4;t++)e.lineTo(h[t].x,h[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle="rgba(148, 163, 184, 0.25)",e.beginPath(),e.moveTo(d[t].x,d[t].y),e.lineTo(d[i].x,d[i].y),e.lineTo(h[i].x,h[i].y),e.lineTo(h[t].x,h[t].y),e.closePath(),e.fill(),e.stroke()}const p=this.project({x:i.x,y:i.y,z:a+100});e.fillStyle="#94a3b8",e.font="11px sans-serif",e.textAlign="center",e.fillText(i.name,p.x,p.y)}}drawDoors(e,t){for(const i of t.doors){if(i.wallIndex>=t.roomPoints.length)continue;const o=t.roomPoints[i.wallIndex],a=t.roomPoints[(i.wallIndex+1)%t.roomPoints.length],r=o.x+(a.x-o.x)*i.position,s=o.y+(a.y-o.y)*i.position,n=Math.atan2(a.y-o.y,a.x-o.x),c=i.width/2,l=Math.cos(n),d=Math.sin(n),h=Math.cos(n+Math.PI/2),p=Math.sin(n+Math.PI/2),u=[{x:r-c*l-40*h,y:s-c*d-40*p},{x:r+c*l-40*h,y:s+c*d-40*p},{x:r+c*l+40*h,y:s+c*d+40*p},{x:r-c*l+40*h,y:s-c*d+40*p}],g=u.map(e=>this.project({...e,z:0})),m=u.map(e=>this.project({...e,z:2e3}));e.strokeStyle="#8b5a2b",e.lineWidth=1,e.fillStyle="rgba(139, 90, 43, 0.6)",e.beginPath(),e.moveTo(m[0].x,m[0].y);for(let t=1;t<4;t++)e.lineTo(m[t].x,m[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(139, 90, 43, 0.5)":"rgba(139, 90, 43, 0.35)",e.beginPath(),e.moveTo(g[t].x,g[t].y),e.lineTo(g[i].x,g[i].y),e.lineTo(m[i].x,m[i].y),e.lineTo(m[t].x,m[t].y),e.closePath(),e.fill(),e.stroke()}}}drawWindows(e,t){for(const i of t.windows){if(i.wallIndex>=t.roomPoints.length)continue;const o=t.roomPoints[i.wallIndex],a=t.roomPoints[(i.wallIndex+1)%t.roomPoints.length],r=o.x+(a.x-o.x)*i.position,s=o.y+(a.y-o.y)*i.position,n=Math.atan2(a.y-o.y,a.x-o.x),c=i.width/2,l=i.height||1100,d=Math.cos(n),h=Math.sin(n),p=Math.cos(n+Math.PI/2),u=Math.sin(n+Math.PI/2),g=[{x:r-c*d-25*p,y:s-c*h-25*u},{x:r+c*d-25*p,y:s+c*h-25*u},{x:r+c*d+25*p,y:s+c*h+25*u},{x:r-c*d+25*p,y:s-c*h+25*u}],m=g.map(e=>this.project({...e,z:900})),f=g.map(e=>this.project({...e,z:900+l}));e.strokeStyle="#4a90a4",e.lineWidth=1,e.fillStyle="rgba(135, 206, 235, 0.4)",e.beginPath(),e.moveTo(f[0].x,f[0].y);for(let t=1;t<4;t++)e.lineTo(f[t].x,f[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(135, 206, 235, 0.35)":"rgba(135, 206, 235, 0.25)",e.beginPath(),e.moveTo(m[t].x,m[t].y),e.lineTo(m[i].x,m[i].y),e.lineTo(f[i].x,f[i].y),e.lineTo(f[t].x,f[t].y),e.closePath(),e.fill(),e.stroke()}}}drawZones(e,t){const i=this.wallHeight;for(const o of t.zones){const t=je[o.type]||je.detection,a=o.points;if("entry"===o.type&&2===a.length){const r=a[0],s=a[1],n=this.project({x:r.x,y:r.y,z:0}),c=this.project({x:s.x,y:s.y,z:0}),l=this.project({x:r.x,y:r.y,z:i}),d=this.project({x:s.x,y:s.y,z:i});e.fillStyle=t.fill.replace("0.25","0.4"),e.strokeStyle=t.stroke,e.lineWidth=3,e.beginPath(),e.moveTo(n.x,n.y),e.lineTo(c.x,c.y),e.lineTo(d.x,d.y),e.lineTo(l.x,l.y),e.closePath(),e.fill(),e.stroke();const h=this.project({x:(r.x+s.x)/2,y:(r.y+s.y)/2,z:i/2});e.fillStyle=t.stroke,e.font="bold 14px sans-serif",e.textAlign="center",e.fillText("left"===o.inDirection?"← IN":"IN →",h.x,h.y)}else if(a.length>=3){e.fillStyle=t.fill,e.strokeStyle=t.stroke,e.lineWidth=2,e.beginPath();const r=this.project({x:a[0].x,y:a[0].y,z:10});e.moveTo(r.x,r.y);for(let t=1;t<a.length;t++){const i=this.project({x:a[t].x,y:a[t].y,z:10});e.lineTo(i.x,i.y)}e.closePath(),e.fill(),e.stroke(),e.fillStyle=t.fill.replace("0.2","0.15"),e.beginPath();const s=this.project({x:a[0].x,y:a[0].y,z:i});e.moveTo(s.x,s.y);for(let t=1;t<a.length;t++){const o=this.project({x:a[t].x,y:a[t].y,z:i});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();for(let o=0;o<a.length;o++){const r=a[o],s=a[(o+1)%a.length],n=this.project({x:r.x,y:r.y,z:10}),c=this.project({x:s.x,y:s.y,z:10}),l=this.project({x:s.x,y:s.y,z:i}),d=this.project({x:r.x,y:r.y,z:i});e.fillStyle=t.fill.replace("0.2","0.12"),e.strokeStyle=t.stroke,e.lineWidth=1,e.beginPath(),e.moveTo(n.x,n.y),e.lineTo(c.x,c.y),e.lineTo(l.x,l.y),e.lineTo(d.x,d.y),e.closePath(),e.fill(),e.stroke()}const n=a.reduce((e,t)=>e+t.x,0)/a.length,c=a.reduce((e,t)=>e+t.y,0)/a.length,l=this.project({x:n,y:c,z:i/2});e.fillStyle=t.stroke,e.font="bold 12px sans-serif",e.textAlign="center",e.fillText(o.name,l.x,l.y)}}}drawSensors(e,t){for(const i of t.sensors){const t=i.heightMm??2e3,o=this.project({x:i.x,y:i.y,z:t}),a=i.fov/2*Math.PI/180,r=(i.rotation-90)*Math.PI/180,s=r-a,n=r+a,c=i.x+Math.cos(s)*i.range,l=i.y+Math.sin(s)*i.range,d=i.x+Math.cos(n)*i.range,h=i.y+Math.sin(n)*i.range,p=this.project({x:i.x,y:i.y,z:0}),u=this.project({x:c,y:l,z:0}),g=this.project({x:d,y:h,z:0});e.fillStyle="rgba(67, 97, 238, 0.15)",e.strokeStyle="#4361ee",e.lineWidth=2,e.beginPath(),e.moveTo(p.x,p.y),e.lineTo(u.x,u.y),e.lineTo(g.x,g.y),e.closePath(),e.fill(),e.stroke(),e.strokeStyle="rgba(67, 97, 238, 0.5)",e.lineWidth=1,e.setLineDash([4,4]),e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(p.x,p.y),e.stroke(),e.setLineDash([]),e.fillStyle="#4361ee",e.beginPath(),e.arc(o.x,o.y,12,0,2*Math.PI),e.fill(),e.fillStyle="white",e.font="bold 10px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText("📡",o.x,o.y)}}drawTargets(e,t){for(let i=0;i<t.targets.length;i++){const o=t.targets[i].x,a=t.targets[i].y;e.save();const r=this.project({x:o+80,y:a+80,z:5});e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.ellipse(r.x,r.y,25,10,.3,0,2*Math.PI),e.fill(),this.drawCapsule(e,o-60,a,0,60,700,"#8b9299","#6b7280"),this.drawCapsule(e,o+60,a,0,60,700,"#8b9299","#6b7280"),this.drawCapsule(e,o-160,a,900,50,380,"#8b9299","#6b7280"),this.drawCapsule(e,o+160,a,900,50,380,"#8b9299","#6b7280"),this.drawCapsule(e,o,a,700,120,600,"#b8bfc7","#9ca3af"),this.drawSphere(e,o,a,1500,110);const s=this.project({x:o,y:a,z:1700});e.fillStyle="rgba(239, 68, 68, 0.95)",e.beginPath(),e.arc(s.x,s.y,14,0,2*Math.PI),e.fill(),e.strokeStyle="rgba(255, 255, 255, 0.6)",e.lineWidth=2,e.stroke(),e.fillStyle="white",e.font="bold 12px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText(`${i+1}`,s.x,s.y),e.restore()}}drawCapsule(e,t,i,o,a,r,s,n){const c=.8*a,l=o+r,d=[];for(let e=0;e<8;e++){const r=e/8*Math.PI*2,s=(e+1)/8*Math.PI*2,n=t+Math.cos(r)*a,h=i+Math.sin(r)*c,p=t+Math.cos(s)*a,u=i+Math.sin(s)*c,g=this.project({x:n,y:h,z:o}),m=this.project({x:p,y:u,z:o}),f=this.project({x:p,y:u,z:l}),v=this.project({x:n,y:h,z:l});d.push({points:[g,m,f,v],depth:(h+u)/2,isTop:!1})}const h=[];for(let e=0;e<8;e++){const o=e/8*Math.PI*2;h.push(this.project({x:t+Math.cos(o)*a,y:i+Math.sin(o)*c,z:l}))}d.push({points:h,depth:-1e3,isTop:!0}),d.sort((e,t)=>t.depth-e.depth);for(const t of d){e.beginPath(),e.moveTo(t.points[0].x,t.points[0].y);for(let i=1;i<t.points.length;i++)e.lineTo(t.points[i].x,t.points[i].y);e.closePath(),e.fillStyle=t.isTop?s:this.shadeColor(s,t.depth>0?.85:1),e.fill(),e.strokeStyle=n,e.lineWidth=.5,e.stroke()}}drawSphere(e,t,i,o,a){const r=this.project({x:t,y:i,z:o}),s=this.project({x:t,y:i,z:o+a}),n=Math.abs(r.y-s.y),c=e.createRadialGradient(r.x-.35*n,r.y-.35*n,0,r.x,r.y,n);c.addColorStop(0,"#ffffff"),c.addColorStop(.3,"#e5e7eb"),c.addColorStop(.7,"#d1d5db"),c.addColorStop(1,"#9ca3af"),e.fillStyle=c,e.beginPath(),e.arc(r.x,r.y,n,0,2*Math.PI),e.fill(),e.strokeStyle="#6b7280",e.lineWidth=1,e.stroke()}shadeColor(e,t){const i=e.replace("#","");return`rgb(${Math.round(parseInt(i.substr(0,2),16)*t)}, ${Math.round(parseInt(i.substr(2,2),16)*t)}, ${Math.round(parseInt(i.substr(4,2),16)*t)})`}}function qe(e,t){const i=[];for(const o of e){if(!o.deviceId)continue;const e=(o.rotation-90)*Math.PI/180;for(let a=1;a<=3;a++){const r=t(`sensor.${o.deviceId}_target_${a}_x`),s=t(`sensor.${o.deviceId}_target_${a}_y`);if(void 0===r||void 0===s)continue;const n=parseFloat(r)||0,c=parseFloat(s)||0;0===n&&0===c||i.push({x:o.x+c*Math.cos(e)-n*Math.sin(e),y:o.y+c*Math.sin(e)+n*Math.cos(e)})}}return i}let Ye=class extends le{constructor(){super(...arguments),this.entityPrefix="",this.deviceName="",this.isOpen=!1,this._settings=[],this._zones=[],this._activeTab="mmwave",this._showZoneEditor=!1,this._saving=!1,this._pendingChanges=new Map}updated(e){e.has("isOpen")&&this.isOpen&&this._loadSettings()}_loadSettings(){if(!this.hass||!this.entityPrefix)return;const e=[],t=this.entityPrefix;[{suffix:"max_distance",name:"Max Afstand",unit:"mm",min:100,max:6e3,step:100}].forEach(i=>{const o=`number.${t}_${i.suffix}`,a=this.hass.states[o];a&&"unavailable"!==a.state&&e.push({entityId:o,name:i.name,value:parseFloat(a.state),min:i.min,max:i.max,step:i.step,unit:i.unit,group:"mmwave"})});[{suffix:"temperature_offset",name:"Temp Offset",unit:"°C",min:-10,max:10,step:.1},{suffix:"humidity_offset",name:"Humidity Offset",unit:"%",min:-20,max:20,step:1}].forEach(i=>{const o=`number.${t}_${i.suffix}`,a=this.hass.states[o];a&&"unavailable"!==a.state&&e.push({entityId:o,name:i.name,value:parseFloat(a.state),min:i.min,max:i.max,step:i.step,unit:i.unit,group:"calibration"})});const i=[];for(let e=1;e<=4;e++)i.push({id:e,beginX:this._getNum(`zone_${e}_begin_x`),endX:this._getNum(`zone_${e}_end_x`),beginY:this._getNum(`zone_${e}_begin_y`),endY:this._getNum(`zone_${e}_end_y`)});this._settings=e,this._zones=i}_getNum(e){const t=`number.${this.entityPrefix}_${e}`,i=this.hass?.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_handleChange(e,t){this._pendingChanges.set(e,t),this.requestUpdate()}async _saveChanges(){if(this.hass&&0!==this._pendingChanges.size){this._saving=!0;try{for(const[e,t]of this._pendingChanges)await this.hass.callService("number","set_value",{entity_id:e,value:t});this._pendingChanges.clear(),setTimeout(()=>this._loadSettings(),500)}catch(e){console.error("Save failed:",e)}finally{this._saving=!1}}}async _saveZone(e){if(this.hass){this._saving=!0;try{const t=this.entityPrefix;await Promise.all([this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_begin_x`,value:e.beginX}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_end_x`,value:e.endX}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_begin_y`,value:e.beginY}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_end_y`,value:e.endY})])}catch(e){console.error("Zone save failed:",e)}finally{this._saving=!1}}}_close(){this.dispatchEvent(new CustomEvent("close"))}_renderSetting(e){const t=this._pendingChanges.has(e.entityId)?this._pendingChanges.get(e.entityId):e.value;return V`
      <div class="setting-item">
        <div>
          <div class="setting-name">${e.name}</div>
          <div class="setting-value">${e.value}${e.unit?" "+e.unit:""}</div>
        </div>
        <div class="number-control">
          <button class="number-btn" @click=${()=>this._handleChange(e.entityId,Math.max(e.min,t-e.step))} ?disabled=${t<=e.min}>−</button>
          <input class="number-input" type="number" .value=${t.toString()} @change=${t=>this._handleChange(e.entityId,parseFloat(t.target.value))} />
          <button class="number-btn" @click=${()=>this._handleChange(e.entityId,Math.min(e.max,t+e.step))} ?disabled=${t>=e.max}>+</button>
          ${e.unit?V`<span class="number-unit">${e.unit}</span>`:Y}
        </div>
      </div>
    `}_renderZone(e){const t=0!==e.beginX||0!==e.endX||0!==e.beginY||0!==e.endY;return V`
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
    `}render(){if(!this.isOpen)return Y;const e=this._settings.filter(e=>"mmwave"===e.group),t=this._settings.filter(e=>"calibration"===e.group);return V`
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
            ${"mmwave"===this._activeTab?V`
              ${e.length>0?V`
                <div class="group-title"><ha-icon icon="mdi:radar"></ha-icon> Radar Instellingen</div>
                ${e.map(e=>this._renderSetting(e))}
              `:V`<div class="empty-state">No mmWave settings found</div>`}
            `:Y}

            ${"zones"===this._activeTab?V`
              <div class="group-title"><ha-icon icon="mdi:vector-square"></ha-icon> Zone Configuratie</div>
              <button class="btn btn-primary" style="width: 100%; margin-bottom: 16px; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" @click=${()=>this._showZoneEditor=!0}>
                <ha-icon icon="mdi:pencil-ruler"></ha-icon> Open Visuele Editor
              </button>
              ${this._zones.map(e=>this._renderZone(e))}
            `:Y}

            ${"calibration"===this._activeTab?V`
              ${t.length>0?V`
                <div class="group-title"><ha-icon icon="mdi:tune"></ha-icon> Sensor Calibratie</div>
                ${t.map(e=>this._renderSetting(e))}
              `:V`<div class="empty-state">No calibration settings found</div>`}
            `:Y}
          </div>

          <div class="modal-footer">
            <div class="changes-badge">
              ${this._pendingChanges.size>0?V`<ha-icon icon="mdi:alert-circle"></ha-icon> ${this._pendingChanges.size} wijzigingen`:Y}
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
    `}};Ye.styles=s`
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
  `,e([ge({attribute:!1})],Ye.prototype,"hass",void 0),e([ge()],Ye.prototype,"entityPrefix",void 0),e([ge()],Ye.prototype,"deviceName",void 0),e([ge({type:Boolean})],Ye.prototype,"isOpen",void 0),e([me()],Ye.prototype,"_settings",void 0),e([me()],Ye.prototype,"_zones",void 0),e([me()],Ye.prototype,"_activeTab",void 0),e([me()],Ye.prototype,"_showZoneEditor",void 0),e([me()],Ye.prototype,"_saving",void 0),e([me()],Ye.prototype,"_pendingChanges",void 0),Ye=e([he("smarthomeshop-sensor-settings")],Ye);let Ze=class extends le{constructor(){super(...arguments),this._config={},this._targets=[],this._zones=[],this._environment={temperature:null,humidity:null,co2:null,illuminance:null,voc:null,nox:null,pm1_0:null,pm2_5:null,pm4_0:null,pm10:null,typical_particle_size:null},this._entityPrefix="",this._deviceName="",this._entityIds={targets:[]},this._showSettings=!1,this._rooms=[],this._selectedRoomId=null,this._roomViewMode="2d",this._room3d=new Ge,this._isDragging3D=!1,this._lastMouseX=0,this._lastMouseY=0,this._roomsLoaded=!1,this._on3DMouseDown=e=>{this._isDragging3D=!0,this._lastMouseX=e.clientX,this._lastMouseY=e.clientY},this._on3DMouseMove=e=>{if(!this._isDragging3D)return;const t=e.clientX-this._lastMouseX,i=e.clientY-this._lastMouseY;this._lastMouseX=e.clientX,this._lastMouseY=e.clientY,this._room3d.orbit(-t,.6*i),this._render3DView()},this._on3DMouseUp=()=>{this._isDragging3D=!1},this._on3DWheel=e=>{e.preventDefault(),this._room3d.zoomBy(e.deltaY>0?1.1:.9),this._render3DView()}}_fireMoreInfo(e){if(!e)return;const t=new CustomEvent("hass-more-info",{detail:{entityId:e},bubbles:!0,composed:!0});this.dispatchEvent(t)}static getConfigElement(){return document.createElement("smarthomeshop-ultimatesensor-card-editor")}static getStubConfig(){return{max_distance:6e3,show_header:!0,show_status:!0,show_radar:!0,show_target_details:!0,show_environment:!0,show_pm_gauge:!0,show_pm_values:!0,show_nox:!0,show_zones:!0,show_grid:!0}}setConfig(e){this._config={max_distance:6e3,show_header:!0,show_status:!0,show_radar:!0,show_target_details:!0,show_environment:!0,show_pm_gauge:!0,show_pm_values:!0,show_nox:!0,show_zones:!0,show_grid:!0,...e},this._roomViewMode=this._config.room_view_mode||"2d","3d"===this._roomViewMode&&setTimeout(()=>this._init3DView(),100)}getCardSize(){return 6}connectedCallback(){super.connectedCallback(),this._startUpdates()}disconnectedCallback(){super.disconnectedCallback(),this._stopUpdates()}_startUpdates(){this._updateData(),this._updateInterval=window.setInterval(()=>this._updateData(),1e3)}async _loadRooms(){if(this.hass)if(this._roomsLoaded)Ae("SmartHomeShop: Rooms already loaded, skipping");else try{Ae("SmartHomeShop: Loading rooms via WebSocket...");const e=await this.hass.callWS({type:"smarthomeshop/rooms"});Ae("SmartHomeShop: WebSocket result:",e),this._rooms=Array.isArray(e?.rooms)?e.rooms:[],this._rooms.length>0&&!this._selectedRoomId&&(this._selectedRoomId=this._rooms[0]?.id||null,Ae("SmartHomeShop: Auto-selected room:",this._selectedRoomId)),this._roomsLoaded=!0,Ae("SmartHomeShop: Loaded",this._rooms.length,"rooms:",this._rooms.map(e=>e.name).join(", ")),"3d"===this._roomViewMode&&setTimeout(()=>this._init3DView(),50)}catch(e){console.error("SmartHomeShop: Could not load rooms:",e),this._rooms=[]}else Ae("SmartHomeShop: _loadRooms called but hass not available")}_stopUpdates(){this._updateInterval&&clearInterval(this._updateInterval)}updated(e){super.updated(e),this.hass&&!this._roomsLoaded&&this._loadRooms(),(e.has("hass")||e.has("_config"))&&this._detectEntityPrefix(),(e.has("_targets")||e.has("_zones"))&&(this._drawRadar(),"room"===this._config.view_mode&&"3d"===this._roomViewMode&&this._render3DView()),e.has("_roomViewMode")&&"3d"===this._roomViewMode&&setTimeout(()=>this._render3DView(),50)}firstUpdated(){this._drawRadar(),this.hass&&!this._roomsLoaded&&this._loadRooms()}_detectEntityPrefix(){if(this.hass){if(this._config.device_id){const e=this._getEntitiesForDevice(this._config.device_id).find(e=>e.includes("target_1_x"));if(e){const t=e.match(/^sensor\.(.+)_target_1_x$/);if(t){this._entityPrefix=t[1];const e=this.hass.devices?.[this._config.device_id];return void(this._deviceName=e?.name||"UltimateSensor")}}}if(this._config.entity_prefix)return this._entityPrefix=this._config.entity_prefix,void(this._deviceName=this._config.title||"UltimateSensor");for(const e of Object.keys(this.hass.states))if(e.includes("target_1_x")&&e.startsWith("sensor.")){const t=e.match(/^sensor\.(.+)_target_1_x$/);if(t)return this._entityPrefix=t[1],void(this._deviceName="UltimateSensor")}}}_getEntitiesForDevice(e){return this.hass?.entities?Object.entries(this.hass.entities).filter(([t,i])=>i.device_id===e).map(([e])=>e):[]}_getOfflineInfo(){if(!this.hass)return{offline:!1,lastSeen:null};const e=this._config.device_id,t=this.hass.entities;if(e&&t){let i=!1,o=null,a=null;for(const[r,s]of Object.entries(t)){if(s.device_id!==e)continue;if("esphome"!==s.platform)continue;if(!r.startsWith("sensor.")&&!r.startsWith("binary_sensor."))continue;const t=this.hass.states[r];if(!t)continue;if("connectivity"===t.attributes?.device_class){if("on"===t.state)return{offline:!1,lastSeen:null};"off"===t.state&&(a=t.last_changed??null);continue}if(i=!0,"unavailable"!==t.state)return{offline:!1,lastSeen:null};const n=t.last_changed;n&&(!o||n>o)&&(o=n)}return a?{offline:!0,lastSeen:a}:{offline:i,lastSeen:o}}if(!this._entityPrefix)return{offline:!1,lastSeen:null};const i=[`sensor.${this._entityPrefix}_`,`binary_sensor.${this._entityPrefix}_`];let o=!1,a=null,r=null;for(const[e,t]of Object.entries(this.hass.states)){if(e.endsWith("_cc"))continue;if(!i.some(t=>e.startsWith(t)))continue;if("connectivity"===t.attributes?.device_class){if("on"===t.state)return{offline:!1,lastSeen:null};"off"===t.state&&(r=t.last_changed??null);continue}if(o=!0,"unavailable"!==t.state)return{offline:!1,lastSeen:null};const s=t.last_changed;s&&(!a||s>a)&&(a=s)}return r?{offline:!0,lastSeen:r}:{offline:o,lastSeen:a}}_getSensorState(e){if(!this.hass||!this._entityPrefix)return null;const t=`sensor.${this._entityPrefix}_${e}`,i=this.hass.states[t]?.state;return i&&"unavailable"!==i&&"unknown"!==i?parseFloat(i):null}_findSensorEntityId(e){if(this.hass&&this._entityPrefix)for(const t of e){const e=`sensor.${this._entityPrefix}_${t}`,i=this.hass.states[e]?.state;if(i&&"unavailable"!==i&&"unknown"!==i)return e}}_getNumberState(e){if(!this.hass||!this._entityPrefix)return 0;const t=`number.${this._entityPrefix}_${e}`,i=this.hass.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_updateData(){if(!this.hass||!this._entityPrefix)return;const e=[],t=[];for(let i=1;i<=5;i++){const o=`sensor.${this._entityPrefix}_target_${i}_x`,a=`sensor.${this._entityPrefix}_target_${i}_y`;if(!this.hass.states[o]||!this.hass.states[a])continue;const r=this._getSensorState(`target_${i}_x`)??0,s=this._getSensorState(`target_${i}_y`)??0,n=[`binary_sensor.${this._entityPrefix}_target_${i}_active`,`binary_sensor.${this._entityPrefix}_target_${i}`].find(e=>this.hass?.states[e]),c=n?"on"===this.hass.states[n].state:0!==r||0!==s,l=`sensor.${this._entityPrefix}_target_${i}_distance`,d=this._getSensorState(`target_${i}_distance`)??Math.hypot(r,s);e.push({x:r,y:s,active:c,distance:d}),t.push(this.hass.states[l]?l:o)}this._targets=e;const i=[];for(let e=1;e<=4;e++){const t=this._getNumberState(`zone_${e}_begin_x`),o=this._getNumberState(`zone_${e}_begin_y`),a=this._getNumberState(`zone_${e}_end_x`),r=this._getNumberState(`zone_${e}_end_y`);0===t&&0===o&&0===a&&0===r||i.push({beginX:t,beginY:o,endX:a,endY:r})}this._zones=i,this._environment={temperature:this._getSensorState("scd41_temperature")??this._getSensorState("temperature")??this._getSensorState("bme280_temperature"),humidity:this._getSensorState("scd41_humidity")??this._getSensorState("humidity")??this._getSensorState("bme280_humidity"),co2:this._getSensorState("scd41_co2")??this._getSensorState("co2"),illuminance:this._getSensorState("bh1750_illuminance")??this._getSensorState("illuminance"),voc:this._getSensorState("voc_index")??this._getSensorState("sgp41_voc_index")??this._getSensorState("sgp30_voc")??this._getSensorState("voc"),nox:this._getSensorState("nox_index")??this._getSensorState("sgp41_nox_index"),pm1_0:this._getSensorState("pm_1mm_weight_concentration")??this._getSensorState("pm_1_0"),pm2_5:this._getSensorState("pm_2_5mm_weight_concentration")??this._getSensorState("pm_2_5"),pm4_0:this._getSensorState("pm_4mm_weight_concentration")??this._getSensorState("pm_4_0"),pm10:this._getSensorState("pm_10mm_weight_concentration")??this._getSensorState("pm_10"),typical_particle_size:this._getSensorState("typical_particle_size")},this._entityIds={temperature:this._findSensorEntityId(["scd41_temperature","temperature","bme280_temperature"]),humidity:this._findSensorEntityId(["scd41_humidity","humidity","bme280_humidity"]),co2:this._findSensorEntityId(["scd41_co2","co2"]),illuminance:this._findSensorEntityId(["bh1750_illuminance","illuminance"]),voc:this._findSensorEntityId(["voc_index","sgp41_voc_index","sgp30_voc","voc"]),nox:this._findSensorEntityId(["nox_index","sgp41_nox_index"]),pm1_0:this._findSensorEntityId(["pm_1mm_weight_concentration","pm_1_0"]),pm2_5:this._findSensorEntityId(["pm_2_5mm_weight_concentration","pm_2_5"]),pm4_0:this._findSensorEntityId(["pm_4mm_weight_concentration","pm_4_0"]),pm10:this._findSensorEntityId(["pm_10mm_weight_concentration","pm_10"]),typical_particle_size:this._findSensorEntityId(["typical_particle_size"]),targets:t},this._drawRadar()}_drawRadar(){const e=this.shadowRoot?.querySelector(".radar-canvas");if(!e)return;const t=e.getContext("2d");if(!t)return;const i=e.getBoundingClientRect();if(i.width<10||i.height<50)return;const o=window.devicePixelRatio||1;e.width=i.width*o,e.height=i.height*o,t.scale(o,o);const a=i.width,r=i.height,s=a/2,n=r-25,c=this._config.max_distance||6e3,l=Math.max(.001,(r-50)/c);if(t.clearRect(0,0,a,r),!1!==this._config.show_grid){t.strokeStyle="rgba(255, 255, 255, 0.1)",t.lineWidth=1,t.setLineDash([5,5]);for(let e=1e3;e<=c;e+=1e3){const i=e*l;t.beginPath(),t.arc(s,n,i,Math.PI,2*Math.PI),t.stroke()}t.beginPath(),t.moveTo(s,n),t.lineTo(s,10),t.stroke(),t.setLineDash([])}const d=120*Math.PI/180,h=c*l;t.beginPath(),t.moveTo(s,n),t.arc(s,n,h,Math.PI+(Math.PI-d)/2,Math.PI+(Math.PI+d)/2),t.closePath();const p=t.createRadialGradient(s,n,0,s,n,h);if(p.addColorStop(0,"rgba(100, 180, 255, 0.3)"),p.addColorStop(1,"rgba(100, 180, 255, 0.05)"),t.fillStyle=p,t.fill(),t.strokeStyle="rgba(100, 180, 255, 0.5)",t.lineWidth=2,t.stroke(),!1!==this._config.show_zones){const e=["rgba(76, 175, 80, 0.3)","rgba(33, 150, 243, 0.3)","rgba(255, 152, 0, 0.3)","rgba(156, 39, 176, 0.3)"];this._zones.forEach((i,o)=>{const a=s+i.beginX*l,r=n-i.beginY*l,c=s+i.endX*l,d=n-i.endY*l,h=Math.min(a,c),p=Math.min(r,d),u=Math.abs(c-a),g=Math.abs(d-r);if(u>5&&g>5){t.fillStyle=e[o%e.length],t.strokeStyle=e[o%e.length].replace("0.3","0.8"),t.lineWidth=2,t.beginPath();const i=Math.min(4,u/2,g/2);t.roundRect(h,p,u,g,Math.max(0,i)),t.fill(),t.stroke()}})}const u=["#e91e63","#9c27b0","#3f51b5"];this._targets.forEach((e,i)=>{if(!e.active||0===e.x&&0===e.y)return;const o=s+e.x*l,a=n-e.y*l,r=u[i%u.length];t.beginPath(),t.arc(o,a,20,0,2*Math.PI);const c=t.createRadialGradient(o,a,0,o,a,20);c.addColorStop(0,r.replace(")",", 0.4)").replace("rgb","rgba")),c.addColorStop(1,"transparent"),t.fillStyle=c,t.fill(),t.beginPath(),t.arc(o,a,10,0,2*Math.PI),t.fillStyle=r,t.fill(),t.strokeStyle="white",t.lineWidth=2,t.stroke(),t.beginPath(),t.arc(o,a,3,0,2*Math.PI),t.fillStyle="white",t.fill()}),t.fillStyle="#2196f3",t.beginPath(),t.arc(s,n,8,0,2*Math.PI),t.fill(),t.fillStyle="rgba(255, 255, 255, 0.6)",t.font="10px sans-serif",t.textAlign="center",t.fillText("SENSOR",s,n+18),t.fillStyle="rgba(255, 255, 255, 0.5)",t.font="10px sans-serif",t.textAlign="right";for(let e=1;e<=c/1e3;e++){const i=n-1e3*e*l;t.fillText(`${e}m`,a-8,i+4)}}_renderRoomView(){const e=V`
      <div class="room-view-header">
        <div class="room-view-toggle">
          <button class="${"2d"===this._roomViewMode?"active":""}" @click=${()=>this._setRoomViewMode("2d")}>2D</button>
          <button class="${"3d"===this._roomViewMode?"active":""}" @click=${()=>this._setRoomViewMode("3d")}>3D</button>
        </div>
      </div>
    `,t=this._rooms.find(e=>e.id===this._selectedRoomId),i=t?.walls||[],o=i.filter(e=>"number"==typeof e?.x1&&"number"==typeof e?.y1).map(e=>({x:e.x1/1e3,y:e.y1/1e3}));Ae("SmartHomeShop: _renderRoomView",{selectedRoomId:this._selectedRoomId,wallSegments:i.length,cornerPoints:o.length,room:t?.name});const a=o.length>=3;if(!t||!a)return this._roomsLoaded&&this._rooms.length>0&&console.warn("SmartHomeShop: Room validation failed",{roomName:t?.name,wallSegmentsCount:i.length,cornerPointsCount:o.length}),V`
        ${e}
        <div class="no-room-message">
          <ha-icon icon="mdi:floor-plan"></ha-icon>
          <div>${this._roomsLoaded?"No room configured":"Loading rooms..."}</div>
          ${this._roomsLoaded?V`
            <div style="font-size: 0.8rem; margin-top: 8px;">
              Create a room in the SmartHomeShop panel first
            </div>
          `:Y}
        </div>
      `;const r=o.map(e=>e.x).filter(e=>!isNaN(e)),s=o.map(e=>e.y).filter(e=>!isNaN(e));if(0===r.length||0===s.length)return V`
        <div class="no-room-message">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <div>Invalid room data</div>
        </div>
      `;const n=Math.min(...r),c=Math.max(...r),l=Math.min(...s),d=Math.max(...s),h=.5,p=n-h,u=l-h,g=(c-n||1)+1,m=(d-l||1)+1;Ae("SmartHomeShop: ViewBox",{viewMinX:p,viewMinY:u,viewWidth:g,viewHeight:m,minX:n,maxX:c,minY:l,maxY:d});const f=o.map((e,t)=>`${0===t?"M":"L"} ${e.x} ${e.y}`).join(" ")+" Z",v=t.sensor?.x?t.sensor.x/1e3:(n+c)/2,_=t.sensor?.y?t.sensor.y/1e3:l+.5,y=t.sensor?.rotation??270,x=(t.sensor?.range??6e3)/1e3,w=t.sensor?.fov??120,b=isNaN(v)?(n+c)/2:v,k=isNaN(_)?l+.5:_,$=this._targets.filter(e=>e.active||0!==e.x||0!==e.y);Ae("SmartHomeShop: Room targets:",JSON.stringify(this._targets),"Active/visible:",$.length);const C=(y-90)*Math.PI/180,z=w/2*Math.PI/180,M=Math.min(x,3),S=C-z,P=C+z;if("3d"===this._roomViewMode)return V`
        ${e}
        <canvas class="canvas-3d"
          @mousedown=${this._on3DMouseDown}
          @mousemove=${this._on3DMouseMove}
          @mouseup=${this._on3DMouseUp}
          @mouseleave=${this._on3DMouseUp}
          @wheel=${this._on3DWheel}
        ></canvas>
      `;const E=[];for(let e=0;e<=32;e++){const t=S+e/32*(P-S);E.push(`${b+Math.cos(t)*M},${k+Math.sin(t)*M}`)}const L=`M ${b} ${k} L ${E.join(" L ")} Z`;return V`
      ${e}
      <svg viewBox="${p} ${u} ${g} ${m}"
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
        <rect x="${p}" y="${u}" width="${g}" height="${m}" fill="url(#room-grid)"/>
        <!-- Room walls - same style as zones-page -->
        <path d="${f}" fill="rgba(249, 115, 22, 0.08)" stroke="#475569" stroke-width="0.04"/>
        <!-- Sensor FOV - same style as zones-page (arc instead of triangle) -->
        <path d="${L}" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="0.015"/>
        <!-- Zones from room configuration -->
        ${(()=>{const e=t.zones||[];return Ae("SmartHomeShop: Rendering zones count:",e.length,"entry lines:",e.filter(e=>"entry"===e.type).length),e.map(e=>{if(!e.points||e.points.length<2)return Y;if("entry"===e.type&&2===e.points.length){const t=e.points[0].x/1e3,i=e.points[0].y/1e3,o=e.points[1].x/1e3,a=e.points[1].y/1e3,r=(t+o)/2,s=(i+a)/2,n=o-t,c=a-i,l=Math.sqrt(n*n+c*c);if(l<.01)return Y;const d=-c/l,h=n/l,p="left"===(e.inDirection||"left")?1:-1,u=.12,g=.02,m=r+d*p*(u+g),f=s+h*p*(u+g),v=r-d*p*(u+g),_=s-h*p*(u+g);return G`
                <line x1="${t}" y1="${i}" x2="${o}" y2="${a}" stroke="#10b981" stroke-width="0.04" stroke-linecap="round"/>
                <line x1="${m}" y1="${f}" x2="${r-d*p*g}" y2="${s-h*p*g}" stroke="#22c55e" stroke-width="0.025" marker-end="url(#arrow-in)"/>
                <line x1="${v}" y1="${_}" x2="${r+d*p*g}" y2="${s+h*p*g}" stroke="#ef4444" stroke-width="0.025" marker-end="url(#arrow-out)"/>
                <text x="${m+d*p*.05}" y="${f+h*p*.05+.025}" fill="#22c55e" font-size="0.07" text-anchor="middle" font-weight="bold">IN</text>
                <text x="${v-d*p*.05}" y="${_-h*p*.05+.025}" fill="#ef4444" font-size="0.07" text-anchor="middle" font-weight="bold">UIT</text>
              `}if(e.points.length<3)return Y;const t=e.points.map((e,t)=>`${0===t?"M":"L"} ${e.x/1e3} ${e.y/1e3}`).join(" ")+" Z",i="detection"===e.type;return G`
              <path d="${t}" fill="none" stroke="${i?"#22c55e":"#ef4444"}" stroke-width="0.025"/>
            `})})()}
        <!-- Doors - same style as zones-page (purple) -->
        ${(()=>{const e=t.doors||[],i=o;return i.length<3?Y:e.map(e=>{if(e.wallIndex>=i.length)return Y;const t=i[e.wallIndex],o=i[(e.wallIndex+1)%i.length],a=t.x+(o.x-t.x)*e.position,r=t.y+(o.y-t.y)*e.position,s=Math.atan2(o.y-t.y,o.x-t.x),n=(e.width||800)/1e3/2;return G`
              <line
                x1="${a-Math.cos(s)*n}"
                y1="${r-Math.sin(s)*n}"
                x2="${a+Math.cos(s)*n}"
                y2="${r+Math.sin(s)*n}"
                stroke="#a855f7" stroke-width="0.06" stroke-linecap="round"
              />
            `})})()}
        <!-- Windows - same style as zones-page (light blue) -->
        ${(()=>{const e=t.windows||[],i=o;return i.length<3?Y:e.map(e=>{if(e.wallIndex>=i.length)return Y;const t=i[e.wallIndex],o=i[(e.wallIndex+1)%i.length],a=t.x+(o.x-t.x)*e.position,r=t.y+(o.y-t.y)*e.position,s=Math.atan2(o.y-t.y,o.x-t.x),n=(e.width||1e3)/1e3/2;return G`
              <line
                x1="${a-Math.cos(s)*n}"
                y1="${r-Math.sin(s)*n}"
                x2="${a+Math.cos(s)*n}"
                y2="${r+Math.sin(s)*n}"
                stroke="#0ea5e9" stroke-width="0.06" stroke-linecap="round"
              />
            `})})()}
        <!-- Furniture - same style as zones-page (gray) -->
        ${(()=>{const e=(t.furniture||[]).filter(e=>"number"==typeof e?.x&&"number"==typeof e?.y&&e?.width&&e?.height);return e.map(e=>{const t=e.x/1e3,i=e.y/1e3,o=e.width/1e3,a=e.height/1e3,r=e.rotation||0;return G`
                <g transform="translate(${t}, ${i}) rotate(${r})">
                  <rect x="${-o/2}" y="${-a/2}" width="${o}" height="${a}"
                        fill="#334155" stroke="#475569" stroke-width="0.02" rx="0.03"/>
                </g>
              `})})()}
        <!-- Sensor icon - same style as zones-page -->
        <circle cx="${b}" cy="${k}" r="0.15" fill="#3b82f6" stroke="#1d4ed8" stroke-width="0.02"/>
        <!-- Sensor direction indicator -->
        <line x1="${b}" y1="${k}"
              x2="${b+.2*Math.cos(C)}" y2="${k+.2*Math.sin(C)}"
              stroke="white" stroke-width="0.04" stroke-linecap="round"/>
        <!-- Targets - same style as zones-page (white circle with colored border) -->
        ${(()=>{const e=["#ef4444","#f97316","#eab308"];return $.map((t,i)=>{const o=t.x/1e3,a=t.y/1e3,r=b+a*Math.cos(C)-o*Math.sin(C),s=k+a*Math.sin(C)+o*Math.cos(C);if(isNaN(r)||isNaN(s))return Y;const n=e[i]||"#ef4444";return G`
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
    `}_getCo2Status(e){return e<600?{label:"Excellent",class:"excellent"}:e<800?{label:"Good",class:"good"}:e<1e3?{label:"Moderate",class:"moderate"}:e<1500?{label:"Poor",class:"poor"}:{label:"Unhealthy",class:"unhealthy"}}_setRoomViewMode(e){this._roomViewMode=e,"3d"===e&&setTimeout(()=>this._init3DView(),50)}_init3DView(){const e=this._rooms.find(e=>e.id===this._selectedRoomId);if(!e)return;const t=(e.walls||[]).map(e=>({x:e.x1,y:e.y1}));this._room3d.resetCamera(t),this._render3DView()}_render3DView(){const e=this.shadowRoot?.querySelector(".canvas-3d");if(!e)return;const t=this._rooms.find(e=>e.id===this._selectedRoomId);t&&this._room3d.render(e,this._buildScene3D(t))}_buildScene3D(e){const t=(e.walls||[]).map(e=>({x:e.x1,y:e.y1})),i=(e.furniture||[]).map(e=>({x:e.x,y:e.y,width:e.width,height:e.height||e.depth||e.width,rotation:e.rotationDeg??e.rotation??0,name:e.name||e.typeId||"Furniture"})),o=(e.sensors&&e.sensors.length>0?e.sensors:e.sensor?[e.sensor]:[]).filter(e=>e&&"number"==typeof e.x).map(e=>({x:e.x,y:e.y,rotation:e.rotation??0,range:e.range??6e3,fov:e.fov??120,heightMm:e.heightMm??2e3,deviceId:e.deviceId??null}));return{roomPoints:t,furniture:i,doors:e.doors||[],windows:e.windows||[],zones:e.zones||[],sensors:o,targets:qe(o,e=>this.hass?.states[e]?.state)}}_getCo2BarPosition(e){return(Math.max(400,Math.min(2e3,e))-400)/1600*100}_getPm25Status(e){return e<=12?{label:"Excellent",labelEn:"Excellent",class:"excellent",color:"#4caf50"}:e<=35.4?{label:"Good",labelEn:"Good",class:"good",color:"#8bc34a"}:e<=55.4?{label:"Moderate",labelEn:"Moderate",class:"moderate",color:"#ffeb3b"}:e<=150.4?{label:"Unhealthy for Sensitive",labelEn:"Unhealthy for Sensitive",class:"unhealthy-sensitive",color:"#ff9800"}:e<=250.4?{label:"Unhealthy",labelEn:"Unhealthy",class:"unhealthy",color:"#f44336"}:e<=350.4?{label:"Very Unhealthy",labelEn:"Very Unhealthy",class:"very-unhealthy",color:"#9c27b0"}:{label:"Hazardous",labelEn:"Hazardous",class:"hazardous",color:"#880e4f"}}_getPm25BarPosition(e){return e<=12?e/12*8.3:e<=35.4?8.3+(e-12)/23.4*8.3:e<=55.4?16.6+(e-35.4)/20*8.4:e<=150.4?25+(e-55.4)/95*8.3:e<=250.4?33.3+(e-150.4)/100*16.7:e<=350.4?50+(e-250.4)/100*16.6:Math.min(100,66.6+(e-350.4)/150*33.4)}_hasAirQualityData(){const{pm1_0:e,pm2_5:t,pm4_0:i,pm10:o}=this._environment;return null!==e||null!==t||null!==i||null!==o}_findRoomQualityEntity(){if(!this.hass)return null;for(const[e,t]of Object.entries(this.hass.states))if(e.startsWith("sensor.")&&e.includes("room_quality")&&!e.includes("label")&&!e.includes("percentage")&&void 0!==t.attributes?.recommendations&&void 0!==t.attributes?.color)return Ae("SmartHomeShop: Found Room Quality entity:",e,"score:",t.state),{entityId:e,state:t};return Ae("SmartHomeShop: No Room Quality entity found, using local calculation"),null}_calculateRoomScore(){const e=this._findRoomQualityEntity();if(e){const{state:t}=e,i=parseFloat(t.state)||0,o=t.attributes||{},a=(o.recommendations||[]).map(e=>{let t="mdi:information";return e.includes("CO₂")||e.includes("Ventilat")?t="mdi:molecule-co2":e.includes("Particulate")||e.includes("dust")?t="mdi:weather-dust":e.includes("VOC")?t="mdi:air-purifier":e.includes("cool")||e.includes("cold")||e.includes("Warm up")?t="mdi:thermometer-low":e.includes("warm")||e.includes("hot")||e.includes("Cool down")?t="mdi:thermometer-high":e.includes("dry")?t="mdi:water-percent":e.includes("humid")&&(t="mdi:water-percent-alert"),{icon:t,text:e}}).slice(0,3);return{score:i,color:o.color||"#ffc107",label:o.label||"Unknown",recommendations:a}}return this._calculateRoomScoreLocal()}_calculateRoomScoreLocal(){const{temperature:e,humidity:t,co2:i,voc:o,pm2_5:a}=this._environment,r=[];let s=0,n=0;if(null!==i){let e=10;i>2e3?(e=1,r.push({icon:"mdi:molecule-co2",text:"Ventilate now!",priority:10})):i>1500?(e=3,r.push({icon:"mdi:molecule-co2",text:"CO₂ unhealthy, ventilate",priority:8})):i>1e3?(e=5,r.push({icon:"mdi:air-filter",text:"Ventilation recommended",priority:6})):i>800?e=7:i>600&&(e=9),s+=.3*e,n+=.3}if(null!==a){let e=10;a>150?(e=1,r.push({icon:"mdi:weather-dust",text:"Particulate matter dangerous!",priority:9})):a>55?(e=3,r.push({icon:"mdi:weather-dust",text:"Particulate matter high",priority:7})):a>35?(e=5,r.push({icon:"mdi:weather-dust",text:"Particulate matter elevated",priority:5})):a>12&&(e=7),s+=.25*e,n+=.25}if(null!==o){let e=10;o>400?(e=2,r.push({icon:"mdi:air-purifier",text:"High VOC, ventilate",priority:7})):o>250?(e=5,r.push({icon:"mdi:air-purifier",text:"Elevated VOC",priority:5})):o>150?e=7:o>100&&(e=9),s+=.15*e,n+=.15}if(null!==e){let t=10;e<16?(t=4,r.push({icon:"mdi:thermometer-low",text:"Warm up the room",priority:4})):e<18?(t=7,r.push({icon:"mdi:thermometer-low",text:"It is a bit cool",priority:2})):e>28?(t=3,r.push({icon:"mdi:thermometer-high",text:"Cool down the room",priority:4})):e>25?(t=6,r.push({icon:"mdi:thermometer-high",text:"It is a bit warm",priority:2})):e>22&&(t=8),s+=.15*t,n+=.15}if(null!==t){let e=10;t<25?(e=4,r.push({icon:"mdi:water-percent-alert",text:"Air too dry",priority:4})):t<35?(e=7,r.push({icon:"mdi:water-percent",text:"Air is dry",priority:2})):t>75?(e=4,r.push({icon:"mdi:water-percent-alert",text:"Air too humid",priority:4})):t>65&&(e=7,r.push({icon:"mdi:water-percent",text:"Air is humid",priority:2})),s+=.15*e,n+=.15}const c=n>0?s/n:0;let l="#22C55E",d="Excellent";c<4?(l="#EF4444",d="Poor"):c<5.5?(l="#F97316",d="Moderate"):c<7?(l="#F59E0B",d="Fair"):c<8.5&&(l="#84CC16",d="Good");const h=r.sort((e,t)=>t.priority-e.priority),p=h.slice(0,3).map(e=>({icon:e.icon,text:e.text}));return{score:c,color:l,label:d,recommendations:p}}_hasEnvironmentData(){const{temperature:e,humidity:t,co2:i,voc:o,pm2_5:a}=this._environment;return null!==e||null!==t||null!==i||null!==o||null!==a}_hasAnyEnvironmentEnabled(){const{temperature:e,humidity:t,co2:i,illuminance:o,voc:a}=this._environment;return null!==e&&!1!==this._config.show_temperature||null!==t&&!1!==this._config.show_humidity||null!==i&&!1!==this._config.show_co2||null!==o&&!1!==this._config.show_illuminance||null!==a&&!1!==this._config.show_voc}render(){if(!this.hass)return Y;if(!this._entityPrefix)return V`
        <ha-card>
          <div class="no-device">
            <ha-icon icon="mdi:radar"></ha-icon>
            <div>Select an UltimateSensor device</div>
            <div style="font-size: 0.8rem; margin-top: 8px;">
              Open the card editor to choose a device
            </div>
          </div>
      </ha-card>
      `;const e=this._targets.filter(e=>e.active).length,t=this._config.title||this._deviceName||"UltimateSensor",i=Pe(/mini/i.test(this._entityPrefix)?"ultimatesensor_mini":"ultimatesensor"),o=this._getOfflineInfo();if(o.offline)return V`
        <ha-card>
          ${!1!==this._config.show_header?V`
            <div class="header">
              <div class="header-left">
                <div class="header-icon">
                  ${i?ye(i):V`<ha-icon icon="mdi:radar"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${t}</h2>
                  <div class="header-subtitle">Presence &amp; climate</div>
                </div>
              </div>
              ${!1!==this._config.show_status?V`
                <div class="status-badge status-alert">
                  <ha-icon icon="mdi:lan-disconnect"></ha-icon>
                  <span>Offline</span>
                </div>
              `:Y}
            </div>
          `:Y}
          <div class="offline-state">
            <ha-icon icon="mdi:lan-disconnect"></ha-icon>
            <div class="offline-title">Device offline</div>
            <div class="offline-sub">
              ${o.lastSeen?`Last seen ${be(o.lastSeen)}`:"Waiting for the device to reconnect"}
            </div>
            <div class="offline-hint">Check the power supply and Wi-Fi connection.</div>
          </div>
        </ha-card>
      `;const{temperature:a,humidity:r,co2:s,illuminance:n,voc:c,nox:l,pm1_0:d,pm2_5:h,pm4_0:p,pm10:u}=this._environment,g=null!==s?this._getCo2Status(s):null,m=this._hasEnvironmentData()&&!1!==this._config.show_room_score,f=!1!==this._config.show_environment&&this._hasAnyEnvironmentEnabled(),v=this._hasAirQualityData()&&!1!==this._config.show_air_quality,_=m||f||v;return V`
      <ha-card>
        ${!1!==this._config.show_header?V`
          <div class="header">
            <div class="header-left">
              <div class="header-icon ${e>0?"active":""}">
                ${i?ye(i):V`<ha-icon icon="mdi:radar"></ha-icon>`}
              </div>
              <div>
                <h2 class="header-title">${t}</h2>
                <div class="header-subtitle">Presence &amp; climate</div>
              </div>
            </div>
            ${!1!==this._config.show_status?V`
              <div class="status-badge ${e>0?"status-active":"status-ok"}">
                <ha-icon icon="${e>0?"mdi:motion-sensor":"mdi:motion-sensor-off"}"></ha-icon>
                <span>${e} ${1===e?"person":"people"}</span>
              </div>
            `:Y}
          </div>
        `:Y}

        ${m?(()=>{const e=this._calculateRoomScore();return V`
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
                    <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="var(--divider-color)" stroke-width="8" stroke-linecap="round"/>
                    <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="url(#scoreGradient)" stroke-width="8" stroke-linecap="round"
                          stroke-dasharray="${e.score/10*Math.PI*50} ${50*Math.PI}" />
                    <circle
                      cx="${60+50*Math.cos(Math.PI*(1-e.score/10))}"
                      cy="${55-50*Math.sin(Math.PI*(1-e.score/10))}"
                      r="6" fill="${e.color}" stroke="var(--card-background-color)" stroke-width="2"/>
                  </svg>
                  <div class="room-score-value" style="color: ${e.color}">${e.score.toFixed(1)}</div>
                </div>
              </div>
              ${e.recommendations.length>0?V`
                <div class="room-score-recommendations">
                  ${e.recommendations.map(e=>V`
                    <div class="recommendation-item"><ha-icon icon="${e.icon}"></ha-icon>${e.text}</div>
                  `)}
                </div>
              `:V`
                <div class="room-score-recommendations">
                  <div class="recommendation-item positive"><ha-icon icon="mdi:check-circle"></ha-icon>All values optimal</div>
                </div>
              `}
            </div>
          `})():Y}

        ${f?V`
          <div class="environment-section">
            <div class="environment-grid">
              ${null!==a&&!1!==this._config.show_temperature?V`
                <div class="env-card temperature" @click=${()=>this._fireMoreInfo(this._entityIds.temperature)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:thermometer"></ha-icon>
                    <span class="env-card-label">Temperature</span>
                  </div>
                  <div class="env-card-value">${a.toFixed(1)}<span>°C</span></div>
                </div>
              `:Y}

              ${null!==r&&!1!==this._config.show_humidity?V`
                <div class="env-card humidity" @click=${()=>this._fireMoreInfo(this._entityIds.humidity)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:water-percent"></ha-icon>
                    <span class="env-card-label">Humidity</span>
                  </div>
                  <div class="env-card-value">${r.toFixed(0)}<span>%</span></div>
                </div>
              `:Y}

              ${null!==s&&!1!==this._config.show_co2?V`
                <div class="env-card co2" @click=${()=>this._fireMoreInfo(this._entityIds.co2)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:molecule-co2"></ha-icon>
                    <span class="env-card-label">CO₂</span>
                  </div>
                  <div class="env-card-value">${s.toFixed(0)}<span>ppm</span></div>
                </div>
              `:Y}

              ${null!==n&&!1!==this._config.show_illuminance?V`
                <div class="env-card illuminance" @click=${()=>this._fireMoreInfo(this._entityIds.illuminance)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:brightness-6"></ha-icon>
                    <span class="env-card-label">Illuminance</span>
                  </div>
                  <div class="env-card-value">${n.toFixed(0)}<span>lx</span></div>
                </div>
              `:Y}

              ${null!==c&&!1!==this._config.show_voc?V`
                <div class="env-card voc" @click=${()=>this._fireMoreInfo(this._entityIds.voc)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:air-filter"></ha-icon>
                    <span class="env-card-label">VOC Index</span>
                  </div>
                  <div class="env-card-value">${c.toFixed(0)}<span></span></div>
                </div>
              `:Y}
            </div>

            ${null!==s&&g&&!1!==this._config.show_co2_bar?V`
              <div class="co2-quality" @click=${()=>this._fireMoreInfo(this._entityIds.co2)}>
                <div class="co2-quality-header">
                  <div class="co2-quality-label">
                    <ha-icon icon="mdi:molecule-co2"></ha-icon>
                    CO₂ Quality
                  </div>
                  <div class="co2-quality-status ${g.class}">${g.label}</div>
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
            `:Y}
          </div>
        `:Y}


        ${v?V`
          <div class="air-quality-section">
            <div class="air-quality-header">
              <div class="air-quality-title">
                <ha-icon icon="mdi:weather-dust"></ha-icon>
                Particulate matter (PM)
              </div>
              ${null!==h?V`
                <div class="air-quality-status ${this._getPm25Status(h).class}">
                  ${this._getPm25Status(h).label}
                </div>
              `:Y}
            </div>

            ${null!==h&&!1!==this._config.show_pm_gauge?V`
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
            `:Y}

            ${!1!==this._config.show_pm_values?V`<div class="pm-grid">
              ${null!==d?V`
                <div class="pm-item pm1" @click=${()=>this._fireMoreInfo(this._entityIds.pm1_0)}>
                  <div class="pm-item-label">PM1.0</div>
                  <div class="pm-item-value">${d.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Y}
              ${null!==h?V`
                <div class="pm-item pm2_5" @click=${()=>this._fireMoreInfo(this._entityIds.pm2_5)}>
                  <div class="pm-item-label">PM2.5</div>
                  <div class="pm-item-value">${h.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Y}
              ${null!==p?V`
                <div class="pm-item pm4" @click=${()=>this._fireMoreInfo(this._entityIds.pm4_0)}>
                  <div class="pm-item-label">PM4.0</div>
                  <div class="pm-item-value">${p.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Y}
              ${null!==u?V`
                <div class="pm-item pm10" @click=${()=>this._fireMoreInfo(this._entityIds.pm10)}>
                  <div class="pm-item-label">PM10</div>
                  <div class="pm-item-value">${u.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Y}
            </div>`:Y}

            ${null!==l&&!1!==this._config.show_nox?V`
              <div class="voc-nox-grid" style="margin-top: 12px;">
                <div class="env-card nox" @click=${()=>this._fireMoreInfo(this._entityIds.nox)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:molecule"></ha-icon>
                    <span class="env-card-label">NOx Index</span>
                  </div>
                  <div class="env-card-value">${l.toFixed(0)}</div>
                </div>
              </div>
            `:Y}
          </div>
        `:Y}

        ${!1!==this._config.show_radar?V`
          ${_?V`<div class="section-divider"></div>`:Y}

          <div class="radar-section">
            ${"room"===this._config.view_mode?V`
              <div class="room-view-container">
                ${this._renderRoomView()}
              </div>
            `:V`
              <div class="radar-container">
                <canvas class="radar-canvas"></canvas>
              </div>
            `}

            ${!1!==this._config.show_target_details?V`
              <div class="target-info">
                ${this._targets.map((e,t)=>V`
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
            `:Y}
          </div>
        `:Y}
      <smarthomeshop-sensor-settings
          .hass=${this.hass}
          .entityPrefix=${this._entityPrefix}
          .deviceName=${this._deviceName}
          .isOpen=${this._showSettings}
          @close=${()=>this._showSettings=!1}
        ></smarthomeshop-sensor-settings>
      </ha-card>
    `}};Ze.styles=s`
    :host {
      display: block;
      container-type: inline-size;
      --shs-surface: color-mix(
        in srgb,
        var(--secondary-background-color) 78%,
        var(--card-background-color)
      );
      --shs-surface-hover: color-mix(
        in srgb,
        var(--primary-color) 6%,
        var(--shs-surface)
      );
      --shs-outline: color-mix(in srgb, var(--divider-color) 88%, transparent);
    }
    ha-card {
      padding: 14px;
      overflow: hidden;
    }

    /* Header */
    /* Shared card header (aligned with the water cards) */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .header-icon {
      width: 42px;
      height: 42px;
      flex: 0 0 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--primary-color) 15%, transparent);
      color: var(--primary-color);
      transition: transform 180ms ease-out, background-color 180ms ease-out;
    }
    .header-icon ha-icon {
      --mdc-icon-size: 24px;
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
      font-size: 1rem;
      font-weight: 600;
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
      flex: 0 0 auto;
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      transition: background-color 180ms ease-out, color 180ms ease-out;
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
      transition: background-color 180ms ease-out, color 180ms ease-out;
    }
    .view-btn.active {
      background: var(--primary-color, #3b82f6);
      color: white;
    }
    .view-btn:hover:not(.active) {
      background: color-mix(in srgb, var(--primary-color) 7%, transparent);
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
      background: var(--shs-surface);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid var(--shs-outline);
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
      color: var(--success-color);
      --mdc-icon-size: 18px;
    }
    .room-score-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0;
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
      background: color-mix(in srgb, var(--warning-color) 11%, transparent);
      border: 1px solid color-mix(in srgb, var(--warning-color) 28%, var(--divider-color));
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      color: var(--primary-text-color);
    }
    .recommendation-item ha-icon {
      --mdc-icon-size: 16px;
      color: var(--warning-color);
      flex-shrink: 0;
    }
    .recommendation-item.positive {
      background: color-mix(in srgb, var(--success-color) 11%, transparent);
      border-color: color-mix(in srgb, var(--success-color) 28%, var(--divider-color));
    }
    .recommendation-item.positive ha-icon {
      color: var(--success-color);
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
      background: var(--shs-surface);
      border: 1px solid var(--shs-outline);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      transition: background-color 180ms ease-out, border-color 180ms ease-out;
      cursor: pointer;
    }
    .env-card:hover {
      background: var(--shs-surface-hover);
      border-color: color-mix(in srgb, var(--primary-color) 25%, var(--divider-color));
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
      letter-spacing: 0;
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
      background: var(--shs-surface);
      border: 1px solid var(--shs-outline);
      border-radius: 12px;
      cursor: pointer;
      transition: background-color 180ms ease-out, border-color 180ms ease-out;
    }
    .co2-quality:hover {
      background: var(--shs-surface-hover);
      border-color: color-mix(in srgb, var(--primary-color) 25%, var(--divider-color));
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
    .co2-quality-status.excellent { background: color-mix(in srgb, #4caf50 14%, transparent); color: #4caf50; }
    .co2-quality-status.good { background: color-mix(in srgb, #43a047 14%, transparent); color: #43a047; }
    .co2-quality-status.moderate { background: color-mix(in srgb, #f57c00 14%, transparent); color: #f57c00; }
    .co2-quality-status.poor { background: color-mix(in srgb, #d32f2f 14%, transparent); color: #d32f2f; }
    .co2-quality-status.unhealthy { background: color-mix(in srgb, #c2185b 14%, transparent); color: #c2185b; }

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
      background: var(--shs-surface);
      border-radius: 12px;
      border: 1px solid var(--shs-outline);
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
    .air-quality-status.excellent { background: color-mix(in srgb, #4caf50 14%, transparent); color: #4caf50; }
    .air-quality-status.good { background: color-mix(in srgb, #43a047 14%, transparent); color: #43a047; }
    .air-quality-status.moderate { background: color-mix(in srgb, #f9a825 14%, transparent); color: #f9a825; }
    .air-quality-status.unhealthy-sensitive { background: color-mix(in srgb, #ef6c00 14%, transparent); color: #ef6c00; }
    .air-quality-status.unhealthy { background: color-mix(in srgb, #e53935 14%, transparent); color: #e53935; }
    .air-quality-status.very-unhealthy { background: color-mix(in srgb, #8e24aa 14%, transparent); color: #8e24aa; }
    .air-quality-status.hazardous { background: color-mix(in srgb, #880e4f 14%, transparent); color: #ad476e; }

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
      background: color-mix(in srgb, var(--card-background-color) 88%, var(--secondary-background-color));
      padding: 12px 8px;
      border-radius: 10px;
      text-align: center;
      cursor: pointer;
      transition: background-color 180ms ease-out, border-color 180ms ease-out;
      border: 1px solid var(--shs-outline);
    }
    .pm-item:hover {
      background: var(--shs-surface-hover);
      border-color: color-mix(in srgb, var(--primary-color) 25%, var(--divider-color));
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

    @container (max-width: 430px) {
      ha-card {
        padding: 14px 12px;
      }

      .header {
        align-items: flex-start;
      }

      .header-icon {
        width: 40px;
        height: 40px;
        flex-basis: 40px;
      }

      .status-badge {
        padding: 6px 8px;
      }

      .pm-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .air-quality-section,
      .room-view-container {
        padding: 12px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .header-icon.active,
      .status-alert {
        animation: none;
      }
    }
  `,e([ge({attribute:!1})],Ze.prototype,"hass",void 0),e([me()],Ze.prototype,"_config",void 0),e([me()],Ze.prototype,"_targets",void 0),e([me()],Ze.prototype,"_zones",void 0),e([me()],Ze.prototype,"_environment",void 0),e([me()],Ze.prototype,"_entityPrefix",void 0),e([me()],Ze.prototype,"_deviceName",void 0),e([me()],Ze.prototype,"_entityIds",void 0),e([me()],Ze.prototype,"_showSettings",void 0),e([me()],Ze.prototype,"_rooms",void 0),e([me()],Ze.prototype,"_selectedRoomId",void 0),e([me()],Ze.prototype,"_roomViewMode",void 0),Ze=e([he("smarthomeshop-ultimatesensor-card")],Ze);let Xe=class extends le{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&this._findDevices()}_findDevices(){if(!this.hass?.devices||!this.hass?.entities)return;const e=[];for(const[t,i]of Object.entries(this.hass.devices)){const o=Object.entries(this.hass.entities).filter(([e,i])=>i.device_id===t).map(([e])=>e),a=o.some(e=>e.includes("target_1_x")),r=o.some(e=>e.includes("scd41")||e.includes("bh1750")||e.includes("co2"));(a||r)&&e.push({id:t,name:i.name||i.name_by_user||"UltimateSensor"})}this._devices=e}_valueChanged(e,t){const i={...this._config,[e]:t};"device_id"===e&&delete i.entity_prefix,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){return V`
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
          ${this._devices.map(e=>V`
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
        <label>Card</label>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_header" .checked=${!1!==this._config.show_header}
              @change=${e=>this._valueChanged("show_header",e.target.checked)} />
            <label for="show_header">Header</label>
          </div>
          ${!1!==this._config.show_header?V`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_status" .checked=${!1!==this._config.show_status}
                  @change=${e=>this._valueChanged("show_status",e.target.checked)} />
                <label for="show_status">Presence status</label>
              </div>
            </div>
          `:Y}
        </div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_room_score" .checked=${!1!==this._config.show_room_score}
              @change=${e=>this._valueChanged("show_room_score",e.target.checked)} />
            <label for="show_room_score">Room quality score</label>
          </div>
        </div>
      </div>

      <div class="form-row">
        <label>Environmental sensors</label>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_environment" .checked=${!1!==this._config.show_environment}
              @change=${e=>this._valueChanged("show_environment",e.target.checked)} />
            <label for="show_environment">Climate values</label>
          </div>
          ${!1!==this._config.show_environment?V`
            <div class="nested-options">
              ${[["show_temperature","Temperature"],["show_humidity","Humidity"],["show_co2","CO2"],["show_illuminance","Illuminance"],["show_voc","VOC index"]].map(([e,t])=>V`
                <div class="checkbox-row">
                  <input type="checkbox" id=${e} .checked=${!1!==this._config[e]}
                    @change=${t=>this._valueChanged(e,t.target.checked)} />
                  <label for=${e}>${t}</label>
                </div>
              `)}
              <div class="checkbox-row">
                <input type="checkbox" id="show_co2_bar" .checked=${!1!==this._config.show_co2_bar}
                  @change=${e=>this._valueChanged("show_co2_bar",e.target.checked)} />
                <label for="show_co2_bar">CO2 quality meter</label>
              </div>
            </div>
          `:Y}
        </div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_air_quality" .checked=${!1!==this._config.show_air_quality}
              @change=${e=>this._valueChanged("show_air_quality",e.target.checked)} />
            <label for="show_air_quality">Particulate matter (PM)</label>
          </div>
          ${!1!==this._config.show_air_quality?V`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_pm_gauge" .checked=${!1!==this._config.show_pm_gauge}
                  @change=${e=>this._valueChanged("show_pm_gauge",e.target.checked)} />
                <label for="show_pm_gauge">PM2.5 quality meter</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_pm_values" .checked=${!1!==this._config.show_pm_values}
                  @change=${e=>this._valueChanged("show_pm_values",e.target.checked)} />
                <label for="show_pm_values">PM value cards</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_nox" .checked=${!1!==this._config.show_nox}
                  @change=${e=>this._valueChanged("show_nox",e.target.checked)} />
                <label for="show_nox">NOx index</label>
              </div>
            </div>
          `:Y}
        </div>
      </div>

      <div class="form-row">
        <label>Presence</label>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_radar" .checked=${!1!==this._config.show_radar}
              @change=${e=>this._valueChanged("show_radar",e.target.checked)} />
            <label for="show_radar">Radar or room view</label>
          </div>
          ${!1!==this._config.show_radar?V`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_target_details" .checked=${!1!==this._config.show_target_details}
                  @change=${e=>this._valueChanged("show_target_details",e.target.checked)} />
                <label for="show_target_details">Person distance details</label>
              </div>
            </div>
          `:Y}
        </div>
      </div>

      ${!1!==this._config.show_radar?V`
        <div class="divider"></div>

        <div class="form-row">
          <label>View mode</label>
          <select @change=${e=>this._valueChanged("view_mode",e.target.value)}>
            <option value="radar" ?selected=${"room"!==this._config.view_mode}>Radar view</option>
            <option value="room" ?selected=${"room"===this._config.view_mode}>Room view</option>
          </select>
          <div class="info">Radar shows the sensor view. Room shows your drawn room with live tracking.</div>
        </div>

        ${"room"===this._config.view_mode?V`
          <div class="form-row">
            <label>Default room view</label>
            <select @change=${e=>this._valueChanged("room_view_mode",e.target.value)}>
              <option value="2d" ?selected=${"3d"!==this._config.room_view_mode}>2D floor plan</option>
              <option value="3d" ?selected=${"3d"===this._config.room_view_mode}>3D view</option>
            </select>
            <div class="info">The view the card starts in. You can still switch views on the card.</div>
          </div>
        `:Y}

        ${"room"!==this._config.view_mode?V`
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
        `:Y}
      `:Y}
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
    .option-group {
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: color-mix(
        in srgb,
        var(--secondary-background-color) 72%,
        var(--card-background-color)
      );
      margin-bottom: 10px;
    }
    .nested-options {
      margin: 8px 0 0 25px;
      padding: 8px 0 0 12px;
      border-left: 2px solid var(--divider-color);
    }
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
      background: color-mix(in srgb, var(--primary-color) 8%, var(--card-background-color));
      border: 1px solid color-mix(in srgb, var(--primary-color) 28%, var(--divider-color));
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
  `,e([ge({attribute:!1})],Xe.prototype,"hass",void 0),e([me()],Xe.prototype,"_config",void 0),e([me()],Xe.prototype,"_devices",void 0),Xe=e([he("smarthomeshop-ultimatesensor-card-editor")],Xe);const Be=e=>String(e??"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g," ").trim(),Ke=e=>Be(e).replace(/\s+/g,""),Qe=e=>{const t=(e.identifiers??[]).flatMap(e=>e).join(" ");return Be([e.name,e.name_by_user,e.model,e.manufacturer,t].join(" "))},Je=(e,t)=>{const i=Ke(e);return!t.exclude?.some(e=>i.includes(Ke(e)))&&t.aliases.some(e=>i.includes(Ke(e)))},et=(e,t)=>{if(!e?.devices)return[];const i=new Map;for(const o of Object.values(e.devices))Je(Qe(o),t)&&i.set(o.id,o);if(e.entities)for(const[o,a]of Object.entries(e.entities)){if(!a.device_id)continue;const r=e.states[o],s=`${o} ${r?.attributes.friendly_name??""}`;if(!Je(s,t))continue;const n=e.devices[a.device_id];n&&i.set(n.id,n)}return[...i.values()].sort((e,t)=>tt(e).localeCompare(tt(t)))},tt=e=>e?.name_by_user||e?.name||e?.model||"SmartHomeShop device",it=(e,t,i)=>t&&e?.devices?.[t]?e.devices[t]:et(e,i)[0],ot=e=>(e??[]).map(Ke).filter(Boolean),at=(e,t)=>{const[i,o=""]=e.entityId.split(".",2);if(t.domains&&!t.domains.includes(i))return-1;const a=String(e.state.attributes.friendly_name??""),r=Ke(o),s=Ke(a),n=`${r}${s}`;if(ot(t.excludes).some(e=>n.includes(e)))return-1;let c=0,l=!1;const d=ot(t.suffixes);for(const e of d)r.endsWith(e)?(c=Math.max(c,120+e.length),l=!0):s.endsWith(e)&&(c=Math.max(c,105+e.length),l=!0);const h=ot(t.exactNames);for(const e of h)r!==e&&s!==e||(c=Math.max(c,140+e.length),l=!0);const p=ot(t.includesAll);p.length>0&&p.every(e=>n.includes(e))&&(c=Math.max(c,70+p.reduce((e,t)=>e+t.length,0)),l=!0);const u=ot(t.includesAny).filter(e=>n.includes(e));u.length>0&&(c=Math.max(c,40+u.reduce((e,t)=>e+t.length,0)),l=!0);const g=Ke(e.state.attributes.device_class);ot(t.deviceClasses).includes(g)&&(c+=18,l=!0);const m=Ke(e.state.attributes.unit_of_measurement);return ot(t.units).includes(m)&&(c+=8,l=!0),l?("unknown"!==e.state.state&&"unavailable"!==e.state.state&&(c+=4),"esphome"===e.registry?.platform&&(c+=2),c):-1},rt=(e,t,i,o)=>{if(!e)return;let a;for(const r of((e,t,i)=>{const o=[];for(const[a,r]of Object.entries(e.states)){const s=e.entities?.[a];if(!t||!e.entities||s?.device_id===t){if(!t&&i){const e=`${a} ${r.attributes.friendly_name??""}`;if(!Je(e,i))continue}o.push({entityId:a,state:r,registry:s})}}return o})(e,t,o)){const e=at(r,i);e<0||a&&a.score>=e||(a={entityId:r.entityId,score:e})}return a?.entityId},st=(e,t)=>{if(!e||!t)return null;const i=e.states[t]?.state;if(!i||"unknown"===i||"unavailable"===i)return null;const o=Number(i);return Number.isFinite(o)?o:null},nt=(e,t)=>{if(!e||!t)return null;const i=e.states[t]?.state;return i&&"unknown"!==i&&"unavailable"!==i?!!["on","home","open","detected","occupied","true"].includes(i.toLowerCase())||!["off","not_home","closed","clear","idle","false"].includes(i.toLowerCase())&&null:null},ct=(e,t)=>t&&e?.states[t]?.attributes.unit_of_measurement||"",lt=(e,t)=>{if(!e||!t||!e.entities)return{offline:!1,lastSeen:null,hasEntities:!1};let i=!1,o=!1,a=null,r=null;for(const[s,n]of Object.entries(e.entities)){if(n.device_id!==t||n.disabled_by)continue;const c=e.states[s];if(c)if(i=!0,"connectivity"!==c.attributes.device_class)"esphome"===n.platform&&"unavailable"!==c.state&&(o=!0),c.last_changed&&(!a||c.last_changed>a)&&(a=c.last_changed);else{if("on"===c.state)return{offline:!1,lastSeen:null,hasEntities:!0};"off"===c.state&&(r=c.last_changed)}}return r?{offline:!0,lastSeen:r,hasEntities:i}:{offline:i&&!o,lastSeen:a,hasEntities:i}},dt=(e,t=0,i="—")=>null===e?i:new Intl.NumberFormat(void 0,{minimumFractionDigits:t,maximumFractionDigits:t}).format(e),ht=e=>{if(null===e)return{value:"—",unit:"W"};const t=Math.abs(e);return t>=1e3?{value:dt(t/1e3,t>=1e4?1:2),unit:"kW"}:{value:dt(t,0),unit:"W"}},pt={aliases:["p1meterkit","p1 meter kit"],exclude:["waterp1meterkit","water p1 meter kit"]},ut={show_header:!0,show_status:!0,show_power_flow:!0,show_energy_totals:!0,show_phases:!0,show_insights:!0,show_gas:!0,show_environment:!0};let gt=class extends le{constructor(){super(...arguments),this._config={...ut},this._cachedEntities={}}setConfig(e){this._config={...ut,...e},this._cachedDeviceId=void 0}getCardSize(){return 6}static getConfigElement(){return document.createElement("smarthomeshop-p1meterkit-card-editor")}static getStubConfig(){return{...ut}}_device(){return it(this.hass,this._config.device_id,pt)}_resolveEntities(){const e=this._device(),t=e?.id;if(this._cachedDeviceId===t&&this._cachedRegistry===this.hass?.entities)return this._cachedEntities;const i=e=>rt(this.hass,t,e,pt);return this._cachedEntities={connectivity:i({domains:["binary_sensor"],deviceClasses:["connectivity"]}),powerConsumed:i({domains:["sensor"],suffixes:["power_consumed"],excludes:["phase","net"]}),powerProduced:i({domains:["sensor"],suffixes:["power_produced"],excludes:["phase"]}),netPower:i({domains:["sensor"],suffixes:["net_grid_power_cc","net_power_cc"],includesAll:["net","power"]}),consumedTariff1:i({domains:["sensor"],suffixes:["energy_consumed_tariff_1"]}),consumedTariff2:i({domains:["sensor"],suffixes:["energy_consumed_tariff_2"]}),producedTariff1:i({domains:["sensor"],suffixes:["energy_produced_tariff_1"]}),producedTariff2:i({domains:["sensor"],suffixes:["energy_produced_tariff_2"]}),currentPhase1:i({domains:["sensor"],suffixes:["current_phase_1"]}),currentPhase2:i({domains:["sensor"],suffixes:["current_phase_2"]}),currentPhase3:i({domains:["sensor"],suffixes:["current_phase_3"]}),powerPhase1:i({domains:["sensor"],suffixes:["power_consumed_phase_1"]}),powerPhase2:i({domains:["sensor"],suffixes:["power_consumed_phase_2"]}),powerPhase3:i({domains:["sensor"],suffixes:["power_consumed_phase_3"]}),standbyPower:i({domains:["sensor"],suffixes:["standby_power_cc"]}),standbyCost:i({domains:["sensor"],suffixes:["standby_cost_per_year_cc","standby_cost_year_cc"]}),monthPeak:i({domains:["sensor"],suffixes:["month_peak_cc"]}),costToday:i({domains:["sensor"],suffixes:["energy_cost_today_cc"]}),costMonth:i({domains:["sensor"],suffixes:["energy_cost_this_month_cc","energy_cost_month_cc"]}),phaseMaxLoad:i({domains:["sensor"],suffixes:["highest_phase_load_cc","phase_max_load_cc"]}),availableGridPower:i({domains:["sensor"],suffixes:["available_grid_power_cc"]}),gas:i({domains:["sensor"],suffixes:["gas_consumed"],deviceClasses:["gas"]}),temperature:i({domains:["sensor"],suffixes:["temperature"],deviceClasses:["temperature"],excludes:["cpu"]}),humidity:i({domains:["sensor"],suffixes:["humidity"],deviceClasses:["humidity"]})},this._cachedDeviceId=t,this._cachedRegistry=this.hass?.entities,this._cachedEntities}_watts(e){const t=st(this.hass,e);return null===t?null:"kw"===ct(this.hass,e).toLowerCase()?1e3*t:t}_metric(e,t,i=2,o){const a=st(this.hass,t);if(null===a)return Y;const r=o??ct(this.hass,t);return V`
      <button class="metric" type="button" @click=${()=>t&&$e(this,t)}>
        <div class="metric-label">${e}</div>
        <div class="metric-value">${dt(a,i)}<span>${r}</span></div>
      </button>
    `}_phase(e,t,i,o){const a=st(this.hass,t),r=this._watts(i);if(null===a&&null===r)return Y;const s=null===a||o<=0?0:Math.min(100,a/o*100),n=ht(r);return V`
      <div class="phase">
        <div class="phase-top">
          <span class="phase-name">${e}</span>
          <span class="phase-current">${dt(a,1)}<span>A</span></span>
        </div>
        <div class="phase-bar"><span style="width:${s}%"></span></div>
        <div class="phase-power">${n.value} ${n.unit}</div>
      </div>
    `}render(){if(!this.hass)return Y;const e=this._device(),t=this._resolveEntities(),i=Pe("p1meterkit");if(!e)return V`
        <ha-card>
          <div class="card-content">
            <div class="empty-state">
              ${i?V`<span class="product-logo">${ye(i)}</span>`:V`<ha-icon icon="mdi:meter-electric-outline"></ha-icon>`}
              <strong>No P1MeterKit found</strong>
              <span>Add the P1MeterKit to Home Assistant or select its device in the card editor.</span>
            </div>
          </div>
        </ha-card>
      `;const o=lt(this.hass,e.id),a=this._watts(t.powerConsumed)??0,r=this._watts(t.powerProduced)??0,s=this._watts(t.netPower)??a-r,n=s>10?"importing":s<-10?"exporting":"balanced",c="importing"===n?"Importing":"exporting"===n?"Exporting":"Balanced",l=ht(s),d=ht(a),h=ht(r),p=[st(this.hass,t.currentPhase1),st(this.hass,t.currentPhase2),st(this.hass,t.currentPhase3)],u=Math.max(1,...p.map(e=>e??0)),g=p.some(e=>null!==e),m=[t.consumedTariff1,t.consumedTariff2,t.producedTariff1,t.producedTariff2].some(e=>null!==st(this.hass,e)),f=[t.costToday,t.costMonth,t.standbyPower,t.standbyCost,t.monthPeak,t.phaseMaxLoad,t.availableGridPower].some(e=>null!==st(this.hass,e)),v=null!==st(this.hass,t.temperature)||null!==st(this.hass,t.humidity);return V`
      <ha-card>
        <div class="card-content">
          ${!1!==this._config.show_header?V`
            <div class="header">
              <div class="header-left">
                <div class="header-icon">
                  ${i?ye(i):V`<ha-icon icon="mdi:meter-electric-outline"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${this._config.title||tt(e)}</h2>
                  <div class="header-subtitle">Energy monitoring</div>
                </div>
              </div>
              ${!1!==this._config.show_status?V`
                <div class="status-badge ${o.offline?"offline":n}">
                  <ha-icon icon="${o.offline?"mdi:lan-disconnect":"exporting"===n?"mdi:transmission-tower-export":"importing"===n?"mdi:transmission-tower-import":"mdi:check-circle"}"></ha-icon>
                  <span>${o.offline?"Offline":c}</span>
                </div>
              `:Y}
            </div>
          `:Y}

          ${!1!==this._config.show_power_flow?V`
            <div class="power-flow">
              <button class="power-side" type="button" @click=${()=>t.powerConsumed&&$e(this,t.powerConsumed)}>
                <div class="power-label"><ha-icon icon="mdi:transmission-tower-import"></ha-icon>From grid</div>
                <div class="power-reading">${d.value}<span>${d.unit}</span></div>
              </button>
              <div class="net-power">
                <div class="net-icon"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></div>
                <div class="net-value">${l.value} ${l.unit}</div>
                <div class="net-caption">${c}</div>
              </div>
              <button class="power-side export" type="button" @click=${()=>t.powerProduced&&$e(this,t.powerProduced)}>
                <div class="power-label">To grid<ha-icon icon="mdi:transmission-tower-export"></ha-icon></div>
                <div class="power-reading">${h.value}<span>${h.unit}</span></div>
              </button>
            </div>
          `:Y}

          ${!1!==this._config.show_phases&&g?V`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:sine-wave"></ha-icon>Phase load</div>
              <div class="phase-grid">
                ${this._phase("L1",t.currentPhase1,t.powerPhase1,u)}
                ${this._phase("L2",t.currentPhase2,t.powerPhase2,u)}
                ${this._phase("L3",t.currentPhase3,t.powerPhase3,u)}
              </div>
            </section>
          `:Y}

          ${!1!==this._config.show_energy_totals&&m?V`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:counter"></ha-icon>Meter totals</div>
              <div class="metric-grid">
                ${this._metric("Imported · tariff 1",t.consumedTariff1,3)}
                ${this._metric("Imported · tariff 2",t.consumedTariff2,3)}
                ${this._metric("Returned · tariff 1",t.producedTariff1,3)}
                ${this._metric("Returned · tariff 2",t.producedTariff2,3)}
              </div>
            </section>
          `:Y}

          ${!1!==this._config.show_insights&&f?V`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:chart-box-outline"></ha-icon>Energy insights</div>
              <div class="metric-grid">
                ${this._metric("Cost today",t.costToday,2)}
                ${this._metric("Cost this month",t.costMonth,2)}
                ${this._metric("Standby power",t.standbyPower,0)}
                ${this._metric("Standby cost / year",t.standbyCost,0)}
                ${this._metric("Month peak",t.monthPeak,2)}
                ${this._metric("Highest phase load",t.phaseMaxLoad,0)}
                ${this._metric("Grid capacity available",t.availableGridPower,0)}
              </div>
            </section>
          `:Y}

          ${!1!==this._config.show_gas&&null!==st(this.hass,t.gas)?V`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:fire"></ha-icon>Gas</div>
              <div class="metric-grid">${this._metric("Total gas consumed",t.gas,3)}</div>
            </section>
          `:Y}

          ${!1!==this._config.show_environment&&v?V`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:thermometer-lines"></ha-icon>Meter environment</div>
              <div class="metric-grid">
                ${this._metric("Temperature",t.temperature,1)}
                ${this._metric("Humidity",t.humidity,0)}
              </div>
            </section>
          `:Y}
        </div>
      </ha-card>
    `}};gt.styles=[Me,s`
      .card-content {
        display: grid;
        gap: 14px;
      }

      .header { margin-bottom: 0; }
      .header-icon {
        background: color-mix(in srgb, var(--warning-color) 14%, transparent);
        color: var(--warning-color);
      }
      .header-icon svg { color: currentColor; }

      .status-badge.offline {
        background: color-mix(in srgb, var(--error-color) 14%, transparent);
        color: var(--error-color);
      }
      .status-badge.importing {
        background: color-mix(in srgb, var(--warning-color) 14%, transparent);
        color: color-mix(in srgb, var(--warning-color) 88%, var(--primary-text-color));
      }
      .status-badge.exporting {
        background: color-mix(in srgb, var(--success-color) 14%, transparent);
        color: var(--success-color);
      }
      .status-badge.balanced {
        background: var(--shs-surface);
        color: var(--secondary-text-color);
      }

      .power-flow {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: stretch;
        gap: 10px;
      }
      .power-side,
      .net-power {
        border: 1px solid var(--shs-outline);
        border-radius: 12px;
        background: var(--shs-surface);
      }
      .power-side {
        appearance: none;
        color: inherit;
        font: inherit;
        min-width: 0;
        padding: 13px;
        text-align: left;
        cursor: pointer;
        transition: border-color 160ms ease, background-color 160ms ease;
      }
      .power-side:hover {
        border-color: color-mix(in srgb, var(--primary-color) 38%, var(--divider-color));
        background: var(--shs-surface-hover);
      }
      .power-side.export { text-align: right; }
      .power-label {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--secondary-text-color);
        font-size: 11px;
        font-weight: 650;
        text-transform: uppercase;
      }
      .power-side.export .power-label { justify-content: flex-end; }
      .power-label ha-icon { --mdc-icon-size: 17px; }
      .power-reading {
        margin-top: 8px;
        color: var(--primary-text-color);
        font-size: 25px;
        font-weight: 700;
        line-height: 1;
      }
      .power-reading span {
        margin-left: 3px;
        color: var(--secondary-text-color);
        font-size: 12px;
        font-weight: 550;
      }
      .net-power {
        width: 88px;
        padding: 10px 8px;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 4px;
        text-align: center;
      }
      .net-icon {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--primary-color) 13%, transparent);
        color: var(--primary-color);
      }
      .net-icon ha-icon { --mdc-icon-size: 20px; }
      .net-value { font-size: 14px; font-weight: 700; color: var(--primary-text-color); }
      .net-caption { font-size: 10px; color: var(--secondary-text-color); }

      .section {
        display: grid;
        gap: 9px;
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 650;
      }
      .section-title ha-icon { --mdc-icon-size: 18px; color: var(--secondary-text-color); }
      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .metric {
        appearance: none;
        min-width: 0;
        border: 1px solid var(--shs-outline);
        border-radius: 10px;
        background: var(--shs-surface);
        color: inherit;
        font: inherit;
        padding: 11px;
        text-align: left;
        cursor: pointer;
      }
      .metric:hover { background: var(--shs-surface-hover); }
      .metric-label {
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 600;
        line-height: 1.25;
        text-transform: uppercase;
      }
      .metric-value {
        margin-top: 5px;
        overflow: hidden;
        color: var(--primary-text-color);
        font-size: 17px;
        font-weight: 680;
        line-height: 1.15;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .metric-value span {
        margin-left: 3px;
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 500;
      }

      .phase-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .phase {
        border: 1px solid var(--shs-outline);
        border-radius: 10px;
        padding: 10px;
        background: var(--shs-surface);
      }
      .phase-top { display: flex; align-items: baseline; justify-content: space-between; gap: 4px; }
      .phase-name { color: var(--secondary-text-color); font-size: 10px; font-weight: 700; }
      .phase-current { color: var(--primary-text-color); font-size: 14px; font-weight: 700; }
      .phase-current span { color: var(--secondary-text-color); font-size: 9px; }
      .phase-bar {
        height: 4px;
        margin-top: 8px;
        overflow: hidden;
        border-radius: 2px;
        background: color-mix(in srgb, var(--divider-color) 75%, transparent);
      }
      .phase-bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--primary-color);
      }
      .phase-power { margin-top: 6px; color: var(--secondary-text-color); font-size: 10px; }

      .empty-state {
        display: grid;
        place-items: center;
        gap: 8px;
        min-height: 140px;
        padding: 20px;
        border: 1px dashed var(--shs-outline);
        border-radius: 12px;
        color: var(--secondary-text-color);
        text-align: center;
      }
      .empty-state ha-icon { --mdc-icon-size: 30px; color: var(--warning-color); }
      .empty-state .product-logo {
        display: block;
        width: 38px;
        height: 38px;
        color: var(--warning-color);
      }
      .empty-state .product-logo svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .empty-state strong { color: var(--primary-text-color); }
      .empty-state span { max-width: 300px; font-size: 12px; line-height: 1.45; }

      @container (max-width: 390px) {
        .card-content { padding: 13px; gap: 12px; }
        .power-flow { grid-template-columns: minmax(0, 1fr) 70px minmax(0, 1fr); gap: 6px; }
        .power-side { padding: 10px; }
        .power-reading { font-size: 20px; }
        .net-power { width: 52px; }
        .header-title { font-size: 0.95rem; }
        .status-badge { padding: 5px 8px; }
      }
    `],e([ge({attribute:!1})],gt.prototype,"hass",void 0),e([me()],gt.prototype,"_config",void 0),gt=e([he("smarthomeshop-p1meterkit-card")],gt);let mt=class extends le{constructor(){super(...arguments),this._config={...ut}}setConfig(e){this._config={...ut,...e}}_change(e,t){this._config={...this._config,[e]:t},this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}render(){const e=et(this.hass,pt);return V`
      <div class="editor">
        <div class="field">
          <label for="device">P1MeterKit device</label>
          <select id="device" .value=${this._config.device_id??""} @change=${e=>this._change("device_id",e.target.value)}>
            <option value="">Automatic</option>
            ${e.map(e=>V`<option value=${e.id}>${tt(e)}</option>`)}
          </select>
          <div class="hint">The card links entities through the Home Assistant device registry, so renamed entity IDs keep working.</div>
        </div>
        <div class="field">
          <label for="title">Card title</label>
          <input id="title" type="text" .value=${this._config.title??""} placeholder="Use device name" @input=${e=>this._change("title",e.target.value)}>
        </div>
        <div class="options">
          <div class="group-title">Visible sections</div>
          ${[["show_header","Header"],["show_status","Connection and grid status"],["show_power_flow","Live import and export"],["show_phases","Phase load"],["show_energy_totals","Meter totals"],["show_insights","Costs, peak and standby insights"],["show_gas","Gas meter"],["show_environment","Meter temperature and humidity"]].map(([e,t])=>V`
            <label class="check">
              <input type="checkbox" .checked=${!1!==this._config[e]} @change=${t=>this._change(e,t.target.checked)}>
              <span>${t}</span>
            </label>
          `)}
        </div>
      </div>
    `}};mt.styles=s`
    :host { display: block; }
    .editor { display: grid; gap: 16px; padding: 4px 0; }
    .field { display: grid; gap: 6px; }
    label, .group-title { color: var(--primary-text-color); font-size: 13px; font-weight: 600; }
    select, input[type='text'] {
      width: 100%;
      box-sizing: border-box;
      min-height: 42px;
      padding: 9px 11px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
    }
    .options {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: var(--secondary-background-color);
    }
    .check { display: flex; align-items: center; gap: 9px; color: var(--primary-text-color); font-size: 13px; }
    .check input { width: 18px; height: 18px; margin: 0; accent-color: var(--primary-color); }
    .hint { color: var(--secondary-text-color); font-size: 11px; line-height: 1.4; }
  `,e([ge({attribute:!1})],mt.prototype,"hass",void 0),e([me()],mt.prototype,"_config",void 0),mt=e([he("smarthomeshop-p1meterkit-card-editor")],mt);const ft={aliases:["ceilsense","ceil sense"]},vt={show_header:!0,show_status:!0,show_presence:!0,show_zones:!0,show_distances:!0,show_environment:!0,show_room_quality:!0};let _t=class extends le{constructor(){super(...arguments),this._config={...vt},this._cachedEntities={zoneCounts:[],zoneOccupancy:[]}}setConfig(e){this._config={...vt,...e},this._cachedDeviceId=void 0}getCardSize(){return 6}static getConfigElement(){return document.createElement("smarthomeshop-ceilsense-card-editor")}static getStubConfig(){return{...vt}}_device(){return it(this.hass,this._config.device_id,ft)}_resolveEntities(){const e=this._device(),t=e?.id;if(this._cachedDeviceId===t&&this._cachedRegistry===this.hass?.entities)return this._cachedEntities;const i=e=>rt(this.hass,t,e,ft);return this._cachedEntities={presence:i({domains:["binary_sensor"],suffixes:["presence","occupancy"],includesAny:["presence","occupancy"],excludes:["zone"]}),movingTarget:i({domains:["binary_sensor"],suffixes:["moving_target"]}),stillTarget:i({domains:["binary_sensor"],suffixes:["still_target"]}),targetCount:i({domains:["sensor"],suffixes:["target_count"],excludes:["zone","moving","still"]}),movingTargetCount:i({domains:["sensor"],suffixes:["moving_target_count"]}),stillTargetCount:i({domains:["sensor"],suffixes:["still_target_count"]}),movingDistance:i({domains:["sensor"],suffixes:["moving_distance"]}),stillDistance:i({domains:["sensor"],suffixes:["still_distance"]}),detectionDistance:i({domains:["sensor"],suffixes:["detection_distance"]}),moveEnergy:i({domains:["sensor"],suffixes:["move_energy"]}),stillEnergy:i({domains:["sensor"],suffixes:["still_energy"]}),target1X:i({domains:["sensor"],suffixes:["target_1_x"]}),target1Y:i({domains:["sensor"],suffixes:["target_1_y"]}),target2X:i({domains:["sensor"],suffixes:["target_2_x"]}),target2Y:i({domains:["sensor"],suffixes:["target_2_y"]}),target3X:i({domains:["sensor"],suffixes:["target_3_x"]}),target3Y:i({domains:["sensor"],suffixes:["target_3_y"]}),zoneCounts:[1,2,3,4].map(e=>i({domains:["sensor"],suffixes:[`zone_${e}_target_count`]})),zoneOccupancy:[1,2,3,4].map(e=>i({domains:["binary_sensor"],suffixes:[`zone_${e}_occupancy`,`zone_${e}_presence`]})),temperature:i({domains:["sensor"],suffixes:["scd41_temperature","temperature"],deviceClasses:["temperature"],excludes:["cpu","bmp"]}),humidity:i({domains:["sensor"],suffixes:["scd41_humidity","humidity"],deviceClasses:["humidity"]}),co2:i({domains:["sensor"],suffixes:["scd41_co2","co2"],deviceClasses:["carbon_dioxide"]}),illuminance:i({domains:["sensor"],suffixes:["bh1750_illuminance","illuminance"],deviceClasses:["illuminance"]}),pressure:i({domains:["sensor"],suffixes:["pressure"],deviceClasses:["atmospheric_pressure"]}),roomQualityScore:i({domains:["sensor"],suffixes:["room_quality_score_cc","room_quality_percentage_cc"]}),roomQualityLabel:i({domains:["sensor"],suffixes:["room_quality_label_cc"]})},this._cachedDeviceId=t,this._cachedRegistry=this.hass?.entities,this._cachedEntities}_metric(e,t,i,o=0){const a=st(this.hass,i);return null===a?Y:V`
      <button class="metric" type="button" @click=${()=>i&&$e(this,i)}>
        <div class="metric-head">
          <div class="metric-icon"><ha-icon icon=${t}></ha-icon></div>
          <div class="metric-label">${e}</div>
        </div>
        <div class="metric-value">${dt(a,o)}<span>${ct(this.hass,i)}</span></div>
      </button>
    `}_targetPositions(e,t){const i=[[e.target1X,e.target1Y],[e.target2X,e.target2Y],[e.target3X,e.target3Y]].flatMap(([e,t])=>{const i=st(this.hass,e),o=st(this.hass,t);return null===i||null===o||0===i&&0===o?[]:[{left:Math.max(10,Math.min(90,50+i/6e3*45)),top:Math.max(12,Math.min(78,84-o/6e3*70))}]});return 0===i.length&&t?[{left:50,top:38}]:i}render(){if(!this.hass)return Y;const e=this._device(),t=this._resolveEntities(),i=Pe("ceilsense");if(!e)return V`
        <ha-card>
          <div class="card-content">
            <div class="empty-state">
              ${i?V`<span class="product-logo">${ye(i)}</span>`:V`<ha-icon icon="mdi:ceiling-light-outline"></ha-icon>`}
              <strong>No CeilSense found</strong>
              <span>Add a CeilSense to Home Assistant or select its device in the card editor.</span>
            </div>
          </div>
        </ha-card>
      `;const o=lt(this.hass,e.id),a=!0===nt(this.hass,t.presence),r=!0===nt(this.hass,t.movingTarget),s=!0===nt(this.hass,t.stillTarget),n=st(this.hass,t.targetCount)??(st(this.hass,t.movingTargetCount)??0)+(st(this.hass,t.stillTargetCount)??0),c=((e,t)=>{if(!e||!t)return null;const i=e.states[t]?.last_changed;if(!i)return null;const o=Math.max(0,Date.now()-new Date(i).getTime()),a=Math.floor(o/6e4);if(a<1)return"just now";if(a<60)return`${a} min ago`;const r=Math.floor(a/60);return r<24?`${r} h ago`:`${Math.floor(r/24)} d ago`})(this.hass,t.presence),l=this._targetPositions(t,a),d=t.zoneCounts.map((e,i)=>{const o=st(this.hass,e),a=!0===nt(this.hass,t.zoneOccupancy[i])||(o??0)>0;return{entityId:e??t.zoneOccupancy[i],count:o,active:a,index:i+1}}).filter(e=>e.entityId),h=[t.movingDistance,t.stillDistance,t.detectionDistance,t.moveEnergy,t.stillEnergy].some(e=>null!==st(this.hass,e)),p=[t.temperature,t.humidity,t.co2,t.illuminance,t.pressure].some(e=>null!==st(this.hass,e)),u=st(this.hass,t.roomQualityScore),g=t.roomQualityLabel?this.hass.states[t.roomQualityLabel]?.state:void 0;return V`
      <ha-card>
        <div class="card-content">
          ${!1!==this._config.show_header?V`
            <div class="header">
              <div class="header-left">
                <div class="header-icon">
                  ${i?ye(i):V`<ha-icon icon="mdi:ceiling-light-outline"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${this._config.title||tt(e)}</h2>
                  <div class="header-subtitle">Ceiling presence & climate</div>
                </div>
              </div>
              ${!1!==this._config.show_status?V`
                <div class="status-badge ${o.offline?"offline":a?"occupied":"clear"}">
                  <ha-icon icon="${o.offline?"mdi:lan-disconnect":a?"mdi:account-radar":"mdi:check-circle"}"></ha-icon>
                  <span>${o.offline?"Offline":a?"Occupied":"Clear"}</span>
                </div>
              `:Y}
            </div>
          `:Y}

          ${!1!==this._config.show_presence?V`
            <div class="presence-panel">
              <div class="presence-copy">
                <div class="presence-kicker"><ha-icon icon="mdi:motion-sensor"></ha-icon>Live presence</div>
                <div class="presence-title">${a?`${dt(n,0)} ${1===n?"person":"people"}`:"Room clear"}</div>
                <div class="presence-detail">${c?`Changed ${c}`:"Waiting for presence data"}</div>
                <div class="presence-types">
                  <span class="presence-chip ${r?"active":""}"><ha-icon icon="mdi:run"></ha-icon>Moving</span>
                  <span class="presence-chip ${s?"active":""}"><ha-icon icon="mdi:human-handsdown"></ha-icon>Still</span>
                </div>
              </div>
              <div class="radar" @click=${()=>t.presence&&$e(this,t.presence)}>
                <div class="radar-ring one"></div>
                <div class="radar-ring two"></div>
                <div class="radar-ring three"></div>
                <div class="radar-sensor"><ha-icon icon="mdi:radar"></ha-icon></div>
                ${l.map(e=>V`<span class="radar-target" style="left:${e.left}%;top:${e.top}%"></span>`)}
              </div>
            </div>
          `:Y}

          ${!1!==this._config.show_room_quality&&null!==u?V`
            <div class="quality" @click=${()=>t.roomQualityScore&&$e(this,t.roomQualityScore)}>
              <div class="quality-icon"><ha-icon icon="mdi:home-heart"></ha-icon></div>
              <div>
                <div class="quality-label">${g&&!["unknown","unavailable"].includes(g.toLowerCase())?g:"Room quality"}</div>
                <div class="quality-subtitle">Combined climate assessment</div>
              </div>
              <div class="quality-score">${dt(u,0)}<span>/100</span></div>
            </div>
          `:Y}

          ${!1!==this._config.show_zones&&d.length>0?V`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:floor-plan"></ha-icon>Detection zones</div>
              <div class="zone-list">
                ${d.map(e=>V`
                  <div class="zone ${e.active?"active":""}" @click=${()=>e.entityId&&$e(this,e.entityId)}>
                    <span class="zone-index">${e.index}</span>
                    <span class="zone-name">Zone ${e.index}</span>
                    <span class="zone-state">${e.active?`${dt(e.count??1,0)} active`:"Clear"}</span>
                  </div>
                `)}
              </div>
            </section>
          `:Y}

          ${!1!==this._config.show_distances&&h?V`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:signal-distance-variant"></ha-icon>Detection detail</div>
              <div class="metric-grid">
                ${this._metric("Moving distance","mdi:run",t.movingDistance,0)}
                ${this._metric("Still distance","mdi:human-handsdown",t.stillDistance,0)}
                ${this._metric("Detection distance","mdi:signal-distance-variant",t.detectionDistance,0)}
                ${this._metric("Movement energy","mdi:waveform",t.moveEnergy,0)}
                ${this._metric("Still energy","mdi:chart-bell-curve",t.stillEnergy,0)}
              </div>
            </section>
          `:Y}

          ${!1!==this._config.show_environment&&p?V`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:home-thermometer-outline"></ha-icon>Room climate</div>
              <div class="metric-grid">
                ${this._metric("Temperature","mdi:thermometer",t.temperature,1)}
                ${this._metric("Humidity","mdi:water-percent",t.humidity,0)}
                ${this._metric("CO₂","mdi:molecule-co2",t.co2,0)}
                ${this._metric("Illuminance","mdi:brightness-5",t.illuminance,0)}
                ${this._metric("Air pressure","mdi:gauge",t.pressure,0)}
              </div>
            </section>
          `:Y}
        </div>
      </ha-card>
    `}};_t.styles=[Me,s`
      .card-content { display: grid; gap: 14px; }
      .header { margin-bottom: 0; }
      .header-icon {
        background: color-mix(in srgb, var(--info-color) 14%, transparent);
        color: var(--info-color);
      }
      .status-badge.offline {
        background: color-mix(in srgb, var(--error-color) 14%, transparent);
        color: var(--error-color);
      }
      .status-badge.occupied {
        background: color-mix(in srgb, var(--success-color) 15%, transparent);
        color: var(--success-color);
      }
      .status-badge.clear {
        background: var(--shs-surface);
        color: var(--secondary-text-color);
      }

      .presence-panel {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 132px;
        min-height: 142px;
        overflow: hidden;
        border: 1px solid var(--shs-outline);
        border-radius: 14px;
        background: var(--shs-surface);
      }
      .presence-copy {
        display: grid;
        align-content: center;
        gap: 7px;
        min-width: 0;
        padding: 18px;
      }
      .presence-kicker {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--secondary-text-color);
        font-size: 11px;
        font-weight: 650;
        text-transform: uppercase;
      }
      .presence-kicker ha-icon { --mdc-icon-size: 17px; }
      .presence-title {
        color: var(--primary-text-color);
        font-size: 25px;
        font-weight: 720;
        line-height: 1.05;
      }
      .presence-detail {
        color: var(--secondary-text-color);
        font-size: 12px;
        line-height: 1.35;
      }
      .presence-types { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 3px; }
      .presence-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 24px;
        padding: 0 8px;
        border-radius: 12px;
        background: var(--card-background-color);
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 600;
      }
      .presence-chip.active {
        background: color-mix(in srgb, var(--success-color) 13%, var(--card-background-color));
        color: var(--success-color);
      }
      .presence-chip ha-icon { --mdc-icon-size: 14px; }

      .radar {
        position: relative;
        overflow: hidden;
        border-left: 1px solid var(--shs-outline);
        background: color-mix(in srgb, var(--info-color) 7%, var(--card-background-color));
      }
      .radar-ring {
        position: absolute;
        left: 50%;
        bottom: -22px;
        border: 1px solid color-mix(in srgb, var(--info-color) 24%, transparent);
        border-radius: 50%;
        transform: translateX(-50%);
      }
      .radar-ring.one { width: 58px; height: 58px; }
      .radar-ring.two { width: 106px; height: 106px; }
      .radar-ring.three { width: 158px; height: 158px; }
      .radar-sensor {
        position: absolute;
        left: 50%;
        bottom: 8px;
        z-index: 2;
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--primary-color);
        color: var(--text-primary-color);
        transform: translateX(-50%);
      }
      .radar-sensor ha-icon { --mdc-icon-size: 18px; }
      .radar-target {
        position: absolute;
        z-index: 3;
        width: 11px;
        height: 11px;
        border: 2px solid color-mix(in srgb, var(--success-color) 48%, white);
        border-radius: 50%;
        background: var(--success-color);
        box-shadow: 0 0 0 5px color-mix(in srgb, var(--success-color) 12%, transparent);
        transform: translate(-50%, -50%);
      }

      .section { display: grid; gap: 9px; }
      .section-title {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 650;
      }
      .section-title ha-icon { --mdc-icon-size: 18px; color: var(--secondary-text-color); }
      .metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .metric {
        appearance: none;
        min-width: 0;
        padding: 11px;
        border: 1px solid var(--shs-outline);
        border-radius: 10px;
        background: var(--shs-surface);
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .metric:hover { background: var(--shs-surface-hover); }
      .metric-head { display: flex; align-items: center; gap: 7px; }
      .metric-icon {
        width: 28px;
        height: 28px;
        flex: 0 0 28px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: color-mix(in srgb, var(--info-color) 12%, transparent);
        color: var(--info-color);
      }
      .metric-icon ha-icon { --mdc-icon-size: 17px; }
      .metric-label {
        overflow: hidden;
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 600;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .metric-value {
        margin-top: 7px;
        color: var(--primary-text-color);
        font-size: 17px;
        font-weight: 680;
      }
      .metric-value span { margin-left: 3px; color: var(--secondary-text-color); font-size: 10px; font-weight: 500; }

      .zone-list { display: grid; gap: 7px; }
      .zone {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        min-height: 42px;
        padding: 0 11px;
        border: 1px solid var(--shs-outline);
        border-radius: 10px;
        background: var(--shs-surface);
      }
      .zone-index {
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: color-mix(in srgb, var(--info-color) 12%, transparent);
        color: var(--info-color);
        font-size: 11px;
        font-weight: 700;
      }
      .zone-name { color: var(--primary-text-color); font-size: 12px; font-weight: 600; }
      .zone-state { color: var(--secondary-text-color); font-size: 11px; }
      .zone.active { border-color: color-mix(in srgb, var(--success-color) 42%, var(--divider-color)); }
      .zone.active .zone-index { background: color-mix(in srgb, var(--success-color) 14%, transparent); color: var(--success-color); }

      .quality {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        padding: 12px;
        border: 1px solid var(--shs-outline);
        border-radius: 11px;
        background: var(--shs-surface);
      }
      .quality-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        background: color-mix(in srgb, var(--success-color) 13%, transparent);
        color: var(--success-color);
      }
      .quality-icon ha-icon { --mdc-icon-size: 20px; }
      .quality-label { color: var(--primary-text-color); font-size: 13px; font-weight: 650; }
      .quality-subtitle { margin-top: 2px; color: var(--secondary-text-color); font-size: 10px; }
      .quality-score { color: var(--primary-text-color); font-size: 20px; font-weight: 720; }
      .quality-score span { color: var(--secondary-text-color); font-size: 10px; font-weight: 500; }

      .empty-state {
        display: grid;
        place-items: center;
        gap: 8px;
        min-height: 140px;
        padding: 20px;
        border: 1px dashed var(--shs-outline);
        border-radius: 12px;
        color: var(--secondary-text-color);
        text-align: center;
      }
      .empty-state ha-icon { --mdc-icon-size: 30px; color: var(--info-color); }
      .empty-state .product-logo {
        display: block;
        width: 40px;
        height: 40px;
        color: var(--info-color);
      }
      .empty-state .product-logo svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .empty-state strong { color: var(--primary-text-color); }
      .empty-state span { max-width: 300px; font-size: 12px; line-height: 1.45; }

      @container (max-width: 390px) {
        .card-content { padding: 13px; gap: 12px; }
        .presence-panel { grid-template-columns: minmax(0, 1fr) 108px; min-height: 132px; }
        .presence-copy { padding: 14px; }
        .presence-title { font-size: 22px; }
        .radar-ring.three { width: 136px; height: 136px; }
      }
    `],e([ge({attribute:!1})],_t.prototype,"hass",void 0),e([me()],_t.prototype,"_config",void 0),_t=e([he("smarthomeshop-ceilsense-card")],_t);let yt=class extends le{constructor(){super(...arguments),this._config={...vt}}setConfig(e){this._config={...vt,...e}}_change(e,t){this._config={...this._config,[e]:t},this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}render(){const e=et(this.hass,ft);return V`
      <div class="editor">
        <div class="field">
          <label for="device">CeilSense device</label>
          <select id="device" .value=${this._config.device_id??""} @change=${e=>this._change("device_id",e.target.value)}>
            <option value="">Automatic</option>
            ${e.map(e=>V`<option value=${e.id}>${tt(e)}</option>`)}
          </select>
          <div class="hint">Optional sensor blocks are hidden automatically when that CeilSense hardware variant does not provide them.</div>
        </div>
        <div class="field">
          <label for="title">Card title</label>
          <input id="title" type="text" .value=${this._config.title??""} placeholder="Use device name" @input=${e=>this._change("title",e.target.value)}>
        </div>
        <div class="options">
          <div class="group-title">Visible sections</div>
          ${[["show_header","Header"],["show_status","Connection and occupancy status"],["show_presence","Live presence visualization"],["show_room_quality","Combined room quality"],["show_zones","Detection zones"],["show_distances","Distance and radar energy"],["show_environment","Temperature, humidity, CO₂, light and pressure"]].map(([e,t])=>V`
            <label class="check">
              <input type="checkbox" .checked=${!1!==this._config[e]} @change=${t=>this._change(e,t.target.checked)}>
              <span>${t}</span>
            </label>
          `)}
        </div>
      </div>
    `}};yt.styles=s`
    :host { display: block; }
    .editor { display: grid; gap: 16px; padding: 4px 0; }
    .field { display: grid; gap: 6px; }
    label, .group-title { color: var(--primary-text-color); font-size: 13px; font-weight: 600; }
    select, input[type='text'] {
      width: 100%;
      box-sizing: border-box;
      min-height: 42px;
      padding: 9px 11px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
    }
    .options {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: var(--secondary-background-color);
    }
    .check { display: flex; align-items: center; gap: 9px; color: var(--primary-text-color); font-size: 13px; }
    .check input { width: 18px; height: 18px; margin: 0; accent-color: var(--primary-color); }
    .hint { color: var(--secondary-text-color); font-size: 11px; line-height: 1.4; }
  `,e([ge({attribute:!1})],yt.prototype,"hass",void 0),e([me()],yt.prototype,"_config",void 0),yt=e([he("smarthomeshop-ceilsense-card-editor")],yt);let xt=class extends le{constructor(){super(...arguments),this.entityPrefix="",this.deviceName="",this.isOpen=!1,this.maxDistance=6e3,this._zones=[],this._targets=[],this._selectedZone=null,this._dragMode="none",this._dragStart=null,this._saving=!1,this._hasChanges=!1,this._viewMode="2d",this._detectionRange=6e3,this._canvasWidth=600,this._canvasHeight=450,this._canvas3D=null,this._ctx=null,this._animationFrame=null,this._liveInterval=null,this._camera={azimuth:0,elevation:.22*Math.PI,distance:1200,targetX:0,targetY:0,targetZ:300},this._orbitDragging=!1,this._orbitLastX=0,this._orbitLastY=0,this.WALL_HEIGHT=200,this.FOV_DEG=120,this.CAMERA_FOV=55,this._zoneColors=["#3b82f6","#8b5cf6","#ec4899","#f59e0b"],this._handleOrbitStart=e=>{this._orbitDragging=!0,this._orbitLastX=e.clientX,this._orbitLastY=e.clientY},this._handleOrbitMove=e=>{if(!this._orbitDragging)return;const t=e.clientX-this._orbitLastX,i=e.clientY-this._orbitLastY;if(e.shiftKey){const e=.002*this._camera.distance,o=Math.cos(this._camera.azimuth),a=Math.sin(this._camera.azimuth);this._camera.targetX-=t*o*e,this._camera.targetZ-=t*a*e,this._camera.targetY+=i*e*.5}else this._camera.azimuth+=.008*t,this._camera.elevation=Math.max(.05,Math.min(.45*Math.PI,this._camera.elevation-.008*i));this._orbitLastX=e.clientX,this._orbitLastY=e.clientY},this._handleOrbitEnd=()=>{this._orbitDragging=!1},this._handleWheel=e=>{e.preventDefault();const t=e.deltaY>0?1.1:.9;this._camera.distance=Math.max(400,Math.min(3e3,this._camera.distance*t))},this._handleMouseMove=e=>{if(!this._dragStart||"none"===this._dragMode)return;const t=this._getSvgPoint(e),i=this._fromSvg(this._dragStart.x,this._dragStart.y),o=this._fromSvg(t.x,t.y),a=o.x-i.x,r=o.y-i.y,s=this._zones.find(e=>e.id===this._selectedZone);if(!s)return;const n=this._dragStart.zone,c=100;"move"===this._dragMode?(s.beginX=Math.round((n.beginX+a)/c)*c,s.endX=Math.round((n.endX+a)/c)*c,s.beginY=Math.round((n.beginY+r)/c)*c,s.endY=Math.round((n.endY+r)/c)*c):(this._dragMode.includes("w")&&(s.beginX=Math.round((n.beginX+a)/c)*c),this._dragMode.includes("e")&&(s.endX=Math.round((n.endX+a)/c)*c),this._dragMode.includes("n")&&(s.endY=Math.round((n.endY+r)/c)*c),this._dragMode.includes("s")&&(s.beginY=Math.round((n.beginY+r)/c)*c)),s.beginX=Math.max(-4e3,Math.min(4e3,s.beginX)),s.endX=Math.max(-4e3,Math.min(4e3,s.endX)),s.beginY=Math.max(0,Math.min(6e3,s.beginY)),s.endY=Math.max(0,Math.min(6e3,s.endY)),this._hasChanges=!0,this.requestUpdate()},this._handleMouseUp=()=>{this._dragMode="none",this._dragStart=null,window.removeEventListener("mousemove",this._handleMouseMove),window.removeEventListener("mouseup",this._handleMouseUp)}}connectedCallback(){super.connectedCallback(),this.isOpen&&(this._loadZones(),this._startLiveUpdates())}disconnectedCallback(){super.disconnectedCallback(),this._stopLiveUpdates(),this._stopAnimation()}updated(e){e.has("isOpen")&&(this.isOpen?(this._loadZones(),this._startLiveUpdates(),"3d"===this._viewMode&&this._setup3DCanvas()):(this._stopLiveUpdates(),this._stopAnimation())),e.has("_viewMode")&&this.isOpen&&("3d"===this._viewMode?this._setup3DCanvas():this._stopAnimation())}_setup3DCanvas(){requestAnimationFrame(()=>{this._canvas3D=this.shadowRoot?.querySelector(".canvas-3d"),this._canvas3D&&(this._ctx=this._canvas3D.getContext("2d",{alpha:!0}),this._setupCanvasEvents(),this._startAnimation())})}_setupCanvasEvents(){this._canvas3D&&(this._canvas3D.addEventListener("mousedown",this._handleOrbitStart),this._canvas3D.addEventListener("wheel",this._handleWheel,{passive:!1}),window.addEventListener("mousemove",this._handleOrbitMove),window.addEventListener("mouseup",this._handleOrbitEnd))}_startAnimation(){const e=()=>{this._render3D(),this._animationFrame=requestAnimationFrame(e)};e()}_stopAnimation(){this._animationFrame&&(cancelAnimationFrame(this._animationFrame),this._animationFrame=null)}_startLiveUpdates(){this._updateTargets(),this._liveInterval=window.setInterval(()=>this._updateTargets(),100)}_stopLiveUpdates(){this._liveInterval&&(clearInterval(this._liveInterval),this._liveInterval=null)}_updateTargets(){if(!this.hass||!this.entityPrefix)return;const e=[];for(let t=1;t<=5;t++){const i=`sensor.${this.entityPrefix}_target_${t}_x`,o=`sensor.${this.entityPrefix}_target_${t}_y`;if(!this.hass.states[i]||!this.hass.states[o])continue;const a=parseFloat(this.hass.states[i]?.state||"0"),r=parseFloat(this.hass.states[o]?.state||"0"),s=[`binary_sensor.${this.entityPrefix}_target_${t}_active`,`binary_sensor.${this.entityPrefix}_target_${t}`].find(e=>this.hass?.states[e]),n=s?"on"===this.hass.states[s].state:0!==a||0!==r;e.push({id:t,x:a,y:r,active:n&&(0!==a||0!==r)})}this._targets=e}_loadZones(){if(!this.hass||!this.entityPrefix)return;const e=[];for(let t=1;t<=4;t++)e.push({id:t,beginX:this._getNum(`zone_${t}_begin_x`),endX:this._getNum(`zone_${t}_end_x`),beginY:this._getNum(`zone_${t}_begin_y`),endY:this._getNum(`zone_${t}_end_y`),color:this._zoneColors[t-1]});this._zones=e,this._hasChanges=!1;const t=`number.${this.entityPrefix}_max_distance`,i=parseFloat(this.hass.states[t]?.state||"6000");this._detectionRange=i}_getNum(e){const t=`number.${this.entityPrefix}_${e}`,i=this.hass?.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_render3D(){if(!this._ctx||!this._canvas3D)return;const e=this._canvas3D,t=this._ctx,i=window.devicePixelRatio||1,o=e.getBoundingClientRect();e.width=o.width*i,e.height=o.height*i,t.scale(i,i);const a=o.width,r=o.height;t.fillStyle="#0a0e14",t.fillRect(0,0,a,r);const s=this._camera,n=s.targetX+s.distance*Math.cos(s.elevation)*Math.sin(s.azimuth),c=s.targetY+s.distance*Math.sin(s.elevation),l=s.targetZ+s.distance*Math.cos(s.elevation)*Math.cos(s.azimuth),d=Math.cos(s.azimuth),h=Math.sin(s.azimuth),p=Math.cos(s.elevation),u=Math.sin(s.elevation),g=this.CAMERA_FOV*Math.PI/180,m=.5*r/Math.tan(g/2),f=a/2,v=r/2,_=(e,t,i)=>{const o=e-n,a=t-c,r=i-l,s=h*o+d*r,g=-(u*a+p*s);return g<=.1?null:{x:f+(d*o-h*r)*m/g,y:v-(p*a-u*s)*m/g,z:g}};this._drawGrid3D(t,_),this._drawFov3D(t,_),this._drawZones3D(t,_),this._drawTargets3D(t,_),this._drawSensor3D(t,_)}_drawGrid3D(e,t){const i=this._detectionRange,o=1e3;e.strokeStyle="rgba(59, 130, 246, 0.15)",e.lineWidth=.5;for(let a=-4e3;a<=4e3;a+=o){const o=t(a,0,0),r=t(a,0,i);o&&r&&(e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(r.x,r.y),e.stroke())}for(let a=0;a<=i;a+=o){const i=t(-4e3,0,a),o=t(4e3,0,a);i&&o&&(e.beginPath(),e.moveTo(i.x,i.y),e.lineTo(o.x,o.y),e.stroke())}e.fillStyle="rgba(148, 163, 184, 0.5)",e.font="11px system-ui, sans-serif";for(let a=o;a<=i;a+=o){const i=t(4200,0,a);i&&e.fillText(a/1e3+"m",i.x,i.y+4)}}_drawFov3D(e,t){const i=this._detectionRange,o=this.FOV_DEG/2*Math.PI/180,a=[{x:0,z:0}];for(let e=-o;e<=o;e+=.05)a.push({x:i*Math.sin(e),z:i*Math.cos(e)});a.push({x:0,z:0}),e.beginPath();let r=!0;for(const i of a){const o=t(i.x,0,i.z);o&&(r?(e.moveTo(o.x,o.y),r=!1):e.lineTo(o.x,o.y))}e.closePath();const s=e.createRadialGradient(e.canvas.width/2/(window.devicePixelRatio||1),e.canvas.height/(window.devicePixelRatio||1),0,e.canvas.width/2/(window.devicePixelRatio||1),e.canvas.height/(window.devicePixelRatio||1),300);s.addColorStop(0,"rgba(59, 130, 246, 0.25)"),s.addColorStop(1,"rgba(59, 130, 246, 0.02)"),e.fillStyle=s,e.fill(),e.strokeStyle="rgba(59, 130, 246, 0.3)",e.lineWidth=1,e.stroke()}_drawZones3D(e,t){const i=this.WALL_HEIGHT;for(const o of this._zones){if(!(0!==o.beginX||0!==o.endX||0!==o.beginY||0!==o.endY))continue;const a=Math.min(o.beginX,o.endX),r=Math.max(o.beginX,o.endX),s=Math.min(o.beginY,o.endY),n=Math.max(o.beginY,o.endY),c=this._selectedZone===o.id,l=[t(a,0,s),t(r,0,s),t(r,0,n),t(a,0,n)].filter(e=>null!==e);if(4===l.length){e.beginPath(),e.moveTo(l[0].x,l[0].y);for(let t=1;t<l.length;t++)e.lineTo(l[t].x,l[t].y);e.closePath(),e.fillStyle=o.color+"30",e.fill(),e.strokeStyle=o.color+"80",e.lineWidth=c?2.5:1.5,e.stroke()}const d=[{pts:[[a,s],[r,s]],label:"front"},{pts:[[r,s],[r,n]],label:"right"},{pts:[[r,n],[a,n]],label:"back"},{pts:[[a,n],[a,s]],label:"left"}];for(const a of d){const[[r,s],[n,l]]=a.pts,d=t(r,0,s),h=t(n,0,l),p=t(r,i,s),u=t(n,i,l);d&&h&&p&&u&&(e.beginPath(),e.moveTo(d.x,d.y),e.lineTo(h.x,h.y),e.lineTo(u.x,u.y),e.lineTo(p.x,p.y),e.closePath(),e.fillStyle=o.color+"20",e.fill(),e.strokeStyle=o.color+(c?"cc":"60"),e.lineWidth=c?2:1,e.stroke())}const h=t((a+r)/2,i+30,(s+n)/2);h&&(e.fillStyle=o.color,e.font="bold 13px system-ui, sans-serif",e.textAlign="center",e.fillText(`Zone ${o.id}`,h.x,h.y))}}_drawTargets3D(e,t){for(const i of this._targets){if(!i.active)continue;const o=170;if(!t(i.x,o/2,i.y))continue;const a=t(i.x,o,i.y),r=t(i.x,0,i.y);a&&r&&(e.strokeStyle="#22c55e",e.lineWidth=8,e.lineCap="round",e.beginPath(),e.moveTo(r.x,r.y),e.lineTo(a.x,a.y),e.stroke(),e.fillStyle="#22c55e",e.beginPath(),e.arc(a.x,a.y,12,0,2*Math.PI),e.fill(),e.shadowColor="#22c55e",e.shadowBlur=20,e.beginPath(),e.arc(a.x,a.y,8,0,2*Math.PI),e.fill(),e.shadowBlur=0,e.fillStyle="#22c55e",e.font="bold 11px system-ui, sans-serif",e.textAlign="center",e.fillText(`T${i.id}`,a.x,a.y-20));const s=t(i.x,0,i.y);s&&(e.beginPath(),e.arc(s.x,s.y,6,0,2*Math.PI),e.fillStyle="rgba(34, 197, 94, 0.5)",e.fill())}}_drawSensor3D(e,t){const i=t(0,10,0);i&&(e.fillStyle="#3b82f6",e.shadowColor="#3b82f6",e.shadowBlur=15,e.beginPath(),e.arc(i.x,i.y,10,0,2*Math.PI),e.fill(),e.shadowBlur=0,e.fillStyle="#60a5fa",e.beginPath(),e.arc(i.x,i.y,4,0,2*Math.PI),e.fill(),e.fillStyle="rgba(148, 163, 184, 0.7)",e.font="10px system-ui, sans-serif",e.textAlign="center",e.fillText("SENSOR",i.x,i.y+25))}_toSvg(e,t){const i=this._detectionRange,o=this._canvasWidth/2,a=this._canvasHeight-40,r=(this._canvasHeight-80)/i;return{x:o+e*r,y:a-t*r}}_fromSvg(e,t){const i=this._detectionRange,o=this._canvasWidth/2,a=this._canvasHeight-40,r=(this._canvasHeight-80)/i;return{x:(e-o)/r,y:(a-t)/r}}_getSvgPoint(e){const t=this.shadowRoot?.querySelector(".editor-svg");if(!t)return{x:0,y:0};const i=t.getBoundingClientRect(),o=e.clientX-i.left,a=e.clientY-i.top;return{x:o*(this._canvasWidth/i.width),y:a*(this._canvasHeight/i.height)}}_handleMouseDown(e,t,i){e.stopPropagation(),e.preventDefault();const o=this._zones.find(e=>e.id===t);o&&(this._selectedZone=t,this._dragMode=i,this._dragStart={...this._getSvgPoint(e),zone:{...o}},window.addEventListener("mousemove",this._handleMouseMove),window.addEventListener("mouseup",this._handleMouseUp))}async _saveAllZones(){if(this.hass&&this.entityPrefix){this._saving=!0;try{const e=[];for(const t of this._zones){const i={...t,beginX:Math.max(-4e3,Math.min(4e3,t.beginX)),endX:Math.max(-4e3,Math.min(4e3,t.endX)),beginY:Math.max(0,Math.min(6e3,t.beginY)),endY:Math.max(0,Math.min(6e3,t.endY))};e.push(this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_begin_x`,value:i.beginX}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_end_x`,value:i.endX}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_begin_y`,value:i.beginY}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_end_y`,value:i.endY}))}await Promise.all(e),this._hasChanges=!1}catch(e){console.error("Failed to save zones:",e)}finally{this._saving=!1}}}_close(){this._stopLiveUpdates(),this._stopAnimation(),this.dispatchEvent(new CustomEvent("close"))}_renderGrid(){const e=[],t=[],i=this._detectionRange;for(let o=1e3;o<=i;o+=1e3){const a=this._toSvg(0,o),r=(this._canvasHeight-80)*(o/i);e.push(G`
        <circle
          cx="${this._canvasWidth/2}"
          cy="${this._canvasHeight-40}"
          r="${r}"
          class="grid-line"
          fill="none"
        />
      `),t.push(G`
        <text x="${this._canvasWidth-15}" y="${a.y+4}" class="grid-label" text-anchor="end">
          ${o/1e3}m
        </text>
      `)}return e.push(G`
      <line
        x1="${this._canvasWidth/2}"
        y1="${this._canvasHeight-40}"
        x2="${this._canvasWidth/2}"
        y2="20"
        class="grid-line"
      />
    `),[...e,...t]}_renderCoverageArc(){const e=this._canvasWidth/2,t=this._canvasHeight-40,i=this._detectionRange,o=(this._canvasHeight-80)*(i/i),a=this.FOV_DEG/2*Math.PI/180,r=e+o*Math.sin(-a),s=t-o*Math.cos(-a),n=e+o*Math.sin(a),c=t-o*Math.cos(a);return G`
      <defs>
        <radialGradient id="coverageGradient" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stop-color="rgba(59, 130, 246, 0.35)" />
          <stop offset="100%" stop-color="rgba(59, 130, 246, 0.02)" />
        </radialGradient>
      </defs>
      <path
        class="coverage-arc"
        d="M ${e} ${t} L ${r} ${s} A ${o} ${o} 0 0 1 ${n} ${c} Z"
      />
    `}_renderTargets(){return this._targets.filter(e=>e.active).map(e=>{const t=this._toSvg(e.x,e.y);return G`
        <g class="target-marker">
          <circle class="target-pulse" cx="${t.x}" cy="${t.y}" r="6" />
          <circle cx="${t.x}" cy="${t.y}" r="8" fill="#22c55e" />
          <circle cx="${t.x}" cy="${t.y}" r="4" fill="#4ade80" />
          <text x="${t.x}" y="${t.y-15}" fill="#22c55e" font-size="11" font-weight="bold" text-anchor="middle">
            T${e.id}
          </text>
        </g>
      `})}_renderZone(e){if(!(0!==e.beginX||0!==e.endX||0!==e.beginY||0!==e.endY))return Y;const t=this._toSvg(Math.min(e.beginX,e.endX),Math.max(e.beginY,e.endY)),i=this._toSvg(Math.max(e.beginX,e.endX),Math.min(e.beginY,e.endY)),o=t.x,a=t.y,r=i.x-t.x,s=i.y-t.y,n=this._selectedZone===e.id,c=n?[{name:"nw",x:o,y:a},{name:"ne",x:o+r,y:a},{name:"sw",x:o,y:a+s},{name:"se",x:o+r,y:a+s},{name:"n",x:o+r/2,y:a},{name:"s",x:o+r/2,y:a+s},{name:"w",x:o,y:a+s/2},{name:"e",x:o+r,y:a+s/2}]:[];return G`
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
        ${c.map(t=>G`
          <circle
            cx="${t.x}" cy="${t.y}"
            r="${8}"
            class="resize-handle ${t.name}"
            stroke="${e.color}"
            @mousedown=${i=>this._handleMouseDown(i,e.id,`resize-${t.name}`)}
          />
        `)}
      </g>
    `}render(){return this.isOpen?V`
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

                ${"3d"===this._viewMode?V`
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
                `:Y}
              </div>
            </div>

            <div class="sidebar">
              <div>
                <div class="section-title">Zones</div>
                <div class="zone-list">
                  ${this._zones.map(e=>{const t=0!==e.beginX||0!==e.endX||0!==e.beginY||0!==e.endY;return V`
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
                ${this._targets.filter(e=>e.active).length>0?this._targets.filter(e=>e.active).map(e=>V`
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></div>
                        <span style="color: #e2e8f0; font-size: 0.85rem;">Target ${e.id}: ${Math.round(e.x)}mm, ${Math.round(e.y)}mm</span>
                      </div>
                    `):V`<span style="color: #64748b; font-size: 0.85rem;">No active targets</span>`}
              </div>

              <div class="info-card">
                <h4>${"3d"===this._viewMode?"3D Controls":"Instructies"}</h4>
                <ul>
                  ${"3d"===this._viewMode?V`
                    <li>Drag to rotate</li>
                    <li>Shift + drag to pan</li>
                    <li>Scroll to zoom</li>
                    <li>Edit zones in 2D mode</li>
                  `:V`
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
              ${this._hasChanges?V`
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                Unsaved changes
              `:Y}
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
    `:Y}};xt.styles=s`
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
  `,e([ge({attribute:!1})],xt.prototype,"hass",void 0),e([ge()],xt.prototype,"entityPrefix",void 0),e([ge()],xt.prototype,"deviceName",void 0),e([ge({type:Boolean})],xt.prototype,"isOpen",void 0),e([ge({type:Number})],xt.prototype,"maxDistance",void 0),e([me()],xt.prototype,"_zones",void 0),e([me()],xt.prototype,"_targets",void 0),e([me()],xt.prototype,"_selectedZone",void 0),e([me()],xt.prototype,"_dragMode",void 0),e([me()],xt.prototype,"_dragStart",void 0),e([me()],xt.prototype,"_saving",void 0),e([me()],xt.prototype,"_hasChanges",void 0),e([me()],xt.prototype,"_viewMode",void 0),e([me()],xt.prototype,"_detectionRange",void 0),xt=e([he("smarthomeshop-zone-editor")],xt);const wt=s`
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
  .option-group {
    padding: 12px;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 10px;
    background: color-mix(
      in srgb,
      var(--secondary-background-color) 72%,
      var(--card-background-color)
    );
    margin-bottom: 10px;
  }
  .option-group .checkbox-row:last-child {
    margin-bottom: 0;
  }
  .nested-options {
    margin: 8px 0 0 25px;
    padding: 8px 0 0 12px;
    border-left: 2px solid var(--divider-color, #e0e0e0);
  }
  .nested-options .checkbox-row {
    margin-bottom: 7px;
  }
  .option-description {
    margin: -2px 0 9px 26px;
    font-size: 11px;
    line-height: 1.4;
    color: var(--secondary-text-color);
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
`;function bt(e){if(!e)return[];const t=new Map,i=[{pattern:"waterp1meterkit",type:"WaterP1MeterKit"},{pattern:"watermeterkit",type:"WaterMeterKit"},{pattern:"waterflowkit",type:"WaterFlowKit"}];return Object.keys(e.states).forEach(o=>{const a=e.states[o],r=(a?.attributes?.friendly_name||"").toLowerCase(),s=o.toLowerCase();for(const{pattern:e,type:o}of i)if(r.includes(e)||s.includes(e)){const i=s.match(new RegExp(`${e}[_-]?([a-f0-9]{6})`)),r=i?i[1]:e;if(!t.has(r)){const e=(a?.attributes?.friendly_name||"").split(" ").slice(0,2).join(" ")||`${o} ${r.toUpperCase()}`;t.set(r,{id:r,name:e,type:o})}break}}),Array.from(t.values())}let kt=class extends le{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&(this._devices=bt(this.hass).filter(e=>"WaterMeterKit"===e.type||"WaterFlowKit"===e.type))}_valueChanged(e,t){if(this._config[e]===t)return;const i={...this._config,[e]:t};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){const e=this._devices.find(e=>e.id===this._config.device_id);return V`
      <div class="form-row">
        <label>Device</label>
        <select
          @change=${e=>this._valueChanged("device_id",e.target.value||void 0)}
        >
          <option value="">Auto detect</option>
          ${this._devices.map(e=>V`
              <option value=${e.id} ?selected=${e.id===this._config.device_id}>
                ${e.name} (${e.type})
              </option>
            `)}
        </select>
        ${e?V`
              <div class="device-info">
                <span>Type:</span> ${e.type}<br />
                <span>ID:</span> ${e.id.toUpperCase()}
              </div>
            `:Y}
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Visible content</div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_header"
              .checked=${!1!==this._config.show_header}
              @change=${e=>this._valueChanged("show_header",e.target.checked)} />
            <label for="show_header">Header</label>
          </div>
          ${!1!==this._config.show_header?V`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_status"
                  .checked=${!1!==this._config.show_status}
                  @change=${e=>this._valueChanged("show_status",e.target.checked)} />
                <label for="show_status">Status badge</label>
              </div>
            </div>
          `:Y}
        </div>

        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_water_current"
              .checked=${!1!==this._config.show_water_current}
              @change=${e=>this._valueChanged("show_water_current",e.target.checked)} />
            <label for="show_water_current">Current water usage</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_water_totals"
              .checked=${!1!==this._config.show_water_totals}
              @change=${e=>this._valueChanged("show_water_totals",e.target.checked)} />
            <label for="show_water_totals">Period totals</label>
          </div>
          ${!1!==this._config.show_water_totals?V`
            <div class="nested-options">
              ${["today","week","month","year"].map(e=>V`
                <div class="checkbox-row">
                  <input type="checkbox" id=${`show_${e}`}
                    .checked=${!1!==this._config[`show_${e}`]}
                    @change=${t=>this._valueChanged(`show_${e}`,t.target.checked)} />
                  <label for=${`show_${e}`}>${e[0].toUpperCase()}${e.slice(1)}</label>
                </div>
              `)}
            </div>
          `:Y}
        </div>

        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_graph"
              .checked=${!1!==this._config.show_graph}
              @change=${e=>this._valueChanged("show_graph",e.target.checked)} />
            <label for="show_graph">24-hour usage graph</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_meter_reading"
              .checked=${!1!==this._config.show_meter_reading}
              @change=${e=>this._valueChanged("show_meter_reading",e.target.checked)} />
            <label for="show_meter_reading">Total meter reading</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_leak_detection"
              .checked=${!1!==this._config.show_leak_detection}
              @change=${e=>this._valueChanged("show_leak_detection",e.target.checked)} />
            <label for="show_leak_detection">Leak detection</label>
          </div>
        </div>
        <div class="info">If no device is selected, entities are automatically detected.</div>
      </div>
    `}};kt.styles=wt,e([ge({attribute:!1})],kt.prototype,"hass",void 0),e([me()],kt.prototype,"_config",void 0),e([me()],kt.prototype,"_devices",void 0),kt=e([he("smarthomeshop-water-card-editor")],kt);let $t=class extends le{constructor(){super(...arguments),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&(this._devices=bt(this.hass).filter(e=>"WaterP1MeterKit"===e.type))}_valueChanged(e,t){if(this._config[e]===t)return;const i={...this._config,[e]:t};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){const e=this._devices.find(e=>e.id===this._config.device_id);return V`
      <div class="form-row">
        <label>Device</label>
        <select
          @change=${e=>this._valueChanged("device_id",e.target.value||void 0)}
        >
          <option value="">Auto detect</option>
          ${this._devices.map(e=>V`
              <option value=${e.id} ?selected=${e.id===this._config.device_id}>
                ${e.name}
              </option>
            `)}
        </select>
        ${e?V`
              <div class="device-info">
                <span>Type:</span> ${e.type}<br />
                <span>ID:</span> ${e.id.toUpperCase()}
              </div>
            `:Y}
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Card</div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_header"
              .checked=${!1!==this._config.show_header}
              @change=${e=>this._valueChanged("show_header",e.target.checked)} />
            <label for="show_header">Header</label>
          </div>
          ${!1!==this._config.show_header?V`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_status"
                  .checked=${!1!==this._config.show_status}
                  @change=${e=>this._valueChanged("show_status",e.target.checked)} />
                <label for="show_status">Status badge</label>
              </div>
            </div>
          `:Y}
        </div>
      </div>

      <div class="form-row">
        <div class="section-title">Water</div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_water"
              .checked=${!1!==this._config.show_water}
              @change=${e=>this._valueChanged("show_water",e.target.checked)} />
            <label for="show_water">Water section</label>
          </div>
          ${!1!==this._config.show_water?V`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_water_current"
                  .checked=${!1!==this._config.show_water_current}
                  @change=${e=>this._valueChanged("show_water_current",e.target.checked)} />
                <label for="show_water_current">Current water usage</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_water_totals"
                  .checked=${!1!==this._config.show_water_totals}
                  @change=${e=>this._valueChanged("show_water_totals",e.target.checked)} />
                <label for="show_water_totals">Period totals</label>
              </div>
              ${!1!==this._config.show_water_totals?V`
                <div class="nested-options">
                  ${["today","week","month","year"].map(e=>V`
                    <div class="checkbox-row">
                      <input type="checkbox" id=${`waterp1_show_${e}`}
                        .checked=${!1!==this._config[`show_${e}`]}
                        @change=${t=>this._valueChanged(`show_${e}`,t.target.checked)} />
                      <label for=${`waterp1_show_${e}`}>${e[0].toUpperCase()}${e.slice(1)}</label>
                    </div>
                  `)}
                </div>
              `:Y}
              <div class="checkbox-row">
                <input type="checkbox" id="show_graph"
                  .checked=${!1!==this._config.show_graph}
                  @change=${e=>this._valueChanged("show_graph",e.target.checked)} />
                <label for="show_graph">24-hour usage graph</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_meter_reading"
                  .checked=${!1!==this._config.show_meter_reading}
                  @change=${e=>this._valueChanged("show_meter_reading",e.target.checked)} />
                <label for="show_meter_reading">Total meter reading</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_leak_detection"
                  .checked=${!1!==this._config.show_leak_detection}
                  @change=${e=>this._valueChanged("show_leak_detection",e.target.checked)} />
                <label for="show_leak_detection">Leak detection</label>
              </div>
            </div>
          `:Y}
        </div>
      </div>

      <div class="form-row">
        <div class="section-title">Energy</div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_energy"
              .checked=${!1!==this._config.show_energy}
              @change=${e=>this._valueChanged("show_energy",e.target.checked)} />
            <label for="show_energy">Energy section</label>
          </div>
          ${!1!==this._config.show_energy?V`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_energy_current"
                  .checked=${!1!==this._config.show_energy_current}
                  @change=${e=>this._valueChanged("show_energy_current",e.target.checked)} />
                <label for="show_energy_current">Current power usage</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_energy_today"
                  .checked=${!1!==this._config.show_energy_today}
                  @change=${e=>this._valueChanged("show_energy_today",e.target.checked)} />
                <label for="show_energy_today">Electricity today</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_energy_returned"
                  .checked=${!1!==this._config.show_energy_returned}
                  @change=${e=>this._valueChanged("show_energy_returned",e.target.checked)} />
                <label for="show_energy_returned">Returned energy</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_gas_today"
                  .checked=${!1!==this._config.show_gas_today}
                  @change=${e=>this._valueChanged("show_gas_today",e.target.checked)} />
                <label for="show_gas_today">Gas today</label>
              </div>
            </div>
          `:Y}
        </div>
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Hardware features (V3)</div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="has_water_leak_sensor"
              .checked=${!0===this._config.has_water_leak_sensor}
              @change=${e=>this._valueChanged("has_water_leak_sensor",e.target.checked)} />
            <label for="has_water_leak_sensor">Optional water leak sensor connected</label>
          </div>
        </div>
        <div class="feature-info">
          Enable this if you have connected the optional water leak sensor to your WaterP1MeterKit V3.
          Critical leak alerts remain visible even when other content is hidden.
        </div>
      </div>
    `}};$t.styles=wt,e([ge({attribute:!1})],$t.prototype,"hass",void 0),e([me()],$t.prototype,"_config",void 0),e([me()],$t.prototype,"_devices",void 0),$t=e([he("smarthomeshop-waterp1-card-editor")],$t);console.info("%c SMARTHOMESHOP-CARDS %c 1.2.0 ","color: white; background: #2196f3; font-weight: bold; padding: 2px 4px; border-radius: 4px 0 0 4px;","color: #2196f3; background: #e3f2fd; font-weight: bold; padding: 2px 4px; border-radius: 0 4px 4px 0;");function Ct(){const e=[document];for(let t=0;t<e.length;t+=1){e[t].querySelectorAll("*").forEach(t=>{t.shadowRoot&&e.push(t.shadowRoot),"hui-error-card"===t.localName&&t.dispatchEvent(new CustomEvent("ll-rebuild",{bubbles:!0,composed:!0}))})}}[["smarthomeshop-water-card",Ee],["smarthomeshop-waterp1-card",Ie],["smarthomeshop-waterflowkit-card",Fe],["smarthomeshop-ultimatesensor-card",Ze],["smarthomeshop-p1meterkit-card",gt],["smarthomeshop-ceilsense-card",_t],["smarthomeshop-water-card-editor",kt],["smarthomeshop-waterp1-card-editor",$t],["smarthomeshop-waterflowkit-card-editor",He],["smarthomeshop-ultimatesensor-card-editor",Xe],["smarthomeshop-p1meterkit-card-editor",mt],["smarthomeshop-ceilsense-card-editor",yt],["smarthomeshop-sensor-settings",Ye],["smarthomeshop-zone-editor",xt]].forEach(([e,t])=>{!function(e,t){customElements.get(e)||customElements.define(e,t)}(e,t)}),[0,100,500,1500].forEach(e=>{window.setTimeout(Ct,e)}),window.customCards=window.customCards||[],window.customCards.push({type:"smarthomeshop-water-card",name:"SmartHomeShop Water Card",description:"Water monitoring voor WaterMeterKit en WaterFlowKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-waterp1-card",name:"SmartHomeShop WaterP1 Card",description:"Water + Energy monitoring voor WaterP1MeterKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-ultimatesensor-card",name:"SmartHomeShop UltimateSensor Card",description:"Presence detection & omgevingssensoren voor UltimateSensor en UltimateSensor Mini",preview:!0,documentationURL:"https://docs.smarthomeshop.io/en/ultimatesensor/home-assistant-card"}),window.customCards.push({type:"smarthomeshop-waterflowkit-card",name:"SmartHomeShop WaterFlowKit Card",description:"Dual flow water monitoring met geanimeerde leidingen voor WaterFlowKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-p1meterkit-card",name:"SmartHomeShop P1MeterKit Card",description:"Live grid power, tariffs, phases and energy insights for P1MeterKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-ceilsense-card",name:"SmartHomeShop CeilSense Card",description:"Ceiling presence, target zones, distance and room climate for CeilSense",preview:!0,documentationURL:"https://smarthomeshop.io"}),console.log("SmartHomeShop.io Cards loaded successfully!");export{_t as SmartHomeShopCeilSenseCard,yt as SmartHomeShopCeilSenseCardEditor,gt as SmartHomeShopP1MeterKitCard,mt as SmartHomeShopP1MeterKitCardEditor,Ye as SmartHomeShopSensorSettings,Ze as SmartHomeShopUltimateSensorCard,Ee as SmartHomeShopWaterCard,Fe as SmartHomeShopWaterFlowKitCard,He as SmartHomeShopWaterFlowKitCardEditor,Ie as SmartHomeShopWaterP1Card,xt as SmartHomeShopZoneEditor};
