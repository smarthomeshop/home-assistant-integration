/* SmartHomeShop.io Cards v1.13.1 - Build: 2026-10-03T19:42:39.633Z */
const e="smarthomeshop-elements-healed";function t(e){const t=e.registryAtLoad,i=e.pollIntervalMs??250,a=e.pollRounds??120,o=e.setTimer??((e,t)=>setTimeout(e,t)),r=e.clearTimer??(e=>clearTimeout(e)),n=new Map;let s,l=0,c=!1,d=!1;const h=()=>{void 0!==s&&(r(s),s=void 0)},u=(i="manual check")=>{if(d||0===n.size)return;let a;try{a=e.getCurrentRegistry()}catch(e){return void console.warn("SmartHomeShop: could not inspect the custom-element registry",e)}if(a===t)return;const o=[];for(const[e,t]of n)try{a.get(e)||(a.define(e,t),o.push(e)),n.delete(e)}catch(t){console.warn(`SmartHomeShop: retrying registration of ${e}`,t)}o.length>0&&(console.info(`SmartHomeShop: restored ${o.join(", ")} after Home Assistant replaced the custom-element registry (${i})`),e.onHealed?.(o,i)),0===n.size&&h()},p=()=>{d||void 0!==s||0===n.size||l>=a||(s=o(()=>{s=void 0,l+=1,u("fallback poll"),p()},i))};return{defineElement(e,i){if(!d){try{t.get(e)||t.define(e,i)}catch(t){console.warn(`SmartHomeShop: initial registration of ${e} failed`,t)}n.set(e,i),c||d||(c=!0,t.whenDefined("home-assistant").then(()=>u("Home Assistant boot signal")).catch(()=>{}),p()),p()}},checkNow:u,dispose(){d=!0,n.clear(),h()}}}let i;function a(e,t,i,a){var o,r=arguments.length,n=r<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,i):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,a);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(n=(r<3?o(n):r>3?o(t,i,n):o(t,i))||n);return r>3&&n&&Object.defineProperty(t,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const o=globalThis,r=o.ShadowRoot&&(void 0===o.ShadyCSS||o.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,n=Symbol(),s=new WeakMap;let l=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(r&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=s.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(t,e))}return e}toString(){return this.cssText}};const c=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,a)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[a+1],e[0]);return new l(i,e,n)},d=r?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new l("string"==typeof e?e:e+"",void 0,n))(t)})(e):e,{is:h,defineProperty:u,getOwnPropertyDescriptor:p,getOwnPropertyNames:m,getOwnPropertySymbols:g,getPrototypeOf:v}=Object,f=globalThis,y=f.trustedTypes,b=y?y.emptyScript:"",w=f.reactiveElementPolyfillSupport,x=(e,t)=>e,_={toAttribute(e,t){switch(t){case Boolean:e=e?b:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},k=(e,t)=>!h(e,t),S={attribute:!0,type:String,converter:_,reflect:!1,useDefault:!1,hasChanged:k};Symbol.metadata??=Symbol("metadata"),f.litPropertyMetadata??=new WeakMap;let C=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=S){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),a=this.getPropertyDescriptor(e,i,t);void 0!==a&&u(this.prototype,e,a)}}static getPropertyDescriptor(e,t,i){const{get:a,set:o}=p(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:a,set(t){const r=a?.call(this);o?.call(this,t),this.requestUpdate(e,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??S}static _$Ei(){if(this.hasOwnProperty(x("elementProperties")))return;const e=v(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(x("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(x("properties"))){const e=this.properties,t=[...m(e),...g(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(d(e))}else void 0!==e&&t.push(d(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,t)=>{if(r)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of t){const t=document.createElement("style"),a=o.litNonce;void 0!==a&&t.setAttribute("nonce",a),t.textContent=i.cssText,e.appendChild(t)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),a=this.constructor._$Eu(e,i);if(void 0!==a&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:_).toAttribute(t,i.type);this._$Em=e,null==o?this.removeAttribute(a):this.setAttribute(a,o),this._$Em=null}}_$AK(e,t){const i=this.constructor,a=i._$Eh.get(e);if(void 0!==a&&this._$Em!==a){const e=i.getPropertyOptions(a),o="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:_;this._$Em=a;const r=o.fromAttribute(t,e.type);this[a]=r??this._$Ej?.get(a)??r,this._$Em=null}}requestUpdate(e,t,i,a=!1,o){if(void 0!==e){const r=this.constructor;if(!1===a&&(o=this[e]),i??=r.getPropertyOptions(e),!((i.hasChanged??k)(o,t)||i.useDefault&&i.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:a,wrapped:o},r){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),!0!==o||void 0!==r)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===a&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,a=this[t];!0!==e||this._$AL.has(t)||void 0===a||this.C(t,void 0,i,a)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};C.elementStyles=[],C.shadowRootOptions={mode:"open"},C[x("elementProperties")]=new Map,C[x("finalized")]=new Map,w?.({ReactiveElement:C}),(f.reactiveElementVersions??=[]).push("2.1.2");const $=globalThis,z=e=>e,E=$.trustedTypes,P=E?E.createPolicy("lit-html",{createHTML:e=>e}):void 0,M="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,L="?"+A,N=`<${L}>`,T=document,D=()=>T.createComment(""),H=e=>null===e||"object"!=typeof e&&"function"!=typeof e,R=Array.isArray,W="[ \t\n\f\r]",I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,j=/-->/g,F=/>/g,O=RegExp(`>|${W}(?:([^\\s"'>=/]+)(${W}*=${W}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),V=/'/g,U=/"/g,G=/^(?:script|style|textarea|title)$/i,q=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),K=q(1),B=q(2),Z=Symbol.for("lit-noChange"),Y=Symbol.for("lit-nothing"),X=new WeakMap,Q=T.createTreeWalker(T,129);function J(e,t){if(!R(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==P?P.createHTML(t):t}const ee=(e,t)=>{const i=e.length-1,a=[];let o,r=2===t?"<svg>":3===t?"<math>":"",n=I;for(let t=0;t<i;t++){const i=e[t];let s,l,c=-1,d=0;for(;d<i.length&&(n.lastIndex=d,l=n.exec(i),null!==l);)d=n.lastIndex,n===I?"!--"===l[1]?n=j:void 0!==l[1]?n=F:void 0!==l[2]?(G.test(l[2])&&(o=RegExp("</"+l[2],"g")),n=O):void 0!==l[3]&&(n=O):n===O?">"===l[0]?(n=o??I,c=-1):void 0===l[1]?c=-2:(c=n.lastIndex-l[2].length,s=l[1],n=void 0===l[3]?O:'"'===l[3]?U:V):n===U||n===V?n=O:n===j||n===F?n=I:(n=O,o=void 0);const h=n===O&&e[t+1].startsWith("/>")?" ":"";r+=n===I?i+N:c>=0?(a.push(s),i.slice(0,c)+M+i.slice(c)+A+h):i+A+(-2===c?t:h)}return[J(e,r+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),a]};class te{constructor({strings:e,_$litType$:t},i){let a;this.parts=[];let o=0,r=0;const n=e.length-1,s=this.parts,[l,c]=ee(e,t);if(this.el=te.createElement(l,i),Q.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(a=Q.nextNode())&&s.length<n;){if(1===a.nodeType){if(a.hasAttributes())for(const e of a.getAttributeNames())if(e.endsWith(M)){const t=c[r++],i=a.getAttribute(e).split(A),n=/([.?@])?(.*)/.exec(t);s.push({type:1,index:o,name:n[2],strings:i,ctor:"."===n[1]?ne:"?"===n[1]?se:"@"===n[1]?le:re}),a.removeAttribute(e)}else e.startsWith(A)&&(s.push({type:6,index:o}),a.removeAttribute(e));if(G.test(a.tagName)){const e=a.textContent.split(A),t=e.length-1;if(t>0){a.textContent=E?E.emptyScript:"";for(let i=0;i<t;i++)a.append(e[i],D()),Q.nextNode(),s.push({type:2,index:++o});a.append(e[t],D())}}}else if(8===a.nodeType)if(a.data===L)s.push({type:2,index:o});else{let e=-1;for(;-1!==(e=a.data.indexOf(A,e+1));)s.push({type:7,index:o}),e+=A.length-1}o++}}static createElement(e,t){const i=T.createElement("template");return i.innerHTML=e,i}}function ie(e,t,i=e,a){if(t===Z)return t;let o=void 0!==a?i._$Co?.[a]:i._$Cl;const r=H(t)?void 0:t._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(e),o._$AT(e,i,a)),void 0!==a?(i._$Co??=[])[a]=o:i._$Cl=o),void 0!==o&&(t=ie(e,o._$AS(e,t.values),o,a)),t}class ae{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,a=(e?.creationScope??T).importNode(t,!0);Q.currentNode=a;let o=Q.nextNode(),r=0,n=0,s=i[0];for(;void 0!==s;){if(r===s.index){let t;2===s.type?t=new oe(o,o.nextSibling,this,e):1===s.type?t=new s.ctor(o,s.name,s.strings,this,e):6===s.type&&(t=new ce(o,this,e)),this._$AV.push(t),s=i[++n]}r!==s?.index&&(o=Q.nextNode(),r++)}return Q.currentNode=T,a}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class oe{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,a){this.type=2,this._$AH=Y,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=ie(this,e,t),H(e)?e===Y||null==e||""===e?(this._$AH!==Y&&this._$AR(),this._$AH=Y):e!==this._$AH&&e!==Z&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>R(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==Y&&H(this._$AH)?this._$AA.nextSibling.data=e:this.T(T.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,a="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=te.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===a)this._$AH.p(t);else{const e=new ae(a,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=X.get(e.strings);return void 0===t&&X.set(e.strings,t=new te(e)),t}k(e){R(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,a=0;for(const o of e)a===t.length?t.push(i=new oe(this.O(D()),this.O(D()),this,this.options)):i=t[a],i._$AI(o),a++;a<t.length&&(this._$AR(i&&i._$AB.nextSibling,a),t.length=a)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=z(e).nextSibling;z(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}let re=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,a,o){this.type=1,this._$AH=Y,this._$AN=void 0,this.element=e,this.name=t,this._$AM=a,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Y}_$AI(e,t=this,i,a){const o=this.strings;let r=!1;if(void 0===o)e=ie(this,e,t,0),r=!H(e)||e!==this._$AH&&e!==Z,r&&(this._$AH=e);else{const a=e;let n,s;for(e=o[0],n=0;n<o.length-1;n++)s=ie(this,a[i+n],t,n),s===Z&&(s=this._$AH[n]),r||=!H(s)||s!==this._$AH[n],s===Y?e=Y:e!==Y&&(e+=(s??"")+o[n+1]),this._$AH[n]=s}r&&!a&&this.j(e)}j(e){e===Y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}};class ne extends re{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===Y?void 0:e}}class se extends re{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==Y)}}class le extends re{constructor(e,t,i,a,o){super(e,t,i,a,o),this.type=5}_$AI(e,t=this){if((e=ie(this,e,t,0)??Y)===Z)return;const i=this._$AH,a=e===Y&&i!==Y||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,o=e!==Y&&(i===Y||a);a&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ce{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){ie(this,e)}}const de=$.litHtmlPolyfillSupport;de?.(te,oe),($.litHtmlVersions??=[]).push("3.3.2");const he=globalThis;let ue=class extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const a=i?.renderBefore??t;let o=a._$litPart$;if(void 0===o){const e=i?.renderBefore??null;a._$litPart$=o=new oe(t.insertBefore(D(),e),e,void 0,i??{})}return o._$AI(e),o})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Z}};ue._$litElement$=!0,ue.finalized=!0,he.litElementHydrateSupport?.({LitElement:ue});const pe=he.litElementPolyfillSupport;pe?.({LitElement:ue}),(he.litElementVersions??=[]).push("4.2.2");const me={attribute:!0,type:String,converter:_,reflect:!1,hasChanged:k},ge=(e=me,t,i)=>{const{kind:a,metadata:o}=i;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===a&&((e=Object.create(e)).wrapped=!0),r.set(i.name,e),"accessor"===a){const{name:a}=i;return{set(i){const o=t.get.call(this);t.set.call(this,i),this.requestUpdate(a,o,e,!0,i)},init(t){return void 0!==t&&this.C(a,void 0,e,t),t}}}if("setter"===a){const{name:a}=i;return function(i){const o=this[a];t.call(this,i),this.requestUpdate(a,o,e,!0,i)}}throw Error("Unsupported decorator location: "+a)};function ve(e){return(t,i)=>"object"==typeof i?ge(e,t,i):((e,t,i)=>{const a=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),a?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function fe(e){return ve({...e,state:!0,attribute:!1})}const ye=2;class be{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}class we extends be{constructor(e){if(super(e),this.it=Y,e.type!==ye)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===Y||null==e)return this._t=void 0,this.it=e;if(e===Z)return e;if("string"!=typeof e)throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}we.directiveName="unsafeHTML",we.resultType=1;const xe=(e=>(...t)=>({_$litDirective$:e,values:t}))(we),_e={common:{loading:"Loading...",error:"Error",unknown:"Unknown",today:"Today",week:"Week",month:"Month",year:"Year",daily:"Daily",weekly:"Weekly",monthly:"Monthly",yearly:"Yearly",current:"Current",total:"Total",temperature:"Temperature",humidity:"Humidity",settings:"Settings",save:"Save",cancel:"Cancel",close:"Close",edit:"Edit",delete:"Delete",add:"Add",name:"Name",value:"Value",unit:"Unit",active:"Active",inactive:"Inactive",on:"On",off:"Off",yes:"Yes",no:"No",show:"Show",hide:"Hide"},waterflowkit:{title:"WaterFlowKit",subtitle:"Dual flow monitoring",pipe1:"Pipe 1",pipe2:"Pipe 2",currentFlow:"Current flow",totalConsumption:"Total consumption",flowRate:"Flow rate",perHour:"per hour",noFlow:"No flow",flowing:"Flowing",waterTemperature:"Water temperature",showPipe1:"Show Pipe 1",showPipe2:"Show Pipe 2",showTemperature:"Show temperature",pipe1Name:"Pipe 1 name",pipe2Name:"Pipe 2 name"},waterp1:{title:"WaterP1MeterKit",water:"Water",energy:"Energy",energyActive:"Energy active",currentUsage:"Current water usage",leakDetection:"Leak Detection",monitoringActivity:"Monitoring activity",meter:"Meter",currentPower:"Current power",electricityToday:"Electricity today",gasToday:"Gas today",waterLast24h:"Water last 24 hours",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Water usage",dailyUsage:"Daily usage",weeklyUsage:"Weekly usage",monthlyUsage:"Monthly usage",yearlyUsage:"Yearly usage",calibration:"Calibration",lastCalibration:"Last calibration",sinceLast:"since calibration"},ultimatesensor:{title:"UltimateSensor",roomScore:"Room Score",excellent:"Excellent",good:"Good",moderate:"Moderate",poor:"Poor",unhealthy:"Unhealthy",hazardous:"Hazardous",presence:"Presence",detected:"Detected",notDetected:"Not detected",targets:"Targets",co2Level:"CO₂ level",vocIndex:"VOC index",noxIndex:"NOx index",illuminance:"Illuminance",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radar view",roomView:"Room view",view2D:"2D",view3D:"3D",zoneOccupancy:"Zone occupancy",zone:"Zone",recommendations:"Recommendations",ventilateNow:"Ventilate now!",openWindow:"Open a window",airQualityPoor:"Air quality is poor",tooHumid:"Too humid",tooDry:"Too dry",tooCold:"Too cold",tooWarm:"Too warm"},editor:{deviceId:"Device ID",selectDevice:"Select device",appearance:"Appearance",showGraph:"Show graph",showWater:"Show water",showEnergy:"Show energy",graphType:"Graph type",historyGraph:"History graph",liveGraph:"Live graph",displayOptions:"Display options"}},ke={en:_e,nl:{common:{loading:"Laden...",error:"Fout",unknown:"Onbekend",today:"Vandaag",week:"Week",month:"Maand",year:"Jaar",daily:"Dagelijks",weekly:"Wekelijks",monthly:"Maandelijks",yearly:"Jaarlijks",current:"Huidig",total:"Totaal",temperature:"Temperatuur",humidity:"Luchtvochtigheid",settings:"Instellingen",save:"Opslaan",cancel:"Annuleren",close:"Sluiten",edit:"Bewerken",delete:"Verwijderen",add:"Toevoegen",name:"Naam",value:"Waarde",unit:"Eenheid",active:"Actief",inactive:"Inactief",on:"Aan",off:"Uit",yes:"Ja",no:"Nee",show:"Tonen",hide:"Verbergen"},waterflowkit:{title:"WaterFlowKit",subtitle:"Dubbele flowmeting",pipe1:"Leiding 1",pipe2:"Leiding 2",currentFlow:"Huidige flow",totalConsumption:"Totaal verbruik",flowRate:"Debiet",perHour:"per uur",noFlow:"Geen flow",flowing:"Stromend",waterTemperature:"Watertemperatuur",showPipe1:"Toon leiding 1",showPipe2:"Toon leiding 2",showTemperature:"Toon temperatuur",pipe1Name:"Naam leiding 1",pipe2Name:"Naam leiding 2"},waterp1:{title:"WaterP1MeterKit",water:"Water",energy:"Energie",energyActive:"Energie actief",currentUsage:"Huidig waterverbruik",leakDetection:"Lekdetectie",monitoringActivity:"Bewakingsactiviteit",meter:"Meter",currentPower:"Huidig vermogen",electricityToday:"Stroom vandaag",gasToday:"Gas vandaag",waterLast24h:"Water laatste 24 uur",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Waterverbruik",dailyUsage:"Dagelijks verbruik",weeklyUsage:"Wekelijks verbruik",monthlyUsage:"Maandelijks verbruik",yearlyUsage:"Jaarlijks verbruik",calibration:"Kalibratie",lastCalibration:"Laatste kalibratie",sinceLast:"sinds kalibratie"},ultimatesensor:{title:"UltimateSensor",roomScore:"Kamerscore",excellent:"Uitstekend",good:"Goed",moderate:"Matig",poor:"Slecht",unhealthy:"Ongezond",hazardous:"Gevaarlijk",presence:"Aanwezigheid",detected:"Gedetecteerd",notDetected:"Niet gedetecteerd",targets:"Doelen",co2Level:"CO₂-niveau",vocIndex:"VOC-index",noxIndex:"NOx-index",illuminance:"Verlichtingssterkte",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radarweergave",roomView:"Kamerweergave",view2D:"2D",view3D:"3D",zoneOccupancy:"Zone bezetting",zone:"Zone",recommendations:"Aanbevelingen",ventilateNow:"Ventileer nu!",openWindow:"Open een raam",airQualityPoor:"Luchtkwaliteit is slecht",tooHumid:"Te vochtig",tooDry:"Te droog",tooCold:"Te koud",tooWarm:"Te warm"},editor:{deviceId:"Apparaat-ID",selectDevice:"Selecteer apparaat",appearance:"Uiterlijk",showGraph:"Toon grafiek",showWater:"Toon water",showEnergy:"Toon energie",graphType:"Grafiektype",historyGraph:"Historiegrafiek",liveGraph:"Live grafiek",displayOptions:"Weergaveopties"}},de:{common:{loading:"Laden...",error:"Fehler",unknown:"Unbekannt",today:"Heute",week:"Woche",month:"Monat",year:"Jahr",daily:"Täglich",weekly:"Wöchentlich",monthly:"Monatlich",yearly:"Jährlich",current:"Aktuell",total:"Gesamt",temperature:"Temperatur",humidity:"Luftfeuchtigkeit",settings:"Einstellungen",save:"Speichern",cancel:"Abbrechen",close:"Schließen",edit:"Bearbeiten",delete:"Löschen",add:"Hinzufügen",name:"Name",value:"Wert",unit:"Einheit",active:"Aktiv",inactive:"Inaktiv",on:"An",off:"Aus",yes:"Ja",no:"Nein",show:"Anzeigen",hide:"Ausblenden"},waterflowkit:{title:"WaterFlowKit",subtitle:"Doppelte Durchflussmessung",pipe1:"Leitung 1",pipe2:"Leitung 2",currentFlow:"Aktueller Durchfluss",totalConsumption:"Gesamtverbrauch",flowRate:"Durchflussrate",perHour:"pro Stunde",noFlow:"Kein Durchfluss",flowing:"Fließend",waterTemperature:"Wassertemperatur",showPipe1:"Leitung 1 anzeigen",showPipe2:"Leitung 2 anzeigen",showTemperature:"Temperatur anzeigen",pipe1Name:"Name Leitung 1",pipe2Name:"Name Leitung 2"},waterp1:{title:"WaterP1MeterKit",water:"Wasser",energy:"Energie",energyActive:"Energie aktiv",currentUsage:"Aktueller Wasserverbrauch",leakDetection:"Leckerkennung",monitoringActivity:"Überwachungsaktivität",meter:"Zähler",currentPower:"Aktuelle Leistung",electricityToday:"Strom heute",gasToday:"Gas heute",waterLast24h:"Wasser letzte 24 Stunden",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Wasserverbrauch",dailyUsage:"Täglicher Verbrauch",weeklyUsage:"Wöchentlicher Verbrauch",monthlyUsage:"Monatlicher Verbrauch",yearlyUsage:"Jährlicher Verbrauch",calibration:"Kalibrierung",lastCalibration:"Letzte Kalibrierung",sinceLast:"seit Kalibrierung"},ultimatesensor:{title:"UltimateSensor",roomScore:"Raumbewertung",excellent:"Ausgezeichnet",good:"Gut",moderate:"Mäßig",poor:"Schlecht",unhealthy:"Ungesund",hazardous:"Gefährlich",presence:"Anwesenheit",detected:"Erkannt",notDetected:"Nicht erkannt",targets:"Ziele",co2Level:"CO₂-Niveau",vocIndex:"VOC-Index",noxIndex:"NOx-Index",illuminance:"Beleuchtungsstärke",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Radaransicht",roomView:"Raumansicht",view2D:"2D",view3D:"3D",zoneOccupancy:"Zonenbelegung",zone:"Zone",recommendations:"Empfehlungen",ventilateNow:"Jetzt lüften!",openWindow:"Öffnen Sie ein Fenster",airQualityPoor:"Luftqualität ist schlecht",tooHumid:"Zu feucht",tooDry:"Zu trocken",tooCold:"Zu kalt",tooWarm:"Zu warm"},editor:{deviceId:"Geräte-ID",selectDevice:"Gerät auswählen",appearance:"Erscheinungsbild",showGraph:"Diagramm anzeigen",showWater:"Wasser anzeigen",showEnergy:"Energie anzeigen",graphType:"Diagrammtyp",historyGraph:"Verlaufsdiagramm",liveGraph:"Live-Diagramm",displayOptions:"Anzeigeoptionen"}},fr:{common:{loading:"Chargement...",error:"Erreur",unknown:"Inconnu",today:"Aujourd'hui",week:"Semaine",month:"Mois",year:"Année",daily:"Quotidien",weekly:"Hebdomadaire",monthly:"Mensuel",yearly:"Annuel",current:"Actuel",total:"Total",temperature:"Température",humidity:"Humidité",settings:"Paramètres",save:"Enregistrer",cancel:"Annuler",close:"Fermer",edit:"Modifier",delete:"Supprimer",add:"Ajouter",name:"Nom",value:"Valeur",unit:"Unité",active:"Actif",inactive:"Inactif",on:"Activé",off:"Désactivé",yes:"Oui",no:"Non",show:"Afficher",hide:"Masquer"},waterflowkit:{title:"WaterFlowKit",subtitle:"Double mesure de débit",pipe1:"Conduite 1",pipe2:"Conduite 2",currentFlow:"Débit actuel",totalConsumption:"Consommation totale",flowRate:"Débit",perHour:"par heure",noFlow:"Pas de débit",flowing:"En cours",waterTemperature:"Température de l'eau",showPipe1:"Afficher conduite 1",showPipe2:"Afficher conduite 2",showTemperature:"Afficher température",pipe1Name:"Nom conduite 1",pipe2Name:"Nom conduite 2"},waterp1:{title:"WaterP1MeterKit",water:"Eau",energy:"Énergie",energyActive:"Énergie active",currentUsage:"Consommation d'eau actuelle",leakDetection:"Détection de fuite",monitoringActivity:"Activité de surveillance",meter:"Compteur",currentPower:"Puissance actuelle",electricityToday:"Électricité aujourd'hui",gasToday:"Gaz aujourd'hui",waterLast24h:"Eau dernières 24 heures",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Consommation d'eau",dailyUsage:"Consommation quotidienne",weeklyUsage:"Consommation hebdomadaire",monthlyUsage:"Consommation mensuelle",yearlyUsage:"Consommation annuelle",calibration:"Calibration",lastCalibration:"Dernière calibration",sinceLast:"depuis calibration"},ultimatesensor:{title:"UltimateSensor",roomScore:"Score de la pièce",excellent:"Excellent",good:"Bon",moderate:"Modéré",poor:"Mauvais",unhealthy:"Malsain",hazardous:"Dangereux",presence:"Présence",detected:"Détectée",notDetected:"Non détectée",targets:"Cibles",co2Level:"Niveau de CO₂",vocIndex:"Indice COV",noxIndex:"Indice NOx",illuminance:"Éclairement",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vue radar",roomView:"Vue de la pièce",view2D:"2D",view3D:"3D",zoneOccupancy:"Occupation de zone",zone:"Zone",recommendations:"Recommandations",ventilateNow:"Aérez maintenant !",openWindow:"Ouvrez une fenêtre",airQualityPoor:"La qualité de l'air est mauvaise",tooHumid:"Trop humide",tooDry:"Trop sec",tooCold:"Trop froid",tooWarm:"Trop chaud"},editor:{deviceId:"ID appareil",selectDevice:"Sélectionner appareil",appearance:"Apparence",showGraph:"Afficher graphique",showWater:"Afficher l'eau",showEnergy:"Afficher l'énergie",graphType:"Type de graphique",historyGraph:"Graphique historique",liveGraph:"Graphique en direct",displayOptions:"Options d'affichage"}},es:{common:{loading:"Cargando...",error:"Error",unknown:"Desconocido",today:"Hoy",week:"Semana",month:"Mes",year:"Año",daily:"Diario",weekly:"Semanal",monthly:"Mensual",yearly:"Anual",current:"Actual",total:"Total",temperature:"Temperatura",humidity:"Humedad",settings:"Configuración",save:"Guardar",cancel:"Cancelar",close:"Cerrar",edit:"Editar",delete:"Eliminar",add:"Añadir",name:"Nombre",value:"Valor",unit:"Unidad",active:"Activo",inactive:"Inactivo",on:"Encendido",off:"Apagado",yes:"Sí",no:"No",show:"Mostrar",hide:"Ocultar"},waterflowkit:{title:"WaterFlowKit",subtitle:"Medición de flujo dual",pipe1:"Tubería 1",pipe2:"Tubería 2",currentFlow:"Flujo actual",totalConsumption:"Consumo total",flowRate:"Caudal",perHour:"por hora",noFlow:"Sin flujo",flowing:"Fluyendo",waterTemperature:"Temperatura del agua",showPipe1:"Mostrar tubería 1",showPipe2:"Mostrar tubería 2",showTemperature:"Mostrar temperatura",pipe1Name:"Nombre tubería 1",pipe2Name:"Nombre tubería 2"},waterp1:{title:"WaterP1MeterKit",water:"Agua",energy:"Energía",energyActive:"Energía activa",currentUsage:"Consumo de agua actual",leakDetection:"Detección de fugas",monitoringActivity:"Actividad de monitoreo",meter:"Medidor",currentPower:"Potencia actual",electricityToday:"Electricidad hoy",gasToday:"Gas hoy",waterLast24h:"Agua últimas 24 horas",max:"máx"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo de agua",dailyUsage:"Consumo diario",weeklyUsage:"Consumo semanal",monthlyUsage:"Consumo mensual",yearlyUsage:"Consumo anual",calibration:"Calibración",lastCalibration:"Última calibración",sinceLast:"desde calibración"},ultimatesensor:{title:"UltimateSensor",roomScore:"Puntuación de habitación",excellent:"Excelente",good:"Bueno",moderate:"Moderado",poor:"Malo",unhealthy:"No saludable",hazardous:"Peligroso",presence:"Presencia",detected:"Detectada",notDetected:"No detectada",targets:"Objetivos",co2Level:"Nivel de CO₂",vocIndex:"Índice COV",noxIndex:"Índice NOx",illuminance:"Iluminancia",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista de habitación",view2D:"2D",view3D:"3D",zoneOccupancy:"Ocupación de zona",zone:"Zona",recommendations:"Recomendaciones",ventilateNow:"¡Ventila ahora!",openWindow:"Abre una ventana",airQualityPoor:"La calidad del aire es mala",tooHumid:"Demasiado húmedo",tooDry:"Demasiado seco",tooCold:"Demasiado frío",tooWarm:"Demasiado caliente"},editor:{deviceId:"ID de dispositivo",selectDevice:"Seleccionar dispositivo",appearance:"Apariencia",showGraph:"Mostrar gráfico",showWater:"Mostrar agua",showEnergy:"Mostrar energía",graphType:"Tipo de gráfico",historyGraph:"Gráfico histórico",liveGraph:"Gráfico en vivo",displayOptions:"Opciones de visualización"}},it:{common:{loading:"Caricamento...",error:"Errore",unknown:"Sconosciuto",today:"Oggi",week:"Settimana",month:"Mese",year:"Anno",daily:"Giornaliero",weekly:"Settimanale",monthly:"Mensile",yearly:"Annuale",current:"Attuale",total:"Totale",temperature:"Temperatura",humidity:"Umidità",settings:"Impostazioni",save:"Salva",cancel:"Annulla",close:"Chiudi",edit:"Modifica",delete:"Elimina",add:"Aggiungi",name:"Nome",value:"Valore",unit:"Unità",active:"Attivo",inactive:"Inattivo",on:"Acceso",off:"Spento",yes:"Sì",no:"No",show:"Mostra",hide:"Nascondi"},waterflowkit:{title:"WaterFlowKit",subtitle:"Misurazione doppio flusso",pipe1:"Tubo 1",pipe2:"Tubo 2",currentFlow:"Flusso attuale",totalConsumption:"Consumo totale",flowRate:"Portata",perHour:"all'ora",noFlow:"Nessun flusso",flowing:"In flusso",waterTemperature:"Temperatura dell'acqua",showPipe1:"Mostra tubo 1",showPipe2:"Mostra tubo 2",showTemperature:"Mostra temperatura",pipe1Name:"Nome tubo 1",pipe2Name:"Nome tubo 2"},waterp1:{title:"WaterP1MeterKit",water:"Acqua",energy:"Energia",energyActive:"Energia attiva",currentUsage:"Consumo d'acqua attuale",leakDetection:"Rilevamento perdite",monitoringActivity:"Attività di monitoraggio",meter:"Contatore",currentPower:"Potenza attuale",electricityToday:"Elettricità oggi",gasToday:"Gas oggi",waterLast24h:"Acqua ultime 24 ore",max:"max"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo d'acqua",dailyUsage:"Consumo giornaliero",weeklyUsage:"Consumo settimanale",monthlyUsage:"Consumo mensile",yearlyUsage:"Consumo annuale",calibration:"Calibrazione",lastCalibration:"Ultima calibrazione",sinceLast:"dalla calibrazione"},ultimatesensor:{title:"UltimateSensor",roomScore:"Punteggio stanza",excellent:"Eccellente",good:"Buono",moderate:"Moderato",poor:"Scarso",unhealthy:"Non salutare",hazardous:"Pericoloso",presence:"Presenza",detected:"Rilevata",notDetected:"Non rilevata",targets:"Obiettivi",co2Level:"Livello CO₂",vocIndex:"Indice COV",noxIndex:"Indice NOx",illuminance:"Illuminamento",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista stanza",view2D:"2D",view3D:"3D",zoneOccupancy:"Occupazione zona",zone:"Zona",recommendations:"Raccomandazioni",ventilateNow:"Ventila ora!",openWindow:"Apri una finestra",airQualityPoor:"La qualità dell'aria è scarsa",tooHumid:"Troppo umido",tooDry:"Troppo secco",tooCold:"Troppo freddo",tooWarm:"Troppo caldo"},editor:{deviceId:"ID dispositivo",selectDevice:"Seleziona dispositivo",appearance:"Aspetto",showGraph:"Mostra grafico",showWater:"Mostra acqua",showEnergy:"Mostra energia",graphType:"Tipo di grafico",historyGraph:"Grafico storico",liveGraph:"Grafico in tempo reale",displayOptions:"Opzioni di visualizzazione"}},pt:{common:{loading:"Carregando...",error:"Erro",unknown:"Desconhecido",today:"Hoje",week:"Semana",month:"Mês",year:"Ano",daily:"Diário",weekly:"Semanal",monthly:"Mensal",yearly:"Anual",current:"Atual",total:"Total",temperature:"Temperatura",humidity:"Umidade",settings:"Configurações",save:"Salvar",cancel:"Cancelar",close:"Fechar",edit:"Editar",delete:"Excluir",add:"Adicionar",name:"Nome",value:"Valor",unit:"Unidade",active:"Ativo",inactive:"Inativo",on:"Ligado",off:"Desligado",yes:"Sim",no:"Não",show:"Mostrar",hide:"Ocultar"},waterflowkit:{title:"WaterFlowKit",subtitle:"Medição de fluxo duplo",pipe1:"Tubo 1",pipe2:"Tubo 2",currentFlow:"Fluxo atual",totalConsumption:"Consumo total",flowRate:"Vazão",perHour:"por hora",noFlow:"Sem fluxo",flowing:"Fluindo",waterTemperature:"Temperatura da água",showPipe1:"Mostrar tubo 1",showPipe2:"Mostrar tubo 2",showTemperature:"Mostrar temperatura",pipe1Name:"Nome tubo 1",pipe2Name:"Nome tubo 2"},waterp1:{title:"WaterP1MeterKit",water:"Água",energy:"Energia",energyActive:"Energia ativa",currentUsage:"Consumo de água atual",leakDetection:"Detecção de vazamento",monitoringActivity:"Atividade de monitoramento",meter:"Medidor",currentPower:"Potência atual",electricityToday:"Eletricidade hoje",gasToday:"Gás hoje",waterLast24h:"Água últimas 24 horas",max:"máx"},watermeter:{title:"WaterMeterKit",waterUsage:"Consumo de água",dailyUsage:"Consumo diário",weeklyUsage:"Consumo semanal",monthlyUsage:"Consumo mensal",yearlyUsage:"Consumo anual",calibration:"Calibração",lastCalibration:"Última calibração",sinceLast:"desde calibração"},ultimatesensor:{title:"UltimateSensor",roomScore:"Pontuação do ambiente",excellent:"Excelente",good:"Bom",moderate:"Moderado",poor:"Ruim",unhealthy:"Não saudável",hazardous:"Perigoso",presence:"Presença",detected:"Detectada",notDetected:"Não detectada",targets:"Alvos",co2Level:"Nível de CO₂",vocIndex:"Índice COV",noxIndex:"Índice NOx",illuminance:"Iluminância",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Vista radar",roomView:"Vista do ambiente",view2D:"2D",view3D:"3D",zoneOccupancy:"Ocupação da zona",zone:"Zona",recommendations:"Recomendações",ventilateNow:"Ventile agora!",openWindow:"Abra uma janela",airQualityPoor:"A qualidade do ar está ruim",tooHumid:"Muito úmido",tooDry:"Muito seco",tooCold:"Muito frio",tooWarm:"Muito quente"},editor:{deviceId:"ID do dispositivo",selectDevice:"Selecionar dispositivo",appearance:"Aparência",showGraph:"Mostrar gráfico",showWater:"Mostrar água",showEnergy:"Mostrar energia",graphType:"Tipo de gráfico",historyGraph:"Gráfico histórico",liveGraph:"Gráfico ao vivo",displayOptions:"Opções de exibição"}},pl:{common:{loading:"Ładowanie...",error:"Błąd",unknown:"Nieznany",today:"Dzisiaj",week:"Tydzień",month:"Miesiąc",year:"Rok",daily:"Dziennie",weekly:"Tygodniowo",monthly:"Miesięcznie",yearly:"Rocznie",current:"Bieżący",total:"Łącznie",temperature:"Temperatura",humidity:"Wilgotność",settings:"Ustawienia",save:"Zapisz",cancel:"Anuluj",close:"Zamknij",edit:"Edytuj",delete:"Usuń",add:"Dodaj",name:"Nazwa",value:"Wartość",unit:"Jednostka",active:"Aktywny",inactive:"Nieaktywny",on:"Włączony",off:"Wyłączony",yes:"Tak",no:"Nie",show:"Pokaż",hide:"Ukryj"},waterflowkit:{title:"WaterFlowKit",subtitle:"Podwójny pomiar przepływu",pipe1:"Rura 1",pipe2:"Rura 2",currentFlow:"Bieżący przepływ",totalConsumption:"Całkowite zużycie",flowRate:"Przepływ",perHour:"na godzinę",noFlow:"Brak przepływu",flowing:"Przepływa",waterTemperature:"Temperatura wody",showPipe1:"Pokaż rurę 1",showPipe2:"Pokaż rurę 2",showTemperature:"Pokaż temperaturę",pipe1Name:"Nazwa rury 1",pipe2Name:"Nazwa rury 2"},waterp1:{title:"WaterP1MeterKit",water:"Woda",energy:"Energia",energyActive:"Energia aktywna",currentUsage:"Bieżące zużycie wody",leakDetection:"Wykrywanie wycieków",monitoringActivity:"Aktywność monitorowania",meter:"Licznik",currentPower:"Bieżąca moc",electricityToday:"Prąd dzisiaj",gasToday:"Gaz dzisiaj",waterLast24h:"Woda ostatnie 24 godziny",max:"maks"},watermeter:{title:"WaterMeterKit",waterUsage:"Zużycie wody",dailyUsage:"Dzienne zużycie",weeklyUsage:"Tygodniowe zużycie",monthlyUsage:"Miesięczne zużycie",yearlyUsage:"Roczne zużycie",calibration:"Kalibracja",lastCalibration:"Ostatnia kalibracja",sinceLast:"od kalibracji"},ultimatesensor:{title:"UltimateSensor",roomScore:"Wynik pomieszczenia",excellent:"Doskonały",good:"Dobry",moderate:"Umiarkowany",poor:"Słaby",unhealthy:"Niezdrowy",hazardous:"Niebezpieczny",presence:"Obecność",detected:"Wykryta",notDetected:"Nie wykryta",targets:"Cele",co2Level:"Poziom CO₂",vocIndex:"Indeks LZO",noxIndex:"Indeks NOx",illuminance:"Natężenie oświetlenia",pm1:"PM1.0",pm25:"PM2.5",pm4:"PM4.0",pm10:"PM10",radarView:"Widok radaru",roomView:"Widok pomieszczenia",view2D:"2D",view3D:"3D",zoneOccupancy:"Zajętość strefy",zone:"Strefa",recommendations:"Zalecenia",ventilateNow:"Wietrz teraz!",openWindow:"Otwórz okno",airQualityPoor:"Jakość powietrza jest słaba",tooHumid:"Za wilgotno",tooDry:"Za sucho",tooCold:"Za zimno",tooWarm:"Za ciepło"},editor:{deviceId:"ID urządzenia",selectDevice:"Wybierz urządzenie",appearance:"Wygląd",showGraph:"Pokaż wykres",showWater:"Pokaż wodę",showEnergy:"Pokaż energię",graphType:"Typ wykresu",historyGraph:"Wykres historyczny",liveGraph:"Wykres na żywo",displayOptions:"Opcje wyświetlania"}}};let Se="en",Ce=_e;function $e(e){if(!e)return"en";return(e.language||e.locale?.language||"en").replace("_","-").split("-")[0].toLowerCase()}function ze(e){return e&&function(e){const t=$e(e);t!==Se&&(Se=t,Ce=ke[t]||_e)}(e),Ce}const Ee={nl:{"-- Select device --":"-- Selecteer apparaat --","-- Select entity --":"-- Geselecteerde entiteit --","10px sans-serif":"10px sans-serif","10px system-ui, sans-serif":"10px systeem-ui, sans-serif","11px system-ui, sans-serif":"11px systeem-ui, sans-serif","24-hour usage graph":"24-uurs gebruiksgrafiek","2D floor plan":"2D plattegrond","3D Controls":"3D Controles","3D view":"3D-weergave","A connected power sensor is unavailable":"Een verbonden vermogenssensor is niet beschikbaar","Above daily average":"Boven het daggemiddelde",Active:"Actief","active contract":"het actieve contract","Add a CeilSense to Home Assistant or select its device in the card editor.":"Voeg een CeilSense toe aan Home Assistant of selecteer het apparaat in de kaart editor.","Add the full daily contract charge to today's net electricity cost":"Voeg het volledige dagelijkse contracttarief toe aan de huidige netto elektriciteitskosten","Add the P1MeterKit to Home Assistant or select its device in the card editor.":"P1Meter toevoegen Kit naar Home Assistant of selecteer het apparaat in de kaart-editor.","Air is dry":"Lucht is droog","Air is humid":"Lucht is vochtig.","Air pressure":"Luchtdruk","Air too dry":"Lucht te droog","Air too humid":"Lucht te vochtig","All normal":"Alles normaal","All time":"Totaal","All values optimal":"Alle waarden optimaal","All-in consumer price":"All-in consumentenprijs","all-in price":"all-in prijs","An active SmartHomeShop energy contract is needed to calculate savings.":"Een actief SmartHomeShop-energiecontract is nodig om besparingen te berekenen.","Animate power flow":"Animatiestroom","Auto detect":"Automatisch detecteren","Automatic uses the Room Designer room linked to this exact Home Assistant device.":"Automatisch gebruikt de Room Designer-ruimte gekoppeld aan dit exacte Home Assistant-apparaat.","Average prices":"Gemiddelde prijzen","avg.":"gem.","Avoid negative-price solar export":"Voorkom teruglevering bij negatieve prijs","Battery flow and state of charge":"Batterijstroom en laadtoestand","Battery line":"Batterijlijn","Battery today":"Batterij vandaag","Begin X (mm)":"Begin X (mm)","Begin Y (mm)":"Begin Y (mm)","Below daily average":"Onder het daggemiddelde","bold 11px system-ui, sans-serif":"vet 11px systeem-ui, sans-serif","bold 13px system-ui, sans-serif":"bold 13px systeem-ui, sans-serif","Calculated hourly rate":"Berekend uurtarief","Calculating today's electricity costs...":"Stroomkosten van vandaag berekenen...","Calculation explanation":"Berekeningsuitleg",Cancel:"Annuleren","Cancel setting meter reading":"Stelmeter lezen annuleren","Card density":"Kaartdichtheid","Card title":"Kaarttitel","Card title (optional)":"Kaarttitel (facultatief)","ceil sense":"ceil sense","Ceiling presence & climate":"Plafond aanwezigheid & klimaat","CeilSense device":"CeilSense-apparaat","Charge EV cheapest":"Opladen EV goedkoopste","Charge the car in the cheapest hours":"Laad de auto tijdens de goedkoopste uren","Charging and discharging":"Laden en ontladen","Charging and discharging power":"Opladen en lossen van vermogen","Cheapest block":"Goedkoopste blok","Cheapest block duration":"Duur van goedkoopste blok","Check the power supply and Wi-Fi connection.":"Controleer de voeding en Wi-Fi aansluiting.","Check the selected contract in SmartHomeShop Energy Settings.":"Controleer het geselecteerde contract in SmartHomeShop Energy Settings.","Click a zone to select it":"Klik op een zone om het te selecteren","Climate values":"Klimaatwaarden",Close:"Sluiten","CO2 quality meter":"CO2-kwaliteitsmeter","Cold water":"Koud water","Combined climate assessment":"Gecombineerde klimaatbeoordeling","Combined flow status":"Gecombineerde stroomstatus","Combined room quality":"Gecombineerde kamerkwaliteit","Compact - status only":"Compact - alleen status","Compact — 300 px":"Compacte 300 px","Configure a P1 meter, solar or battery power source in SmartHomeShop Energy Settings.":"Configureer een P1-meter, zonne-energie- of batterijbron in SmartHomeShop Energie-instellingen.","Connect an active SmartHomeShop contract to value today's imported and returned electricity.":"Verbind een actief SmartHomeShop-contract om de afname en teruglevering van vandaag te waarderen.","Connection and grid status":"Verbindings- en rasterstatus","Connection and occupancy status":"Aansluiting en bezettingsstatus","Continuous flow":"Continustroom","Cool down":"Rustig aan.","Cool down the room":"Rustig aan.","Coordinates snap to 100mm":"Coördinaten klikken naar 100mm","Cost this month":"Kosten deze maand","Cost today":"Kosten vandaag","Costs, peak and standby insights":"Kosten, piek- en stand-by inzichten","Could not enable the automation.":"De automatisering kon niet worden ingeschakeld.","Could not pause the automation.":"De automatisering kon niet worden gepauzeerd.","Could not update the schedule.":"Het schema kon niet worden bijgewerkt.","CO₂ Quality":"CO₂ Kwaliteit","CO₂ unhealthy, ventilate":"CO₂ ongezond, ventilatie","Create price, solar or deadline controls in SmartHomeShop Energy Settings. They will appear here automatically.":"Maak prijs-, zonne-energie- of deadlinebesturing in SmartHomeShop Energie-instellingen. Ze verschijnen hier automatisch.","Cumulative value this calendar month":"Opgetelde waarde deze kalendermaand","Current and peak values":"Huidige en piekwaarden","Current grid import or export":"Huidige invoer of uitvoer van het net","current power":"huidige vermogen","Current power usage":"Huidig stroomverbruik","Current price":"Huidige prijs","Current usage":"Huidig gebruik","current water usage":"huidig watergebruik","Current water usage":"Huidig waterverbruik","Curtailing export during negative feed-in":"Teruglevering beperken bij negatieve terugleverprijs","Daily average":"Daggemiddelde","Daily average, low, high and feed-in facts":"Dagelijkse gemiddelde, lage, hoge en feed-in feiten","Daily spread":"Dagspreiding","Deadline schedules":"Deadlineschema's","Default room view":"Standaard kamerweergave","Detection detail":"Opsporingsdetails","Detection distance":"Detectieafstand","Detection zones":"Detectiegebieden",Device:"Apparaat","Device offline":"Apparaat offline","Direction and speed follow the power moving right now":"Richting en snelheid volgen het vermogen van dit moment","Disabled - deadline planning is paused":"Uitgeschakeld - deadlineplanning is gepauzeerd","Disabled - no automatic actions":"Uitgeschakeld - geen automatische acties","Distance and radar energy":"Afstands- en radarenergie",Drag:"Sleep","Drag the zone to move it":"Sleep de zone om het te verplaatsen","Drag to rotate":"Draaien slepen","Draw your room, place the sensor and configure zones in the":"Trek uw kamer, plaats de sensor en configureer zones in de","Edit setup":"Instellingen bewerken","Edit zones in 2D mode":"Zones in 2D-modus bewerken","Eind X (mm)":"X-einde (mm)","Eind Y (mm)":"Y-einde (mm)","Electricity costs":"Stroomkosten","Electricity costs unavailable":"Stroomkosten niet beschikbaar","Electricity imported":"Stroom afgenomen","Electricity is cheap now":"Stroom is nu goedkoop","Electricity returned":"Stroom teruggeleverd","Electricity today":"Stroom vandaag","Elevated VOC":"Verhoogde VOC","Enable automation":"Automatisering inschakelen","Enable schedule":"Schema inschakelen","Enable this if you have connected the optional water leak sensor to your WaterP1MeterKit V3. Critical leak alerts remain visible even when other content is hidden.":"Schakel dit in als u de optionele waterleksensor hebt aangesloten op uw WaterP1MeterKit V3. Kritische lekwaarschuwingen blijven zichtbaar zelfs wanneer andere inhoud wordt verborgen.",Energy:"Energie","Energy active":"Energie actief","energy consumed":"verbruikte energie","Energy contract":"Energiecontract","Energy costs card configuration is required.":"Energiekosten kaartconfiguratie is vereist.","Energy insights":"Energie-inzichten","Energy Live card configuration is required.":"Energie Live kaart configuratie is vereist.","Energy monitoring":"Energiemonitoring","Energy Power Trend card configuration is required.":"Energievermogen Trend kaart configuratie is vereist.","Energy Price Outlook card configuration is required.":"Energieprijs Outlook-kaartconfiguratie is vereist.","Energy prices":"Energieprijzen","Energy section":"Afdeling energie","Enter the reading shown on your physical water meter in m³, for example 123.456. The value is stored on the device itself.":"Voer de meting in op uw fysieke watermeter in m3, bijvoorbeeld 123.456. De waarde wordt opgeslagen op het apparaat zelf.","entry lines:":"invoerregels:","Environmental sensors":"Milieusensoren","Estimated feed-in now":"Geschatte invoer nu","Estimated price":"Geraamde prijs","Estimated price now":"Geraamde prijs nu",Excellent:"Uitstekend","Expanded - status and details":"Uitbreid - status en details","Explain how Smart Savings is calculated":"Leg uit hoe Smart Savings wordt berekend","Explain the price source, coverage and contract charges":"Leg de prijsbron, dekking en contractkosten uit","Export now":"Teruglevering nu","Exporting to grid":"Teruglevering aan het net","Extra large — 600 px":"Extra grote 600 px","Failed to save zones:":"Opslaan van zones is mislukt:","Feed-in now":"Teruglevering nu","Feed-in price is not negative":"Terugleverprijs is niet negatief","Feed-in T1":"Feed-in T1","Feed-in T2":"Feed-in T2","Fixed cost/day":"Vaste kosten/dag","Fixed cost/year":"Vaste kosten/jaar","Fixed daily charges and gas are excluded.":"Vaste dagkosten en gas zijn niet meegerekend.","Fixed daily contract cost":"Vaste dagelijkse contractkosten","Flow sensor":"Stroomsensor","Forecast average":"Verwacht gemiddelde","Forecast · not used for automation":"Voorspelling · niet gebruikt voor automatisering","From grid":"Van raster","Full daily charge from your active contract":"Volledig dagbedrag uit je actieve contract","gas consumed":"verbruikt gas","Gas meter":"Gasmeter","Gas today":"Gas vandaag",Good:"Goed","Graphs shown":"Grafieken","Grid balanced":"Net in balans","Grid capacity available":"Rastercapaciteit beschikbaar","Grid export":"Netteruglevering","Grid export line":"Raster exportlijn","Grid import":"Netafname","Grid import line":"Raster importlijn","Grid now":"Net nu","Hardware features (V3)":"Hardware-eigenschappen (V3)","Hardware leak sensor":"Hardwareleksensor",Hazardous:"Gevaarlijk",Header:"Kop","Heat on solar surplus":"Verwarm met zonne-overschot","Height of the room visual":"Hoogte van de kamer visueel","High VOC, ventilate":"Hoge VOC, ventilatie","Highest phase load":"Hoogste fasebelasting","History range":"Voorgeschiedenisbereik","Home Assistant Recorder history":"Home Assistant Recorder geschiedenis","Home consumption":"Thuisverbruik","Hot water":"Warm water","Hourly electricity prices":"Stroomprijzen per uur",Humidity:"Luchtvochtigheid","Humidity Offset":"Vochtigheidsverschuiving","If no device is selected, entities are automatically detected.":"Als er geen apparaat is geselecteerd, worden entiteiten automatisch gedetecteerd.","Import and return details":"Gegevens importeren en retourneren","Import now":"Afname nu","Import T1":"T1 importeren","Import T2":"T2 importeren","Imported · tariff 1":"Ingevoerd · tarief 1","Imported · tariff 2":"Geïmporteerd · tarief 2","Imported, returned and net value today":"Afname, teruglevering en netto waarde vandaag","Importing from grid":"Afname van het net","In a Sections dashboard you can also drag the card wider. The card requests the full row by default.":"In een Section dashboard kunt u de kaart ook breder slepen. De kaart vraagt standaard de volledige rij aan.","Include fixed daily cost":"Inclusief vaste dagelijkse kosten","Incomplete sensor data":"Onvolledige sensordata","Initial day":"Begindag","Invalid room data":"Ongeldige kamergegevens","It is a bit cool":"Het is een beetje cool.","It is a bit warm":"Het is een beetje warm","just now":"Net","Keep solar export near zero":"Houd teruglevering rond nul","Keep the familiar home overview and source rows below the flow":"Houd het vertrouwde huis overzicht en bron rijen onder de stroom","Large calculated consumption overview":"Groot berekend verbruiksoverzicht","Large calculated consumption overview below the flow":"Groot berekend verbruikoverzicht onder de stroom","Large — 480 px":"Groot 480 px","Last run unknown":"Laatste uitvoering onbekend","Last triggered":"Laatst geactiveerd","leak alarm":"lekalarm","Leak detected":"Lek gedetecteerd","Leak Detection":"Lekdetectie","Leak detection":"Lekdetectie","Leak score":"Lekscore","Link this exact device to a sensor placement in Room Designer, or select a room override in the card editor.":"Koppel dit exacte apparaat aan een sensorplaatsing in Room Designer, of selecteer een roomoverride in de kaarteditor.","Live energy":"Live energie","Live energy unavailable":"Live energie niet beschikbaar","Live import and export":"Levende invoer en uitvoer","Live power flow":"Live energiestroom","Live presence":"Levende aanwezigheid","Live presence visualization":"Visualisatie van levende aanwezigheid","Live solar production when configured":"Levende zonneproductie wanneer geconfigureerd","Live Targets":"Levende doelstellingen","Live usage":"Actueel verbruik","Loading Home Assistant chart...":"Home Assistant-grafiek laden...","Loading rooms...":"Laden van kamers...","Loading rooms…":"Laden van kamers...","Loading smart savings...":"Smart Savings laden...","Loads shifted in time":"Verbruik in de tijd verschoven","M 24 16 C 35 16 37 38 42 46":"M 24 16 C 35 16 37 38 42 46","M 24 84 C 35 84 37 62 42 54":"M 24 84 C 35 84 37 62 42 54","M 76 50 C 69 50 65 50 58 50":"M 76 50 C 69 50 65 50 58 50","Max Afstand":"Max Afstand","Maximum distance (mm)":"Maximumafstand (mm)","Measured every 15 minutes from battery flows and running schedules, valued against the day-average electricity price.":"Elke 15 minuten gemeten aan de hand van batterijstroom en actieve schema's, gewaardeerd tegen de gemiddelde stroomprijs van de dag.","Measured value created by smart energy":"Gemeten waarde door slimme energie","Measurement explanation":"Meetverklaring","Meter environment":"Meter omgeving","Meter reading":"Meter lezen","Meter temperature and humidity":"Metertemperatuur en vochtigheid","Meter totals":"Metertotalen","Micro leak":"Microlek",Moderate:"Matig","Monitoring activity":"Bewakingsactiviteit","Monitoring grid flow":"Netstroom bewaken",Month:"Maand","Month peak":"Maandpiek","More information":"Meer informatie","Movement energy":"Bewegingsenergie","Moving distance":"Bewegende afstand","Negative feed-in - self-consumption active":"Negatieve terugleverprijs - zelfverbruik actief","Negative prices":"Negatieve prijzen","Net earned today":"Netto verdiend vandaag","Net electricity cost":"Netto stroomkosten","Never triggered":"Nog nooit geactiveerd","Next lower":"Volgende lagere prijs","Night usage":"Nachtgebruik","No active energy contract":"Geen actief energiecontract","No active targets":"Geen actieve doelen","No anomalies":"Geen afwijkingen","No calibration settings found":"Geen kalibratie-instellingen gevonden","No CeilSense found":"Geen CeilSense gevonden","No contract prices available":"Geen contractprijzen beschikbaar","No entities":"Geen entiteiten","No linked room configured for this sensor":"Geen verbonden ruimte geconfigureerd voor deze sensor","No measured return value deducted yet.":"Nog geen gemeten terugleverwaarde afgetrokken.","No mmWave settings found":"Geen mmWave-instellingen gevonden","No P1 meter selected":"Geen P1-meter geselecteerd","No P1MeterKit found":"Geen P1meterKit gevonden","No power statistics available":"Geen vermogensstatistieken beschikbaar","No price peak right now":"Nu geen prijspiek","No production":"Geen productie","No reading":"Geen meting","No Smart Automations yet":"Nog geen slimme automatiseringen","No unwanted paid export":"Geen ongewenste betaalde teruglevering","No usage":"Geen gebruik","None today":"Geen vandaag","Not available":"Niet beschikbaar","Not enough history yet":"Nog niet genoeg historie","NOx index":"NOx-index","NOx Index":"NOx Index","Number of hours shown in value graphs":"Aantal uren in waardegrafieken",Offline:"Offline","Open Energy Settings":"Open Energie-instellingen","Open price entity details":"Open details van prijsentiteit","Open Smart Energy settings":"Open Smart Energy-instellingen","Open the card editor to choose a device":"Open de kaartbewerker om een apparaat te kiezen","Open Visuele Editor":"Visuele-editor openen","Optional sensor blocks are hidden automatically when that CeilSense hardware variant does not provide them.":"Optionele sensorblokken worden automatisch verborgen wanneer die CeilSense hardwarevariant hen niet voorziet.","Optional water leak sensor connected":"Optionele waterleksensor aangesloten","Overall risk assessment":"Algemene risicobeoordeling","p1 meter kit":"p1 meter kit","P1MeterKit device":"P1MeterKit apparaat",Pan:"Verschuiven","Particulate matter (PM)":"Deeltjes (PM)","Particulate matter dangerous!":"Deeltjes gevaarlijk.","Particulate matter elevated":"Verhoogde deeltjes","Particulate matter high":"Deeltjes hoog","Pause and resume directly from the card":"Pauzeer en hervat direct vanaf de kaart","Pause automation":"Automatisering pauzeren","Pause during price peaks":"Pauzeer tijdens prijspieken","Pause flow animation":"Animatie pauzeren","Pause on price peak":"Pauzeer op prijspiek","Pause schedule":"Schema pauzeren","Peak export":"Piekteruglevering","Peak import":"Piekafname","Peak mode is active":"Piekmodus is actief","Period totals":"Periodetotalen","Persistent meter reading unavailable":"Aanhoudende meting is niet beschikbaar","Person distance details":"Gegevens over de persoonsafstand","Phase load":"Fasebelasting","Physical water detection (V3)":"Fysieke waterdetectie (V3)","Pipe detail cards":"Pijp detail kaarten","Pipe visualization":"Pijpvisualisatie","PM value cards":"PM-waardekaarten","PM2.5 (Fine Particles)":"PM2.5 (Fijne deeltjes)","PM2.5 quality meter":"PM2.5 kwaliteitsmeter",Poor:"Slecht","Possible leak":"Mogelijk lek","Power (W) · mean with min/max range":"Vermogen (W) · gemiddelde met min/max-bereik","power consumed":"verbruikt vermogen","Power drawn from the grid":"Uit het net getrokken vermogen","Power returned to the grid":"Energie terug naar het net","Power trend":"Vermogenstrend","Power used by your home right now":"Vermogen dat je huis nu gebruikt","Pre-heat cheap":"Voorverwarmen goedkoop","Pre-heat cheap, ease off at peak":"Goedkoop voorverwarmen, terugschakelen bij piek","Pre-heating in the cheap window":"Voorverwarmen in het goedkope blok","Predicted all-in consumer price":"Voorspelde all-in consumentenprijs","Predicted all-in price":"Voorspelde all-in prijs","Predicted prices are used until confirmed prices arrive.":"Voorspelde prijzen worden gebruikt totdat bevestigde prijzen beschikbaar zijn.",Presence:"Aanwezigheid","Presence status":"Aanwezigheidsstatus","Price data is being fetched":"Prijsgegevens worden opgehaald","Price day":"Prijsdag","Price insights":"Prijsinformatie","Price now":"Prijs nu","Price outlook":"Prijsverwachting","Price peak - selected loads should be paused":"Prijspiek - geselecteerd verbruik moet worden gepauzeerd","Price, solar and deadline control":"Prijs-, zonne-energie- en deadlinebesturing","Producing now":"Produceert nu","Quarter-hour electricity prices":"Kwart uur elektriciteitsprijzen","Quick controls":"Snelle bediening","Radar Instellingen":"Radarinstellingen","Radar options":"Radaropties","Radar or room view":"Radar- of kamerzicht","Radar shows the sensor view. Room shows your drawn room with live tracking.":"Radar toont het sensorbeeld. Kamer toont uw getrokken kamer met live tracking.","Radar view":"Radarweergave","Reactive automations":"Reactieve automatiseringen","Ready - waiting for its trigger":"Gereed - wacht op een trigger","Reducing exported solar power":"Teruggeleverd zonnevermogen wordt verlaagd",Reset:"Herstellen","Resume flow animation":"Animatie hervatten","Return value is higher than import cost.":"De terugleverwaarde is hoger dan de afnamekosten.","Returned energy":"Teruggegeven energie","Returned today":"Vandaag teruggekeerd","Returned · tariff 1":"Teruggave · tarief 1","Returned · tariff 2":"Teruggave · tarief 2","rgba(100, 180, 255, 0.05)":"rgba(100, 180, 255, 0,05)","rgba(100, 180, 255, 0.3)":"rgba(100, 180, 255, 0,3)","rgba(100, 180, 255, 0.5)":"rgba(100, 180, 255, 0.5)","rgba(148, 163, 184, 0.5)":"rgba(148, 163, 184, 0,5)","rgba(148, 163, 184, 0.7)":"rgba(148, 163, 184, 0,7)","rgba(156, 39, 176, 0.3)":"rgba(156, 39, 176, 0,3)","rgba(255, 152, 0, 0.3)":"rgba(255, 152, 0, 0,3)","rgba(255, 255, 255, 0.1)":"rgba(255, 255, 255, 0,1)","rgba(255, 255, 255, 0.5)":"rgba(255, 255, 255, 0,5)","rgba(255, 255, 255, 0.6)":"rgba(255, 255, 255, 0,6)","rgba(33, 150, 243, 0.3)":"rgba(33, 150, 243, 0,3)","rgba(34, 197, 94, 0.5)":"rgba(34, 197, 94, 0,5)","rgba(59, 130, 246, 0.02)":"rgba(59, 130, 246, 0,02)","rgba(59, 130, 246, 0.15)":"rgba(59, 130, 246, 0,15)","rgba(59, 130, 246, 0.25)":"rgba(59, 130, 246, 0,25)","rgba(59, 130, 246, 0.3)":"rgba(59, 130, 246, 0,3)","rgba(76, 175, 80, 0.3)":"rgba(76, 175, 80, 0,3)",Room:"Kamer","Room clear":"Kamer veilig.","Room climate":"Ruimteklimaat","Room Quality":"Kwaliteit van de ruimte","Room quality":"Kwaliteit van de ruimte","Room quality score":"Kwaliteitsscore van de kamer","Room shown for this UltimateSensor":"Kamer getoond voor deze UltimateSensor","Room view":"Kamerweergave","Room view height":"Hoogte kamerweergave","Rooms could not be loaded right now.":"Kamers konden nu niet geladen worden.","Rooms could not be loaded. Reload the card or check the SmartHomeShop integration.":"Kamers konden niet geladen worden. Herlaad de kaart of controleer de SmartHomeShop integratie.",Rotate:"Draaien","Run in cheapest":"Run in goedkoopste","Run in the cheapest hours":"Draai tijdens de goedkoopste uren","Run while cheap":"Ren terwijl je goedkoop bent","Run while electricity is cheap":"Draai zolang stroom goedkoop is","Running an action now":"Voert nu een actie uit","Running in a selected low-price hour":"Draait in een geselecteerd goedkoop uur","Running now to meet the deadline":"Draait nu om de deadline te halen","Running on battery":"Draait op de batterij","Running on solar":"Draait op zonne-energie",Save:"Opslaan","Save failed:":"Opslaan mislukt:","Save to sensor":"Opslaan naar sensor","Saved compared with today's average electricity price.":"Bespaard ten opzichte van de gemiddelde stroomprijs van vandaag.","Saving...":"Opslaan...","Schedules could not be refreshed. Showing the latest available data.":"Schema's konden niet worden vernieuwd. De laatst beschikbare gegevens worden getoond.","Schedules today":"Schema's vandaag",Scroll:"Scrollen","Scroll to zoom":"Naar zoom schuiven","Select a P1 meter in SmartHomeShop Energy settings first.":"Selecteer eerst een P1-meter in de SmartHomeShop Energy-instellingen.","Select an active SmartHomeShop energy contract in Energy Settings.":"Selecteer een actief SmartHomeShop-energiecontract in Energie-instellingen.","Select an UltimateSensor device":"Selecteer een UltimateSensor apparaat","Select an UltimateSensor device with radar and/or environmental sensors.":"Selecteer een UltimateSensor apparaat met radar- en/of omgevingssensoren.","Self-consume on negative feed-in":"Zelf verbruiken bij negatieve terugleverprijs","Sensor Calibratie":"Sensorkalibratie","Sensor unavailable":"Sensor niet beschikbaar","Separate battery and schedule contributions":"Aparte batterij- en schemabijdragen","Set meter reading":"Meetwaarde instellen","Set up room & zones":"Ruimte & zones instellen","Shift + drag to pan":"Shift + sleep naar pan","Shift+Drag":"Shift+Sleep","Show card header":"Kaartkop tonen","Show grid lines":"Rasterlijnen tonen","Show ready-by schedules below reactive automations":"Ready-by schema's tonen onder reactieve automatiseringen","Show the best consecutive period below the chart":"Toon de beste opeenvolgende periode onder de grafiek","Show the direction and speed of power moving between grid, solar, home and battery":"Toon de richting en snelheid van het vermogen bewegen tussen net, zonne-energie, thuis en batterij","Show the latest 1–168 hours":"Laat de laatste 13.168 uur zien","Show the measured average import and return price per kWh":"Toon de gemeten gemiddelde invoer- en retourprijs per kWh","Show today's kWh and value for both grid directions":"De huidige kWh en waarde voor beide rasterrichtingen tonen","Show when each automation last ran":"Tonen wanneer elke automatisering voor het laatst liep","Show zones":"Zones tonen","Since Smart Savings started measuring":"Sinds Smart Savings is gaan meten","Small constant water flow":"Kleine constante waterstroom","Smart actions cost more than today's average so far.":"Slimme acties kostten tot nu toe meer dan het daggemiddelde.","Smart actions have not created measured value yet today.":"Slimme acties hebben vandaag nog geen gemeten waarde opgeleverd.","Smart automations":"Slimme automatiseringen","Smart Automations card configuration is required.":"Smart Automations kaartconfiguratie is vereist.","Smart energy":"Slimme energie","Smart Energy data could not be loaded.":"Smart Energy-gegevens konden niet geladen worden.","Smart savings":"Smart Savings","Smart Savings is paused":"Smart Savings is gepauzeerd","Smart Savings requires dynamic prices":"Smart Savings vereist dynamische prijzen","Smart savings unavailable":"Smart Savings niet beschikbaar","SmartHomeShop device":"SmartHomeShop-apparaat","SmartHomeShop Panel":"SmartHomeShop Paneel","SmartHomeShop: _loadRooms called but hass not available":"SmartHomeShop: _laden Kamers gebeld maar heeft niet beschikbaar","SmartHomeShop: _renderRoomView":"SmartHomeShop: _renderRoomBekijk","SmartHomeShop: Could not load environmental trends":"SmartHomeShop: Kon milieutrends niet laden","SmartHomeShop: Could not load rooms in card editor:":"SmartHomeShop: Kon kamers in kaarteditor niet laden:","SmartHomeShop: Could not load rooms:":"SmartHomeShop: Kon ruimtes niet laden:","SmartHomeShop: Error fetching history:":"SmartHomeShop: Fout bij ophalen van geschiedenis:","SmartHomeShop: Found Room Quality entity:":"SmartHomeShop: Gevonden kamer Kwaliteit entiteit:","SmartHomeShop: Loaded":"SmartHomeShop: geladen","SmartHomeShop: Loading rooms via WebSocket...":"SmartHomeShop: Kamers worden geladen via WebSocket...","SmartHomeShop: No Room Quality entity for this device, using local calculation":"SmartHomeShop: Geen Kamer Kwaliteit entiteit voor dit apparaat, met behulp van lokale berekening","SmartHomeShop: Rendering zones count:":"SmartHomeShop: Aantal renderingszones:","SmartHomeShop: Room targets:":"SmartHomeShop: Doelen van de ruimte:","SmartHomeShop: Room validation failed":"SmartHomeShop: Roomvalidatie mislukt","SmartHomeShop: Rooms already loaded, skipping":"SmartHomeShop: Kamers al geladen, overgeslagen","SmartHomeShop: ViewBox":"SmartHomeShop: ViewBox","SmartHomeShop: WebSocket result:":"SmartHomeShop: WebSocket resultaat:","Solar + battery":"Zon + batterij","Solar line":"Zonnelijn","Solar production during the day":"Productie van zonne-energie overdag","Solar surplus":"Zonne-energieoverschot","Source details below flow":"Brongegevens onder stroom","Standard — 360 px":"Standaard 360 px","Standby cost / year":"Stand-by kosten / jaar","Standby power":"Stand-by kracht","Status badge":"Status-badge","Still distance":"Nog steeds afstand","Still energy":"Stille energie","Summary strip above the graph":"Samenvatting strip boven de grafiek","Synchronized with your device":"Gesynchroniseerd met uw apparaat","Temp Offset":"Tijdsverschuiving",Temperature:"Temperatuur","Temperature sensor":"Temperatuursensor","Temperature, humidity, CO₂, light and pressure":"Temperatuur, vochtigheid, CO₂, licht en druk","The card links entities through the Home Assistant device registry, so renamed entity IDs keep working.":"De kaart koppelt entiteiten via het Home Assistant apparaatregister, dus hernoemde entiteit ID's blijven werken.","The card will calculate today's costs as soon as Recorder has grid power history.":"De kaart berekent de kosten van vandaag zodra Recorder netvermogenhistorie heeft.","The leak sensor detected water. Check immediately!":"De leksensor heeft water gedetecteerd. Check onmiddellijk!","The Smart Energy editor could not be loaded. Open SmartHomeShop Energy Settings to edit this automation.":"De Smart Energy-editor kon niet worden geladen. Open SmartHomeShop Energie-instellingen om deze automatisering te bewerken.","The view the card starts in. You can still switch views on the card.":"De weergave van de kaart begint. U kunt nog steeds wisselen weergaven op de kaart.","This contract has no changing intraday price curve, so cheapest-hour controls and price optimisation are not shown.":"Dit contract heeft geen veranderende intraday prijscurve, dus goedkoopste uur controles en prijsoptimalisatie worden niet getoond.","This month":"Deze maand","This sensor is not linked to the selected room":"Deze sensor is niet gekoppeld aan de geselecteerde ruimte","Title (optional)":"Titel (facultatief)","Title, icon and a short explanation":"Titel, pictogram en een korte uitleg","To grid":"Naar raster",Today:"Vandaag","Today · 5-minute statistics to now":"Vandaag · 5-minutenstatistieken tot nu","Today's breakdown":"Uitsplitsing van vandaag","Total consumption":"Totaal verbruik","Total consumption sensor":"Totale verbruikssensor","Total gas consumed":"Totaal gasverbruik","Total meter reading":"Totale meterstand","Total registered water":"Totaal geregistreerd water","Triggered just now":"Zojuist geactiveerd","UltimateSensor Device":"UltimateSensor Apparaat",Unhealthy:"Ongezond","Unhealthy for Sensitive":"Ongezond voor gevoelig",Unknown:"Onbekend","Unnamed room":"Kamer zonder naam","Update the WaterP1MeterKit firmware to enable Water Meter Total.":"Update de WaterP1MeterKit firmware om Water Meter Total in te schakelen.","Usage last 24 hours":"Gebruik afgelopen 24 uur","usage this month":"gebruik deze maand","usage this week":"gebruik deze week","usage this year":"gebruik dit jaar","usage today":"gebruik vandaag","Use device name":"Naam apparaat gebruiken","Use solar surplus":"Gebruik zonne-overschot","Use the handles to resize":"Gebruik de handvatten om de grootte te wijzigen","Use the left and right arrow keys to inspect each price period.":"Gebruik de linker en rechter pijltjestoetsen om elke prijsperiode te inspecteren.","Uses the entities and energy contract configured in SmartHomeShop Energy settings. No duplicate entity setup is needed in this card.":"Gebruikt de entiteiten en energiecontract geconfigureerd in SmartHomeShop Energy-instellingen. Er is geen dubbele entiteit-opstelling nodig in deze kaart.","Value graphs":"Waardegrafieken","Ventilate now!":"Ventileer nu!","Ventilation recommended":"Aanbevolen ventilatie","Very Unhealthy":"Zeer ongezond","View mode":"Beeldmodus","Visible content":"Zichtbare inhoud","Visible sections":"Zichtbare secties","VOC index":"VOC-index","VOC Index":"VOC Index","Waiting for a below-average price":"Wacht op een prijs onder het gemiddelde","Waiting for a cheap window or price peak":"Wacht op een goedkoop blok of prijspiek","Waiting for presence data":"Wachten op aanwezigheidsgegevens","Waiting for the device to reconnect":"Wachten tot het apparaat opnieuw verbonden is","Warm up":"Opwarmen","Warm up the room":"Warm de kamer op.",Water:"Water","Water + Energy":"Water + Energie","Water flowing":"Waterstromen","Water last 24 hours":"Water laatste 24 uur","Water leak detected!":"Waterlek gedetecteerd!","water leak sensor":"waterleksensor","WATER LEAK!":"Waterlek!","water meter total":"watermeter totaal","Water Monitoring":"Watermonitoring","water p1 meter kit":"water p1 meter kit","Water running for extended period":"Water dat langer loopt","Water section":"Watersectie","water total consumption":"totaal waterverbruik","Water usage during night hours":"Waterverbruik tijdens de nachturen","WaterFlowKit: Auto-detected entities:":"WaterFlowKit: Automatisch gedetecteerde entiteiten:",Week:"Week","WET!":"Wet!",Year:"Jaar","Your dynamic contract is active. Daily prices appear here as soon as confirmed prices or a forecast is available.":"Je dynamische contract is actief. De dagprijzen verschijnen hier zodra de bevestigde prijzen of een prognose beschikbaar zijn.","Your fixed or variable contract is connected correctly. Savings from shifting usage can only be measured when prices change during the day.":"Uw vaste of variabele contract is correct aangesloten. Besparingen van verschuivend gebruik kunnen alleen worden gemeten wanneer de prijzen overdag veranderen.","Zone Configuratie":"Zoneconfiguratie","Zone save failed:":"Zone opslaan mislukt:",Zoom:"Zoomen","⚠️ Water Leak Detected!":"Waterlek ontdekt!"},de:{"-- Select device --":"-- Gerät auswählen --","-- Select entity --":"-- Entität auswählen --","10px sans-serif":"10px Sans-Serif","10px system-ui, sans-serif":"10px system-ui, sans-serif","11px system-ui, sans-serif":"11px system-ui, sans-serif","24-hour usage graph":"24-Stunden-Nutzungsdiagramm","2D floor plan":"2D-Bodenplan","3D Controls":"3D Kontrollen","3D view":"3D-Ansicht","A connected power sensor is unavailable":"Ein angeschlossener Stromsensor ist nicht verfügbar","Above daily average":"Über dem Tagesdurchschnitt",Active:"Aktiv","active contract":"Aktiver Vertrag","Add a CeilSense to Home Assistant or select its device in the card editor.":"Fügen Sie CeilSense zu Home Assistant hinzu oder wählen Sie das Gerät im Karteneditor aus.","Add the full daily contract charge to today's net electricity cost":"Addieren Sie die volle tägliche Vertragsgebühr zu den heutigen Nettostromkosten","Add the P1MeterKit to Home Assistant or select its device in the card editor.":"Hinzufügen des P1Meters Kit auf Home Assistant oder wählen Sie das Gerät im Karteneditor aus.","Air is dry":"Luft ist trocken","Air is humid":"Luft ist feucht","Air pressure":"Luftdruck","Air too dry":"Luft zu trocken","Air too humid":"Zu feuchte Luft","All normal":"Alle normal","All time":"Gesamt","All values optimal":"Alle Werte optimal","All-in consumer price":"All-in-Verbrauchspreis","all-in price":"All-in Preis","An active SmartHomeShop energy contract is needed to calculate savings.":"Ein aktiver SmartHomeShop-Energievertrag ist erforderlich, um Einsparungen zu berechnen.","Animate power flow":"Energiefluss animieren","Auto detect":"Auto-Erkennung","Automatic uses the Room Designer room linked to this exact Home Assistant device.":"Automatic verwendet den Room Designer-Raum, der mit genau diesem Home Assistant-Gerät verbunden ist.","Average prices":"Durchschnittspreise","avg.":"avg.","Avoid negative-price solar export":"Negativpreis-Solarexport vermeiden","Battery flow and state of charge":"Batteriestrom und Ladezustand","Battery line":"Batterieleitung","Battery today":"Batterie heute","Begin X (mm)":"Beginn X (mm)","Begin Y (mm)":"Beginn Y (mm)","Below daily average":"Unter dem Tagesdurchschnitt","bold 11px system-ui, sans-serif":"fett 11px system-ui, sans-serif","bold 13px system-ui, sans-serif":"fett 13px system-ui, sans-serif","Calculated hourly rate":"Berechneter Stundensatz","Calculating today's electricity costs...":"Die heutigen Stromkosten berechnen...","Calculation explanation":"Berechnungserklärung",Cancel:"Abbrechen","Cancel setting meter reading":"Abstellzählerablesung","Card density":"Kartendichte","Card title":"Kartentitel","Card title (optional)":"Kartentitel (fakultativ)","ceil sense":"Ceil Sense","Ceiling presence & climate":"Deckenpräsenz und Klima","CeilSense device":"CeilSense-Gerät","Charge EV cheapest":"Charge EV billig","Charge the car in the cheapest hours":"Laden Sie das Auto in den billigsten Stunden","Charging and discharging":"Aufladen und Entladen","Charging and discharging power":"Lade- und Entladestrom","Cheapest block":"Günstiger Block","Cheapest block duration":"Billigste Blockdauer","Check the power supply and Wi-Fi connection.":"Überprüfen Sie die Stromversorgung und die Wi-Fi-Verbindung.","Check the selected contract in SmartHomeShop Energy Settings.":"Überprüfen Sie den ausgewählten Vertrag in den SmartHomeShop Energieeinstellungen.","Click a zone to select it":"Klicken Sie auf eine Zone, um sie auszuwählen","Climate values":"Klimawerte",Close:"Schließen","CO2 quality meter":"CO2-Qualitätsmesser","Cold water":"Kaltes Wasser","Combined climate assessment":"Kombinierte Klimaprüfung","Combined flow status":"Kombinierter Durchflussstatus","Combined room quality":"Kombinierte Raumqualität","Compact - status only":"Compact - nur Status","Compact — 300 px":"Compact — 300 px","Configure a P1 meter, solar or battery power source in SmartHomeShop Energy Settings.":"Konfigurieren Sie ein P1-Messgerät, eine Solar- oder Batteriestromquelle in den SmartHomeShop-Energieeinstellungen.","Connect an active SmartHomeShop contract to value today's imported and returned electricity.":"Verbinden Sie einen aktiven SmartHomeShop-Vertrag, um den heutigen importierten und zurückgegebenen Strom zu bewerten.","Connection and grid status":"Netzanschluss und Netzstatus","Connection and occupancy status":"Anschluss- und Belegungsstatus","Continuous flow":"Dauerstrom","Cool down":"Abkühlung","Cool down the room":"Kühlen Sie den Raum ab","Coordinates snap to 100mm":"Koordinaten Snap auf 100mm","Cost this month":"Kosten diesen Monat","Cost today":"Kosten heute","Costs, peak and standby insights":"Kosten, Peak und Standby Insights","Could not enable the automation.":"Die Automatisierung konnte nicht ermöglicht werden.","Could not pause the automation.":"Ich konnte die Automatisierung nicht unterbrechen.","Could not update the schedule.":"Ich konnte den Zeitplan nicht aktualisieren.","CO₂ Quality":"CO₂ Qualität","CO₂ unhealthy, ventilate":"CO₂ ungesund, lüften","Create price, solar or deadline controls in SmartHomeShop Energy Settings. They will appear here automatically.":"Erstellen Sie Preis-, Solar- oder Terminkontrollen in den SmartHomeShop Energieeinstellungen. Sie werden hier automatisch erscheinen.","Cumulative value this calendar month":"Kumulierter Wert in diesem Kalendermonat","Current and peak values":"Strom- und Spitzenwerte","Current grid import or export":"Aktueller Netzimport oder -export","current power":"Stromstärke","Current power usage":"Stromverbrauch","Current price":"Aktueller Preis","Current usage":"Aktuelle Nutzung","current water usage":"derzeitiger Wasserverbrauch","Current water usage":"Aktueller Wasserverbrauch","Curtailing export during negative feed-in":"Einschränkung des Exports bei negativer Einspeisung","Daily average":"Tagesdurchschnitt","Daily average, low, high and feed-in facts":"Täglicher Durchschnitt, niedrig, hoch und Feed-in Fakten","Daily spread":"Tägliche Ausbreitung","Deadline schedules":"Fristen","Default room view":"Standardraumansicht","Detection detail":"Nachweisdetail","Detection distance":"Detektionsabstand","Detection zones":"Detektionszonen",Device:"Vorrichtung","Device offline":"Gerät offline","Direction and speed follow the power moving right now":"Richtung und Geschwindigkeit folgen dem aktuellen Energiefluss","Disabled - deadline planning is paused":"Disabled - Terminplanung wird pausiert","Disabled - no automatic actions":"Disabled - keine automatischen Aktionen","Distance and radar energy":"Entfernung und Radarenergie",Drag:"Zug","Drag the zone to move it":"Ziehen Sie die Zone, um es zu bewegen","Drag to rotate":"Schleppen in Rotation","Draw your room, place the sensor and configure zones in the":"Zeichnen Sie Ihren Raum, platzieren Sie den Sensor und konfigurieren Sie Zonen im","Edit setup":"Einrichtung bearbeiten","Edit zones in 2D mode":"Zonen im 2D-Modus bearbeiten","Eind X (mm)":"X-Ende (mm)","Eind Y (mm)":"Y-Ende (mm)","Electricity costs":"Stromkosten","Electricity costs unavailable":"Stromkosten nicht verfügbar","Electricity imported":"Strombezug","Electricity is cheap now":"Strom ist jetzt billig","Electricity returned":"Netzeinspeisung","Electricity today":"Strom heute","Elevated VOC":"Erhöhte VOC","Enable automation":"Automatisierung ermöglichen","Enable schedule":"Zeitplan aktivieren","Enable this if you have connected the optional water leak sensor to your WaterP1MeterKit V3. Critical leak alerts remain visible even when other content is hidden.":"Aktivieren Sie dies, wenn Sie den optionalen Wasserlecksensor an Ihren WaterP1MeterKit V3 angeschlossen haben. Kritische Leckwarnungen bleiben sichtbar, auch wenn andere Inhalte ausgeblendet werden.",Energy:"Energie","Energy active":"Energie aktiv","energy consumed":"Energieverbrauch","Energy contract":"Energievertrag","Energy costs card configuration is required.":"Die Konfiguration der Energiekostenkarte ist erforderlich.","Energy insights":"Energieeinblicke","Energy Live card configuration is required.":"Energy Live-Kartenkonfiguration ist erforderlich.","Energy monitoring":"Energieüberwachung","Energy Power Trend card configuration is required.":"Energieversorgung Trendkartenkonfiguration ist erforderlich.","Energy Price Outlook card configuration is required.":"Energiepreis Outlook-Kartenkonfiguration ist erforderlich.","Energy prices":"Energiepreise","Energy section":"Energiebereich","Enter the reading shown on your physical water meter in m³, for example 123.456. The value is stored on the device itself.":"Geben Sie die Anzeige in Ihrem physischen Wasserzähler in m3 ein, z. B. 123,456. Der Wert wird auf dem Gerät selbst gespeichert.","entry lines:":"Eingangsleitungen:","Environmental sensors":"Umgebungssensoren","Estimated feed-in now":"Geschätztes Feed-In jetzt","Estimated price":"Geschätzter Preis","Estimated price now":"Geschätzter Preis jetzt",Excellent:"Ausgezeichnet","Expanded - status and details":"Erweitert - Status und Details","Explain how Smart Savings is calculated":"Erklären Sie, wie Smart Savings berechnet wird","Explain the price source, coverage and contract charges":"Erläutern Sie die Preisquelle, Abdeckung und Vertragsgebühren","Export now":"Jetzt exportieren","Exporting to grid":"Export ins Netz","Extra large — 600 px":"Extra groß - 600 px","Failed to save zones:":"Zonen konnten nicht gespeichert werden:","Feed-in now":"Einspeisung jetzt","Feed-in price is not negative":"Einspeisepreis ist nicht negativ","Feed-in T1":"Einspeisung T1","Feed-in T2":"Einspeisung T2","Fixed cost/day":"Fixkosten/Tag","Fixed cost/year":"Fixkosten/Jahr","Fixed daily charges and gas are excluded.":"Feste Tagesgebühren und Gas sind ausgeschlossen.","Fixed daily contract cost":"Feste tägliche Vertragskosten","Flow sensor":"Durchflusssensor","Forecast average":"Prognosedurchschnitt","Forecast · not used for automation":"Prognose · nicht für die Automatisierung verwendet","From grid":"Aus dem Netz","Full daily charge from your active contract":"Volle tägliche Gebühr von Ihrem aktiven Vertrag","gas consumed":"Gasverbrauch","Gas meter":"Gaszähler","Gas today":"Gas heute",Good:"Gut","Graphs shown":"Dargestellte Diagramme","Grid balanced":"Netz ausgeglichen","Grid capacity available":"Verfügbare Netzkapazität","Grid export":"Netzausfuhr","Grid export line":"Netzexportleitung","Grid import":"Netzeinfuhr","Grid import line":"Netzeinfuhrleitung","Grid now":"Netz jetzt","Hardware features (V3)":"Hardwaremerkmale (V3)","Hardware leak sensor":"Hardware-Leck-Sensor",Hazardous:"Gefährlich",Header:"Kopfzeile","Heat on solar surplus":"Wärme auf Sonnenüberschuss","Height of the room visual":"Höhe des Raumes visuell","High VOC, ventilate":"Hoch VOC, belüftet","Highest phase load":"Höchste Phasenlast","History range":"Historischer Bereich","Home Assistant Recorder history":"Home Assistant Recorder Geschichte","Home consumption":"Hausverbrauch","Hot water":"Warmwasser","Hourly electricity prices":"Stündliche Strompreise",Humidity:"Luftfeuchtigkeit","Humidity Offset":"Luftfeuchtigkeitsversatz","If no device is selected, entities are automatically detected.":"Wenn kein Gerät ausgewählt ist, werden Entitäten automatisch erkannt.","Import and return details":"Angaben Einfuhr und Rücksendung","Import now":"Jetzt importieren","Import T1":"Einfuhr T1","Import T2":"Einfuhr T2","Imported · tariff 1":"Importiert · Tarif 1","Imported · tariff 2":"Importiert · Tarif 2","Imported, returned and net value today":"Importiert, zurückgegeben und Nettowert heute","Importing from grid":"Import aus dem Netz","In a Sections dashboard you can also drag the card wider. The card requests the full row by default.":"In einem Sections Dashboard können Sie die Karte auch breiter ziehen. Die Karte fordert die vollständige Zeile standardmäßig an.","Include fixed daily cost":"Fixe Tageskosten enthalten","Incomplete sensor data":"Unvollständige Sensordaten","Initial day":"Erster Tag","Invalid room data":"Ungültige Zimmerdaten","It is a bit cool":"Es ist ein bisschen cool","It is a bit warm":"Es ist ein bisschen warm","just now":"gerade jetzt","Keep solar export near zero":"Solarexport nahe Null","Keep the familiar home overview and source rows below the flow":"Behalten Sie die vertraute Hausübersicht und Quellzeilen unter dem Fluss","Large calculated consumption overview":"Große berechnete Verbrauchsübersicht","Large calculated consumption overview below the flow":"Große berechnete Verbrauchsübersicht unterhalb des Flusses","Large — 480 px":"Groß — 480 px","Last run unknown":"Letzter Lauf unbekannt","Last triggered":"Letzter Auslöser","leak alarm":"Leckagealarm","Leak detected":"Leckage erkannt","Leak Detection":"Leckerkennung","Leak detection":"Leckageerkennung","Leak score":"Leckpunkt","Link this exact device to a sensor placement in Room Designer, or select a room override in the card editor.":"Verbinden Sie dieses genaue Gerät mit einer Sensorplatzierung in Room Designer oder wählen Sie im Karteneditor eine Raumüberschreibung aus.","Live energy":"Live-Energie","Live energy unavailable":"Live-Energie nicht verfügbar","Live import and export":"Live Import und Export","Live power flow":"Live-Leistungsfluss","Live presence":"Lebendpräsenz","Live presence visualization":"Live-Präsenzvisualisierung","Live solar production when configured":"Live-Solarproduktion bei Konfiguration","Live Targets":"Live-Ziele","Live usage":"Aktueller Verbrauch","Loading Home Assistant chart...":"Laden Home Assistant Diagramm...","Loading rooms...":"Laderäume...","Loading rooms…":"Laderäume...","Loading smart savings...":"Smart Savings wird geladen…","Loads shifted in time":"In der Zeit verschobene Lasten","M 24 16 C 35 16 37 38 42 46":"M 24 16 C 35 16 37 38 42 46","M 24 84 C 35 84 37 62 42 54":"M 24 84 C 35 84 37 62 42 54","M 76 50 C 69 50 65 50 58 50":"M 76 50 C 69 50 65 50 58 50 50","Max Afstand":"Maximale Entfernung","Maximum distance (mm)":"Maximaler Abstand (mm)","Measured every 15 minutes from battery flows and running schedules, valued against the day-average electricity price.":"Gemessen alle 15 Minuten aus Batteriestrom und Fahrplänen, bewertet gegen den Tagesdurchschnittsstrompreis.","Measured value created by smart energy":"Gemessener Mehrwert durch Smart Energy","Measurement explanation":"Messanweisung","Meter environment":"Zählerumgebung","Meter reading":"Zählerstand","Meter temperature and humidity":"Messgerätetemperatur und -feuchtigkeit","Meter totals":"Zählsummen","Micro leak":"Mikroleckage",Moderate:"Mäßig","Monitoring activity":"Überwachungsaktivität","Monitoring grid flow":"Überwachungsnetzfluss",Month:"Monat","Month peak":"Monatlicher Höchststand","More information":"Weitere Informationen","Movement energy":"Bewegungsenergie","Moving distance":"Beweglichkeit","Negative feed-in - self-consumption active":"Negative Einspeisung - Eigenverbrauch aktiv","Negative prices":"Negative Preise","Net earned today":"Heute netto verdient","Net electricity cost":"Netto-Stromkosten","Never triggered":"Niemals ausgelöst","Next lower":"Nächster niedriger","Night usage":"Nachtnutzung","No active energy contract":"Kein aktiver Energievertrag","No active targets":"Keine aktiven Ziele","No anomalies":"Keine Anomalien","No calibration settings found":"Keine Kalibrierungseinstellungen gefunden","No CeilSense found":"Keine CeilSense gefunden","No contract prices available":"Keine Vertragspreise verfügbar","No entities":"Keine Entitäten","No linked room configured for this sensor":"Kein verknüpfter Raum für diesen Sensor konfiguriert","No measured return value deducted yet.":"Noch kein gemessener Rückgabewert abgezogen.","No mmWave settings found":"Keine mmWave-Einstellungen gefunden","No P1 meter selected":"Kein P1-Meter ausgewählt","No P1MeterKit found":"No P1MeterKit gefunden","No power statistics available":"Keine Stromstatistik verfügbar","No price peak right now":"Keine Preisspitze im Moment","No production":"Keine Produktion","No reading":"Kein Messwert","No Smart Automations yet":"Noch keine Smart Automation","No unwanted paid export":"Keine unerwünschte bezahlte Ausfuhr","No usage":"Keine Nutzung","None today":"Heute keine","Not available":"Nicht verfügbar","Not enough history yet":"Noch nicht genug Geschichte","NOx index":"NOx-Index","NOx Index":"NOx Index","Number of hours shown in value graphs":"Anzahl der Stunden in Wertdiagrammen",Offline:"Offline","Open Energy Settings":"Energieeinstellungen öffnen","Open price entity details":"Angaben zum Eröffnungspreis","Open Smart Energy settings":"Smart Energy Einstellungen öffnen","Open the card editor to choose a device":"Öffnen Sie den Karteneditor, um ein Gerät auszuwählen","Open Visuele Editor":"Visuellen Editor öffnen","Optional sensor blocks are hidden automatically when that CeilSense hardware variant does not provide them.":"Optionale Sensorblöcke werden automatisch ausgeblendet, wenn diese CeilSense-Hardwarevariante sie nicht bereitstellt.","Optional water leak sensor connected":"Optionaler Wasserlecksensor angeschlossen","Overall risk assessment":"Gesamtrisikobewertung","p1 meter kit":"p1 Meter Kit","P1MeterKit device":"P1MeterKit-Gerät",Pan:"Verschieben","Particulate matter (PM)":"Partikel (PM)","Particulate matter dangerous!":"Feinstaub gefährlich!","Particulate matter elevated":"Feinstaub erhöht","Particulate matter high":"Feinstaub hoch","Pause and resume directly from the card":"Pause und Wiederaufnahme direkt von der Karte","Pause automation":"Pausenautomatisierung","Pause during price peaks":"Pause während der Preisspitzen","Pause flow animation":"Flussanimation pausieren","Pause on price peak":"Pause auf Preisspitze","Pause schedule":"Pausenplan","Peak export":"Spitzenausfuhren","Peak import":"Spitzeneinfuhren","Peak mode is active":"Peak Mode ist aktiv","Period totals":"Periodengesamtbeträge","Persistent meter reading unavailable":"Persistente Zählerablesung nicht verfügbar","Person distance details":"Angaben zum Personenabstand","Phase load":"Phasenlast","Physical water detection (V3)":"Physikalische Wasserdetektion (V3)","Pipe detail cards":"Rohrdetailkarten","Pipe visualization":"Rohrvisualisierung","PM value cards":"PM-Wertkarten","PM2.5 (Fine Particles)":"PM2.5 (feine Partikel)","PM2.5 quality meter":"PM2.5 Qualitätsmessgerät",Poor:"Schlecht","Possible leak":"Mögliche Leckage","Power (W) · mean with min/max range":"Leistung (W) · Mittelwert mit min/max Bereich","power consumed":"Leistungsaufnahme","Power drawn from the grid":"Strom aus dem Netz","Power returned to the grid":"Strom zurück ins Netz","Power trend":"Leistungsverlauf","Power used by your home right now":"Leistung, die dein Zuhause gerade verbraucht","Pre-heat cheap":"Vorwärme billig","Pre-heat cheap, ease off at peak":"Vorwärmen billig, entspannen Sie sich in der Spitze","Pre-heating in the cheap window":"Vorwärmen im billigen Fenster","Predicted all-in consumer price":"Voraussichtlicher All-in-Verbraucherpreis","Predicted all-in price":"Voraussichtlicher All-in-Preis","Predicted prices are used until confirmed prices arrive.":"Voraussichtliche Preise werden verwendet, bis bestätigte Preise eintreffen.",Presence:"Anwesenheit","Presence status":"Präsenzstatus","Price data is being fetched":"Preisdaten werden abgerufen","Price day":"Preistag","Price insights":"Preisinformationen","Price now":"Jetzt Preis","Price outlook":"Preisausblick","Price peak - selected loads should be paused":"Preisspitze - ausgewählte Lasten sollten angehalten werden","Price, solar and deadline control":"Preis-, Solar- und Terminkontrolle","Producing now":"Erzeugt gerade","Quarter-hour electricity prices":"Viertelstundenstrompreise","Quick controls":"Schnelle Kontrollen","Radar Instellingen":"Radareinstellungen","Radar options":"Radaroptionen","Radar or room view":"Radar- oder Raumansicht","Radar shows the sensor view. Room shows your drawn room with live tracking.":"Radar zeigt die Sensoransicht. Der raum zeigt ihren gezeichneten raum mit live-tracking.","Radar view":"Radaransicht","Reactive automations":"Reaktive Automatisierung","Ready - waiting for its trigger":"Ready - Warten auf seinen Auslöser","Reducing exported solar power":"Reduzierung der exportierten Solarenergie",Reset:"Zurücksetzen","Resume flow animation":"Flussanimation fortsetzen","Return value is higher than import cost.":"Der Rückgabewert ist höher als die Importkosten.","Returned energy":"Rückführung von Energie","Returned today":"Heute zurückgekommen","Returned · tariff 1":"Rückgabe · Tarif 1","Returned · tariff 2":"Rückgabe · Tarif 2","rgba(100, 180, 255, 0.05)":"rgba(100, 180, 255, 0.05)","rgba(100, 180, 255, 0.3)":"rgba(100, 180, 255, 0,3)","rgba(100, 180, 255, 0.5)":"rgba(100, 180, 255, 0.5)","rgba(148, 163, 184, 0.5)":"rgba(148, 163, 184, 0.5)","rgba(148, 163, 184, 0.7)":"rgba(148, 163, 184, 0.7)","rgba(156, 39, 176, 0.3)":"rgba(156, 39, 176, 0.3)","rgba(255, 152, 0, 0.3)":"rgba(255, 152, 0, 0,3)","rgba(255, 255, 255, 0.1)":"rgba(255, 255, 255, 0.1)","rgba(255, 255, 255, 0.5)":"rgba(255, 255, 255, 0.5)","rgba(255, 255, 255, 0.6)":"rgba(255, 255, 255, 0.6)","rgba(33, 150, 243, 0.3)":"rgba(33, 150, 243, 0,3)","rgba(34, 197, 94, 0.5)":"rgba(34, 197, 94, 0.5)","rgba(59, 130, 246, 0.02)":"rgba(59, 130, 246, 0,02)","rgba(59, 130, 246, 0.15)":"rgba(59, 130, 246, 0.15)","rgba(59, 130, 246, 0.25)":"rgba(59, 130, 246, 0.25)","rgba(59, 130, 246, 0.3)":"rgba(59, 130, 246, 0,3)","rgba(76, 175, 80, 0.3)":"rgba(76, 175, 80, 0,3)",Room:"Zimmer","Room clear":"Raum klar","Room climate":"Raumklima","Room Quality":"Raumqualität","Room quality":"Raumqualität","Room quality score":"Zimmerqualitätsbewertung","Room shown for this UltimateSensor":"Raum für diese UltimateSensor gezeigt","Room view":"Raumansicht","Room view height":"Raumsichthöhe","Rooms could not be loaded right now.":"Die Zimmer konnten jetzt nicht geladen werden.","Rooms could not be loaded. Reload the card or check the SmartHomeShop integration.":"Die Zimmer konnten nicht beladen werden. Laden Sie die Karte neu oder überprüfen Sie die SmartHomeShop-Integration.",Rotate:"Rotation","Run in cheapest":"Laufen Sie am billigsten","Run in the cheapest hours":"Laufen Sie in den billigsten Stunden","Run while cheap":"Laufen, während billig","Run while electricity is cheap":"Laufen, während Strom billig ist","Running an action now":"Jetzt eine Aktion ausführen","Running in a selected low-price hour":"Laufen in einer ausgewählten Niedrigpreisstunde","Running now to meet the deadline":"Jetzt laufen, um die Frist einzuhalten","Running on battery":"Versorgung durch die Batterie","Running on solar":"Versorgung durch Solarenergie",Save:"Speichern","Save failed:":"Speichern fehlgeschlagen:","Save to sensor":"Speichern zum Sensor","Saved compared with today's average electricity price.":"Gespart im Vergleich zum heutigen Durchschnittsstrompreis.","Saving...":"Rettung...","Schedules could not be refreshed. Showing the latest available data.":"Zeitpläne konnten nicht aktualisiert werden. Anzeige der neuesten verfügbaren Daten.","Schedules today":"Zeitpläne heute",Scroll:"Scrollen","Scroll to zoom":"Scrollen Sie zum Zoom","Select a P1 meter in SmartHomeShop Energy settings first.":"Wählen Sie zuerst ein P1-Messgerät in den SmartHomeShop-Energieeinstellungen aus.","Select an active SmartHomeShop energy contract in Energy Settings.":"Wählen Sie einen aktiven SmartHomeShop-Energievertrag in den Energieeinstellungen.","Select an UltimateSensor device":"Wählen Sie ein UltimateSensor-Gerät","Select an UltimateSensor device with radar and/or environmental sensors.":"Wählen Sie ein UltimateSensor-Gerät mit Radar- und/oder Umgebungssensoren.","Self-consume on negative feed-in":"Eigenverbrauch durch negative Einspeisung","Sensor Calibratie":"Sensorkalibrierung","Sensor unavailable":"Sensor nicht verfügbar","Separate battery and schedule contributions":"Separate Batterie- und Zeitplanbeiträge","Set meter reading":"Zählerstand","Set up room & zones":"Raum & Zonen einrichten","Shift + drag to pan":"Shift + Drag to Pan","Shift+Drag":"Umschaltung + Zug","Show card header":"Show Card Header","Show grid lines":"Rasterlinien anzeigen","Show ready-by schedules below reactive automations":"Vorbereitende Zeitpläne unter reaktiver Automatisierung anzeigen","Show the best consecutive period below the chart":"Zeigen Sie die beste aufeinanderfolgende Periode unter dem Chart","Show the direction and speed of power moving between grid, solar, home and battery":"Zeigen Sie die Richtung und Geschwindigkeit der Energie zwischen Netz, Solar, Haus und Batterie","Show the latest 1–168 hours":"Zeigen Sie die letzten 1–168 Stunden","Show the measured average import and return price per kWh":"Zeigen Sie den gemessenen durchschnittlichen Import- und Rückgabepreis pro kWh an","Show today's kWh and value for both grid directions":"Zeigen Sie das heutige kWh und den Wert für beide Rasterrichtungen an","Show when each automation last ran":"Zeigen Sie, wann jede Automatisierung zuletzt ausgeführt wurde","Show zones":"Ausstellungszonen","Since Smart Savings started measuring":"Seit Smart Savings mit der Messung begonnen hat","Small constant water flow":"kleiner konstanter Wasserfluss","Smart actions cost more than today's average so far.":"Intelligente Aktionen kosten bisher mehr als der heutige Durchschnitt.","Smart actions have not created measured value yet today.":"Intelligente Aktionen haben heute noch keinen Messwert geschaffen.","Smart automations":"Smart-Automatisierungen","Smart Automations card configuration is required.":"Smart Automations Kartenkonfiguration ist erforderlich.","Smart energy":"Intelligente Energie","Smart Energy data could not be loaded.":"Smart Energy-Daten konnten nicht geladen werden.","Smart savings":"Smart Savings","Smart Savings is paused":"Smart Savings wird angehalten","Smart Savings requires dynamic prices":"Smart Savings erfordert dynamische Preise","Smart savings unavailable":"Smart Savings nicht verfügbar","SmartHomeShop device":"SmartHomeShop-Gerät","SmartHomeShop Panel":"SmartHomeShop Panel","SmartHomeShop: _loadRooms called but hass not available":"SmartHomeShop _load Zimmer aufgerufen, aber nicht verfügbar","SmartHomeShop: _renderRoomView":"SmartHomeShop: _renderRoomView","SmartHomeShop: Could not load environmental trends":"SmartHomeShop: Könnte Umwelttrends nicht belasten","SmartHomeShop: Could not load rooms in card editor:":"SmartHomeShop: Es konnten keine Räume im Karteneditor geladen werden:","SmartHomeShop: Could not load rooms:":"SmartHomeShop: Die Räume konnten nicht beladen werden:","SmartHomeShop: Error fetching history:":"SmartHomeShop: Fehlerabrufhistorie:","SmartHomeShop: Found Room Quality entity:":"SmartHomeShop: Found Room Quality Entität:","SmartHomeShop: Loaded":"SmartHomeShop: geladen","SmartHomeShop: Loading rooms via WebSocket...":"SmartHomeShop: Laderäume über WebSocket...","SmartHomeShop: No Room Quality entity for this device, using local calculation":"SmartHomeShop: Keine Raumqualitätseinheit für dieses Gerät, mit lokaler Berechnung","SmartHomeShop: Rendering zones count:":"SmartHomeShop: Anzahl der Tierkörperbeseitigungszonen:","SmartHomeShop: Room targets:":"SmartHomeShop: Raumziele:","SmartHomeShop: Room validation failed":"SmartHomeShop: Validierung des Raums fehlgeschlagen","SmartHomeShop: Rooms already loaded, skipping":"SmartHomeShop: Zimmer bereits beladen, Skipping","SmartHomeShop: ViewBox":"SmartHomeShop: ViewBox","SmartHomeShop: WebSocket result:":"SmartHomeShop: WebSocket Ergebnis:","Solar + battery":"Solar + Batterie","Solar line":"Solarleitung","Solar production during the day":"Solarproduktion während des Tages","Solar surplus":"Solarüberschuss","Source details below flow":"Quellenangaben unter Strom","Standard — 360 px":"Standard — 360 px","Standby cost / year":"Standby Kosten / Jahr","Standby power":"Standby-Leistung","Status badge":"Statusabzeichen","Still distance":"Stille Entfernung","Still energy":"Stille Energie","Summary strip above the graph":"Zusammenfassungsstreifen über dem Graphen","Synchronized with your device":"Synchronisiert mit Ihrem Gerät","Temp Offset":"Zeitversatz",Temperature:"Temperatur","Temperature sensor":"Temperaturfühler","Temperature, humidity, CO₂, light and pressure":"Temperatur, Luftfeuchtigkeit, CO₂, Licht und Druck","The card links entities through the Home Assistant device registry, so renamed entity IDs keep working.":"Die Karte verbindet Entitäten über die Home Assistant-Geräteregistrierung, so dass umbenannte Entitäts-IDs weiterhin funktionieren.","The card will calculate today's costs as soon as Recorder has grid power history.":"Die Karte berechnet die heutigen Kosten, sobald Recorder die Netzstromhistorie hat.","The leak sensor detected water. Check immediately!":"Der Lecksensor erkannte Wasser. Überprüfen Sie sofort!","The Smart Energy editor could not be loaded. Open SmartHomeShop Energy Settings to edit this automation.":"Der Smart Energy Editor konnte nicht geladen werden. Open SmartHomeShop Energieeinstellungen zum Bearbeiten dieser Automatisierung.","The view the card starts in. You can still switch views on the card.":"Die Ansicht, in der die Karte beginnt. Sie können weiterhin Ansichten auf der Karte wechseln.","This contract has no changing intraday price curve, so cheapest-hour controls and price optimisation are not shown.":"Dieser Vertrag hat keine Änderung der Intraday-Preiskurve, so dass billigste Stundenkontrollen und Preisoptimierung nicht angezeigt werden.","This month":"Diesen Monat","This sensor is not linked to the selected room":"Dieser Sensor ist nicht mit dem ausgewählten Raum verbunden","Title (optional)":"Titel (fakultativ)","Title, icon and a short explanation":"Titel, Icon und eine kurze Erklärung","To grid":"Ins Netz",Today:"Heute","Today · 5-minute statistics to now":"Heute · 5-Minuten-Statistik bis jetzt","Today's breakdown":"Die heutige Aufschlüsselung","Total consumption":"Gesamtverbrauch","Total consumption sensor":"Gesamtverbrauchssensor","Total gas consumed":"Gesamtgasverbrauch","Total meter reading":"Zählerstand insgesamt","Total registered water":"Registriertes Wasser insgesamt","Triggered just now":"Gerade ausgelöst","UltimateSensor Device":"UltimateSensor Vorrichtung",Unhealthy:"Ungesund","Unhealthy for Sensitive":"Ungesund für empfindlich",Unknown:"Unbekannt","Unnamed room":"Unbenanntes Zimmer","Update the WaterP1MeterKit firmware to enable Water Meter Total.":"Aktualisieren Sie die WaterP1MeterKit Firmware, um Water Meter Total zu aktivieren.","Usage last 24 hours":"Nutzung letzte 24 Stunden","usage this month":"Nutzung in diesem Monat","usage this week":"Nutzung diese Woche","usage this year":"Nutzung in diesem Jahr","usage today":"Nutzung heute","Use device name":"Name des Geräts","Use solar surplus":"Solarüberschuss","Use the handles to resize":"Verwenden Sie die Griffe, um die Größe zu ändern","Use the left and right arrow keys to inspect each price period.":"Verwenden Sie die linke und rechte Pfeiltaste, um jeden Preiszeitraum zu überprüfen.","Uses the entities and energy contract configured in SmartHomeShop Energy settings. No duplicate entity setup is needed in this card.":"Verwendet die Entitäten und den Energievertrag, die in den SmartHomeShop Energieeinstellungen konfiguriert sind. In dieser Karte ist keine doppelte Entity-Einrichtung erforderlich.","Value graphs":"Wertdiagramme","Ventilate now!":"Jetzt lüften!","Ventilation recommended":"Belüftung empfohlen","Very Unhealthy":"Sehr ungesund","View mode":"Sichtmodus","Visible content":"Sichtbarer Inhalt","Visible sections":"Sichtbare Abschnitte","VOC index":"VOC-Index","VOC Index":"VOC Index","Waiting for a below-average price":"Waiting zu einem unterdurchschnittlichen Preis","Waiting for a cheap window or price peak":"Waiting für ein günstiges Fenster oder Preisspitze","Waiting for presence data":"Warten auf Präsenzdaten","Waiting for the device to reconnect":"Warten auf die Wiederverbindung des Geräts","Warm up":"Aufwärmen","Warm up the room":"Aufwärmen des Raumes",Water:"Wasser","Water + Energy":"Wasser + Energie","Water flowing":"Fließendes Wasser","Water last 24 hours":"Wasser letzte 24 Stunden","Water leak detected!":"Wasserleck entdeckt!","water leak sensor":"Wasserlecksensor","WATER LEAK!":"WASSERLEICH!","water meter total":"Wasserzähler insgesamt","Water Monitoring":"Wasserüberwachung","water p1 meter kit":"Wasser p1 Meter Kit","Water running for extended period":"Wasserlauf für längere Zeit","Water section":"Wasserabschnitt","water total consumption":"Gesamtwasserverbrauch","Water usage during night hours":"Wasserverbrauch während der Nacht","WaterFlowKit: Auto-detected entities:":"WaterFlowKit: Autodetektierte Entitäten:",Week:"Woche","WET!":"NASS!",Year:"Jahr","Your dynamic contract is active. Daily prices appear here as soon as confirmed prices or a forecast is available.":"Ihr dynamischer Vertrag ist aktiv. Tagespreise erscheinen hier, sobald bestätigte Preise oder eine Prognose vorliegen.","Your fixed or variable contract is connected correctly. Savings from shifting usage can only be measured when prices change during the day.":"Ihr fester oder variabler Vertrag ist korrekt verbunden. Einsparungen durch wechselnde Nutzung können nur gemessen werden, wenn sich die Preise während des Tages ändern.","Zone Configuratie":"Zonenkonfiguration","Zone save failed:":"Zone save fehlgeschlagen:",Zoom:"Zoomen","⚠️ Water Leak Detected!":"<0xE2><0x9A><0xA0>️ Wasserleck entdeckt!"},fr:{"-- Select device --":"-- Sélectionner l'appareil --","-- Select entity --":"-- Sélectionner une entité --","10px sans-serif":"10px sans-serif","10px system-ui, sans-serif":"10px système-ui, sans-serif","11px system-ui, sans-serif":"11px system-ui, sans-serif","24-hour usage graph":"Graphique d'utilisation 24 heures sur 24","2D floor plan":"Plan d'étage 2D","3D Controls":"3D Contrôles","3D view":"Vue 3D","A connected power sensor is unavailable":"Un capteur de puissance connecté n'est pas disponible","Above daily average":"Au-dessus de la moyenne quotidienne",Active:"Actif","active contract":"contrat actif","Add a CeilSense to Home Assistant or select its device in the card editor.":"Ajoutez un CeilSense à Home Assistant ou sélectionnez son périphérique dans l'éditeur de carte.","Add the full daily contract charge to today's net electricity cost":"Ajouter la charge quotidienne complète du contrat au coût net de l'électricité d'aujourd'hui","Add the P1MeterKit to Home Assistant or select its device in the card editor.":"Ajouter le P1Meter Kit Home Assistant ou sélectionnez son périphérique dans l'éditeur de carte.","Air is dry":"L'air est sec","Air is humid":"L'air est humide","Air pressure":"Pression atmosphérique","Air too dry":"Air trop sec","Air too humid":"Air trop humide","All normal":"Toute normale","All time":"Total","All values optimal":"Toutes les valeurs sont optimales","All-in consumer price":"Prix consommateur tout compris","all-in price":"Prix total","An active SmartHomeShop energy contract is needed to calculate savings.":"Un contrat énergétique SmartHomeShop actif est nécessaire pour calculer les économies.","Animate power flow":"Débit d'énergie animé","Auto detect":"Détecter automatiquement","Automatic uses the Room Designer room linked to this exact Home Assistant device.":"Automatique utilise la pièce Room Designer liée à ce périphérique exact Home Assistant.","Average prices":"Prix moyens","avg.":"Avg.","Avoid negative-price solar export":"Éviter les exportations solaires à prix négatif","Battery flow and state of charge":"Débit et état de charge de la batterie","Battery line":"Ligne de batterie","Battery today":"Batterie aujourd'hui","Begin X (mm)":"Début X (mm)","Begin Y (mm)":"Début Y (mm)","Below daily average":"En dessous de la moyenne quotidienne","bold 11px system-ui, sans-serif":"bold 11px system-ui, sans-serif","bold 13px system-ui, sans-serif":"bold 13px system-ui, sans-serif","Calculated hourly rate":"Taux horaire calculé","Calculating today's electricity costs...":"Calculer les coûts d'électricité d'aujourd'hui...","Calculation explanation":"Explication du calcul",Cancel:"Annuler","Cancel setting meter reading":"Annuler la lecture du paramètre","Card density":"Densité de la carte","Card title":"Titre de la carte","Card title (optional)":"Titre de la carte (facultatif)","ceil sense":"Ceil sens","Ceiling presence & climate":"Présence de plafond et climat","CeilSense device":"Appareil CeilSense","Charge EV cheapest":"Charge EV moins cher","Charge the car in the cheapest hours":"Charger la voiture dans les heures les moins chères","Charging and discharging":"Chargement et déchargement","Charging and discharging power":"Charger et décharger la puissance","Cheapest block":"Bloc le moins cher","Cheapest block duration":"Durée du bloc le moins cher","Check the power supply and Wi-Fi connection.":"Vérifiez l'alimentation et la connexion Wi-Fi.","Check the selected contract in SmartHomeShop Energy Settings.":"Vérifiez le contrat sélectionné dans les paramètres énergétiques SmartHomeShop.","Click a zone to select it":"Cliquez sur une zone pour la sélectionner","Climate values":"Valeurs climatiques",Close:"Fermer","CO2 quality meter":"Compteur de qualité CO2","Cold water":"Eau froide","Combined climate assessment":"Évaluation combinée du climat","Combined flow status":"État du flux combiné","Combined room quality":"Qualité combinée des chambres","Compact - status only":"Compact - statut uniquement","Compact — 300 px":"Compact — 300 px","Configure a P1 meter, solar or battery power source in SmartHomeShop Energy Settings.":"Configurez un compteur P1, une source d'énergie solaire ou batterie dans les paramètres énergétiques SmartHomeShop.","Connect an active SmartHomeShop contract to value today's imported and returned electricity.":"Connectez un contrat actif SmartHomeShop à la valeur de l'électricité importée et retournée aujourd'hui.","Connection and grid status":"État de la connexion et de la grille","Connection and occupancy status":"Statut de connexion et d'occupation","Continuous flow":"Débit continu","Cool down":"Refroidir","Cool down the room":"Refroidir la pièce","Coordinates snap to 100mm":"Coordonnées snap à 100mm","Cost this month":"Coût ce mois","Cost today":"Coût aujourd'hui","Costs, peak and standby insights":"Coûts, pics et perspectives en attente","Could not enable the automation.":"Impossible d'activer l'automatisation.","Could not pause the automation.":"Ne pouvait pas interrompre l'automatisation.","Could not update the schedule.":"Impossible de mettre à jour le calendrier.","CO₂ Quality":"Autres Qualité","CO₂ unhealthy, ventilate":"CO₂ malsain, ventilation","Create price, solar or deadline controls in SmartHomeShop Energy Settings. They will appear here automatically.":"Créez des contrôles de prix, solaires ou de date limite dans les paramètres énergétiques SmartHomeShop. Ils apparaîtront ici automatiquement.","Cumulative value this calendar month":"Valeur cumulée ce mois civil","Current and peak values":"Valeurs actuelles et maximales","Current grid import or export":"Importation ou exportation du réseau actuel","current power":"puissance actuelle","Current power usage":"Utilisation actuelle de la puissance","Current price":"Prix actuel","Current usage":"Utilisation actuelle","current water usage":"Consommation actuelle d'eau","Current water usage":"Consommation d'eau actuelle","Curtailing export during negative feed-in":"Exportation de la quenouille pendant l'alimentation négative","Daily average":"Moyenne journalière","Daily average, low, high and feed-in facts":"Moyenne quotidienne, faible, élevée et des faits d'alimentation","Daily spread":"Répartition quotidienne","Deadline schedules":"Calendrier des échéances","Default room view":"Vue par défaut de la chambre","Detection detail":"Détails de détection","Detection distance":"Distance de détection","Detection zones":"Zones de détection",Device:"Appareil","Device offline":"Périphérique hors ligne","Direction and speed follow the power moving right now":"La direction et la vitesse suivent le flux d’énergie actuel","Disabled - deadline planning is paused":"Handicapé - la planification de la date limite est interrompue","Disabled - no automatic actions":"Handicapé - pas d'action automatique","Distance and radar energy":"Distance et énergie radar",Drag:"Faites glisser","Drag the zone to move it":"Faites glisser la zone pour la déplacer","Drag to rotate":"Faire glisser pour tourner","Draw your room, place the sensor and configure zones in the":"Dessinez votre pièce, placez le capteur et configurez les zones dans la","Edit setup":"Modifier la configuration","Edit zones in 2D mode":"Modifier les zones en mode 2D","Eind X (mm)":"Fin X (mm)","Eind Y (mm)":"Fin Y (mm)","Electricity costs":"Coûts d’électricité","Electricity costs unavailable":"Coûts de l'électricité non disponibles","Electricity imported":"Électricité prélevée","Electricity is cheap now":"L'électricité est bon marché maintenant","Electricity returned":"Électricité injectée","Electricity today":"Électricité aujourd'hui","Elevated VOC":"Élevé VOC","Enable automation":"Activer l'automatisation","Enable schedule":"Activer le calendrier","Enable this if you have connected the optional water leak sensor to your WaterP1MeterKit V3. Critical leak alerts remain visible even when other content is hidden.":"Activez cela si vous avez connecté le capteur de fuite d'eau optionnel à votre WaterP1MeterKit V3. Les alertes critiques demeurent visibles même lorsque d'autres contenus sont cachés.",Energy:"Énergie","Energy active":"Énergie active","energy consumed":"énergie consommée","Energy contract":"Contrat énergie","Energy costs card configuration is required.":"La configuration de la carte des coûts énergétiques est requise.","Energy insights":"Perspectives énergétiques","Energy Live card configuration is required.":"La configuration de la carte Energy Live est requise.","Energy monitoring":"Surveillance de l'énergie","Energy Power Trend card configuration is required.":"Énergie La configuration de la carte de tendance est requise.","Energy Price Outlook card configuration is required.":"Prix de l'énergie La configuration de la carte Outlook est requise.","Energy prices":"Prix de l'énergie","Energy section":"Secteur énergie","Enter the reading shown on your physical water meter in m³, for example 123.456. The value is stored on the device itself.":"Saisissez la lecture affichée sur votre compteur d'eau physique en m3, par exemple 123.456. La valeur est stockée sur le périphérique lui-même.","entry lines:":"lignes d'entrée:","Environmental sensors":"Capteurs environnementaux","Estimated feed-in now":"Estimation de l'alimentation actuelle","Estimated price":"Prix estimé","Estimated price now":"Prix estimé maintenant",Excellent:"Excellent","Expanded - status and details":"Élargi - état et détails","Explain how Smart Savings is calculated":"Expliquer comment Smart Savings est calculé","Explain the price source, coverage and contract charges":"Expliquer la source des prix, la couverture et les frais contractuels","Export now":"Exporter maintenant","Exporting to grid":"Exportation vers le réseau","Extra large — 600 px":"Extra large — 600 px","Failed to save zones:":"Échec de l'enregistrement des zones :","Feed-in now":"Injection actuelle","Feed-in price is not negative":"Le prix d'entrée n'est pas négatif","Feed-in T1":"Alimentation T1","Feed-in T2":"Alimentation en T2","Fixed cost/day":"Coût fixe/jour","Fixed cost/year":"Coût fixe/année","Fixed daily charges and gas are excluded.":"Les charges journalières fixes et le gaz sont exclus.","Fixed daily contract cost":"Coût journalier fixe","Flow sensor":"Capteur de débit","Forecast average":"Moyenne prévue","Forecast · not used for automation":"Prévisions · non utilisées pour l'automatisation","From grid":"À partir de la grille","Full daily charge from your active contract":"Charge quotidienne complète de votre contrat actif","gas consumed":"gaz consommé","Gas meter":"Compteur de gaz","Gas today":"Gaz aujourd'hui",Good:"Bon","Graphs shown":"Graphiques","Grid balanced":"Réseau équilibré","Grid capacity available":"Capacité du réseau disponible","Grid export":"Exportation de grille","Grid export line":"Ligne d'exportation du réseau","Grid import":"Importation de grille","Grid import line":"Ligne d'importation de grille","Grid now":"Réseau maintenant","Hardware features (V3)":"Caractéristiques matérielles (V3)","Hardware leak sensor":"Capteur de fuite matériel",Hazardous:"Dangereux",Header:"En-tête","Heat on solar surplus":"Chaleur sur surplus solaire","Height of the room visual":"Hauteur de la chambre visuelle","High VOC, ventilate":"Haute VOC, ventilation","Highest phase load":"Charge de phase la plus élevée","History range":"Historique","Home Assistant Recorder history":"Historique de Home Assistant Recorder","Home consumption":"Consommation du logement","Hot water":"Eau chaude","Hourly electricity prices":"Prix horaires de l'électricité",Humidity:"Humidité","Humidity Offset":"Décalage d'humidité","If no device is selected, entities are automatically detected.":"Si aucun périphérique n'est sélectionné, les entités sont automatiquement détectées.","Import and return details":"Importer et retourner les détails","Import now":"Importer maintenant","Import T1":"Importation T1","Import T2":"Importation T2","Imported · tariff 1":"Importé · tarif 1","Imported · tariff 2":"Importé · tarif 2","Imported, returned and net value today":"Importé, retourné et valeur nette aujourd'hui","Importing from grid":"Importation depuis le réseau","In a Sections dashboard you can also drag the card wider. The card requests the full row by default.":"Dans un tableau de bord Sections, vous pouvez également faire glisser la carte plus large. La carte demande la ligne complète par défaut.","Include fixed daily cost":"Inclure le coût journalier fixe","Incomplete sensor data":"Données incomplètes du capteur","Initial day":"Jour initial","Invalid room data":"Données de chambre non valides","It is a bit cool":"C'est un peu cool.","It is a bit warm":"Il fait un peu chaud.","just now":"Juste maintenant","Keep solar export near zero":"Gardez l'exportation solaire près de zéro","Keep the familiar home overview and source rows below the flow":"Gardez l'aperçu familier de la maison et les lignes sources sous le flux","Large calculated consumption overview":"Grande consommation calculée","Large calculated consumption overview below the flow":"Grande vue d'ensemble de la consommation calculée sous le débit","Large — 480 px":"Grand — 480 px","Last run unknown":"Dernier essai inconnu","Last triggered":"Dernier déclenchement","leak alarm":"alarme de fuite","Leak detected":"Fuite détectée","Leak Detection":"Détection de fuite","Leak detection":"Détection des fuites","Leak score":"Score de fuite","Link this exact device to a sensor placement in Room Designer, or select a room override in the card editor.":"Lier ce périphérique exact à un placement de capteur dans Room Designer, ou sélectionner une zone de remplacement dans l'éditeur de carte.","Live energy":"Énergie en direct","Live energy unavailable":"Énergie en direct indisponible","Live import and export":"Importation et exportation vivantes","Live power flow":"Flux d’énergie en direct","Live presence":"Présence vivante","Live presence visualization":"Visualisation de la présence vivante","Live solar production when configured":"Production solaire en direct lors de la configuration","Live Targets":"Cibles réelles","Live usage":"Consommation actuelle","Loading Home Assistant chart...":"Chargement du graphique Home Assistant...","Loading rooms...":"Chargement des chambres...","Loading rooms…":"Chargement des chambres...","Loading smart savings...":"Chargement de Smart Savings…","Loads shifted in time":"Charges décalées dans le temps","M 24 16 C 35 16 37 38 42 46":"M 24 16 C 35 16 37 38 42 46","M 24 84 C 35 84 37 62 42 54":"M 24 84 C 35 84 37 62 42 54","M 76 50 C 69 50 65 50 58 50":"M 76 50 C 69 50 65 50 58 50","Max Afstand":"Distance maximale","Maximum distance (mm)":"Distance maximale (mm)","Measured every 15 minutes from battery flows and running schedules, valued against the day-average electricity price.":"Mesuré toutes les 15 minutes à partir du débit de la batterie et des horaires de fonctionnement, évalué par rapport au prix moyen journalier de l'électricité.","Measured value created by smart energy":"Valeur mesurée créée par Smart Energy","Measurement explanation":"Explication de mesure","Meter environment":"Environnement du compteur","Meter reading":"Lecture des compteurs","Meter temperature and humidity":"Température et humidité du compteur","Meter totals":"Nombre total de compteurs","Micro leak":"Fuite micro",Moderate:"Modéré","Monitoring activity":"Activité de surveillance","Monitoring grid flow":"Surveillance du débit du réseau",Month:"Mois","Month peak":"Maximum du mois","More information":"Plus d’informations","Movement energy":"Énergie des mouvements","Moving distance":"Distance de déplacement","Negative feed-in - self-consumption active":"Alimentation négative - autoconsommation active","Negative prices":"Prix négatifs","Net earned today":"Gain net aujourd’hui","Net electricity cost":"Coût net de l’électricité","Never triggered":"Jamais déclenché","Next lower":"Suivant inférieur","Night usage":"Usage nocturne","No active energy contract":"Aucun contrat d'énergie active","No active targets":"Pas de cibles actives","No anomalies":"Aucune anomalie","No calibration settings found":"Aucun réglage d'étalonnage trouvé","No CeilSense found":"Aucun CeilSense trouvé","No contract prices available":"Aucun prix contractuel disponible","No entities":"Aucune entité","No linked room configured for this sensor":"Aucune pièce liée configurée pour ce capteur","No measured return value deducted yet.":"Aucune valeur de retour mesurée n'a encore été déduite.","No mmWave settings found":"Pas de réglages en mm","No P1 meter selected":"Aucun compteur P1 sélectionné","No P1MeterKit found":"Aucun P1MeterKit trouvé","No power statistics available":"Pas de statistiques sur la puissance disponible","No price peak right now":"Pas de pic de prix en ce moment","No production":"Pas de production","No reading":"Aucune mesure","No Smart Automations yet":"Pas encore d'automatisation intelligente","No unwanted paid export":"Aucune exportation non désirée payée","No usage":"Aucune utilisation","None today":"Aucun aujourd’hui","Not available":"Non disponible","Not enough history yet":"Pas encore assez d'histoire","NOx index":"Indice NOx","NOx Index":"Autres Sommaire","Number of hours shown in value graphs":"Nombre d'heures indiqué dans les graphiques de valeurs",Offline:"Hors ligne","Open Energy Settings":"Ouvrir les paramètres Energy","Open price entity details":"Ouvrir les détails de l'entité","Open Smart Energy settings":"Ouvrir les paramètres Smart Energy","Open the card editor to choose a device":"Ouvrez l'éditeur de carte pour choisir un périphérique","Open Visuele Editor":"Ouvrir l'éditeur visuel","Optional sensor blocks are hidden automatically when that CeilSense hardware variant does not provide them.":"Les blocs de capteurs optionnels sont cachés automatiquement lorsque la variante matérielle CeilSense ne les fournit pas.","Optional water leak sensor connected":"Capteur de fuite d'eau en option connecté","Overall risk assessment":"Évaluation globale des risques","p1 meter kit":"kit de mesure p1","P1MeterKit device":"Appareil P1MeterKit",Pan:"Déplacer","Particulate matter (PM)":"Matières particulaires","Particulate matter dangerous!":"Particules dangereux !","Particulate matter elevated":"Augmentation des particules","Particulate matter high":"Matières particulaires élevées","Pause and resume directly from the card":"Laisser tomber et reprendre directement à partir de la carte","Pause automation":"Automatisation des pauses","Pause during price peaks":"Pause pendant les pics de prix","Pause flow animation":"Mettre l’animation du flux en pause","Pause on price peak":"Pause sur le pic de prix","Pause schedule":"Horaire de la pause","Peak export":"Exportation maximale","Peak import":"Importation maximale","Peak mode is active":"Le mode pic est actif","Period totals":"Total des périodes","Persistent meter reading unavailable":"Lecture de compteurs persistants non disponible","Person distance details":"Renseignements sur la distance entre les personnes","Phase load":"Charge de phase","Physical water detection (V3)":"Détection physique de l'eau (V3)","Pipe detail cards":"Cartes de détails de pipe","Pipe visualization":"Visualisation des tuyaux","PM value cards":"Cartes de valeurs PM","PM2.5 (Fine Particles)":"Autres (Bonnes particules)","PM2.5 quality meter":"PM2.5 compteur de qualité",Poor:"Mauvais","Possible leak":"Fuite possible","Power (W) · mean with min/max range":"Puissance (W) · moyenne avec une plage min/max","power consumed":"Puissance consommée","Power drawn from the grid":"Puissance tirée du réseau","Power returned to the grid":"Puissance retournée au réseau","Power trend":"Évolution de la puissance","Power used by your home right now":"Puissance consommée actuellement par votre logement","Pre-heat cheap":"Préchauffage bon marché","Pre-heat cheap, ease off at peak":"Préchauffer bon marché, se détendre au pic","Pre-heating in the cheap window":"Préchauffage dans la fenêtre bon marché","Predicted all-in consumer price":"Prix à la consommation prévu","Predicted all-in price":"Prix total prévu","Predicted prices are used until confirmed prices arrive.":"Les prix prévus sont utilisés jusqu'à l'arrivée des prix confirmés.",Presence:"Présence","Presence status":"État de présence","Price data is being fetched":"Les données de prix sont récupérées","Price day":"Jour du prix","Price insights":"Aperçu des prix","Price now":"Prix maintenant","Price outlook":"Prévision des prix","Price peak - selected loads should be paused":"Prix maximum - les charges sélectionnées doivent être suspendues","Price, solar and deadline control":"Contrôle des prix, solaire et échéance","Producing now":"Production en cours","Quarter-hour electricity prices":"Prix trimestriels de l'électricité","Quick controls":"Contrôles rapides","Radar Instellingen":"Paramètres du radar","Radar options":"Options radar","Radar or room view":"Vue radar ou chambre","Radar shows the sensor view. Room shows your drawn room with live tracking.":"Le radar montre la vue du capteur. La chambre montre votre chambre dessinée avec le suivi en direct.","Radar view":"Vue radar","Reactive automations":"Automatisations réactives","Ready - waiting for its trigger":"Prêt - attendant son déclencheur","Reducing exported solar power":"Réduction de l'énergie solaire exportée",Reset:"Réinitialiser","Resume flow animation":"Reprendre l’animation du flux","Return value is higher than import cost.":"La valeur de retour est plus élevée que le coût d'importation.","Returned energy":"Énergie retournée","Returned today":"De retour aujourd'hui","Returned · tariff 1":"Retour · tarif 1","Returned · tariff 2":"Retourné · tarif 2","rgba(100, 180, 255, 0.05)":"rgba(100, 180, 255, 0,05)","rgba(100, 180, 255, 0.3)":"rgba(100, 180, 255, 0,3)","rgba(100, 180, 255, 0.5)":"rgba(100, 180, 255, 0,5)","rgba(148, 163, 184, 0.5)":"rgba(148, 163, 184, 0,5)","rgba(148, 163, 184, 0.7)":"rgba(148, 163, 184, 0,7)","rgba(156, 39, 176, 0.3)":"rgba(156, 39, 176, 0,3)","rgba(255, 152, 0, 0.3)":"rgba(255, 152, 0, 0,3)","rgba(255, 255, 255, 0.1)":"rgba(255, 255, 255, 0,1)","rgba(255, 255, 255, 0.5)":"rgba(255, 255, 255, 0,5)","rgba(255, 255, 255, 0.6)":"rgba(255, 255, 255, 0,6)","rgba(33, 150, 243, 0.3)":"rgba(33, 150, 243, 0,3)","rgba(34, 197, 94, 0.5)":"rgba(34, 197, 94, 0,5)","rgba(59, 130, 246, 0.02)":"rgba(59, 130, 246, 0,02)","rgba(59, 130, 246, 0.15)":"rgba(59, 130, 246, 0,15)","rgba(59, 130, 246, 0.25)":"rgba(59, 130, 246, 0,25)","rgba(59, 130, 246, 0.3)":"rgba(59, 130, 246, 0,3)","rgba(76, 175, 80, 0.3)":"rgba(76, 175, 80, 0,3)",Room:"conférence","Room clear":"Chambre libre","Room climate":"Climat ambiant","Room Quality":"Qualité de la pièce","Room quality":"Qualité de la chambre","Room quality score":"Qualité de la chambre","Room shown for this UltimateSensor":"Chambre montrée pour ce UltimateSensor","Room view":"Vue de la pièce","Room view height":"Hauteur vue sur la chambre","Rooms could not be loaded right now.":"Les chambres ne pouvaient pas être chargées en ce moment.","Rooms could not be loaded. Reload the card or check the SmartHomeShop integration.":"Les chambres ne pouvaient pas être chargées. Rechargez la carte ou vérifiez l'intégration SmartHomeShop.",Rotate:"Rotation","Run in cheapest":"Cours moins cher","Run in the cheapest hours":"Cours dans les heures les moins chères","Run while cheap":"Courez quand vous êtes bon marché","Run while electricity is cheap":"Courez alors que l'électricité est bon marché","Running an action now":"Lancer une action maintenant","Running in a selected low-price hour":"Courant dans une heure choisie à bas prix","Running now to meet the deadline":"Courir maintenant pour respecter la date limite","Running on battery":"Alimenté par la batterie","Running on solar":"Alimenté par le solaire",Save:"Enregistrer","Save failed:":"Échec de l'enregistrement :","Save to sensor":"Enregistrer dans le capteur","Saved compared with today's average electricity price.":"Economisez par rapport au prix moyen de l'électricité d'aujourd'hui.","Saving...":"Sauver...","Schedules could not be refreshed. Showing the latest available data.":"Les horaires ne pouvaient pas être actualisés. Affichage des dernières données disponibles.","Schedules today":"Planifications aujourd’hui",Scroll:"Faire défiler","Scroll to zoom":"Faites défiler pour zoomer","Select a P1 meter in SmartHomeShop Energy settings first.":"Sélectionnez un compteur P1 dans les paramètres d'énergie SmartHomeShop.","Select an active SmartHomeShop energy contract in Energy Settings.":"Sélectionnez un contrat d'énergie SmartHomeShop actif dans Paramètres énergétiques.","Select an UltimateSensor device":"Sélectionnez un périphérique UltimateSensor","Select an UltimateSensor device with radar and/or environmental sensors.":"Sélectionnez un appareil UltimateSensor avec radar et/ou capteurs environnementaux.","Self-consume on negative feed-in":"Autoconsommation sur l'alimentation négative","Sensor Calibratie":"Étalonnage du capteur","Sensor unavailable":"Capteur non disponible","Separate battery and schedule contributions":"Contributions à la batterie et au calendrier","Set meter reading":"Régler la lecture du compteur","Set up room & zones":"Configurer la chambre & les zones","Shift + drag to pan":"Maj + glisser dans la poêle","Shift+Drag":"Maj+Drag","Show card header":"Afficher l'en-tête de la carte","Show grid lines":"Afficher les lignes de grille","Show ready-by schedules below reactive automations":"Afficher les horaires prêts à l'emploi sous les automatismes réactifs","Show the best consecutive period below the chart":"Afficher la meilleure période consécutive sous le graphique","Show the direction and speed of power moving between grid, solar, home and battery":"Afficher la direction et la vitesse de l'énergie se déplaçant entre le réseau, le solaire, la maison et la batterie","Show the latest 1–168 hours":"Afficher les dernières 1–168 heures","Show the measured average import and return price per kWh":"Afficher le prix moyen d'importation et de retour mesuré par kWh","Show today's kWh and value for both grid directions":"Afficher kWh d'aujourd'hui et la valeur pour les deux directions de grille","Show when each automation last ran":"Afficher à quel moment chaque automatisation a été exécutée en dernier","Show zones":"Afficher les zones","Since Smart Savings started measuring":"Depuis que Smart Savings a commencé à mesurer","Small constant water flow":"Petit débit constant d'eau","Smart actions cost more than today's average so far.":"Les actions intelligentes coûtent plus cher que la moyenne actuelle.","Smart actions have not created measured value yet today.":"Les actions intelligentes n'ont pas encore créé de valeur mesurée.","Smart automations":"Automatisations intelligentes","Smart Automations card configuration is required.":"La configuration de la carte Smart Automations est requise.","Smart energy":"Énergie intelligente","Smart Energy data could not be loaded.":"Les données Smart Energy ne peuvent pas être chargées.","Smart savings":"Smart Savings","Smart Savings is paused":"Smart Savings est interrompu","Smart Savings requires dynamic prices":"Smart Savings nécessite des prix dynamiques","Smart savings unavailable":"Smart Savings indisponible","SmartHomeShop device":"Appareil SmartHomeShop","SmartHomeShop Panel":"Autres Groupe","SmartHomeShop: _loadRooms called but hass not available":"SmartHomeShop : _charger Chambres appelées mais non disponibles","SmartHomeShop: _renderRoomView":"SmartHomeShop: _renderRoomView","SmartHomeShop: Could not load environmental trends":"SmartHomeShop : Impossible de charger les tendances environnementales","SmartHomeShop: Could not load rooms in card editor:":"SmartHomeShop : Impossible de charger des pièces dans l'éditeur de cartes :","SmartHomeShop: Could not load rooms:":"SmartHomeShop : Impossible de charger les salles :","SmartHomeShop: Error fetching history:":"SmartHomeShop : Erreur lors de la récupération de l'historique :","SmartHomeShop: Found Room Quality entity:":"SmartHomeShop: Trouvé Chambre Entité de qualité:","SmartHomeShop: Loaded":"SmartHomeShop: chargé","SmartHomeShop: Loading rooms via WebSocket...":"SmartHomeShop : Chargement des chambres via WebSocket...","SmartHomeShop: No Room Quality entity for this device, using local calculation":"SmartHomeShop: Aucune entité de Qualité de Chambre pour cet appareil, en utilisant le calcul local","SmartHomeShop: Rendering zones count:":"SmartHomeShop : Nombre de zones de rendu:","SmartHomeShop: Room targets:":"SmartHomeShop : Objectifs locaux:","SmartHomeShop: Room validation failed":"SmartHomeShop : La validation en salle a échoué","SmartHomeShop: Rooms already loaded, skipping":"SmartHomeShop : Chambres déjà chargées, sauter","SmartHomeShop: ViewBox":"SmartHomeShop: AffichageBox","SmartHomeShop: WebSocket result:":"SmartHomeShop : Résultat WebSocket:","Solar + battery":"Solaire + batterie","Solar line":"Ligne solaire","Solar production during the day":"Production solaire pendant la journée","Solar surplus":"Excédent solaire","Source details below flow":"Détails de la source en dessous du débit","Standard — 360 px":"Standard — 360 px","Standby cost / year":"Coût de la réserve / année","Standby power":"Puissance de réserve","Status badge":"Insigne d'état","Still distance":"Toujours distance","Still energy":"Énergie restante","Summary strip above the graph":"Tableau récapitulatif au-dessus du graphique","Synchronized with your device":"Synchronisé avec votre appareil","Temp Offset":"Décalage horaire",Temperature:"Température","Temperature sensor":"Capteur de température","Temperature, humidity, CO₂, light and pressure":"Température, humidité, CO₂, lumière et pression","The card links entities through the Home Assistant device registry, so renamed entity IDs keep working.":"La carte relie les entités à travers le registre des périphériques Home Assistant, donc les identifiants d'entités rebaptisés continuent de fonctionner.","The card will calculate today's costs as soon as Recorder has grid power history.":"La carte calculera les coûts d'aujourd'hui dès que Recorder aura l'historique du réseau électrique.","The leak sensor detected water. Check immediately!":"Le capteur de fuite a détecté de l'eau. Vérifiez immédiatement !","The Smart Energy editor could not be loaded. Open SmartHomeShop Energy Settings to edit this automation.":"L'éditeur Smart Energy n'a pu être chargé. Ouvrir SmartHomeShop Paramètres énergétiques pour modifier cette automatisation.","The view the card starts in. You can still switch views on the card.":"La vue de la carte commence. Vous pouvez toujours changer de vue sur la carte.","This contract has no changing intraday price curve, so cheapest-hour controls and price optimisation are not shown.":"Ce contrat n'a pas de courbe des prix intrajournaliers, de sorte que les contrôles des heures les moins chères et l'optimisation des prix ne sont pas indiqués.","This month":"Ce mois-ci","This sensor is not linked to the selected room":"Ce capteur n'est pas relié à la pièce sélectionnée","Title (optional)":"Titre (facultatif)","Title, icon and a short explanation":"Titre, icône et brève explication","To grid":"Vers la grille",Today:"Aujourd'hui","Today · 5-minute statistics to now":"Aujourd'hui · statistiques de 5 minutes à ce jour","Today's breakdown":"La panne d'aujourd'hui","Total consumption":"Consommation totale","Total consumption sensor":"Capteur de consommation totale","Total gas consumed":"Gaz total consommé","Total meter reading":"Lecture totale du compteur","Total registered water":"Total des eaux enregistrées","Triggered just now":"Déclenché à l'instant","UltimateSensor Device":"Autres Appareil",Unhealthy:"Malsain","Unhealthy for Sensitive":"Mauvaise santé pour les personnes sensibles",Unknown:"Inconnu","Unnamed room":"Chambre sans nom","Update the WaterP1MeterKit firmware to enable Water Meter Total.":"Mettre à jour le firmware WaterP1MeterKit pour activer Water Meter Total.","Usage last 24 hours":"Utilisation des dernières 24 heures","usage this month":"utilisation ce mois","usage this week":"utilisation cette semaine","usage this year":"utilisation cette année","usage today":"utilisation aujourd'hui","Use device name":"Utiliser le nom du périphérique","Use solar surplus":"Utiliser l'excédent solaire","Use the handles to resize":"Utilisez les poignées pour redimensionner","Use the left and right arrow keys to inspect each price period.":"Utilisez les touches fléchées gauche et droite pour inspecter chaque période de prix.","Uses the entities and energy contract configured in SmartHomeShop Energy settings. No duplicate entity setup is needed in this card.":"Utilise les entités et le contrat énergie configurés dans les paramètres SmartHomeShop Energy. Aucune configuration d'entité en double n'est nécessaire dans cette carte.","Value graphs":"Graphiques de valeur","Ventilate now!":"Aérez maintenant !","Ventilation recommended":"Ventilation recommandée","Very Unhealthy":"Très malsain","View mode":"Affichage du mode","Visible content":"Contenu visible","Visible sections":"Sections visibles","VOC index":"Indice COV","VOC Index":"Autres Sommaire","Waiting for a below-average price":"Waiting pour un prix inférieur à la moyenne","Waiting for a cheap window or price peak":"Waiting pour une fenêtre bon marché ou un pic de prix","Waiting for presence data":"En attente de données de présence","Waiting for the device to reconnect":"Attendre que l'appareil se reconnecte","Warm up":"Chauffer","Warm up the room":"Chauffer la pièce",Water:"Eau","Water + Energy":"Eau + énergie","Water flowing":"Eau courante","Water last 24 hours":"Eau dernières 24 heures","Water leak detected!":"Fuite d'eau détectée !","water leak sensor":"capteur de fuite d'eau","WATER LEAK!":"Couche d'eau !","water meter total":"débitmètre total","Water Monitoring":"Surveillance de l'eau","water p1 meter kit":"water p1 meter kit","Water running for extended period":"Eau courante pendant une longue période","Water section":"Section eau","water total consumption":"consommation totale d'eau","Water usage during night hours":"Utilisation de l'eau pendant les heures de nuit","WaterFlowKit: Auto-detected entities:":"WaterFlowKit : Entités détectées automatiquement:",Week:"Semaine","WET!":"MOUILLÉ !",Year:"Année","Your dynamic contract is active. Daily prices appear here as soon as confirmed prices or a forecast is available.":"Votre contrat dynamique est actif. Les prix quotidiens apparaissent ici dès que les prix confirmés ou une prévision sont disponibles.","Your fixed or variable contract is connected correctly. Savings from shifting usage can only be measured when prices change during the day.":"Votre contrat fixe ou variable est correctement connecté. Les économies dues au changement d'utilisation ne peuvent être mesurées que lorsque les prix changent au cours de la journée.","Zone Configuratie":"Configuration des zones","Zone save failed:":"La zone de sauvegarde a échoué :",Zoom:"Zoomer","⚠️ Water Leak Detected!":"Fuite d'eau détectée !"},es:{"-- Select device --":"-- Seleccionar dispositivo --","-- Select entity --":"-- Seleccionar entidad --","10px sans-serif":"10px sans-serif","10px system-ui, sans-serif":"10px system-ui, sans-serif","11px system-ui, sans-serif":"11px system-ui, sans-serif","24-hour usage graph":"Gráfico de uso las 24 horas","2D floor plan":"Plan de planta 2D","3D Controls":"3D Controles","3D view":"Vista 3D","A connected power sensor is unavailable":"Un sensor de potencia conectado no está disponible","Above daily average":"Sobre la media diaria",Active:"Activo","active contract":"contrato activo","Add a CeilSense to Home Assistant or select its device in the card editor.":"Añada un CeilSense a Home Assistant o seleccione su dispositivo en el editor de tarjetas.","Add the full daily contract charge to today's net electricity cost":"Añada la carga completa del contrato diario al costo neto de la electricidad de hoy","Add the P1MeterKit to Home Assistant or select its device in the card editor.":"Añadir el P1Meter Kit a Home Assistant o seleccione su dispositivo en el editor de tarjetas.","Air is dry":"El aire está seco","Air is humid":"El aire es húmedo","Air pressure":"Presión aérea","Air too dry":"Aire demasiado seco","Air too humid":"Aire demasiado húmedo","All normal":"Todo normal","All time":"Total","All values optimal":"Todos los valores óptimos","All-in consumer price":"Precio final para el consumidor","all-in price":"precio total","An active SmartHomeShop energy contract is needed to calculate savings.":"Se necesita un contrato de energía SmartHomeShop activo para calcular los ahorros.","Animate power flow":"Animar el flujo de energía","Auto detect":"Detecto automático","Automatic uses the Room Designer room linked to this exact Home Assistant device.":"Utiliza automáticamente la habitación Room Designer vinculada a este dispositivo Home Assistant exacto.","Average prices":"Precios medios","avg.":"prom.","Avoid negative-price solar export":"Evite la exportación solar de precio negativo","Battery flow and state of charge":"Flujo de batería y estado de carga","Battery line":"Línea de batería","Battery today":"Batería hoy","Begin X (mm)":"Inicio X (mm)","Begin Y (mm)":"Inicio Y (mm)","Below daily average":"Promedio diario","bold 11px system-ui, sans-serif":"bold 11px system-ui, sans-serif","bold 13px system-ui, sans-serif":"bold 13px system-ui, sans-serif","Calculated hourly rate":"Tasa horaria calculada","Calculating today's electricity costs...":"Calculando los costos de electricidad de hoy...","Calculation explanation":"Cálculo de explicación",Cancel:"Cancelar","Cancel setting meter reading":"Cancelación del medidor de ajuste","Card density":"Densidad de la tarjeta","Card title":"Título de la tarjeta","Card title (optional)":"Título de la tarjeta (opcional)","ceil sense":"Ceil sense","Ceiling presence & climate":"Presencia de techo &quot; clima &quot;","CeilSense device":"Dispositivo CeilSense","Charge EV cheapest":"Carga EV más barato","Charge the car in the cheapest hours":"Cargar el coche en las horas más baratas","Charging and discharging":"Carga y descarga","Charging and discharging power":"Potencia de carga y descarga","Cheapest block":"Bloque más barato","Cheapest block duration":"La duración del bloque más barata","Check the power supply and Wi-Fi connection.":"Compruebe la fuente de alimentación y la conexión Wi-Fi.","Check the selected contract in SmartHomeShop Energy Settings.":"Compruebe el contrato seleccionado en SmartHomeShop Energy Settings.","Click a zone to select it":"Haga clic en una zona para seleccionarla","Climate values":"Valores climáticos",Close:"Cerrar","CO2 quality meter":"Medidor de calidad CO2","Cold water":"Agua fría","Combined climate assessment":"Evaluación del clima combinado","Combined flow status":"Estado de flujo combinado","Combined room quality":"Calidad de la habitación combinada","Compact - status only":"Compacto - estado únicamente","Compact — 300 px":"Compacto - 300 px","Configure a P1 meter, solar or battery power source in SmartHomeShop Energy Settings.":"Configure un medidor P1, fuente de energía solar o de batería en SmartHomeShop Energy Settings.","Connect an active SmartHomeShop contract to value today's imported and returned electricity.":"Conecte un contrato SmartHomeShop activo para valorar la electricidad importada y devuelta de hoy.","Connection and grid status":"Estado de conexión y rejilla","Connection and occupancy status":"Estado de conexión y ocupación","Continuous flow":"Flujo continuo","Cool down":"Genial.","Cool down the room":"Enfriar por la habitación","Coordinates snap to 100mm":"Las coordenadas se ajustan a 100mm","Cost this month":"Costo este mes","Cost today":"Costo hoy","Costs, peak and standby insights":"Costos, pico y puntos de vista de reserva","Could not enable the automation.":"No podía permitir la automatización.","Could not pause the automation.":"No podía detener la automatización.","Could not update the schedule.":"No podía actualizar el horario.","CO₂ Quality":"CO₂ Calidad","CO₂ unhealthy, ventilate":"CO₂ insalubridad, ventilación","Create price, solar or deadline controls in SmartHomeShop Energy Settings. They will appear here automatically.":"Cree controles de precio, solares o plazos en SmartHomeShop Energy Settings. Ellos aparecerán aquí automáticamente.","Cumulative value this calendar month":"Valor acumulativo de este mes calendario","Current and peak values":"Valores actuales y máximos","Current grid import or export":"Importación actual de la red o exportación","current power":"potencia actual","Current power usage":"Uso de energía actual","Current price":"Precio actual","Current usage":"Uso actual","current water usage":"uso actual del agua","Current water usage":"Consumo de agua actual","Curtailing export during negative feed-in":"Reducción de la exportación durante la entrada negativa","Daily average":"Media diaria","Daily average, low, high and feed-in facts":"Datos promedios diarios, bajos, altos y alimentarios","Daily spread":"Difusión diaria","Deadline schedules":"Calendarios fijos","Default room view":"Vista por habitación predeterminada","Detection detail":"Detección de detalles","Detection distance":"Distancia de detección","Detection zones":"Zonas de detección",Device:"Dispositivo","Device offline":"Dispositivo sin conexión","Direction and speed follow the power moving right now":"La dirección y la velocidad siguen el flujo de energía actual","Disabled - deadline planning is paused":"Discapacitados - se detiene la planificación del plazo","Disabled - no automatic actions":"Impedidos - sin acciones automáticas","Distance and radar energy":"Energía de distancia y radar",Drag:"Arrastre","Drag the zone to move it":"Arrastre la zona para moverla","Drag to rotate":"Arrastre para girar","Draw your room, place the sensor and configure zones in the":"Dibujar su habitación, colocar el sensor y configurar las zonas en el","Edit setup":"Editar configuración","Edit zones in 2D mode":"Editar zonas en modo 2D","Eind X (mm)":"Fin X (mm)","Eind Y (mm)":"Fin Y (mm)","Electricity costs":"Costes de electricidad","Electricity costs unavailable":"Gastos de electricidad no disponibles","Electricity imported":"Electricidad importada","Electricity is cheap now":"La electricidad es barata ahora","Electricity returned":"Electricidad inyectada","Electricity today":"Electricidad hoy","Elevated VOC":"COV elevado","Enable automation":"Automatización habilitada","Enable schedule":"Calendario habilitado","Enable this if you have connected the optional water leak sensor to your WaterP1MeterKit V3. Critical leak alerts remain visible even when other content is hidden.":"Hable esto si ha conectado el sensor de fuga de agua opcional a su WaterP1MeterKit V3. Las alertas de fuga crítica siguen siendo visibles incluso cuando se oculta otro contenido.",Energy:"Energía","Energy active":"Energía activa","energy consumed":"energía consumida","Energy contract":"Contrato energético","Energy costs card configuration is required.":"Se requiere configuración de tarjeta de costo de energía.","Energy insights":"Información sobre la energía","Energy Live card configuration is required.":"Se requiere configuración de tarjeta Energy Live.","Energy monitoring":"Vigilancia de la energía","Energy Power Trend card configuration is required.":"Energy Power Se requiere configuración de la tarjeta Trend.","Energy Price Outlook card configuration is required.":"Energy Price Se requiere configuración de la tarjeta de Outlook.","Energy prices":"Precios de energía","Energy section":"Sección de energía","Enter the reading shown on your physical water meter in m³, for example 123.456. The value is stored on the device itself.":"Introduzca la lectura mostrada en su medidor de agua física en m3, por ejemplo 123.456. El valor se almacena en el propio dispositivo.","entry lines:":"líneas de entrada:","Environmental sensors":"Sensores ambientales","Estimated feed-in now":"Alimentación estimada ahora","Estimated price":"Precio estimado","Estimated price now":"Precio estimado ahora",Excellent:"Excelente","Expanded - status and details":"Ampliación - estado y detalles","Explain how Smart Savings is calculated":"Explique cómo se calcula Smart Savings","Explain the price source, coverage and contract charges":"Explicar la fuente de precios, la cobertura y los cargos por contrato","Export now":"Exportar ahora","Exporting to grid":"Exportación a la red","Extra large — 600 px":"Extra grande - 600 px","Failed to save zones:":"No se pudieron guardar las zonas:","Feed-in now":"Inyección actual","Feed-in price is not negative":"El precio no es negativo","Feed-in T1":"Alimentación en T1","Feed-in T2":"Alimentación en T2","Fixed cost/day":"Costo fijo/día","Fixed cost/year":"Costo fijo/año","Fixed daily charges and gas are excluded.":"Se excluyen los cargos diarios fijos y el gas.","Fixed daily contract cost":"Costo fijo del contrato diario","Flow sensor":"Sensor de flujo","Forecast average":"Promedio de pronóstico","Forecast · not used for automation":"Predicción · no utilizado para la automatización","From grid":"De la red","Full daily charge from your active contract":"Cargo diario completo de su contrato activo","gas consumed":"gas consumido","Gas meter":"Gasímetro","Gas today":"Gas hoy",Good:"Bueno","Graphs shown":"Gráficos mostrados","Grid balanced":"Red equilibrada","Grid capacity available":"Capacidad de carga disponible","Grid export":"Vertido a la red","Grid export line":"Línea de exportación de rejas","Grid import":"Importación de rejas","Grid import line":"Línea de importación de rejas","Grid now":"Red ahora","Hardware features (V3)":"Características de hardware (V3)","Hardware leak sensor":"Sensor de escape de hardware",Hazardous:"Peligroso",Header:"Encabezado","Heat on solar surplus":"Caliente sobre el superávit solar","Height of the room visual":"Altura de la habitación visual","High VOC, ventilate":"Alta VOC, ventilación","Highest phase load":"Carga de fase más alta","History range":"Rango de historia","Home Assistant Recorder history":"Historia Home Assistant Recorder","Home consumption":"Consumo del hogar","Hot water":"Agua caliente","Hourly electricity prices":"Precios de electricidad por hora",Humidity:"Humedad","Humidity Offset":"Desviación de humedad","If no device is selected, entities are automatically detected.":"Si no se selecciona ningún dispositivo, las entidades se detectan automáticamente.","Import and return details":"Importación y detalles de retorno","Import now":"Importe ahora","Import T1":"Importación T1","Import T2":"Importación T2","Imported · tariff 1":"Importado · tarifa 1","Imported · tariff 2":"Importado · arancel 2","Imported, returned and net value today":"Importado, devuelto y valor neto hoy","Importing from grid":"Importación de la red","In a Sections dashboard you can also drag the card wider. The card requests the full row by default.":"En un panel de secciones también puede arrastrar la tarjeta más ancha. La tarjeta solicita la fila completa por defecto.","Include fixed daily cost":"Incluido el costo diario fijo","Incomplete sensor data":"Datos de sensores incompletos","Initial day":"Día inicial","Invalid room data":"Datos de la habitación inválidos","It is a bit cool":"Es un poco genial.","It is a bit warm":"Está un poco caliente","just now":"ahora","Keep solar export near zero":"Mantener la exportación solar cerca de cero","Keep the familiar home overview and source rows below the flow":"Mantenga la vista general familiar y las filas de origen debajo del flujo","Large calculated consumption overview":"Panorama general del consumo calculado","Large calculated consumption overview below the flow":"Amplia descripción del consumo calculado debajo del flujo","Large — 480 px":"Grande - 480 px","Last run unknown":"Última carrera desconocida","Last triggered":"El último gatillo","leak alarm":"alarma de fuga","Leak detected":"Leak detectado","Leak Detection":"Detección de fugas","Leak detection":"Detección de levas","Leak score":"Puntuación de fugas","Link this exact device to a sensor placement in Room Designer, or select a room override in the card editor.":"Enlace este dispositivo exacto a una colocación de sensores en Room Designer, o seleccione una anulación de la habitación en el editor de tarjetas.","Live energy":"Energía en tiempo real","Live energy unavailable":"Energía en tiempo real no disponible","Live import and export":"Importación y exportación en vivo","Live power flow":"Flujo de energía en tiempo real","Live presence":"presencia en vivo","Live presence visualization":"Visualización de presencia en vivo","Live solar production when configured":"Producción solar en vivo cuando se configura","Live Targets":"Metas en vivo","Live usage":"Consumo actual","Loading Home Assistant chart...":"Cargando Home Assistant gráfica...","Loading rooms...":"Cargando habitaciones...","Loading rooms…":"Cargando habitaciones...","Loading smart savings...":"Cargando Smart Savings…","Loads shifted in time":"Las cargas cambiaron de tiempo","M 24 16 C 35 16 37 38 42 46":"M 24 16 C 35 16 37 38 42 46","M 24 84 C 35 84 37 62 42 54":"M 24 84 C 35 84 37 62 42 54","M 76 50 C 69 50 65 50 58 50":"M 76 50 C 69 50 65 50 58 50","Max Afstand":"Distancia máxima","Maximum distance (mm)":"Distancia máxima (mm)","Measured every 15 minutes from battery flows and running schedules, valued against the day-average electricity price.":"Medido cada 15 minutos de los flujos de batería y los horarios de funcionamiento, valorado contra el precio de la electricidad del día.","Measured value created by smart energy":"Valor medido generado por Smart Energy","Measurement explanation":"explicación de la medición","Meter environment":"Medio ambiente","Meter reading":"Meter lectura","Meter temperature and humidity":"Temperatura y humedad del medidor","Meter totals":"Totales de contadores","Micro leak":"Filtro micro",Moderate:"Moderado","Monitoring activity":"Actividad de monitoreo","Monitoring grid flow":"Corriente de vigilancia",Month:"Mes","Month peak":"Mes pico","More information":"Más información","Movement energy":"Energía de movimiento","Moving distance":"Distancia móvil","Negative feed-in - self-consumption active":"Alimentación negativa - autoconsumo activo","Negative prices":"Precios negativos","Net earned today":"Ganancia neta de hoy","Net electricity cost":"Coste neto de electricidad","Never triggered":"Nunca disparado","Next lower":"Siguiente inferior","Night usage":"Uso nocturno","No active energy contract":"No contrato de energía activo","No active targets":"No hay metas activas","No anomalies":"Sin anomalías","No calibration settings found":"No se han encontrado ajustes de calibración","No CeilSense found":"No CeilSense encontrado","No contract prices available":"No hay precios contractuales disponibles","No entities":"No entidades","No linked room configured for this sensor":"No hay espacio conectado configurado para este sensor","No measured return value deducted yet.":"Todavía no se ha deducido el valor de retorno medido.","No mmWave settings found":"No se han encontrado ajustes","No P1 meter selected":"No se ha seleccionado el medidor P1","No P1MeterKit found":"No P1MeterKit encontrado","No power statistics available":"No hay estadísticas de potencia disponibles","No price peak right now":"No hay pico de precio ahora mismo","No production":"No hay producción","No reading":"Sin lectura","No Smart Automations yet":"Sin automatizaciones inteligentes todavía","No unwanted paid export":"Ninguna exportación pagada no deseada","No usage":"No uso","None today":"Ninguno hoy","Not available":"No disponible","Not enough history yet":"Aún no es suficiente historia","NOx index":"Índice NOx","NOx Index":"NOx Índice","Number of hours shown in value graphs":"Número de horas mostradas en gráficos de valor",Offline:"Sin conexión","Open Energy Settings":"Abrir ajustes de Energy","Open price entity details":"Detalles de la entidad de precio abierto","Open Smart Energy settings":"Ajustes de Smart Energy abiertos","Open the card editor to choose a device":"Abra el editor de tarjetas para elegir un dispositivo","Open Visuele Editor":"Abrir editor visual","Optional sensor blocks are hidden automatically when that CeilSense hardware variant does not provide them.":"Los bloques de sensores opcionales se ocultan automáticamente cuando la variante de hardware CeilSense no los proporciona.","Optional water leak sensor connected":"Sensor de fuga de agua opcional conectado","Overall risk assessment":"Evaluación general del riesgo","p1 meter kit":"kit de p1 metros","P1MeterKit device":"P1MeterKit device",Pan:"Desplazar","Particulate matter (PM)":"Materia particulada (PM)","Particulate matter dangerous!":"¡Parículas peligrosas!","Particulate matter elevated":"Material de partículas elevado","Particulate matter high":"Material de partículas alta","Pause and resume directly from the card":"Pausa y reanudar directamente desde la tarjeta","Pause automation":"Automatización de la pausa","Pause during price peaks":"Pausa durante los picos de precios","Pause flow animation":"Pausar la animación del flujo","Pause on price peak":"Pausa en el pico del precio","Pause schedule":"Pausar programación","Peak export":"Pico de vertido","Peak import":"Importación de pico","Peak mode is active":"Modo de pico activo","Period totals":"Totales de período","Persistent meter reading unavailable":"Lectura de medidor persistente no disponible","Person distance details":"Detalles de la distancia por persona","Phase load":"Carga de fase","Physical water detection (V3)":"Detección de agua física (V3)","Pipe detail cards":"Tarjetas de detalles de tuberías","Pipe visualization":"Visualización de tuberías","PM value cards":"Tarjetas de valor PM","PM2.5 (Fine Particles)":"PM2.5 (partículas finas)","PM2.5 quality meter":"Medidor de calidad PM2.5",Poor:"Malo","Possible leak":"Posible fuga","Power (W) · mean with min/max range":"Potencia (W) · media con rango min/max","power consumed":"poder consumido","Power drawn from the grid":"Potencia extraída de la red","Power returned to the grid":"El poder regresó a la red","Power trend":"Tendencia de potencia","Power used by your home right now":"Potencia que consume tu hogar ahora mismo","Pre-heat cheap":"Pre-calor barato","Pre-heat cheap, ease off at peak":"Precalentamiento barato, aléjate en el pico","Pre-heating in the cheap window":"Precalentamiento en la ventana barata","Predicted all-in consumer price":"Precio total previsto para el consumidor","Predicted all-in price":"Precio todo acusado","Predicted prices are used until confirmed prices arrive.":"Los precios predecidos se utilizan hasta que lleguen los precios confirmados.",Presence:"Presencia","Presence status":"Situación de la presencia","Price data is being fetched":"Los datos de precios se están obteniendo","Price day":"Día del precio","Price insights":"Información de precios","Price now":"Precio ahora","Price outlook":"Previsión de precios","Price peak - selected loads should be paused":"Precio máximo - las cargas seleccionadas deben ser pausadas","Price, solar and deadline control":"Control de precios, solar y plazo","Producing now":"Produciendo ahora","Quarter-hour electricity prices":"Tarifas de electricidad trimestrales","Quick controls":"Controles rápidos","Radar Instellingen":"Ajustes del radar","Radar options":"Opciones de radar","Radar or room view":"Radar o vista de habitación","Radar shows the sensor view. Room shows your drawn room with live tracking.":"Radar muestra la vista del sensor. La habitación muestra su habitación dibujada con seguimiento en vivo.","Radar view":"Vista radar","Reactive automations":"Automatizaciones reactivas","Ready - waiting for its trigger":"Listo - esperando su gatillo","Reducing exported solar power":"Reducción de la energía solar exportada",Reset:"Restablecer","Resume flow animation":"Reanudar la animación del flujo","Return value is higher than import cost.":"El valor de retorno es superior al costo de importación.","Returned energy":"Energía devuelta","Returned today":"Regresó hoy","Returned · tariff 1":"Regresado · tarifa 1","Returned · tariff 2":"Regresado · tarifa 2","rgba(100, 180, 255, 0.05)":"rgba(100, 180, 255, 0,05)","rgba(100, 180, 255, 0.3)":"rgba(100, 180, 255, 0.3)","rgba(100, 180, 255, 0.5)":"rgba(100, 180, 255, 0.5)","rgba(148, 163, 184, 0.5)":"rgba(148, 163, 184, 0.5)","rgba(148, 163, 184, 0.7)":"rgba(148, 163, 184, 0.7)","rgba(156, 39, 176, 0.3)":"rgba(156, 39, 176, 0.3)","rgba(255, 152, 0, 0.3)":"rgba(255, 152, 0, 0.3)","rgba(255, 255, 255, 0.1)":"rgba(255, 255, 255, 0.1)","rgba(255, 255, 255, 0.5)":"rgba(255, 255, 255, 0,5)","rgba(255, 255, 255, 0.6)":"rgba(255, 255, 255, 0.6)","rgba(33, 150, 243, 0.3)":"rgba(33, 150, 243, 0.3)","rgba(34, 197, 94, 0.5)":"rgba(34, 197, 94, 0.5)","rgba(59, 130, 246, 0.02)":"rgba(59, 130, 246, 0,02)","rgba(59, 130, 246, 0.15)":"rgba(59, 130, 246, 0.15)","rgba(59, 130, 246, 0.25)":"rgba(59, 130, 246, 0.25)","rgba(59, 130, 246, 0.3)":"rgba(59, 130, 246, 0.3)","rgba(76, 175, 80, 0.3)":"rgba(76, 175, 80, 0.3)",Room:"13.00 horas","Room clear":"Sala clara","Room climate":"Habitación climática","Room Quality":"Calidad de la habitación","Room quality":"Calidad de la habitación","Room quality score":"Puntuación de calidad de la habitación","Room shown for this UltimateSensor":"Habitación mostrada para este UltimateSensor","Room view":"Vista de habitación","Room view height":"Altura de la vista de la habitación","Rooms could not be loaded right now.":"Las habitaciones no se pueden cargar ahora mismo.","Rooms could not be loaded. Reload the card or check the SmartHomeShop integration.":"Las habitaciones no se pueden cargar. Recargar la tarjeta o comprobar la integración SmartHomeShop.",Rotate:"Rotación","Run in cheapest":"Correr en el más barato","Run in the cheapest hours":"Corre en las horas más baratas","Run while cheap":"Correr mientras barato","Run while electricity is cheap":"Corre mientras la electricidad es barata","Running an action now":"Corriendo una acción ahora","Running in a selected low-price hour":"Correr en una hora de precio bajo seleccionada","Running now to meet the deadline":"Correr ahora para cumplir con el plazo","Running on battery":"Funcionando con la batería","Running on solar":"Funcionando con energía solar",Save:"Guardar","Save failed:":"Salvar falló:","Save to sensor":"Guardar el sensor","Saved compared with today's average electricity price.":"Se ahorra en comparación con el precio medio de la electricidad de hoy.","Saving...":"Salvando...","Schedules could not be refreshed. Showing the latest available data.":"Los horarios no se pueden actualizar. Mostrando los últimos datos disponibles.","Schedules today":"Programaciones de hoy",Scroll:"Desplazar","Scroll to zoom":"Desplazamiento para ampliar","Select a P1 meter in SmartHomeShop Energy settings first.":"Seleccione un medidor P1 en la configuración de SmartHomeShop Energy primero.","Select an active SmartHomeShop energy contract in Energy Settings.":"Seleccione un contrato de energía SmartHomeShop activo en Ajustes de Energía.","Select an UltimateSensor device":"Seleccione un dispositivo UltimateSensor","Select an UltimateSensor device with radar and/or environmental sensors.":"Seleccione un dispositivo UltimateSensor con sensores de radar y/o ambientales.","Self-consume on negative feed-in":"Autoconsumir con vertido negativo","Sensor Calibratie":"Calibración del sensor","Sensor unavailable":"Sensor no disponible","Separate battery and schedule contributions":"Contribuciones separadas de la batería y del calendario","Set meter reading":"Lección de medidor","Set up room & zones":"Zonas de montaje","Shift + drag to pan":"Cambio + arrastrar a la sartén","Shift+Drag":"Mayús+arrastrar","Show card header":"Mostrar encabezado de la tarjeta","Show grid lines":"Mostrar líneas de red","Show ready-by schedules below reactive automations":"Mostrar calendarios listos a continuación automatizaciones reactivas","Show the best consecutive period below the chart":"Mostrar el mejor período consecutivo debajo de la gráfica","Show the direction and speed of power moving between grid, solar, home and battery":"Mostrar la dirección y la velocidad de movimiento de energía entre la red, solar, hogar y batería","Show the latest 1–168 hours":"Mostrar las últimas 1–168 horas","Show the measured average import and return price per kWh":"Mostrar el precio medio de importación y retorno medido por kWh","Show today's kWh and value for both grid directions":"Mostrar el kWh de hoy y el valor para ambas direcciones de red","Show when each automation last ran":"Mostrar cuando la última automatización funcionó","Show zones":"Mostrar zonas","Since Smart Savings started measuring":"Desde Smart Savings comenzó a medir","Small constant water flow":"Pequeño flujo de agua constante","Smart actions cost more than today's average so far.":"Las acciones inteligentes cuestan más que el promedio de hoy hasta ahora.","Smart actions have not created measured value yet today.":"Las acciones inteligentes no han creado valor medido todavía hoy.","Smart automations":"Automatizaciones inteligentes","Smart Automations card configuration is required.":"Se requiere configuración de tarjeta Smart Automations.","Smart energy":"Energía inteligente","Smart Energy data could not be loaded.":"Los datos Smart Energy no se pueden cargar.","Smart savings":"Smart Savings","Smart Savings is paused":"Smart Savings se detiene","Smart Savings requires dynamic prices":"Smart Savings requiere precios dinámicos","Smart savings unavailable":"Smart Savings no disponible","SmartHomeShop device":"Dispositivo SmartHomeShop","SmartHomeShop Panel":"SmartHomeShop Panel","SmartHomeShop: _loadRooms called but hass not available":"SmartHomeShop: _load Habitaciones llamadas pero no está disponible","SmartHomeShop: _renderRoomView":"SmartHomeShop: _renderRoomView","SmartHomeShop: Could not load environmental trends":"SmartHomeShop: No podía cargar tendencias ambientales","SmartHomeShop: Could not load rooms in card editor:":"SmartHomeShop: No podía cargar las habitaciones en el editor de tarjetas:","SmartHomeShop: Could not load rooms:":"SmartHomeShop: No podía cargar habitaciones:","SmartHomeShop: Error fetching history:":"SmartHomeShop: Historia de búsqueda de errores:","SmartHomeShop: Found Room Quality entity:":"SmartHomeShop: Fundada entidad de calidad de habitación:","SmartHomeShop: Loaded":"SmartHomeShop: Cargado","SmartHomeShop: Loading rooms via WebSocket...":"SmartHomeShop: Cargando habitaciones vía WebSocket...","SmartHomeShop: No Room Quality entity for this device, using local calculation":"SmartHomeShop: Ninguna entidad de calidad de habitación para este dispositivo, utilizando cálculo local","SmartHomeShop: Rendering zones count:":"SmartHomeShop: Las zonas de carga cuentan:","SmartHomeShop: Room targets:":"SmartHomeShop: Objetivos de habitación:","SmartHomeShop: Room validation failed":"SmartHomeShop: Falló la validación de la habitación","SmartHomeShop: Rooms already loaded, skipping":"SmartHomeShop: Habitaciones ya cargadas, saltando","SmartHomeShop: ViewBox":"SmartHomeShop: ViewBox","SmartHomeShop: WebSocket result:":"SmartHomeShop: Resultado WebSocket:","Solar + battery":"Batería solar +","Solar line":"Línea solar","Solar production during the day":"Producción solar durante el día","Solar surplus":"Superávit solar","Source details below flow":"Datos de la fuente a continuación del flujo","Standard — 360 px":"Estándar - 360 px","Standby cost / year":"Costo de reserva / año","Standby power":"Potencia de reserva","Status badge":"Insignia de estado","Still distance":"Distancia","Still energy":"Energía","Summary strip above the graph":"Banda sumaria por encima del gráfico","Synchronized with your device":"Sincronizado con tu dispositivo","Temp Offset":"Temporada",Temperature:"Temperatura","Temperature sensor":"Sensor de temperatura","Temperature, humidity, CO₂, light and pressure":"Temperatura, humedad, CO₂, luz y presión","The card links entities through the Home Assistant device registry, so renamed entity IDs keep working.":"La tarjeta vincula a entidades a través del registro de dispositivos Home Assistant, por lo que los ID de entidad renombrada siguen funcionando.","The card will calculate today's costs as soon as Recorder has grid power history.":"La tarjeta calculará los costos de hoy tan pronto como Recorder tenga historial de energía de red.","The leak sensor detected water. Check immediately!":"El sensor detectó agua. ¡Mira inmediatamente!","The Smart Energy editor could not be loaded. Open SmartHomeShop Energy Settings to edit this automation.":"El editor Smart Energy no puede ser cargado. Open SmartHomeShop Ajustes de energía para editar esta automatización.","The view the card starts in. You can still switch views on the card.":"La vista de la tarjeta comienza. Aún puedes cambiar las vistas de la tarjeta.","This contract has no changing intraday price curve, so cheapest-hour controls and price optimisation are not shown.":"Este contrato no tiene una curva de precio intradía cambiante, por lo que no se muestran los controles más baratos y la optimización de precios.","This month":"Este mes","This sensor is not linked to the selected room":"Este sensor no está vinculado a la habitación seleccionada","Title (optional)":"Título (opcional)","Title, icon and a short explanation":"Título, icono y una breve explicación","To grid":"Cuadrícula",Today:"Hoy","Today · 5-minute statistics to now":"Hoy · 5 minutos de estadísticas para ahora","Today's breakdown":"El colapso de hoy","Total consumption":"Consumo total","Total consumption sensor":"Sensor de consumo total","Total gas consumed":"Gas total consumido","Total meter reading":"lectura total de medidores","Total registered water":"Total de agua registrada","Triggered just now":"Activado ahora mismo","UltimateSensor Device":"UltimateSensor Dispositivo",Unhealthy:"No saludable","Unhealthy for Sensitive":"Insaludable para Sensitive",Unknown:"Desconocido","Unnamed room":"Habitación sin nombre","Update the WaterP1MeterKit firmware to enable Water Meter Total.":"Actualice el firmware WaterP1MeterKit para habilitar Water Meter Total.","Usage last 24 hours":"Uso de las últimas 24 horas","usage this month":"uso este mes","usage this week":"uso esta semana","usage this year":"uso este año","usage today":"uso hoy","Use device name":"Use el nombre del dispositivo","Use solar surplus":"Uso de excedentes solares","Use the handles to resize":"Utilice las manijas para cambiar el tamaño","Use the left and right arrow keys to inspect each price period.":"Utilice las teclas de flecha izquierda y derecha para inspeccionar cada período de precio.","Uses the entities and energy contract configured in SmartHomeShop Energy settings. No duplicate entity setup is needed in this card.":"Utiliza las entidades y contratos energéticos configurados en la configuración SmartHomeShop Energy. No se necesita ninguna configuración de entidad duplicada en esta tarjeta.","Value graphs":"Gráficos de valor","Ventilate now!":"¡Ventila ahora!","Ventilation recommended":"Ventilación recomendada","Very Unhealthy":"Muy poco saludable","View mode":"Ver modo","Visible content":"Contenido visible","Visible sections":"Secciones visibles","VOC index":"Índice COV","VOC Index":"VOC Índice","Waiting for a below-average price":"Waiting por un precio por debajo del promedio","Waiting for a cheap window or price peak":"Waiting por una ventana barata o precio pico","Waiting for presence data":"Esperando datos de presencia","Waiting for the device to reconnect":"Esperando que el dispositivo vuelva a conectar","Warm up":"Cálmense.","Warm up the room":"Calentar la habitación",Water:"Agua","Water + Energy":"Agua + energía","Water flowing":"Flujo de agua","Water last 24 hours":"Agua últimas 24 horas","Water leak detected!":"¡Se detectó fuga de agua!","water leak sensor":"sensor de fuga de agua","WATER LEAK!":"¡Water LEAK!","water meter total":"medidor de agua","Water Monitoring":"Vigilancia del agua","water p1 meter kit":"kit de agua p1 metro","Water running for extended period":"Agua durante el período prolongado","Water section":"Sección de agua","water total consumption":"consumo total de agua","Water usage during night hours":"Uso de agua durante horas nocturnas","WaterFlowKit: Auto-detected entities:":"WaterFlowKit: Entidades autodetectadas:",Week:"Semana","WET!":"¡MOJADO!",Year:"Año","Your dynamic contract is active. Daily prices appear here as soon as confirmed prices or a forecast is available.":"Su contrato dinámico está activo. Los precios diarios aparecen aquí tan pronto como los precios confirmados o un pronóstico está disponible.","Your fixed or variable contract is connected correctly. Savings from shifting usage can only be measured when prices change during the day.":"Su contrato fijo o variable está conectado correctamente. Los ahorros del uso de cambio sólo se pueden medir cuando los precios cambian durante el día.","Zone Configuratie":"Configuración de zonas","Zone save failed:":"El ahorro de zona falló:",Zoom:"Ampliar","⚠️ Water Leak Detected!":"¡Detección del pico de agua de cúpula!"}},Pe=(e,t)=>{const i=$e(e);return Ee[i]?.[t]||t},Me=new WeakMap,Ae=new WeakMap,Le=["aria-label","aria-description","title","placeholder","alt"],Ne=(e,t)=>{const i=e.parentElement;if(!i||i.closest("[data-i18n-ignore], code, pre, script, style"))return;const a=e.data,o=Me.get(e),r=o&&a===o.lastApplied?o.source:a,n=r.match(/^\s*/)?.[0]||"",s=r.match(/\s*$/)?.[0]||"",l=r.trim().replace(/\s+/g," ");if(!l)return;const c=`${n}${Pe(t,l)}${s}`;Me.set(e,{source:r,lastApplied:c}),a!==c&&(e.data=c)},Te=(e,t)=>{let i=Ae.get(e);i||(i=new Map,Ae.set(e,i));for(const a of Le){if(!e.hasAttribute(a))continue;const o=e.getAttribute(a)||"",r=i.get(a),n=r&&o===r.lastApplied?r.source:o,s=Pe(t,n);i.set(a,{source:n,lastApplied:s}),o!==s&&e.setAttribute(a,s)}};class De{constructor(e,t){this.observers=new Set,this.observedRoots=new WeakSet,this.scheduledRoots=new WeakSet,this.host=e,this.hassProvider=t,e.addController(this)}hostUpdated(){const e=this.host.renderRoot;e instanceof ShadowRoot&&this.observeRoot(e),e instanceof ShadowRoot&&this.localizeRoot(e)}hostDisconnected(){for(const e of this.observers)e.disconnect();this.observers.clear(),this.observedRoots=new WeakSet,this.scheduledRoots=new WeakSet}localizeRoot(e){const t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let i=t.nextNode();for(;i;)Ne(i,this.hassProvider()),i=t.nextNode();for(const t of Array.from(e.querySelectorAll("*")))Te(t,this.hassProvider()),t.shadowRoot&&this.observeRoot(t.shadowRoot)}schedule(e){this.scheduledRoots.has(e)||(this.scheduledRoots.add(e),queueMicrotask(()=>{this.scheduledRoots.delete(e),this.localizeRoot(e)}))}observeRoot(e){if(this.observedRoots.has(e))return;this.observedRoots.add(e);const t=new MutationObserver(()=>this.schedule(e));t.observe(e,{subtree:!0,childList:!0,characterData:!0,attributes:!0,attributeFilter:[...Le]}),this.observers.add(t),this.localizeRoot(e)}}function He(e,t){return e&&t&&e.states[t]?e.states[t]:null}function Re(e,t,i=0){const a=He(e,t);if(!a||"unavailable"===a.state||"unknown"===a.state)return i;const o=parseFloat(a.state);return isNaN(o)?i:o}function We(e){const t=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"just now";if(t<60)return`${t} min ago`;const i=Math.floor(t/60);if(i<24)return`${i} hour${1===i?"":"s"} ago`;const a=Math.floor(i/24);return`${a} day${1===a?"":"s"} ago`}function Ie(e,t=1){return null==e||isNaN(e)?"-":e.toFixed(t)}function je(e,t){t&&e.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}}))}function Fe(e,t=300,i=50){const a=24===e?.length?e:new Array(24).fill(0).map((e,t)=>t>6&&t<9?2:t>17&&t<21?3:.5),o=Math.max(...a,.1),r=a.map(e=>e/o*(i-5));let n="M 0 "+(i-r[0]);return r.forEach((e,a)=>{a>0&&(n+=` L ${a*(t/23)} ${i-e}`)}),n}class Oe extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={},this._historyData=null,this._historyLoading=!1,this._showMeterForm=!1,this._meterInput="",this._lastHistoryFetch=0,this._toggleMeterForm=()=>{if(this._showMeterForm=!this._showMeterForm,this._showMeterForm){const e=this._getMeterTotal();this._meterInput=e>0?e.toFixed(3):""}},this._saveMeterReading=async()=>{const e=this._config.meter_initial_entity;if(!this.hass||!e)return;const t=parseFloat(this._meterInput.replace(",","."));isNaN(t)||t<0||(await this.hass.callService("number","set_value",{entity_id:e,value:t}),this._showMeterForm=!1,this._meterInput="")}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_header:!0,show_status:!0,show_water_current:!0,show_water_totals:!0,show_today:!0,show_week:!0,show_month:!0,show_year:!0,show_graph:!0,show_meter_reading:!0,show_leak_detection:!0,_entitiesResolved:!t&&e._entitiesResolved,...e},t&&(this._lastDeviceId=e.device_id)}getCardSize(){return 5}updated(e){if(super.updated(e),e.has("hass")&&this.hass&&(this._config._entitiesResolved&&this._lastDeviceId===this._config.device_id||(this._autoDetectEntities(),this._lastDeviceId=this._config.device_id),this._preferPersistentWaterTotal(),this._config.show_graph&&this._config.flow_entity)){(Date.now()-this._lastHistoryFetch>3e5||!this._historyData)&&this._fetchHistory()}}_findEntity(e,t="sensor",i=!1){if(!this.hass)return"";const a=this._config.device_id,o=["waterp1meterkit","watermeterkit","waterflowkit","smarthomeshop"],r=Object.keys(this.hass.states).find(r=>{if(!r.startsWith(t+"."))return!1;const n=this.hass.states[r];if(!n?.attributes)return!1;const s=(n.attributes.friendly_name||"").toLowerCase(),l=r.toLowerCase(),c=this.hass.entities?.[r]?.device_id,d=!!a&&c===a,h=!!a&&(s.includes(a.toLowerCase())||l.includes(a.toLowerCase())),u=o.some(e=>s.includes(e)||l.includes(e));return!(!u&&!d)&&(!(a&&!d&&!h)&&(i?e.some(e=>l.includes(e.toLowerCase())):e.some(e=>s.includes(e.toLowerCase()))))});return r||""}_autoDetectEntities(){if(!this.hass)return;const e=this._config.device_id;if(e){const t=Object.keys(this.hass.states).filter(t=>{const i=this.hass.entities?.[t]?.device_id;return i===e||t.includes(e)});t.some(e=>e.includes("waterp1meterkit"))?this._config._productName="WaterP1MeterKit":t.some(e=>e.includes("watermeterkit"))?this._config._productName="WaterMeterKit":t.some(e=>e.includes("waterflowkit"))?this._config._productName="WaterFlowKit":this._config._productName="SmartHomeShop"}else{const e=Object.keys(this.hass.states);e.some(e=>e.includes("waterp1meterkit"))?this._config._productName="WaterP1MeterKit":e.some(e=>e.includes("watermeterkit"))?this._config._productName="WaterMeterKit":e.some(e=>e.includes("waterflowkit"))?this._config._productName="WaterFlowKit":this._config._productName="SmartHomeShop"}this._config.flow_entity||(this._config.flow_entity=this._findEntity(["current_usage"],"sensor",!0)||this._findEntity(["current water usage"]));const t=this._findEntity(["water_meter_total"],"sensor",!0)||this._findEntity(["water meter total"]);!t||this._config.total_entity&&!this._isRawWaterTotal(this._config.total_entity)?this._config.total_entity||(this._config.total_entity=this._findEntity(["total_consumption"],"sensor",!0)):this._config.total_entity=t,this._config.today_entity||(this._config.today_entity=this._findEntity(["usage today"])),this._config.week_entity||(this._config.week_entity=this._findEntity(["usage this week"])),this._config.month_entity||(this._config.month_entity=this._findEntity(["usage this month"])),this._config.year_entity||(this._config.year_entity=this._findEntity(["usage this year"])),this._config.leak_entity||(this._config.leak_entity=this._findEntity(["leak alarm"],"binary_sensor")),this._config.meter_initial_entity||(this._config.meter_initial_entity=this._findEntity(["water_meter_initial"],"number",!0)),this._config._entitiesResolved=!0}_isRawWaterTotal(e){if(!e)return!1;if(e.toLowerCase().includes("water_total_consumption"))return!0;const t=this.hass?.states[e]?.attributes.friendly_name;return"string"==typeof t&&t.toLowerCase().includes("water total consumption")}_preferPersistentWaterTotal(){const e=this._config.total_entity;if(e&&!this._isRawWaterTotal(e))return;const t=this._findEntity(["water_meter_total"],"sensor",!0)||this._findEntity(["water meter total"]);t&&t!==e&&(this._config={...this._config,total_entity:t})}async _fetchHistory(){if(!this.hass||!this._config.flow_entity||this._historyLoading)return;this._historyLoading=!0;const e=this._config.flow_entity,t=new Date,i=new Date(t.getTime()-864e5);try{const a=await this.hass.callWS({type:"history/history_during_period",start_time:i.toISOString(),end_time:t.toISOString(),entity_ids:[e],minimal_response:!0,no_attributes:!0,significant_changes_only:!1});a?.[e]&&(this._historyData=function(e){if(!e?.length)return[];const t=new Array(24).fill(null).map(()=>({sum:0,count:0})),i=new Date;return e.forEach(e=>{const a=new Date(e.lu?1e3*e.lu:e.last_updated||0),o=Math.floor((i.getTime()-a.getTime())/36e5),r=23-Math.min(o,23),n=parseFloat(e.s||e.state||"0");!isNaN(n)&&r>=0&&r<24&&(t[r].sum+=n,t[r].count++)}),t.map(e=>e.count>0?e.sum/e.count:0)}(a[e]),this._lastHistoryFetch=Date.now())}catch(e){console.error("SmartHomeShop: Error fetching history:",e)}finally{this._historyLoading=!1}}_getFlowRate(){return Re(this.hass,this._config.flow_entity)}_getTodayUsage(){return Re(this.hass,this._config.today_entity)}_getWeekUsage(){return Re(this.hass,this._config.week_entity)}_getMonthUsage(){return Re(this.hass,this._config.month_entity)}_getYearUsage(){return Re(this.hass,this._config.year_entity)}_getMeterTotal(){return Re(this.hass,this._config.total_entity)}_hasLeak(){const e=He(this.hass,this._config.leak_entity);return"on"===e?.state}_getMaxHistoryValue(){return this._historyData?.length?Math.max(...this._historyData):0}_renderMeterSection(){const e=this._config.total_entity;if(!e||!1===this._config.show_meter_reading)return Y;if("WaterP1MeterKit"===this._config._productName&&this._isRawWaterTotal(e))return K`
        <div class="meter-counter-section meter-counter-upgrade">
          <span class="meter-counter-icon"><ha-icon icon="mdi:update"></ha-icon></span>
          <span class="meter-counter-copy">
            <span class="meter-counter-title">Persistent meter reading unavailable</span>
            <span class="meter-counter-subtitle">
              Update the WaterP1MeterKit firmware to enable Water Meter Total.
            </span>
          </span>
        </div>
      `;const t=this._getMeterTotal(),i=!!this._config.meter_initial_entity,a=parseFloat(this._meterInput.replace(",",".")),o=!isNaN(a)&&a>=0;return K`
      <div class="meter-counter-section">
        <div class="meter-counter-main">
          <button type="button" class="meter-counter-reading" @click=${()=>je(this,e)}>
            <span class="meter-counter-icon"><ha-icon icon="mdi:counter"></ha-icon></span>
            <span class="meter-counter-copy">
              <span class="meter-counter-title">Meter reading</span>
              <span class="meter-counter-subtitle">
                ${i?"Synchronized with your device":"Total registered water"}
              </span>
            </span>
            <span class="meter-counter-value">${t.toFixed(3)}<span>m³</span></span>
          </button>
          ${i?K`
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
        ${i&&this._showMeterForm?K`
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
                @keydown=${e=>{"Enter"===e.key&&o&&this._saveMeterReading()}}
              />
              <span class="meter-form-unit">m³</span>
              <button class="meter-form-save" ?disabled=${!o} @click=${this._saveMeterReading}>
                Save
              </button>
            </div>
          </div>
        `:Y}
      </div>
    `}}a([ve({attribute:!1})],Oe.prototype,"hass",void 0),a([fe()],Oe.prototype,"_config",void 0),a([fe()],Oe.prototype,"_historyData",void 0),a([fe()],Oe.prototype,"_historyLoading",void 0),a([fe()],Oe.prototype,"_showMeterForm",void 0),a([fe()],Oe.prototype,"_meterInput",void 0);const Ve=c`
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
`,Ue={ultimatesensor:'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 612.9 605.2" style="enable-background:new 0 0 612.9 605.2;" xml:space="preserve"> <g> <g> <g> <path fill="currentColor" d="M581.4,299.4c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5l-23.2,239.8c-2,20.2-20,35.1-40.2,33.1l-312.3-30.2 c-20.2-2-35.1-20-33.1-40.2l12.8-132.4l117,11.3c6,0.6,11.5-3.9,12-9.9c0.3-2.9-0.6-5.8-2.5-8.1c-1.9-2.3-4.5-3.7-7.5-4 l-279.6-27c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4l140.6,13.6l-12.8,132.4 c-3.1,32.3,20.6,61.2,53,64.3l312.3,30.2c1.9,0.2,3.8,0.3,5.7,0.3c13.6,0,26.7-4.7,37.4-13.5c12.2-10,19.7-24.1,21.2-39.8 l23.3-240c0.3-2.9-0.6-5.8-2.5-8.1C587,301.1,584.4,299.7,581.4,299.4z"/> <path fill="currentColor" d="M559.2,30.9l-62.3-6c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.6,6.1,3.9,11.5,9.9,12l62.3,6 c20.2,2,35.1,20,33.1,40.2l-14.6,151.2c-0.3,2.9,0.6,5.8,2.5,8.1s4.5,3.7,7.5,4c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10 l14.6-151.2C615.3,62.9,591.6,34.1,559.2,30.9z"/> <path fill="currentColor" d="M285.4,430.9l-5.7,59.1c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4l131.9,12.7c0.4,0,0.7,0.1,1.1,0.1 c5.6,0,10.4-4.3,11-10l5.7-59.1c0.6-6.1-3.9-11.5-9.9-12L297.4,421C291.4,420.4,285.9,424.9,285.4,430.9z M416.2,454.7l-3.6,37.1 l-110-10.6l3.7-37.2L416.2,454.7z"/> <path fill="currentColor" d="M495.4,200.8l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1 l1.6-16.3c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C496,199.7,495.5,200.2,495.4,200.8z"/> <path fill="currentColor" d="M393.8,112.6c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10l0,0l3.6-37.4c0.3-2.9-0.6-5.8-2.5-8.1 s-4.5-3.7-7.5-4c-6-0.6-11.5,3.9-12,9.9l-3.6,37.4C383.3,106.7,387.7,112.1,393.8,112.6z"/> <path fill="currentColor" d="M326.8,120.2c1.8,3,4.9,5,8.5,5.4l0,0c0.4,0,0.7,0.1,1.1,0.1c2,0,3.9-0.5,5.6-1.5c2.5-1.5,4.3-3.9,5.1-6.7 c0.7-2.9,0.3-5.8-1.2-8.4l-19.1-32.4c-1.5-2.5-3.9-4.3-6.7-5.1c-2.8-0.7-5.8-0.3-8.4,1.2c-2.5,1.5-4.3,3.9-5.1,6.7 c-0.7,2.9-0.3,5.8,1.2,8.4L326.8,120.2z"/> <path fill="currentColor" d="M301,149.4l-34.5-15c-5.6-2.4-12.1,0.1-14.5,5.7c-1.2,2.7-1.2,5.7-0.2,8.4c1.1,2.7,3.2,4.9,5.9,6.1l34.5,15 c1.1,0.5,2.2,0.8,3.3,0.9l0,0c0.4,0,0.7,0.1,1.1,0.1c4.4,0,8.3-2.6,10.1-6.6C309.2,158.3,306.6,151.8,301,149.4z"/> <path fill="currentColor" d="M470.8,171.3c-1.6,2.5-2.1,5.4-1.5,8.3c1,4.7,4.9,8.1,9.7,8.6c0.3,0,0.7,0.1,1,0.1c0.8,0,1.6-0.1,2.4-0.3 l36.7-8.1c5.9-1.3,9.7-7.2,8.4-13.2c-0.6-2.9-2.4-5.3-4.8-6.9c-2.5-1.6-5.4-2.1-8.3-1.5l0,0l-36.7,8.1 C474.9,167.1,472.4,168.8,470.8,171.3z"/> <path fill="currentColor" d="M443.2,249.2c13.6-15.4,20.4-35.2,19.2-55.8c-1.3-20.6-10.4-39.4-25.8-53s-35.2-20.5-55.7-19.2 c-20.6,1.3-39.4,10.4-53,25.8c-16.3,18.4-22.7,42.7-17.8,66.7c1.2,5.9,7.1,9.8,13,8.6l0,0c6-1.2,9.8-7.1,8.6-13 c-3.5-17.2,1.1-34.5,12.7-47.6c9.7-11,23.2-17.5,37.8-18.4c14.7-0.9,28.8,4,39.8,13.7s17.5,23.2,18.4,37.8 c0.9,14.7-4,28.8-13.7,39.8c-18.8,21.3-51.4,24.6-74.1,7.6c-4.9-3.6-11.8-2.7-15.4,2.2c-1.8,2.4-2.5,5.3-2.1,8.2s1.9,5.5,4.3,7.3 c11.2,8.4,24.5,13.5,38.5,14.9c2.5,0.2,5,0.4,7.5,0.4C407.4,275.1,428.6,265.7,443.2,249.2z"/> <path fill="currentColor" d="M438.7,126.2c0.2,2.9,1.5,5.6,3.7,7.6c1.8,1.6,3.9,2.5,6.2,2.7c0.4,0,0.7,0.1,1.1,0.1c3.1,0,6.2-1.3,8.3-3.7 l24.9-28.1c2-2.2,2.9-5,2.8-8c-0.2-2.9-1.5-5.6-3.7-7.6s-5-2.9-8-2.8c-2.9,0.2-5.6,1.5-7.6,3.7l-24.9,28.1 C439.5,120.5,438.6,123.3,438.7,126.2z"/> <path fill="currentColor" d="M67.4,281.8L67.4,281.8l103.4,10c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10l21.8-226 c0.9-9.8,5.7-18.6,13.3-24.9s17.2-9.2,27-8.3l201.7,19.5c6.1,0.6,11.5-3.9,12-9.9c0.6-6.1-3.9-11.5-9.9-12L247,0.8 c-32.3-3.1-61.2,20.6-64.3,53l-20.8,215.1L69.5,260c-6.1-0.6-11.5,3.9-12,9.9C56.9,275.9,61.3,281.3,67.4,281.8z"/> <path fill="currentColor" d="M233.7,319.5L88,305.4c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1 c1.9,2.3,4.5,3.7,7.5,4l145.7,14.1c0.4,0,0.7,0.1,1.1,0.1c2.5,0,5-0.9,7-2.5c2.3-1.9,3.7-4.5,4-7.5c0.3-2.9-0.6-5.8-2.5-8.1 C239.2,321.2,236.6,319.8,233.7,319.5z"/> </g> </g> </g> </svg>',ultimatesensor_mini:'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 612.9 605.2" style="enable-background:new 0 0 612.9 605.2;" xml:space="preserve"> <g> <g> <g> <path fill="currentColor" d="M581.4,299.4c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5l-23.2,239.8c-2,20.2-20,35.1-40.2,33.1l-312.3-30.2 c-20.2-2-35.1-20-33.1-40.2l12.8-132.4l117,11.3c6,0.6,11.5-3.9,12-9.9c0.3-2.9-0.6-5.8-2.5-8.1c-1.9-2.3-4.5-3.7-7.5-4 l-279.6-27c-2.9-0.3-5.8,0.6-8.1,2.5s-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4l140.6,13.6l-12.8,132.4 c-3.1,32.3,20.6,61.2,53,64.3l312.3,30.2c1.9,0.2,3.8,0.3,5.7,0.3c13.6,0,26.7-4.7,37.4-13.5c12.2-10,19.7-24.1,21.2-39.8 l23.3-240c0.3-2.9-0.6-5.8-2.5-8.1C587,301.1,584.4,299.7,581.4,299.4z"/> <path fill="currentColor" d="M559.2,30.9l-62.3-6c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.6,6.1,3.9,11.5,9.9,12l62.3,6 c20.2,2,35.1,20,33.1,40.2l-14.6,151.2c-0.3,2.9,0.6,5.8,2.5,8.1s4.5,3.7,7.5,4c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10 l14.6-151.2C615.3,62.9,591.6,34.1,559.2,30.9z"/> <path fill="currentColor" d="M495.4,199.8l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1l1.6-16.3 c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C496,198.7,495.5,199.2,495.4,199.8z"/> <path fill="currentColor" d="M67.4,281.8L67.4,281.8l103.4,10c0.4,0,0.7,0.1,1.1,0.1c5.6,0,10.4-4.3,11-10l21.8-226c0.9-9.8,5.7-18.6,13.3-24.9 s17.2-9.2,27-8.3l201.7,19.5c6.1,0.6,11.5-3.9,12-9.9c0.6-6.1-3.9-11.5-9.9-12L247,0.8c-32.3-3.1-61.2,20.6-64.3,53l-20.8,215.1 L69.5,260c-6.1-0.6-11.5,3.9-12,9.9C56.9,275.9,61.3,281.3,67.4,281.8z"/> <path fill="currentColor" d="M233.7,319.5L88,305.4c-2.9-0.3-5.8,0.6-8.1,2.5c-2.3,1.9-3.7,4.5-4,7.5c-0.3,2.9,0.6,5.8,2.5,8.1c1.9,2.3,4.5,3.7,7.5,4 l145.7,14.1c0.4,0,0.7,0.1,1.1,0.1c2.5,0,5-0.9,7-2.5c2.3-1.9,3.7-4.5,4-7.5c0.3-2.9-0.6-5.8-2.5-8.1 C239.2,321.2,236.6,319.8,233.7,319.5z"/> <path fill="currentColor" d="M498.4,169.1l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1l1.6-16.3 c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C499,168,498.5,168.5,498.4,169.1z"/> <path fill="currentColor" d="M492.4,230.1l-1.6,16.3c0,0.3,0.1,0.6,0.3,0.8c0.2,0.2,0.5,0.4,0.8,0.4l35.4,3.4h0.1c0.6,0,1.1-0.4,1.1-1l1.6-16.3 c0-0.3-0.1-0.6-0.3-0.8s-0.5-0.4-0.8-0.4l-35.4-3.4C493,229,492.5,229.5,492.4,230.1z"/> </g> </g> </g> </svg>',waterp1meterkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 330.6" style="enable-background:new 0 0 360.3 330.6;" xml:space="preserve"> <path fill="currentColor" d="M353.6,215.6c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 s4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,238.6,363,224.1,353.6,215.6z"/> <path fill="currentColor" d="M150.1,56.4h-40.7l15-45.8c1.4-5.3-2.6-10.6-8.2-10.6H65.5c-4.2,0-7.8,3.1-8.4,7.3L45.8,91.9 c-0.7,5.1,3.3,9.6,8.4,9.6H96l-16.2,68.6c-1.3,5.4,2.8,10.4,8.2,10.4c3,0,5.8-1.6,7.3-4.2l62-107.1 C160.6,63.5,156.6,56.4,150.1,56.4z"/> <g id="ZzGCBf_00000049189341060021335730000007757298693458865835_"> <g> <path fill="currentColor" d="M250,2.9c1.4,0,2.9,0,4.4,0c4.9,1.6,7.5,5.2,8.6,10c0.1,0.6,0.1,1.3,0.4,1.8c3.7,8.5,6.8,17.3,11.2,25.3 c5.7,10.3,12.5,20.1,19,30c6,9.1,12.5,17.9,15.7,28.4c1.2,4,1.9,8.2,2.9,12.4c0,3.8,0,7.6,0,11.5c-0.2,1.3-0.3,2.6-0.6,3.9 c-1.8,7.8-4,15.3-8.3,22.2c-7.4,11.9-17.4,20.6-30.6,25.2c-4.7,1.7-9.7,2.6-14.6,3.8c-4,0-8,0-12,0c-1.1-0.2-2.2-0.3-3.3-0.6 c-14.2-2.8-26.4-9.1-35.9-20.3c-6-7.1-10.4-15-12.6-23.9c-0.9-3.6-1.4-7.3-2.2-10.9c0-3.5,0-6.9,0-10.4c0.2-0.4,0.4-0.8,0.5-1.2 c0.4-7.9,3.2-15.2,6.8-22.1c3.2-6,7.4-11.6,11.1-17.4c5.9-9.1,11.8-18.1,17.5-27.3c5.6-8.9,9.5-18.6,12.6-28.6 C242.3,9.8,244,4.7,250,2.9z M250.7,156.4c1.9-0.9,4.3-1.4,5.5-2.9c1-1.2,1.2-3.8,0.7-5.4c-0.7-2.4-3.1-3.1-5.6-3.2 c-14.8-0.4-26.1-12.4-26.6-26.6c-0.1-3.7-2.1-6-5.3-6.1c-3.3-0.1-5.6,2.4-5.5,6.2c0.2,9.5,3.4,17.8,9.8,24.8 C231,150.9,239.9,155,250.7,156.4z"/> <path fill="currentColor" d="M250.7,156.4c-10.9-1.3-19.7-5.5-26.9-13.2c-6.5-7-9.6-15.3-9.8-24.8c-0.1-3.8,2.2-6.3,5.5-6.2 c3.3,0.1,5.2,2.4,5.3,6.1c0.5,14.3,11.8,26.3,26.6,26.6c2.6,0.1,4.9,0.8,5.6,3.2c0.5,1.6,0.3,4.2-0.7,5.4 C255,154.9,252.6,155.4,250.7,156.4z"/> </g> </g> </svg>',watermeterkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 327.7" style="enable-background:new 0 0 360.3 327.7;" xml:space="preserve"> <g id="ZzGCBf_00000097490843262625298010000006643391998989410708_"> <g> <path fill="currentColor" d="M178.5,0c1.4,0,2.9,0,4.4,0c4.9,1.6,7.5,5.2,8.6,10c0.1,0.6,0.1,1.3,0.4,1.8c3.7,8.5,6.8,17.3,11.2,25.3 c5.7,10.3,12.5,20.1,19,30c6,9.1,12.5,17.9,15.7,28.5c1.2,4,1.9,8.2,2.9,12.4c0,3.8,0,7.6,0,11.5c-0.2,1.3-0.3,2.6-0.6,3.9 c-1.8,7.8-4,15.3-8.3,22.2c-7.4,11.9-17.4,20.6-30.6,25.2c-4.7,1.7-9.7,2.6-14.6,3.8c-4,0-8,0-12,0c-1.1-0.2-2.2-0.3-3.3-0.6 c-14.2-2.8-26.4-9.1-35.9-20.3c-6-7.1-10.4-15-12.7-23.9c-0.9-3.6-1.4-7.3-2.2-10.9c0-3.5,0-6.9,0-10.4c0.2-0.4,0.4-0.8,0.5-1.2 c0.4-7.9,3.2-15.2,6.8-22.1c3.2-6,7.4-11.6,11.1-17.4c5.9-9.1,11.8-18.1,17.5-27.3c5.6-8.9,9.5-18.6,12.6-28.6 C170.8,6.8,172.5,1.8,178.5,0z M179.3,153.4c1.9-0.9,4.3-1.4,5.5-2.9c1-1.2,1.2-3.8,0.7-5.4c-0.7-2.4-3.1-3.1-5.6-3.2 c-14.8-0.4-26.1-12.4-26.6-26.6c-0.1-3.7-2.1-6-5.3-6.1c-3.3-0.1-5.6,2.4-5.5,6.2c0.2,9.5,3.4,17.8,9.8,24.8 C159.6,147.9,168.4,152.1,179.3,153.4z"/> </g> </g> <path fill="currentColor" d="M353.6,212.7c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 s4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,235.7,363,221.2,353.6,212.7z"/> </svg>',waterflowkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 332.6" style="enable-background:new 0 0 360.3 332.6;" xml:space="preserve"> <path fill="currentColor" d="M353.6,217.5c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 c0-5.5,4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,240.6,363,226.1,353.6,217.5z"/> <path fill="currentColor" d="M308.8,149.5c-10-1.1-19.7-4.9-27.1-10.7c-6.6-5.2-16-5.3-22.5,0c-17.7,14.2-50.1,14.2-68.1-0.7 c-6.3-5.2-15.4-4.2-21.8,0.8c-17.8,14.1-50,14-67.9-0.8c-6.3-5.2-15.6-4.2-22,0.9c-7.2,5.7-16.8,9.4-27,10.5 c-3.7,0.4-6.4,3.6-6.4,7.3v15.1c0,4.2,3.5,7.9,7.8,7.5c13.5-1.2,26.2-5.3,37.1-12.1c26.4,16.2,64,15.9,89.8,0 c26.4,16.2,64,15.9,89.8,0c10.9,6.6,23.8,10.9,37,12.1c4.2,0.4,7.8-3.2,7.8-7.5v-14.8C315.3,153.4,312.6,149.9,308.8,149.5z M308.8,82.2c-10-1.1-19.7-4.9-27.1-10.7c-6.6-5.2-16-5.3-22.5,0c-17.7,14.2-50.1,14.2-68.1-0.7c-6.3-5.2-15.4-4.2-21.8,0.8 c-17.8,14.1-50,14-67.9-0.8c-6.3-5.2-15.6-4.2-22,0.9c-7.2,5.7-16.8,9.4-27,10.5c-3.7,0.4-6.4,3.7-6.4,7.3v15.1 c0,4.2,3.5,7.8,7.8,7.5c13.5-1.2,26.2-5.3,37.1-12.1c26.4,16.2,64,15.9,89.8,0c26.4,16.2,64,15.9,89.8,0c10.9,6.6,23.8,10.9,37,12.1 c4.2,0.4,7.8-3.2,7.8-7.5V89.8C315.3,86.1,312.6,82.6,308.8,82.2L308.8,82.2z M308.8,14.9c-10-1.2-19.7-4.9-27.1-10.7 c-6.6-5.2-16-5.3-22.5,0c-17.7,14.2-50.1,14.2-68.1-0.7c-6.3-5.2-15.4-4.2-21.8,0.8c-17.8,14.1-50,14-67.9-0.8 c-6.3-5.2-15.6-4.2-22,0.9c-7.2,5.7-16.8,9.4-27,10.5c-3.7,0.4-6.4,3.6-6.4,7.3v15.1c0,4.2,3.5,7.8,7.8,7.5 c13.5-1.2,26.2-5.3,37.1-12.1c26.4,16.2,64,15.9,89.8,0c26.4,16.2,64,15.9,89.8,0c10.9,6.6,23.8,10.9,37,12.1 c4.2,0.4,7.8-3.2,7.8-7.5V22.5C315.3,18.8,312.6,15.3,308.8,14.9L308.8,14.9z"/> </svg>',p1meterkit:'<svg version="1.1" id="Laag_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360.3 330.6" style="enable-background:new 0 0 360.3 330.6;" xml:space="preserve" fill="none"> <path fill="currentColor" d="M353.6,215.6c-7.4-6.7-18.9-6.2-26.6,0l-57.8,46.2c-7.1,5.7-15.9,8.8-25,8.8h-74c-5.5,0-10-4.5-10-10 c0-5.5,4.5-10,10-10h49c9.9,0,19.2-6.8,20.8-16.6c2.1-12.5-7.6-23.4-19.8-23.4H120.1c-16.9,0-33.2,5.8-46.3,16.4l-29.1,23.6H10 c-5.5,0-10,4.5-10,10v60c0,5.5,4.5,10,10,10h223.2c9.1,0,17.9-3.1,25-8.8l94.6-75.7C362.3,238.6,363,224.1,353.6,215.6z"/> <path fill="currentColor" d="M228.1,56.4h-40.7l15-45.8c1.4-5.3-2.6-10.6-8.2-10.6h-50.8c-4.2,0-7.8,3.1-8.4,7.3l-11.3,84.6 c-0.7,5.1,3.3,9.6,8.4,9.6h41.8l-16.2,68.6c-1.3,5.4,2.8,10.4,8.2,10.4c3,0,5.8-1.6,7.3-4.2l62-107.1 C238.6,63.5,234.6,56.4,228.1,56.4z"/> </svg>',ceilsense:'\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 226.772 226.772">\n<path fill-rule="nonzero" fill="currentColor" d="M 152.335938 185.832031 C 152.058594 185.832031 151.835938 185.605469 151.835938 185.332031 L 151.835938 167.378906 C 151.835938 167.214844 151.914062 167.066406 152.046875 166.972656 L 156.625 163.753906 C 156.742188 163.671875 156.890625 163.644531 157.03125 163.675781 L 160.382812 164.515625 C 160.398438 164.519531 160.414062 164.523438 160.429688 164.527344 L 169.527344 166.804688 C 169.796875 166.871094 169.960938 167.144531 169.890625 167.410156 C 169.824219 167.675781 169.550781 167.839844 169.285156 167.773438 L 160.222656 165.503906 C 160.207031 165.5 160.1875 165.5 160.175781 165.496094 L 157.011719 164.703125 L 152.835938 167.636719 L 152.835938 185.332031 C 152.835938 185.605469 152.609375 185.832031 152.335938 185.832031 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.226562 124.132812 C 52.546875 124.132812 12.945312 104.03125 12.945312 79.328125 C 12.945312 59.148438 39.675781 41.367188 77.953125 36.085938 C 78.230469 36.046875 78.476562 36.238281 78.515625 36.511719 C 78.550781 36.785156 78.363281 37.039062 78.089844 37.074219 C 40.320312 42.285156 13.945312 59.660156 13.945312 79.328125 C 13.945312 103.480469 53.097656 123.132812 101.226562 123.132812 C 149.347656 123.132812 188.5 103.480469 188.5 79.328125 C 188.5 59.589844 162.011719 42.199219 124.085938 37.035156 C 123.8125 36.996094 123.621094 36.746094 123.660156 36.472656 C 123.695312 36.199219 123.953125 36.011719 124.222656 36.046875 C 162.65625 41.277344 189.5 59.074219 189.5 79.328125 C 189.5 104.03125 149.898438 124.132812 101.226562 124.132812 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.148438 103.402344 C 59.601562 103.402344 25.800781 87.953125 25.800781 68.957031 C 25.800781 54.054688 46.566406 40.902344 77.464844 36.234375 C 77.738281 36.199219 77.992188 36.382812 78.035156 36.65625 C 78.074219 36.929688 77.886719 37.183594 77.617188 37.222656 C 47.222656 41.8125 26.800781 54.566406 26.800781 68.957031 C 26.800781 87.402344 60.152344 102.40625 101.148438 102.40625 C 142.148438 102.40625 175.503906 87.402344 175.503906 68.957031 C 175.503906 54.558594 155.078125 41.804688 124.679688 37.222656 C 124.40625 37.183594 124.21875 36.929688 124.257812 36.65625 C 124.300781 36.382812 124.558594 36.199219 124.828125 36.234375 C 155.734375 40.894531 176.5 54.042969 176.5 68.957031 C 176.5 87.953125 142.695312 103.402344 101.148438 103.402344 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.152344 33.855469 C 79.148438 33.855469 61.246094 41.664062 61.246094 51.261719 C 61.246094 60.855469 79.148438 68.664062 101.152344 68.664062 C 123.15625 68.664062 141.058594 60.855469 141.058594 51.261719 C 141.058594 41.664062 123.15625 33.855469 101.152344 33.855469 M 101.152344 69.664062 C 78.59375 69.664062 60.246094 61.410156 60.246094 51.261719 C 60.246094 41.113281 78.59375 32.859375 101.152344 32.859375 C 123.707031 32.859375 142.058594 41.113281 142.058594 51.261719 C 142.058594 61.410156 123.707031 69.664062 101.152344 69.664062 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.15625 78.546875 C 74.402344 78.546875 52.636719 68.5 52.636719 56.152344 C 52.636719 48.917969 60.195312 42.113281 72.859375 37.945312 C 73.121094 37.859375 73.402344 38 73.488281 38.261719 C 73.574219 38.523438 73.433594 38.808594 73.171875 38.894531 C 60.9375 42.921875 53.632812 49.371094 53.632812 56.152344 C 53.632812 67.949219 74.953125 77.550781 101.15625 77.550781 C 127.355469 77.550781 148.667969 67.949219 148.667969 56.152344 C 148.667969 49.371094 141.367188 42.921875 129.132812 38.894531 C 128.871094 38.808594 128.726562 38.523438 128.8125 38.261719 C 128.902344 38 129.183594 37.859375 129.445312 37.945312 C 142.109375 42.113281 149.667969 48.917969 149.667969 56.152344 C 149.667969 68.5 127.90625 78.546875 101.15625 78.546875 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.148438 89.496094 C 73.960938 89.496094 51.847656 79.203125 51.847656 66.550781 C 51.847656 64.417969 52.460938 62.316406 53.675781 60.300781 C 53.820312 60.0625 54.125 59.984375 54.359375 60.128906 C 54.597656 60.269531 54.671875 60.578125 54.53125 60.816406 C 53.414062 62.671875 52.84375 64.605469 52.84375 66.550781 C 52.84375 78.652344 74.511719 88.5 101.148438 88.5 C 127.785156 88.5 149.457031 78.652344 149.457031 66.550781 C 149.457031 64.605469 148.890625 62.671875 147.769531 60.816406 C 147.628906 60.578125 147.707031 60.269531 147.941406 60.128906 C 148.179688 59.988281 148.484375 60.0625 148.628906 60.300781 C 149.84375 62.316406 150.457031 64.421875 150.457031 66.550781 C 150.457031 79.203125 128.335938 89.496094 101.148438 89.496094 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 101.148438 103.382812 C 64.4375 103.382812 34.574219 89.308594 34.574219 72.003906 C 34.574219 63.339844 41.851562 55.289062 55.066406 49.332031 C 55.320312 49.21875 55.613281 49.332031 55.726562 49.582031 C 55.839844 49.832031 55.730469 50.128906 55.480469 50.242188 C 42.640625 56.027344 35.574219 63.757812 35.574219 72.003906 C 35.574219 88.757812 64.988281 102.382812 101.148438 102.382812 C 137.308594 102.382812 166.730469 88.757812 166.730469 72.003906 C 166.730469 63.800781 159.730469 56.105469 147.023438 50.332031 C 146.773438 50.21875 146.660156 49.921875 146.777344 49.671875 C 146.890625 49.421875 147.1875 49.308594 147.4375 49.421875 C 160.523438 55.367188 167.730469 63.386719 167.730469 72.003906 C 167.730469 89.308594 137.859375 103.382812 101.148438 103.382812 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 70.765625 43.140625 C 68.675781 43.140625 67.222656 43.890625 67.222656 44.570312 C 67.222656 45.246094 68.675781 46 70.765625 46 C 72.851562 46 74.304688 45.246094 74.304688 44.570312 C 74.304688 43.890625 72.851562 43.140625 70.765625 43.140625 M 70.765625 46.5 C 68.5 46.5 66.722656 45.652344 66.722656 44.570312 C 66.722656 43.488281 68.5 42.640625 70.765625 42.640625 C 73.03125 42.640625 74.804688 43.488281 74.804688 44.570312 C 74.804688 45.652344 73.03125 46.5 70.765625 46.5 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 100.878906 121.882812 C 55.847656 121.882812 18.136719 104.917969 13.15625 82.421875 C 13.097656 82.152344 13.265625 81.886719 13.535156 81.828125 C 13.800781 81.765625 14.074219 81.9375 14.132812 82.207031 C 19.011719 104.257812 56.304688 120.886719 100.878906 120.886719 C 149.003906 120.886719 188.160156 101.386719 188.160156 77.417969 C 188.160156 76.386719 188.085938 75.363281 187.945312 74.382812 C 187.90625 74.113281 188.09375 73.859375 188.367188 73.820312 C 188.632812 73.773438 188.894531 73.96875 188.933594 74.242188 C 189.082031 75.269531 189.160156 76.339844 189.160156 77.417969 C 189.160156 101.9375 149.554688 121.882812 100.878906 121.882812 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 141.078125 79.96875 C 140.800781 79.96875 140.578125 79.742188 140.578125 79.46875 L 140.578125 75.242188 C 140.578125 72.984375 140.039062 70.875 139.140625 69.59375 C 138.980469 69.367188 139.035156 69.058594 139.261719 68.898438 C 139.484375 68.742188 139.796875 68.792969 139.957031 69.019531 C 141.417969 71.101562 141.578125 74.0625 141.578125 75.242188 L 141.578125 79.46875 C 141.578125 79.742188 141.351562 79.96875 141.078125 79.96875 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 127.71875 85.871094 C 127.445312 85.871094 127.21875 85.648438 127.21875 85.371094 L 127.21875 80.566406 C 127.21875 78.421875 126.722656 76.367188 125.890625 75.070312 C 125.742188 74.839844 125.808594 74.53125 126.039062 74.382812 C 126.273438 74.234375 126.582031 74.296875 126.730469 74.53125 C 128.074219 76.625 128.21875 79.449219 128.21875 80.566406 L 128.21875 85.371094 C 128.21875 85.648438 127.996094 85.871094 127.71875 85.871094 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 61.226562 79.96875 C 60.953125 79.96875 60.726562 79.742188 60.726562 79.46875 L 60.726562 75.242188 C 60.726562 74.0625 60.886719 71.097656 62.347656 69.019531 C 62.503906 68.792969 62.816406 68.738281 63.042969 68.898438 C 63.269531 69.058594 63.324219 69.367188 63.164062 69.59375 C 62.265625 70.875 61.726562 72.984375 61.726562 75.242188 L 61.726562 79.46875 C 61.726562 79.742188 61.503906 79.96875 61.226562 79.96875 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 74.582031 85.871094 C 74.308594 85.871094 74.082031 85.648438 74.082031 85.371094 L 74.082031 80.566406 C 74.082031 79.449219 74.230469 76.625 75.570312 74.53125 C 75.722656 74.300781 76.03125 74.230469 76.261719 74.382812 C 76.496094 74.53125 76.5625 74.839844 76.414062 75.070312 C 75.582031 76.367188 75.082031 78.421875 75.082031 80.566406 L 75.082031 85.371094 C 75.082031 85.648438 74.859375 85.871094 74.582031 85.871094 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 79.511719 195.695312 C 79.484375 195.695312 79.457031 195.695312 79.429688 195.6875 C 50.789062 190.800781 31.550781 176.945312 31.550781 161.210938 L 31.550781 106.597656 C 31.550781 106.320312 31.773438 106.097656 32.050781 106.097656 C 32.324219 106.097656 32.550781 106.320312 32.550781 106.597656 L 32.550781 161.210938 C 32.550781 176.441406 51.457031 189.902344 79.59375 194.703125 C 79.867188 194.75 80.050781 195.007812 80.003906 195.28125 C 79.960938 195.523438 79.75 195.695312 79.511719 195.695312 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 139.816406 191.414062 C 139.609375 191.414062 139.417969 191.285156 139.34375 191.078125 C 139.257812 190.820312 139.394531 190.535156 139.652344 190.441406 C 144.191406 188.863281 148.359375 187.007812 152.042969 184.925781 C 152.332031 184.707031 152.835938 184.9375 152.835938 185.320312 C 152.835938 185.5 152.738281 185.675781 152.582031 185.765625 C 148.832031 187.890625 144.59375 189.78125 139.980469 191.386719 C 139.925781 191.40625 139.871094 191.414062 139.816406 191.414062 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 169.398438 167.789062 C 169.121094 167.789062 168.898438 167.566406 168.898438 167.289062 L 168.898438 153.621094 C 168.898438 153.347656 169.121094 153.125 169.398438 153.125 C 169.671875 153.125 169.898438 153.347656 169.898438 153.621094 L 169.898438 167.289062 C 169.898438 167.566406 169.671875 167.789062 169.398438 167.789062 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 169.398438 167.789062 C 169.34375 167.789062 169.292969 167.78125 169.242188 167.765625 C 168.976562 167.675781 168.835938 167.394531 168.921875 167.132812 C 169.570312 165.195312 169.898438 163.203125 169.898438 161.214844 L 169.898438 106.601562 C 169.898438 106.324219 170.121094 106.101562 170.398438 106.101562 C 170.671875 106.101562 170.898438 106.324219 170.898438 106.601562 L 170.898438 161.214844 C 170.898438 163.3125 170.550781 165.40625 169.871094 167.445312 C 169.800781 167.65625 169.605469 167.789062 169.398438 167.789062 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 80.011719 173.550781 L 80.011719 189.144531 C 80.363281 187.207031 80.738281 185.386719 81.003906 184.722656 C 81.789062 182.761719 84.886719 180.753906 89.097656 180.835938 C 92.234375 180.914062 96.960938 181.148438 99.78125 181.289062 C 100.824219 181.339844 101.613281 181.378906 101.984375 181.394531 C 104.265625 181.480469 106.085938 181.742188 107.847656 181.996094 C 109.703125 182.265625 111.449219 182.503906 113.488281 182.503906 C 115.808594 182.488281 118.65625 181.875 121.167969 181.332031 C 123.195312 180.894531 124.945312 180.519531 126.105469 180.519531 L 126.316406 180.519531 C 128.746094 180.519531 134.996094 180.488281 139.320312 188.691406 L 139.320312 150.816406 C 138.089844 151.207031 136.960938 151.546875 135.878906 151.851562 C 130.910156 153.269531 125.339844 154.5 119.320312 155.519531 L 119.320312 175.742188 C 119.320312 176.507812 118.75 177.15625 117.996094 177.253906 C 114.625 177.6875 111.191406 177.984375 107.789062 178.144531 C 107.367188 178.179688 106.96875 178.011719 106.667969 177.722656 C 106.367188 177.4375 106.195312 177.035156 106.195312 176.621094 L 106.195312 175.15625 C 104.554688 175.222656 102.882812 175.257812 101.21875 175.257812 C 93.96875 175.257812 86.835938 174.683594 80.011719 173.550781 M 79.511719 195.695312 C 79.5 195.695312 79.488281 195.695312 79.472656 195.695312 C 79.214844 195.675781 79.011719 195.457031 79.011719 195.195312 L 79.011719 172.960938 C 79.011719 172.8125 79.078125 172.671875 79.191406 172.578125 C 79.300781 172.484375 79.449219 172.441406 79.59375 172.464844 C 86.542969 173.65625 93.816406 174.257812 101.21875 174.257812 C 103.042969 174.257812 104.878906 174.21875 106.671875 174.140625 C 106.804688 174.117188 106.941406 174.183594 107.039062 174.277344 C 107.136719 174.371094 107.195312 174.5 107.195312 174.636719 L 107.195312 176.621094 C 107.195312 176.765625 107.25 176.898438 107.355469 177 C 107.460938 177.101562 107.601562 177.144531 107.742188 177.148438 C 111.117188 176.988281 114.523438 176.691406 117.871094 176.265625 C 118.128906 176.230469 118.324219 176.007812 118.324219 175.742188 L 118.324219 155.097656 C 118.324219 154.851562 118.5 154.644531 118.738281 154.605469 C 124.882812 153.578125 130.554688 152.328125 135.609375 150.890625 C 136.867188 150.535156 138.195312 150.132812 139.667969 149.65625 C 139.816406 149.609375 139.988281 149.636719 140.113281 149.726562 C 140.242188 149.824219 140.320312 149.972656 140.320312 150.132812 L 140.320312 190.910156 C 140.320312 191.007812 140.292969 191.097656 140.246094 191.171875 C 140.191406 191.261719 140.113281 191.332031 140.011719 191.375 C 139.753906 191.484375 139.464844 191.363281 139.355469 191.109375 C 135.308594 181.484375 128.765625 181.507812 126.320312 181.515625 L 126.105469 181.519531 C 125.050781 181.519531 123.265625 181.902344 121.378906 182.3125 C 118.820312 182.859375 115.917969 183.488281 113.496094 183.5 C 111.378906 183.492188 109.597656 183.257812 107.703125 182.984375 C 105.96875 182.734375 104.175781 182.480469 101.945312 182.390625 C 101.570312 182.375 100.777344 182.335938 99.734375 182.285156 C 96.914062 182.144531 92.199219 181.914062 89.074219 181.835938 C 84.855469 181.730469 82.457031 183.777344 81.933594 185.09375 C 81.429688 186.351562 80.371094 192.867188 80.003906 195.273438 C 79.96875 195.515625 79.757812 195.695312 79.511719 195.695312 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 129.839844 181.582031 C 129.703125 181.582031 129.589844 181.46875 129.589844 181.332031 L 129.589844 162.238281 C 129.589844 162.101562 129.703125 161.988281 129.839844 161.988281 C 129.980469 161.988281 130.089844 162.101562 130.089844 162.238281 L 130.089844 181.332031 C 130.089844 181.46875 129.980469 181.582031 129.839844 181.582031 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 84.277344 182.550781 C 84.140625 182.550781 84.027344 182.4375 84.027344 182.300781 L 84.027344 173.667969 C 84.027344 173.53125 84.140625 173.417969 84.277344 173.417969 C 84.414062 173.417969 84.527344 173.53125 84.527344 173.667969 L 84.527344 182.300781 C 84.527344 182.4375 84.414062 182.550781 84.277344 182.550781 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 18.488281 60.40625 C 18.429688 60.40625 18.371094 60.398438 18.316406 60.375 C 18.183594 60.328125 18.082031 60.226562 18.027344 60.101562 L 10.996094 43.359375 L 5.683594 41.289062 C 5.386719 41.175781 5.1875 40.894531 5.171875 40.578125 C 5.15625 40.261719 5.328125 39.964844 5.613281 39.824219 L 22.753906 31.183594 C 23.476562 30.820312 24.300781 30.75 25.070312 30.984375 L 30.605469 32.6875 C 30.746094 32.730469 30.859375 32.832031 30.917969 32.964844 L 37.792969 48.742188 C 37.902344 48.992188 37.785156 49.289062 37.53125 49.398438 C 37.277344 49.507812 36.984375 49.390625 36.875 49.140625 L 30.09375 33.574219 L 24.777344 31.941406 C 24.253906 31.78125 23.695312 31.828125 23.203125 32.074219 L 6.453125 40.519531 L 11.558594 42.503906 C 11.683594 42.554688 11.785156 42.652344 11.835938 42.777344 L 18.742188 59.222656 L 21.777344 57.714844 L 17.953125 49.164062 C 17.84375 48.921875 17.941406 48.640625 18.175781 48.519531 L 29.652344 42.4375 C 29.773438 42.371094 29.914062 42.359375 30.046875 42.402344 C 30.175781 42.445312 30.28125 42.542969 30.339844 42.667969 L 34.125 50.820312 C 34.242188 51.066406 34.132812 51.367188 33.882812 51.480469 C 33.632812 51.601562 33.335938 51.488281 33.21875 51.238281 L 29.65625 43.566406 L 19.054688 49.183594 L 22.882812 57.746094 C 22.996094 57.992188 22.890625 58.277344 22.652344 58.398438 L 18.710938 60.355469 C 18.640625 60.390625 18.566406 60.40625 18.488281 60.40625 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 11.375 43.46875 C 11.195312 43.46875 11.019531 43.371094 10.929688 43.199219 C 10.804688 42.953125 10.902344 42.652344 11.148438 42.523438 L 30.230469 32.71875 C 30.476562 32.59375 30.777344 32.691406 30.902344 32.9375 C 31.027344 33.179688 30.933594 33.480469 30.6875 33.609375 L 11.605469 43.414062 C 11.53125 43.453125 11.453125 43.46875 11.375 43.46875 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 32.40625 52.3125 C 32.21875 52.3125 32.039062 52.207031 31.953125 52.023438 L 28.148438 43.769531 C 28.03125 43.515625 28.140625 43.21875 28.390625 43.105469 C 28.644531 42.988281 28.9375 43.097656 29.054688 43.347656 L 32.863281 51.605469 C 32.976562 51.855469 32.867188 52.152344 32.617188 52.269531 C 32.546875 52.300781 32.476562 52.3125 32.40625 52.3125 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 16.902344 60.917969 C 16.707031 60.917969 16.523438 60.804688 16.445312 60.617188 L 9.734375 45.25 L 5.476562 43.425781 C 5.292969 43.347656 5.171875 43.164062 5.171875 42.964844 L 5.171875 40.570312 C 5.171875 40.292969 5.398438 40.070312 5.671875 40.070312 C 5.949219 40.070312 6.171875 40.292969 6.171875 40.570312 L 6.171875 42.636719 L 10.3125 44.410156 C 10.429688 44.460938 10.519531 44.554688 10.574219 44.667969 L 17.179688 59.804688 L 18.335938 59.433594 C 18.597656 59.351562 18.878906 59.492188 18.964844 59.753906 C 19.046875 60.015625 18.902344 60.296875 18.640625 60.382812 L 17.054688 60.894531 C 17.003906 60.910156 16.953125 60.917969 16.902344 60.917969 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 20.738281 62.125 C 20.550781 62.125 20.375 62.019531 20.289062 61.84375 L 19.179688 59.554688 C 19.058594 59.308594 19.164062 59.007812 19.410156 58.886719 C 19.660156 58.769531 19.957031 58.871094 20.078125 59.121094 L 21.1875 61.40625 C 21.308594 61.65625 21.203125 61.957031 20.957031 62.074219 C 20.886719 62.109375 20.8125 62.125 20.738281 62.125 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 21.207031 61.59375 C 21.023438 61.59375 20.84375 61.492188 20.757812 61.3125 L 19.769531 59.265625 C 19.648438 59.015625 19.753906 58.71875 20 58.597656 C 20.25 58.480469 20.546875 58.582031 20.667969 58.832031 L 21.65625 60.878906 C 21.777344 61.128906 21.671875 61.425781 21.425781 61.546875 C 21.355469 61.578125 21.28125 61.59375 21.207031 61.59375 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 220.402344 95.371094 Z M 198.226562 104.019531 L 206.140625 107.429688 C 206.46875 107.574219 206.839844 107.511719 207.109375 107.273438 L 220.300781 95.460938 L 212.8125 92.550781 C 212.503906 92.429688 212.152344 92.484375 211.886719 92.695312 Z M 188.996094 120.066406 C 188.878906 120.066406 188.761719 120.027344 188.667969 119.941406 L 186.921875 118.402344 C 186.726562 118.234375 186.695312 117.945312 186.84375 117.738281 L 196.867188 103.871094 C 196.886719 103.84375 196.90625 103.820312 196.925781 103.800781 C 196.9375 103.789062 196.953125 103.777344 196.96875 103.765625 L 211.257812 91.917969 C 211.808594 91.480469 212.542969 91.367188 213.179688 91.621094 L 220.785156 94.574219 C 221.085938 94.6875 221.300781 94.949219 221.359375 95.273438 C 221.414062 95.59375 221.304688 95.910156 221.0625 96.117188 L 207.773438 108.023438 C 207.214844 108.511719 206.417969 108.636719 205.742188 108.347656 L 197.449219 104.769531 L 187.921875 117.953125 L 189.054688 118.949219 L 191.507812 117.476562 L 196.894531 109.863281 C 196.933594 109.808594 196.980469 109.765625 197.035156 109.730469 L 199.28125 108.300781 C 199.417969 108.214844 199.582031 108.199219 199.730469 108.257812 L 201.359375 108.882812 L 201.679688 108.414062 C 201.835938 108.1875 202.148438 108.128906 202.375 108.285156 C 202.601562 108.441406 202.660156 108.753906 202.503906 108.980469 L 201.957031 109.773438 C 201.828125 109.964844 201.582031 110.039062 201.367188 109.957031 L 199.605469 109.28125 L 197.652344 110.519531 L 192.265625 118.136719 C 192.222656 118.195312 192.171875 118.242188 192.113281 118.277344 L 189.253906 119.996094 C 189.175781 120.042969 189.085938 120.066406 188.996094 120.066406 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 189 120.0625 C 188.898438 120.0625 188.792969 120.035156 188.707031 119.96875 C 188.480469 119.808594 188.433594 119.496094 188.59375 119.273438 L 197.636719 106.710938 C 197.773438 106.523438 198.015625 106.453125 198.234375 106.542969 L 206.472656 109.988281 C 206.652344 110.0625 206.863281 110.027344 207.011719 109.898438 L 220.3125 98.171875 C 220.339844 98.148438 220.355469 98.113281 220.355469 98.074219 L 220.355469 95.578125 C 220.355469 95.300781 220.578125 95.078125 220.855469 95.078125 C 221.132812 95.078125 221.355469 95.300781 221.355469 95.578125 L 221.355469 98.074219 C 221.355469 98.394531 221.21875 98.703125 220.976562 98.917969 L 207.675781 110.644531 C 207.246094 111.027344 206.621094 111.132812 206.089844 110.910156 L 198.21875 107.617188 L 189.402344 119.855469 C 189.304688 119.992188 189.152344 120.0625 189 120.0625 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 206.71875 110.976562 C 206.441406 110.976562 206.21875 110.753906 206.21875 110.476562 L 206.21875 107.988281 C 206.21875 107.710938 206.441406 107.488281 206.71875 107.488281 C 206.992188 107.488281 207.21875 107.710938 207.21875 107.988281 L 207.21875 110.476562 C 207.21875 110.753906 206.992188 110.976562 206.71875 110.976562 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 152.835938 172.527344 C 153.308594 172.734375 153.855469 172.8125 154.402344 172.765625 C 154.753906 172.730469 155.09375 172.640625 155.410156 172.492188 C 156.046875 172.191406 156.554688 171.679688 156.832031 171.050781 C 156.960938 170.773438 157.035156 170.472656 157.0625 170.148438 C 157.070312 170.066406 157.070312 169.996094 157.070312 169.9375 C 157.070312 168.359375 155.730469 167.078125 154.082031 167.078125 C 154.058594 167.082031 153.941406 167.089844 153.914062 167.089844 C 153.800781 167.089844 153.6875 167.097656 153.574219 167.121094 L 152.835938 167.636719 Z M 154.082031 173.78125 C 153.371094 173.78125 152.679688 173.605469 152.089844 173.265625 C 151.933594 173.179688 151.835938 173.011719 151.835938 172.832031 L 151.835938 167.378906 C 151.835938 167.21875 151.914062 167.066406 152.046875 166.972656 L 153.085938 166.242188 C 153.140625 166.203125 153.203125 166.175781 153.265625 166.164062 C 153.480469 166.113281 153.699219 166.089844 153.914062 166.089844 C 153.921875 166.082031 153.996094 166.082031 154.082031 166.082031 C 156.28125 166.082031 158.070312 167.808594 158.070312 169.9375 C 158.070312 170.035156 158.070312 170.148438 158.054688 170.246094 C 158.023438 170.667969 157.917969 171.085938 157.746094 171.464844 C 157.367188 172.304688 156.691406 172.992188 155.835938 173.394531 C 155.417969 173.59375 154.964844 173.714844 154.492188 173.761719 C 154.351562 173.773438 154.21875 173.78125 154.082031 173.78125 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 153.328125 169.792969 C 153.558594 170.113281 153.835938 170.375 154.152344 170.574219 C 154.175781 170.589844 154.207031 170.617188 154.230469 170.636719 C 154.644531 170.898438 155.21875 171.066406 155.820312 171.066406 C 155.886719 171.066406 155.945312 171.066406 155.980469 171.058594 C 156.425781 171.027344 156.765625 170.949219 157.082031 170.800781 C 157.644531 170.550781 158.117188 170.136719 158.40625 169.636719 C 158.671875 169.203125 158.808594 168.714844 158.808594 168.21875 C 158.808594 166.710938 157.613281 165.488281 156.058594 165.367188 L 152.910156 167.585938 C 152.882812 167.703125 152.863281 167.820312 152.851562 167.941406 C 152.84375 168.035156 152.835938 168.128906 152.835938 168.21875 C 152.835938 168.765625 153 169.300781 153.308594 169.773438 C 153.316406 169.777344 153.320312 169.785156 153.328125 169.792969 Z M 155.820312 172.0625 C 155.023438 172.0625 154.261719 171.84375 153.621094 171.421875 C 153.203125 171.15625 152.839844 170.816406 152.539062 170.40625 C 152.527344 170.390625 152.515625 170.375 152.503906 170.355469 C 152.066406 169.714844 151.835938 168.976562 151.835938 168.21875 C 151.835938 168.089844 151.847656 167.960938 151.859375 167.84375 C 151.878906 167.609375 151.925781 167.371094 151.996094 167.136719 C 152.03125 167.027344 152.097656 166.933594 152.1875 166.871094 L 155.625 164.453125 C 155.710938 164.390625 155.835938 164.367188 155.925781 164.363281 C 158.101562 164.417969 159.808594 166.113281 159.808594 168.21875 C 159.808594 168.898438 159.621094 169.566406 159.261719 170.148438 C 158.875 170.820312 158.242188 171.375 157.492188 171.710938 C 157.066406 171.910156 156.597656 172.019531 156.113281 172.042969 C 156.058594 172.0625 155.925781 172.0625 155.820312 172.0625 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 157.378906 170.695312 C 156.742188 170.695312 156.132812 170.550781 155.558594 170.261719 C 154.953125 169.964844 154.433594 169.523438 154.0625 168.980469 C 153.941406 168.8125 153.835938 168.632812 153.753906 168.449219 C 153.519531 167.964844 153.394531 167.421875 153.394531 166.851562 C 153.394531 166.761719 153.394531 166.648438 153.414062 166.535156 C 153.417969 166.402344 153.441406 166.273438 153.460938 166.152344 C 153.484375 166.023438 153.558594 165.90625 153.664062 165.832031 L 155.625 164.453125 C 155.851562 164.292969 156.160156 164.347656 156.320312 164.574219 C 156.480469 164.800781 156.425781 165.113281 156.199219 165.269531 L 154.414062 166.527344 C 154.414062 166.546875 154.414062 166.566406 154.414062 166.589844 C 154.414062 166.628906 154.40625 166.671875 154.398438 166.707031 C 154.394531 166.730469 154.394531 166.804688 154.394531 166.851562 C 154.394531 167.265625 154.484375 167.664062 154.660156 168.027344 C 154.722656 168.164062 154.792969 168.285156 154.878906 168.40625 C 155.160156 168.816406 155.546875 169.144531 156 169.367188 C 156.449219 169.59375 156.925781 169.695312 157.421875 169.695312 C 157.441406 169.695312 157.460938 169.695312 157.480469 169.695312 C 157.933594 169.667969 158.300781 169.585938 158.628906 169.433594 C 159.6875 168.964844 160.367188 167.953125 160.367188 166.851562 C 160.367188 166.324219 160.21875 165.808594 159.933594 165.351562 C 159.914062 165.335938 159.898438 165.3125 159.882812 165.292969 C 159.445312 164.644531 158.75 164.195312 157.972656 164.054688 C 157.699219 164.003906 157.519531 163.746094 157.566406 163.472656 C 157.617188 163.203125 157.878906 163.027344 158.148438 163.070312 C 159.160156 163.253906 160.070312 163.832031 160.660156 164.65625 C 160.683594 164.679688 160.707031 164.707031 160.722656 164.734375 C 161.144531 165.375 161.367188 166.101562 161.367188 166.851562 C 161.367188 168.347656 160.453125 169.71875 159.039062 170.34375 C 158.601562 170.546875 158.109375 170.660156 157.582031 170.683594 C 157.550781 170.695312 157.464844 170.695312 157.378906 170.695312 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 152.835938 168.386719 L 152.835938 174.074219 C 153.234375 174.050781 153.617188 173.953125 153.957031 173.792969 C 154.480469 173.539062 154.910156 173.15625 155.195312 172.683594 C 155.429688 172.308594 155.5625 171.914062 155.59375 171.503906 C 155.601562 171.410156 155.613281 171.316406 155.613281 171.234375 C 155.613281 170.820312 155.519531 170.414062 155.332031 170.035156 C 155.054688 169.464844 154.578125 168.988281 153.988281 168.695312 C 153.628906 168.515625 153.242188 168.410156 152.835938 168.386719 M 152.625 175.082031 C 152.492188 175.082031 152.375 175.078125 152.238281 175.054688 C 152.003906 175.007812 151.835938 174.800781 151.835938 174.5625 L 151.835938 167.898438 C 151.835938 167.765625 151.886719 167.640625 151.980469 167.546875 C 152.066406 167.460938 152.175781 167.414062 152.292969 167.402344 C 152.417969 167.378906 152.53125 167.378906 152.625 167.378906 C 153.269531 167.378906 153.878906 167.523438 154.4375 167.800781 C 155.222656 168.195312 155.859375 168.832031 156.230469 169.597656 C 156.484375 170.113281 156.609375 170.664062 156.609375 171.234375 C 156.609375 171.351562 156.601562 171.480469 156.585938 171.597656 C 156.542969 172.152344 156.363281 172.695312 156.046875 173.207031 C 155.660156 173.839844 155.089844 174.355469 154.390625 174.691406 C 153.855469 174.945312 153.246094 175.082031 152.625 175.082031 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 152.835938 170.628906 L 152.835938 175.109375 C 153.214844 174.824219 153.519531 174.457031 153.722656 174.027344 C 153.835938 173.78125 153.914062 173.507812 153.945312 173.207031 C 153.964844 173.085938 153.972656 172.980469 153.972656 172.875 C 153.972656 172.324219 153.8125 171.785156 153.503906 171.316406 C 153.492188 171.308594 153.484375 171.296875 153.480469 171.289062 C 153.292969 171.03125 153.078125 170.808594 152.835938 170.628906 M 152.335938 176.460938 C 152.238281 176.460938 152.140625 176.429688 152.054688 176.375 C 151.917969 176.28125 151.835938 176.125 151.835938 175.960938 L 151.835938 169.777344 C 151.835938 169.613281 151.917969 169.457031 152.050781 169.363281 C 152.1875 169.273438 152.359375 169.25 152.511719 169.3125 C 152.753906 169.402344 152.976562 169.519531 153.191406 169.660156 C 153.203125 169.667969 153.214844 169.675781 153.222656 169.683594 C 153.625 169.941406 153.976562 170.277344 154.269531 170.675781 C 154.28125 170.691406 154.296875 170.710938 154.308594 170.726562 C 154.742188 171.367188 154.972656 172.109375 154.972656 172.875 C 154.972656 173.027344 154.960938 173.183594 154.9375 173.335938 C 154.894531 173.726562 154.785156 174.109375 154.625 174.453125 C 154.203125 175.347656 153.457031 176.042969 152.523438 176.421875 C 152.464844 176.449219 152.398438 176.460938 152.335938 176.460938 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 152.335938 172.273438 C 152.234375 172.273438 152.136719 172.246094 152.050781 172.183594 C 151.824219 172.027344 151.769531 171.714844 151.925781 171.488281 L 188.417969 119.132812 C 188.578125 118.902344 188.890625 118.851562 189.113281 119.007812 C 189.339844 119.164062 189.398438 119.476562 189.238281 119.703125 L 152.746094 172.0625 C 152.648438 172.199219 152.492188 172.273438 152.335938 172.273438 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 160.65625 166.21875 C 160.558594 166.21875 160.460938 166.191406 160.375 166.132812 C 160.148438 165.976562 160.089844 165.664062 160.246094 165.4375 L 199.214844 108.476562 C 199.371094 108.25 199.683594 108.191406 199.910156 108.347656 C 200.136719 108.503906 200.195312 108.8125 200.039062 109.039062 L 161.070312 166.003906 C 160.972656 166.144531 160.816406 166.21875 160.65625 166.21875 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 152.335938 167.878906 C 152.164062 167.878906 151.996094 167.789062 151.90625 167.632812 C 151.765625 167.394531 151.84375 167.089844 152.082031 166.949219 C 152.105469 166.925781 152.171875 166.882812 152.199219 166.863281 C 153.253906 166.15625 154.371094 165.371094 155.617188 164.457031 C 155.769531 164.359375 155.898438 164.265625 156.015625 164.175781 C 160.769531 160.710938 165.148438 157.042969 169.050781 153.265625 C 169.25 153.074219 169.566406 153.078125 169.757812 153.277344 C 169.949219 153.472656 169.945312 153.789062 169.746094 153.980469 C 165.8125 157.792969 161.394531 161.492188 156.617188 164.976562 C 156.484375 165.078125 156.332031 165.183594 156.183594 165.28125 C 154.949219 166.183594 153.820312 166.980469 152.753906 167.695312 C 152.742188 167.71875 152.648438 167.773438 152.589844 167.808594 C 152.507812 167.855469 152.421875 167.878906 152.335938 167.878906 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 133.378906 154.457031 C 132.59375 154.457031 131.761719 154.757812 131.039062 155.308594 C 130.4375 155.765625 129.984375 156.34375 129.730469 156.988281 C 129.542969 157.445312 129.472656 157.90625 129.527344 158.324219 C 129.5625 158.6875 129.6875 159.015625 129.898438 159.292969 C 130.21875 159.714844 130.703125 159.980469 131.300781 160.0625 C 132.183594 160.179688 133.207031 159.871094 134.042969 159.234375 C 134.96875 158.527344 135.554688 157.488281 135.574219 156.53125 C 135.582031 156.085938 135.476562 155.699219 135.257812 155.378906 C 135.222656 155.3125 135.203125 155.285156 135.183594 155.257812 C 134.863281 154.835938 134.375 154.566406 133.777344 154.484375 C 133.644531 154.46875 133.511719 154.457031 133.378906 154.457031 M 131.695312 160.589844 C 131.539062 160.589844 131.386719 160.578125 131.234375 160.558594 C 130.503906 160.457031 129.902344 160.125 129.5 159.59375 C 129.234375 159.238281 129.074219 158.832031 129.03125 158.378906 C 128.96875 157.886719 129.050781 157.339844 129.269531 156.800781 C 129.554688 156.078125 130.0625 155.421875 130.734375 154.910156 C 131.691406 154.1875 132.820312 153.847656 133.84375 153.988281 C 134.578125 154.089844 135.179688 154.425781 135.582031 154.957031 C 135.617188 155.003906 135.664062 155.066406 135.695312 155.148438 C 135.941406 155.5 136.082031 155.996094 136.070312 156.542969 C 136.050781 157.664062 135.40625 158.820312 134.347656 159.632812 C 133.535156 160.25 132.59375 160.589844 131.695312 160.589844 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 131.171875 159.914062 C 130.484375 159.914062 129.835938 159.710938 129.328125 159.296875 C 129.222656 159.210938 129.207031 159.050781 129.296875 158.945312 C 129.382812 158.839844 129.539062 158.824219 129.648438 158.910156 C 130.582031 159.679688 132.140625 159.5625 133.351562 158.636719 C 134.015625 158.132812 134.488281 157.457031 134.683594 156.722656 C 134.8125 156.273438 134.820312 155.847656 134.703125 155.445312 C 134.636719 155.179688 134.53125 154.957031 134.375 154.75 C 134.316406 154.671875 134.273438 154.621094 134.222656 154.578125 C 134.210938 154.570312 134.203125 154.5625 134.195312 154.550781 C 134.148438 154.507812 134.125 154.445312 134.125 154.378906 C 134.125 154.171875 134.414062 154.066406 134.558594 154.207031 C 134.628906 154.273438 134.699219 154.351562 134.773438 154.449219 C 134.96875 154.707031 135.105469 155 135.1875 155.316406 C 135.324219 155.804688 135.320312 156.324219 135.164062 156.855469 C 134.941406 157.691406 134.40625 158.464844 133.65625 159.03125 C 132.894531 159.617188 132.003906 159.914062 131.171875 159.914062 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 134.921875 156.785156 L 129.277344 158.355469 C 129.21875 157.886719 129.300781 157.386719 129.5 156.894531 L 134.941406 155.378906 C 135.074219 155.828125 135.0625 156.308594 134.921875 156.785156 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 123.285156 156.851562 C 122.492188 156.851562 121.65625 157.15625 120.9375 157.703125 C 120.335938 158.15625 119.882812 158.738281 119.628906 159.382812 C 119.441406 159.839844 119.371094 160.300781 119.425781 160.71875 C 119.460938 161.082031 119.585938 161.40625 119.796875 161.691406 C 120.117188 162.109375 120.601562 162.375 121.203125 162.457031 C 122.09375 162.578125 123.109375 162.269531 123.941406 161.628906 C 124.863281 160.921875 125.453125 159.886719 125.472656 158.925781 C 125.480469 158.484375 125.375 158.09375 125.15625 157.773438 C 125.121094 157.707031 125.101562 157.683594 125.082031 157.652344 C 124.691406 157.136719 124.050781 156.851562 123.285156 156.851562 M 121.59375 162.984375 C 121.4375 162.984375 121.285156 162.972656 121.132812 162.953125 C 120.398438 162.851562 119.800781 162.519531 119.398438 161.988281 C 119.132812 161.632812 118.972656 161.222656 118.929688 160.773438 C 118.867188 160.28125 118.949219 159.734375 119.167969 159.195312 C 119.453125 158.472656 119.960938 157.816406 120.636719 157.304688 C 121.441406 156.691406 122.382812 156.355469 123.285156 156.355469 C 124.210938 156.355469 124.992188 156.707031 125.480469 157.351562 C 125.519531 157.40625 125.5625 157.460938 125.59375 157.539062 C 125.84375 157.894531 125.984375 158.394531 125.96875 158.9375 C 125.949219 160.058594 125.304688 161.214844 124.246094 162.027344 C 123.433594 162.648438 122.492188 162.984375 121.59375 162.984375 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 121.070312 162.3125 C 120.382812 162.3125 119.734375 162.105469 119.230469 161.691406 C 119.121094 161.605469 119.105469 161.449219 119.195312 161.339844 C 119.28125 161.234375 119.4375 161.21875 119.546875 161.304688 C 120.480469 162.074219 122.039062 161.960938 123.25 161.03125 C 123.914062 160.53125 124.382812 159.851562 124.582031 159.117188 C 124.710938 158.667969 124.71875 158.242188 124.601562 157.839844 C 124.535156 157.578125 124.429688 157.351562 124.273438 157.144531 C 124.214844 157.066406 124.167969 157.015625 124.121094 156.972656 C 124.109375 156.964844 124.101562 156.957031 124.09375 156.945312 C 124.046875 156.902344 124.023438 156.839844 124.023438 156.773438 C 124.023438 156.566406 124.3125 156.457031 124.457031 156.605469 C 124.546875 156.683594 124.617188 156.773438 124.671875 156.84375 C 124.867188 157.101562 125.003906 157.394531 125.082031 157.710938 C 125.222656 158.195312 125.21875 158.714844 125.0625 159.25 C 124.835938 160.085938 124.300781 160.863281 123.554688 161.425781 C 122.792969 162.011719 121.902344 162.3125 121.070312 162.3125 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 124.820312 159.179688 L 119.175781 160.75 C 119.117188 160.28125 119.199219 159.78125 119.398438 159.292969 L 124.839844 157.773438 C 124.972656 158.222656 124.960938 158.703125 124.820312 159.179688 "/>\n<path fill-rule="nonzero" fill="currentColor" d="M 118.824219 165.519531 C 118.601562 165.519531 118.398438 165.367188 118.34375 165.140625 C 118.273438 164.875 118.4375 164.601562 118.703125 164.535156 L 136.886719 159.945312 L 136.886719 150.894531 C 136.886719 150.617188 137.113281 150.394531 137.386719 150.394531 C 137.664062 150.394531 137.886719 150.617188 137.886719 150.894531 L 137.886719 160.335938 C 137.886719 160.566406 137.730469 160.761719 137.507812 160.820312 L 118.949219 165.503906 C 118.90625 165.515625 118.867188 165.519531 118.824219 165.519531 "/>\n</svg>\n'};function Ge(e){return e?Ue[e]??null:null}class qe extends Oe{constructor(){super(...arguments),this._config={}}static getConfigElement(){return document.createElement("smarthomeshop-water-card-editor")}static getStubConfig(){return{show_header:!0,show_status:!0,show_water_current:!0,show_water_totals:!0,show_graph:!0,show_meter_reading:!0,show_leak_detection:!0}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_header:!0,show_status:!0,show_water_current:!0,show_water_totals:!0,show_today:!0,show_week:!0,show_month:!0,show_year:!0,show_graph:!0,show_meter_reading:!0,show_leak_detection:!0,_entitiesResolved:!t&&e._entitiesResolved,...e}}_handleClick(e){e&&je(this,e)}render(){if(!this.hass)return Y;const e=this._getFlowRate(),t=this._getTodayUsage(),i=this._getWeekUsage(),a=this._getMonthUsage(),o=this._getYearUsage(),r=this._hasLeak(),n=this._config._productName||"SmartHomeShop";return K`
      <ha-card>
        <div class="card-content">
          ${!1!==this._config.show_header?this._renderHeader(n,e,r):Y}
          ${!1!==this._config.show_water_current?this._renderFlowDisplay(e):Y}
          ${!1!==this._config.show_water_totals?this._renderStats(t,i,a,o):Y}
          ${this._config.show_graph?this._renderGraph():Y}
          ${this._renderMeterSection()}
          ${!1!==this._config.show_leak_detection?this._renderLeakBar(r):Y}
        </div>
      </ha-card>
    `}_renderHeader(e,t,i){let a,o,r;return i?(a="mdi:alert",o="Leak detected",r="status-alert"):t>0?(a="mdi:water",o="Water flowing",r="status-active"):(a="mdi:check-circle",o="No usage",r="status-ok"),K`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${t>0?"flowing":""}">
            ${Ge("watermeterkit")?xe(Ge("watermeterkit")):K`<ha-icon icon="mdi:water"></ha-icon>`}
          </div>
          <div>
            <h2 class="header-title">${e}</h2>
            <div class="header-subtitle">Water Monitoring</div>
          </div>
        </div>
        ${!1!==this._config.show_status?K`
          <div class="status-badge ${r}">
            <ha-icon icon="${a}"></ha-icon>
            <span>${o}</span>
          </div>
        `:Y}
      </div>
    `}_renderFlowDisplay(e){return K`
      <div
        class="value-display ${e>0?"active":""}"
        @click=${()=>this._handleClick(this._config.flow_entity)}
      >
        <span class="value-big">${Ie(e,1)}</span>
        <span class="value-unit">L/min</span>
        <div class="value-label">Current water usage</div>
      </div>
    `}_renderStats(e,t,i,a){const o=!1!==this._config.show_today,r=!1!==this._config.show_week,n=!1!==this._config.show_month,s=!1!==this._config.show_year;return o||r||n||s?K`
      <div class="stats-grid">
        ${o?K`
          <div class="stat-item" @click=${()=>this._handleClick(this._config.today_entity)}>
            <div class="stat-value">${Ie(e,0)}<span class="stat-unit">L</span></div>
            <div class="stat-label">Today</div>
          </div>
        `:Y}
        ${r?K`
          <div class="stat-item" @click=${()=>this._handleClick(this._config.week_entity)}>
            <div class="stat-value">${Ie(t,0)}<span class="stat-unit">L</span></div>
            <div class="stat-label">Week</div>
          </div>
        `:Y}
        ${n?K`
          <div class="stat-item" @click=${()=>this._handleClick(this._config.month_entity)}>
            <div class="stat-value">
              ${Ie(i/1e3,1)}<span class="stat-unit">m³</span>
            </div>
            <div class="stat-label">Month</div>
          </div>
        `:Y}
        ${s?K`
          <div class="stat-item" @click=${()=>this._handleClick(this._config.year_entity)}>
            <div class="stat-value">${Ie(a,1)}<span class="stat-unit">m³</span></div>
            <div class="stat-label">Year</div>
          </div>
        `:Y}
      </div>
    `:Y}_renderGraph(){const e=Fe(this._historyData),t=this._getMaxHistoryValue();return K`
      <div class="graph-section" @click=${()=>this._handleClick(this._config.flow_entity)}>
        <div class="graph-header">
          <span class="graph-title">Usage last 24 hours</span>
          <span class="graph-max">
            ${this._historyData?`max: ${Ie(t,1)} L/min`:""}
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
    `}_renderLeakBar(e){return K`
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
    `}}qe.styles=[Ve],a([fe()],qe.prototype,"_config",void 0);const Ke="smarthomeshop_debug";let Be=!1;try{Be="1"===localStorage.getItem(Ke)}catch{Be=!1}const Ze=window;function Ye(...e){Be&&console.log("[SmartHomeShop]",...e)}Ze.__shsDebugSetters=Ze.__shsDebugSetters||[],Ze.__shsDebugSetters.push(e=>{Be=e}),Ze.shsDebug||(Ze.shsDebug={enable(){try{localStorage.setItem(Ke,"1")}catch{}(Ze.__shsDebugSetters||[]).forEach(e=>e(!0)),console.info("[SmartHomeShop] Debug logging enabled")},disable(){try{localStorage.removeItem(Ke)}catch{}(Ze.__shsDebugSetters||[]).forEach(e=>e(!1)),console.info("[SmartHomeShop] Debug logging disabled")},get enabled(){try{return"1"===localStorage.getItem(Ke)}catch{return!1}}});class Xe extends Oe{constructor(){super(...arguments),this._energyTodayFromStats=null,this._lastStatsUpdate=0,this._config={},this._leakPanelExpanded=!1}static getConfigElement(){return document.createElement("smarthomeshop-waterp1-card-editor")}static getStubConfig(){return{show_header:!0,show_status:!0,show_water:!0,show_water_current:!0,show_water_totals:!0,show_graph:!0,show_meter_reading:!0,show_leak_detection:!0,show_energy:!0,show_energy_current:!0,show_energy_today:!0,show_energy_returned:!0,show_gas_today:!0,has_water_leak_sensor:!1}}setConfig(e){const t=this._config.device_id!==e.device_id;this._config={show_header:!0,show_status:!0,show_graph:!0,show_water:!0,show_water_current:!0,show_water_totals:!0,show_today:!0,show_week:!0,show_month:!0,show_year:!0,show_meter_reading:!0,show_leak_detection:!0,show_energy:!0,show_energy_current:!0,show_energy_today:!0,show_energy_returned:!0,show_gas_today:!0,has_water_leak_sensor:!1,_entitiesResolved:!t&&e._entitiesResolved,...e}}_autoDetectEntities(){super._autoDetectEntities(),this.hass&&(this._config._productName="WaterP1MeterKit",this._config.power_entity||(this._config.power_entity=this._findEntity(["power_consumed","currently_delivered","power_delivered","active_power","vermogen_actueel","stroom_afgenomen"],"sensor",!0)||this._findEntity(["power consumed","vermogen","current power"])),this._config.power_phase_l1_entity||(this._config.power_phase_l1_entity=this._findEntity(["power_consumed_phase_l1","power_phase_l1","phase_1_power","l1_power"],"sensor",!0)),this._config.power_phase_l2_entity||(this._config.power_phase_l2_entity=this._findEntity(["power_consumed_phase_l2","power_phase_l2","phase_2_power","l2_power"],"sensor",!0)),this._config.power_phase_l3_entity||(this._config.power_phase_l3_entity=this._findEntity(["power_consumed_phase_l3","power_phase_l3","phase_3_power","l3_power"],"sensor",!0)),this._config.energy_today_entity||(this._config.energy_today_entity=this._findEntity(["electricity_today","electricity_daily","energy_today"],"sensor",!0)||this._findEntity(["energy_consumed_tariff"],"sensor",!0)||this._findEntity(["energy consumed"])),this._config.gas_entity||(this._config.gas_entity=this._findEntity(["gas_consumed","gas_delivered"],"sensor",!0)||this._findEntity(["gas consumed"])),this._config.leak_score_entity||(this._config.leak_score_entity=this._findEntity(["leak_score","lek_score"],"sensor",!0)),this._config.continuous_flow_entity||(this._config.continuous_flow_entity=this._findEntity(["continuous_flow","continue_flow"],"binary_sensor",!0)),this._config.night_usage_entity||(this._config.night_usage_entity=this._findEntity(["night_usage","nacht_gebruik"],"binary_sensor",!0)),this._config.micro_leak_entity||(this._config.micro_leak_entity=this._findEntity(["micro_leak","micro_lek"],"binary_sensor",!0)),this._config.has_water_leak_sensor&&!this._config.water_leak_sensor_entity&&(this._config.water_leak_sensor_entity=this._findEntity(["water_leak_sensor","water_leak"],"binary_sensor",!0)||this._findEntity(["water leak sensor","leksensor"],"binary_sensor")))}_handleClick(e){e&&je(this,e)}_getTotalPower(){const e=He(this.hass,this._config.power_entity),t=e?.attributes?.unit_of_measurement||"W";let i=Re(this.hass,this._config.power_entity);if("kw"===t.toLowerCase()&&(i*=1e3),i>0)return i;const a=e=>{const t=He(this.hass,e),i=t?.attributes?.unit_of_measurement||"W";let a=Re(this.hass,e);return"kw"===i.toLowerCase()&&(a*=1e3),a},o=a(this._config.power_phase_l1_entity),r=a(this._config.power_phase_l2_entity),n=a(this._config.power_phase_l3_entity);return o>0||r>0||n>0?o+r+n:i}_isHardwareLeakSensorWet(){if(!this._config.has_water_leak_sensor||!this._config.water_leak_sensor_entity||!this.hass)return!1;const e=He(this.hass,this._config.water_leak_sensor_entity);return"on"===e?.state}_getLeakScore(){return Re(this.hass,this._config.leak_score_entity)}_isContinuousFlow(){return"on"===He(this.hass,this._config.continuous_flow_entity)?.state}_isNightUsage(){return"on"===He(this.hass,this._config.night_usage_entity)?.state}_isMicroLeak(){return"on"===He(this.hass,this._config.micro_leak_entity)?.state}async _fetchEnergyStatistics(){if(!this.hass)return;const e=Date.now();if(e-this._lastStatsUpdate<6e4&&null!==this._energyTodayFromStats)return;const t=this._findUtilityMeterEntity("energy_daily_t1"),i=this._findUtilityMeterEntity("energy_daily_t2");if(t||i){const a=Re(this.hass,t),o=Re(this.hass,i);return this._energyTodayFromStats=a+o,this._lastStatsUpdate=e,void Ye("WaterP1 Card: Energy today from Utility Meters (CC):",a,"+",o,"=",this._energyTodayFromStats,"kWh")}const a=this._findEntity(["energy_consumed_tariff_1"],"sensor",!0),o=this._findEntity(["energy_consumed_tariff_2"],"sensor",!0);if(!a&&!o)return void Ye("WaterP1 Card: No tariff entities found for statistics");const r=[a,o].filter(Boolean);try{const t=new Date;t.setHours(0,0,0,0);const i=t.toISOString(),a=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:i,statistic_ids:r,period:"day",types:["change"]});let o=0;for(const e of r){const t=a[e];if(t&&t.length>0)for(const e of t)void 0!==e.change&&(o+=e.change)}this._energyTodayFromStats=o,this._lastStatsUpdate=e,Ye("WaterP1 Card: Energy today from Statistics API:",o,"kWh")}catch(e){console.warn("WaterP1 Card: Failed to fetch energy statistics:",e)}}_findUtilityMeterEntity(e){if(!this.hass)return;const t=this._config.device_id;if(!t)return;const i=t.match(/([a-f0-9]{6})/i),a=i?i[1].toLowerCase():"";if(!a)return;const o=`sensor.waterp1_${a}_${e}`;if(this.hass.states[o])return o;for(const t of Object.keys(this.hass.states))if(t.includes(a)&&t.endsWith(e))return t}_getEnergyToday(){if(null!==this._energyTodayFromStats&&this._energyTodayFromStats>0)return this._energyTodayFromStats;const e=Re(this.hass,this._config.energy_today_entity);return e<.5&&null===this._energyTodayFromStats&&this._fetchEnergyStatistics(),this._energyTodayFromStats??e}_getGasToday(){const e=this._findUtilityMeterEntity("gas_daily");return e?Re(this.hass,e):0}firstUpdated(e){super.firstUpdated(e),this._fetchEnergyStatistics()}updated(e){super.updated(e),e.has("hass")&&this._fetchEnergyStatistics()}_getOfflineInfo(){const e=this._config.device_id;if(!this.hass||!e)return{offline:!1,lastSeen:null};const t=this.hass.entities||{};let i=!1,a=null,o=null;for(const[r,n]of Object.entries(t)){if(n.device_id!==e)continue;if("esphome"!==n.platform)continue;if(!r.startsWith("sensor.")&&!r.startsWith("binary_sensor."))continue;const t=this.hass.states[r];if(!t)continue;if("connectivity"===t.attributes?.device_class){if("on"===t.state)return{offline:!1,lastSeen:null};"off"===t.state&&(o=t.last_changed??null);continue}if(i=!0,"unavailable"!==t.state)return{offline:!1,lastSeen:null};const s=t.last_changed;s&&(!a||s>a)&&(a=s)}return o?{offline:!0,lastSeen:o}:{offline:i,lastSeen:a}}render(){if(!this.hass)return Y;const e=this._getOfflineInfo();if(e.offline)return K`
        <ha-card>
          <div class="card-content">
            <div class="header">
              <div class="header-left">
                <div class="header-icon">${Ge("waterp1meterkit")?xe(Ge("waterp1meterkit")):K`<ha-icon icon="mdi:water-flash"></ha-icon>`}</div>
                <div><h2 class="header-title">WaterP1MeterKit</h2><div class="header-subtitle">Water + Energy</div></div>
              </div>
              <div class="status-badge status-alert"><ha-icon icon="mdi:lan-disconnect"></ha-icon><span>Offline</span></div>
            </div>
            <div class="offline-state">
              <ha-icon icon="mdi:lan-disconnect"></ha-icon>
              <div class="offline-title">Device offline</div>
              <div class="offline-sub">
                ${e.lastSeen?`Last seen ${We(e.lastSeen)}`:"Waiting for the device to reconnect"}
              </div>
              <div class="offline-hint">Check the power supply and Wi-Fi connection.</div>
            </div>
          </div>
        </ha-card>
      `;const t=this._getFlowRate(),i=this._getTodayUsage(),a=this._getWeekUsage(),o=this._getMonthUsage(),r=this._getYearUsage(),n=this._hasLeak(),s=this._getLeakScore(),l=this._isContinuousFlow(),c=this._isNightUsage(),d=this._isMicroLeak(),h=!0===this._config.has_water_leak_sensor,u=this._isHardwareLeakSensorWet(),p=this._getTotalPower(),m=this._getEnergyToday(),g=this._getGasToday(),v=!1!==this._config.show_water&&this._hasVisibleWaterContent(),f=!1!==this._config.show_energy&&this._hasVisibleEnergyContent();return K`
      <ha-card>
        <div class="card-content">
          ${u?this._renderHardwareLeakAlert():Y}
          ${!1!==this._config.show_header?this._renderHeader(t,p,n,u):Y}
          ${v?K`
            <div class="water-section">
              ${this._renderWaterSection(t,i,a,o,r)}
              ${!1!==this._config.show_leak_detection?this._renderLeakDetectionPanel(n,s,l,c,d,h,u):Y}
            </div>
          `:Y}
          ${v&&f?K`<div class="section-divider"></div>`:Y}
          ${f?K`<div class="energy-section">${this._renderEnergySection(p,m,g)}</div>`:Y}
        </div>
      </ha-card>
    `}_renderHardwareLeakAlert(){return K`
      <div class="hardware-leak-alert" @click=${()=>this._handleClick(this._config.water_leak_sensor_entity)}>
        <div class="alert-icon"><ha-icon icon="mdi:water-alert"></ha-icon></div>
        <div class="alert-content">
          <div class="alert-title">⚠️ Water Leak Detected!</div>
          <div class="alert-message">The leak sensor detected water. Check immediately!</div>
        </div>
        <div class="alert-badge">WET</div>
      </div>
    `}_renderHeader(e,t,i,a){let o="mdi:check-circle",r="All normal",n="status-ok";return a?(o="mdi:water-alert",r="WATER LEAK!",n="status-alert"):i?(o="mdi:alert",r="Leak detected",n="status-alert"):(e>0||t>100)&&(o=e>0?"mdi:water":"mdi:flash",r=e>0?"Water flowing":"Energy active",n="status-active"),K`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${e>0||t>100?"flowing":""}">${Ge("waterp1meterkit")?xe(Ge("waterp1meterkit")):K`<ha-icon icon="mdi:water-flash"></ha-icon>`}</div>
          <div><h2 class="header-title">WaterP1MeterKit</h2><div class="header-subtitle">Water + Energy</div></div>
        </div>
        ${!1!==this._config.show_status?K`
          <div class="status-badge ${n}"><ha-icon icon="${o}"></ha-icon><span>${r}</span></div>
        `:Y}
      </div>
    `}_hasVisibleWaterContent(){const e=!1!==this._config.show_water_totals&&[this._config.show_today,this._config.show_week,this._config.show_month,this._config.show_year].some(e=>!1!==e);return!1!==this._config.show_water_current||e||!1!==this._config.show_graph||!1!==this._config.show_meter_reading||!1!==this._config.show_leak_detection}_hasVisibleEnergyContent(){return!1!==this._config.show_energy_current||!1!==this._config.show_energy_today||!1!==this._config.show_energy_returned||!1!==this._config.show_gas_today}_renderWaterSection(e,t,i,a,o){const r=Fe(this._historyData),n=this._getMaxHistoryValue(),s=!1!==this._config.show_today,l=!1!==this._config.show_week,c=!1!==this._config.show_month,d=!1!==this._config.show_year,h=!1!==this._config.show_water_totals&&(s||l||c||d);return K`
      <div class="section-header water"><ha-icon icon="mdi:water"></ha-icon> Water</div>
      ${!1!==this._config.show_water_current?K`
        <div class="value-display ${e>0?"active":""}" @click=${()=>this._handleClick(this._config.flow_entity)}>
          <span class="value-big">${Ie(e,1)}</span><span class="value-unit">L/min</span>
          <div class="value-label">Current water usage</div>
        </div>
      `:Y}
      ${h?K`
        <div class="stats-grid">
          ${s?K`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.today_entity)}><div class="stat-value">${Ie(t,0)}<span class="stat-unit">L</span></div><div class="stat-label">Today</div></div>
          `:Y}
          ${l?K`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.week_entity)}><div class="stat-value">${Ie(i,0)}<span class="stat-unit">L</span></div><div class="stat-label">Week</div></div>
          `:Y}
          ${c?K`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.month_entity)}><div class="stat-value">${Ie(a/1e3,1)}<span class="stat-unit">m³</span></div><div class="stat-label">Month</div></div>
          `:Y}
          ${d?K`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.year_entity)}><div class="stat-value">${Ie(o,1)}<span class="stat-unit">m³</span></div><div class="stat-label">Year</div></div>
          `:Y}
        </div>
      `:Y}
      ${this._config.show_graph?K`
        <div class="graph-section" @click=${()=>this._handleClick(this._config.flow_entity)}>
          <div class="graph-header"><span class="graph-title">Water last 24 hours</span><span class="graph-max">${this._historyData?`max: ${Ie(n,1)} L/min`:""}</span></div>
          <svg class="sparkline" viewBox="0 0 300 55" preserveAspectRatio="none">
            <defs><linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="var(--info-color)" stop-opacity="0.3"/><stop offset="100%" stop-color="var(--info-color)" stop-opacity="0.02"/></linearGradient></defs>
            <path class="sparkline-fill" d="${r} L 300 55 L 0 55 Z" style="fill: url(#waterGradient);"/>
            <path class="sparkline-line" d="${r}" style="stroke: var(--info-color);"/>
          </svg>
          <div class="graph-labels"><span>-24h</span><span>-18h</span><span>-12h</span><span>-6h</span><span>Now</span></div>
        </div>
      `:Y}
      ${this._renderMeterSection()}
    `}_renderLeakDetectionPanel(e,t,i,a,o,r,n){const s=[i,a,o,n].filter(Boolean).length;let l="ok",c="mdi:shield-check",d="No anomalies";return n?(l="alert",c="mdi:water-alert",d="Water leak detected!"):e||t>=50?(l="alert",c="mdi:alert-circle",d=`${s} issue${1!==s?"s":""} detected`):(t>0||s>0)&&(l="warning",c="mdi:alert",d="Monitoring activity"),K`
      <div class="leak-panel">
        <div class="leak-panel-header" @click=${()=>this._leakPanelExpanded=!this._leakPanelExpanded}>
          <div class="header-icon ${l}"><ha-icon icon="${c}"></ha-icon></div>
          <div class="header-content"><div class="header-title">Leak Detection</div><div class="header-subtitle">${d}</div></div>
          <ha-icon
            class="expand-icon"
            icon=${this._leakPanelExpanded?"mdi:chevron-up":"mdi:chevron-down"}
          ></ha-icon>
        </div>
        ${this._leakPanelExpanded?K`
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
            ${r?K`
              <div class="leak-detail-row hardware ${n?"wet":""}" @click=${()=>this._handleClick(this._config.water_leak_sensor_entity)}>
                <div class="detail-icon"><ha-icon icon="mdi:water-pump"></ha-icon></div>
                <div class="detail-info"><div class="detail-name">Hardware leak sensor</div><div class="detail-desc">Physical water detection (V3)</div></div>
                <div class="detail-status ${n?"active":"ok"}">${n?"WET!":"DRY"}</div>
              </div>
            `:Y}
            ${t>0?K`
              <div class="leak-detail-row" @click=${()=>this._handleClick(this._config.leak_score_entity)}>
                <div class="detail-icon ${t>=50?"active":""}"><ha-icon icon="mdi:gauge"></ha-icon></div>
                <div class="detail-info"><div class="detail-name">Leak score</div><div class="detail-desc">Overall risk assessment</div></div>
                <div class="detail-status ${t>=50?"active":"ok"}">${t}%</div>
              </div>
            `:Y}
          </div>
        `:Y}
      </div>
    `}_renderEnergySection(e,t,i){const a=this._getPowerReturned(),o=this._getEnergyReturnedToday(),r=a>0||o>0,n=!1!==this._config.show_energy_current,s=!1!==this._config.show_energy_today,l=!1!==this._config.show_energy_returned&&r,c=!1!==this._config.show_gas_today,d=s||l||c;return K`
      <div class="section-header energy"><ha-icon icon="mdi:flash"></ha-icon> Energy</div>
      ${n||l?K`
        <div class="dual-power">
          ${n?K`
            <div class="value-display ${e>100?"active":""}" @click=${()=>this._handleClick(this._config.power_entity)}>
              <span class="value-big">${Ie(e,0)}</span><span class="value-unit">W</span>
              <div class="value-label">${r?"Usage":"Current usage"}</div>
            </div>
          `:Y}
          ${l?K`
            <div class="value-display solar ${a>0?"active":""}" @click=${()=>this._handleClick(this._config.power_returned_entity)}>
              <span class="value-big">${Ie(a,0)}</span><span class="value-unit">W</span>
              <div class="value-label">Returned</div>
            </div>
          `:Y}
        </div>
      `:Y}
      ${d?K`
        <div class="stats-grid">
          ${s?K`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.energy_today_entity)}><div class="stat-value">${Ie(t,2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Electricity today</div></div>
          `:Y}
          ${l?K`
            <div class="stat-item solar" @click=${()=>this._handleClick(this._config.energy_returned_entity)}><div class="stat-value">${Ie(o,2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Returned today</div></div>
          `:Y}
          ${c?K`
            <div class="stat-item" @click=${()=>this._handleClick(this._config.gas_entity)}><div class="stat-value">${Ie(i,2)}<span class="stat-unit">m³</span></div><div class="stat-label">Gas today</div></div>
          `:Y}
        </div>
      `:Y}
    `}_getPowerReturned(){return this._config.power_returned_entity||(this._config.power_returned_entity=this._findEntity(["power_returned","power_delivered_to_grid","power_export"],"sensor",!0)),Re(this.hass,this._config.power_returned_entity)}_getEnergyReturnedToday(){const e=this._findUtilityMeterEntity("energy_returned_daily_t1"),t=this._findUtilityMeterEntity("energy_returned_daily_t2");return e||t?Re(this.hass,e)+Re(this.hass,t):(this._config.energy_returned_entity||(this._config.energy_returned_entity=this._findEntity(["energy_returned_tariff_1","energy_returned_tariff_2","energy_returned","energy_delivered","energy_export"],"sensor",!0)),0)}}Xe.styles=[Ve,c`
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

    `],a([fe()],Xe.prototype,"_energyTodayFromStats",void 0),a([fe()],Xe.prototype,"_lastStatsUpdate",void 0),a([fe()],Xe.prototype,"_config",void 0),a([fe()],Xe.prototype,"_leakPanelExpanded",void 0);class Qe extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={}}setConfig(e){this._config={show_header:!0,show_status:!0,show_pipe_visualization:!0,show_flow_cards:!0,show_total_consumption:!0,show_hourly_rate:!0,show_flow1:!0,show_flow2:!0,...e}}getCardSize(){return 5}updated(e){super.updated(e),e.has("hass")&&this.hass&&!this._config.flow1_flow_entity&&this._autoDetectEntities()}_autoDetectEntities(){if(!this.hass)return;const e=Object.keys(this.hass.states),t={};for(const i of e){const e=i.toLowerCase();e.includes("waterflowkit")&&(e.includes("flow1")&&(e.includes("current")&&e.includes("usage")?t.flow1_flow_entity=i:e.includes("total")&&e.includes("consumption")?t.flow1_total_entity=i:e.includes("temperature")&&(t.flow1_temp_entity=i)),e.includes("flow2")&&(e.includes("current")&&e.includes("usage")?t.flow2_flow_entity=i:e.includes("total")&&e.includes("consumption")?t.flow2_total_entity=i:e.includes("temperature")&&(t.flow2_temp_entity=i)))}Object.keys(t).length>0&&(this._config={...this._config,...t},Ye("WaterFlowKit: Auto-detected entities:",t))}_getFlowData(e){const t=1===e?this._config.flow1_flow_entity:this._config.flow2_flow_entity,i=1===e?this._config.flow1_total_entity:this._config.flow2_total_entity,a=1===e?this._config.flow1_temp_entity:this._config.flow2_temp_entity,o=Re(this.hass,t)??0,r=Re(this.hass,i)??0,n=Re(this.hass,a),s=null!==n&&n>-10;return{flow:o,total:r,temp:s?n:null,hasTemp:s,isFlowing:o>.01}}_getTempClass(e){return null===e?"":e<20?"cold":e<40?"warm":"hot"}_getFlowSpeed(e){return e>5?"fast":e<1?"slow":""}render(){if(!this.hass)return Y;const e=ze(this.hass),t=!1!==this._config.show_flow1,i=!1!==this._config.show_flow2,a=!1!==this._config.flow1_show_temp,o=!1!==this._config.flow2_show_temp,r=this._getFlowData(1),n=this._getFlowData(2),s=this._config.flow1_name||e.waterflowkit.pipe1,l=this._config.flow2_name||e.waterflowkit.pipe2,c=(t&&r.isFlowing?1:0)+(i&&n.isFlowing?1:0),d=(t?r.flow:0)+(i?n.flow:0);return K`
      <ha-card>
        <div class="card-content">
          ${!1!==this._config.show_header?K`
            <div class="header">
              <div class="header-left">
                <div class="header-icon ${c>0?"flowing":""}">
                  ${Ge("waterflowkit")?xe(Ge("waterflowkit")):K`<ha-icon icon="mdi:pipe"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${e.waterflowkit.title}</h2>
                  <div class="header-subtitle">${e.waterflowkit.subtitle}</div>
                </div>
              </div>
              ${!1!==this._config.show_status?K`
                <div class="status-badge ${c>0?"flowing":"inactive"}">
                  <ha-icon icon="${c>0?"mdi:water":"mdi:water-off"}"></ha-icon>
                  <span>${c>0?`${Ie(d,2)} L/min`:e.waterflowkit.noFlow}</span>
                </div>
              `:Y}
            </div>
          `:Y}

          ${!1!==this._config.show_pipe_visualization?K`
            <div class="pipe-container">
              ${this._renderPipesSVG(r,n,t,i,a,o)}
            </div>
          `:Y}

          ${!1!==this._config.show_flow_cards&&t?this._renderFlowCard(1,r,s,a):Y}
          ${!1!==this._config.show_flow_cards&&i?this._renderFlowCard(2,n,l,o):Y}
        </div>
      </ha-card>
    `}_renderPipesSVG(e,t,i,a,o,r){const n=ze(this.hass),s=i&&e.isFlowing,l=a&&t.isFlowing,c=i&&a,d=35,h=c?105:35;return B`
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
        ${i?B`
          <!-- Pipe -->
          <path class="pipe" d="M 0 ${d} L 360 ${d}" />
          <path class="pipe-inner" d="M 0 ${d} L 360 ${d}" />

          <!-- Animated water flow -->
          <path class="water-flow flow1 ${s?"active":""} ${this._getFlowSpeed(e.flow)}" d="M 0 ${d} L 360 ${d}" />

          <!-- Water bubbles animation when flowing -->
          ${s?B`
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
          ${this._renderYFSensor(55,d,s,1)}

          <!-- Labels -->
          <text class="pipe-label" x="110" y="${20}">${(this._config.flow1_name||n.waterflowkit.pipe1).toUpperCase()}</text>
          <text class="pipe-value" x="220" y="${40}">${Ie(e.flow,2)}</text>
          <text class="pipe-unit" x="265" y="${40}">L/min</text>
          ${o&&e.hasTemp?B`
            <text class="temp-badge ${this._getTempClass(e.temp)}" x="320" y="${40}">${Ie(e.temp,1)}°C</text>
          `:""}
        `:""}

        <!-- Flow 2 -->
        ${a?B`
          <!-- Pipe -->
          <path class="pipe" d="M 0 ${h} L 360 ${h}" />
          <path class="pipe-inner" d="M 0 ${h} L 360 ${h}" />

          <!-- Animated water flow -->
          <path class="water-flow flow2 ${l?"active":""} ${this._getFlowSpeed(t.flow)}" d="M 0 ${h} L 360 ${h}" />

          <!-- Water bubbles animation when flowing -->
          ${l?B`
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
          <text class="pipe-label" x="110" y="${h-15}">${(this._config.flow2_name||n.waterflowkit.pipe2).toUpperCase()}</text>
          <text class="pipe-value flow2" x="220" y="${h+5}">${Ie(t.flow,2)}</text>
          <text class="pipe-unit" x="265" y="${h+5}">L/min</text>
          ${r&&t.hasTemp?B`
            <text class="temp-badge ${this._getTempClass(t.temp)}" x="320" y="${h+5}">${Ie(t.temp,1)}°C</text>
          `:""}
        `:""}
      </svg>
    `}_renderYFSensor(e,t,i,a){const o=1===a?"#0ea5e9":"#22c55e";return B`
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
        ${i?B`
          <rect x="12" y="-4" width="16" height="10" rx="2" fill="${o}" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1s" repeatCount="indefinite" />
          </rect>
        `:""}
      </g>
    `}_renderFlowCard(e,t,i,a){const o=ze(this.hass),r=1===e?this._config.flow1_flow_entity:this._config.flow2_flow_entity,n=this._getTempClass(t.temp),s=!1!==this._config.show_total_consumption,l=a&&t.hasTemp,c=!1!==this._config.show_hourly_rate,d=s||l||c;return K`
      <div class="flow-card flow${e} ${t.isFlowing?"active":""}" @click=${()=>r&&je(this,r)}>
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
            <span class="flow-value">${Ie(t.flow,2)}</span>
            <span class="flow-unit">L/min</span>
          </div>
        </div>
        ${d?K`
          <div class="flow-card-stats">
            ${s?K`
              <div class="flow-stat">
                <div class="flow-stat-label">${o.waterflowkit.totalConsumption}</div>
                <div class="flow-stat-value">${Ie(1e3*t.total,0)}</div>
                <div class="flow-stat-unit">liter</div>
              </div>
            `:Y}
            ${l?K`
              <div class="flow-stat">
                <div class="flow-stat-label">${o.common.temperature}</div>
                <div class="temp-display ${n}">
                  <ha-icon icon="mdi:thermometer"></ha-icon>
                  <span class="flow-stat-value">${Ie(t.temp,1)}°C</span>
                </div>
              </div>
            `:Y}
            ${c?K`
              <div class="flow-stat">
                <div class="flow-stat-label">${o.waterflowkit.flowRate}</div>
                <div class="flow-stat-value">${Ie(60*t.flow,1)}</div>
                <div class="flow-stat-unit">L/h</div>
              </div>
            `:Y}
          </div>
        `:Y}
      </div>
    `}static getConfigElement(){return document.createElement("smarthomeshop-waterflowkit-card-editor")}static getStubConfig(){return{show_header:!0,show_status:!0,show_pipe_visualization:!0,show_flow_cards:!0,show_total_consumption:!0,show_hourly_rate:!0,show_flow1:!0,show_flow2:!0,flow1_show_temp:!0,flow2_show_temp:!0,flow1_name:"Hot water",flow2_name:"Cold water"}}}Qe.styles=[Ve,c`
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
    `],a([ve({attribute:!1})],Qe.prototype,"hass",void 0),a([fe()],Qe.prototype,"_config",void 0);class Je extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={}}setConfig(e){this._config=e}_valueChanged(e,t){const i={...this._config,[e]:t};this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}_getFilteredEntities(e){return this.hass?.states?Object.keys(this.hass.states).filter(t=>t.startsWith("sensor.")&&e(t)).sort():[]}_getFlowEntities(){return this._getFilteredEntities(e=>e.includes("water")||e.includes("flow")||e.includes("usage"))}_getTotalEntities(){return this._getFilteredEntities(e=>e.includes("consumption")||e.includes("total")||e.includes("water"))}_getTempEntities(){return this._getFilteredEntities(e=>e.includes("temp")||e.includes("temperature"))}render(){const e=ze(this.hass),t=this._getFlowEntities(),i=this._getTotalEntities(),a=this._getTempEntities();return K`
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
          ${!1!==this._config.show_header?K`
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
          ${!1!==this._config.show_flow_cards?K`
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
            ${t.map(e=>K`
              <option value=${e} ?selected=${e===this._config.flow1_flow_entity}>${e}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <label>Total consumption sensor</label>
          <select @change=${e=>this._valueChanged("flow1_total_entity",e.target.value||void 0)}>
            <option value="">-- Select entity --</option>
            ${i.map(e=>K`
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
        ${!1!==this._config.flow1_show_temp?K`
          <div class="form-row">
            <label>Temperature sensor</label>
            <select @change=${e=>this._valueChanged("flow1_temp_entity",e.target.value||void 0)}>
              <option value="">-- Select entity --</option>
              ${a.map(e=>K`
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
            ${t.map(e=>K`
              <option value=${e} ?selected=${e===this._config.flow2_flow_entity}>${e}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <label>Total consumption sensor</label>
          <select @change=${e=>this._valueChanged("flow2_total_entity",e.target.value||void 0)}>
            <option value="">-- Select entity --</option>
            ${i.map(e=>K`
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
        ${!1!==this._config.flow2_show_temp?K`
          <div class="form-row">
            <label>Temperature sensor</label>
            <select @change=${e=>this._valueChanged("flow2_temp_entity",e.target.value||void 0)}>
              <option value="">-- Select entity --</option>
              ${a.map(e=>K`
                <option value=${e} ?selected=${e===this._config.flow2_temp_entity}>${e}</option>
              `)}
            </select>
          </div>
        `:""}
      </div>
    `}}Je.styles=c`
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
  `,a([ve({attribute:!1})],Je.prototype,"hass",void 0),a([fe()],Je.prototype,"_config",void 0);const et=e=>{const t=Number(e.rotationDeg??e.rotation??0);return Number.isFinite(t)?t:0},tt=(e,t,i,a,o)=>{const r=i/2,n=a/2,s=o*Math.PI/180,l=Math.cos(s),c=Math.sin(s);return[[-r,-n],[r,-n],[r,n],[-r,n]].map(([i,a])=>({x:e+i*l-a*c,y:t+i*c+a*l}))},it={detection:{fill:"rgba(34, 197, 94, 0.2)",stroke:"#22c55e"},exclusion:{fill:"rgba(239, 68, 68, 0.2)",stroke:"#ef4444"},entry:{fill:"rgba(16, 185, 129, 0.25)",stroke:"#10b981"}},at=600;class ot{constructor(){this.camera={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3},this.wallHeight=2500}resetCamera(e){if(e.length>=3){const t=e.map(e=>e.x),i=e.map(e=>e.y),a=(Math.min(...t)+Math.max(...t))/2,o=(Math.min(...i)+Math.max(...i))/2,r=Math.max(Math.max(...t)-Math.min(...t),Math.max(...i)-Math.min(...i));this.camera={azimuth:45,elevation:35,distance:Math.max(4e3,1.5*r),targetX:a,targetY:o,targetZ:this.wallHeight/2}}else this.camera={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3}}orbit(e,t){this.camera.azimuth=(this.camera.azimuth-.5*e)%360,this.camera.elevation=Math.max(5,Math.min(85,this.camera.elevation+.3*t))}zoomBy(e){this.camera.distance=Math.max(2e3,Math.min(2e4,this.camera.distance*e))}render(e,t){e.width=800,e.height=at;const i=e.getContext("2d");if(!i)return;const a=i.createLinearGradient(0,0,0,at);a.addColorStop(0,"#1e293b"),a.addColorStop(1,"#0f172a"),i.fillStyle=a,i.fillRect(0,0,800,at),this.drawGrid(i),t.roomPoints.length>=3&&(this.drawRoom(i,t),this.drawFurniture(i,t),this.drawDoors(i,t),this.drawWindows(i,t),this.drawZones(i,t)),this.drawSensors(i,t),this.drawTargets(i,t)}project(e){const t=this.camera,i=t.azimuth*Math.PI/180,a=t.elevation*Math.PI/180,o=e.x-t.targetX,r=e.y-t.targetY,n=e.z-t.targetZ,s=o*Math.cos(i)-r*Math.sin(i),l=o*Math.sin(i)+r*Math.cos(i),c=n,d=l*Math.cos(a)-c*Math.sin(a),h=l*Math.sin(a)+c*Math.cos(a),u=1/Math.tan(60*Math.PI/360)*400,p=t.distance+d,m=p>50?u/p:u/50;return{x:400-s*m,y:300-h*m}}drawGrid(e){e.strokeStyle="rgba(71, 85, 105, 0.3)",e.lineWidth=1;const t=5e3;for(let i=-5e3;i<=t;i+=1e3){const a=this.project({x:i,y:-5e3,z:0}),o=this.project({x:i,y:t,z:0});e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(o.x,o.y),e.stroke();const r=this.project({x:-5e3,y:i,z:0}),n=this.project({x:t,y:i,z:0});e.beginPath(),e.moveTo(r.x,r.y),e.lineTo(n.x,n.y),e.stroke()}}drawRoom(e,t){const i=t.roomPoints;e.fillStyle="rgba(67, 97, 238, 0.08)",e.strokeStyle="rgba(67, 97, 238, 0.4)",e.lineWidth=2,e.beginPath();const a=this.project({x:i[0].x,y:i[0].y,z:0});e.moveTo(a.x,a.y);for(let t=1;t<i.length;t++){const a=this.project({x:i[t].x,y:i[t].y,z:0});e.lineTo(a.x,a.y)}e.closePath(),e.fill(),e.stroke();const o=i.map((e,t)=>{const a=i[(t+1)%i.length],o=(e.x+a.x)/2,r=(e.y+a.y)/2;return{index:t,dist:Math.hypot(o-this.camera.targetX,r-this.camera.targetY)}}).sort((e,t)=>t.dist-e.dist);for(const{index:i}of o)this.drawWall(e,t,i)}drawWall(e,t,i){const a=t.roomPoints,o=a[i],r=a[(i+1)%a.length],n=this.project({x:o.x,y:o.y,z:0}),s=this.project({x:r.x,y:r.y,z:0}),l=this.project({x:r.x,y:r.y,z:this.wallHeight}),c=this.project({x:o.x,y:o.y,z:this.wallHeight}),d=r.x-o.x,h=r.y-o.y,u=Math.atan2(h,d)+Math.PI/2,p=this.camera.azimuth*Math.PI/180,m=.3+.4*Math.abs(Math.cos(u-p)),g=e.createLinearGradient((n.x+s.x)/2,Math.max(n.y,s.y),(c.x+l.x)/2,Math.min(c.y,l.y));g.addColorStop(0,`rgba(71, 85, 105, ${.5*m})`),g.addColorStop(1,`rgba(71, 85, 105, ${.2*m})`),e.fillStyle=g,e.strokeStyle="#475569",e.lineWidth=2,e.beginPath(),e.moveTo(n.x,n.y),e.lineTo(s.x,s.y),e.lineTo(l.x,l.y),e.lineTo(c.x,c.y),e.closePath(),e.fill(),e.stroke()}drawFurniture(e,t){for(const i of t.furniture){const t=400,a=tt(i.x,i.y,i.width,i.height,et(i)).map(e=>({...e,z:0})),o=a.map(e=>({...e,z:t})),r=a.map(e=>this.project(e)),n=o.map(e=>this.project(e));e.fillStyle="rgba(148, 163, 184, 0.5)",e.strokeStyle="#64748b",e.lineWidth=1,e.beginPath(),e.moveTo(n[0].x,n[0].y);for(let t=1;t<4;t++)e.lineTo(n[t].x,n[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle="rgba(148, 163, 184, 0.25)",e.beginPath(),e.moveTo(r[t].x,r[t].y),e.lineTo(r[i].x,r[i].y),e.lineTo(n[i].x,n[i].y),e.lineTo(n[t].x,n[t].y),e.closePath(),e.fill(),e.stroke()}const s=this.project({x:i.x,y:i.y,z:t+100});e.fillStyle="#94a3b8",e.font="11px sans-serif",e.textAlign="center",e.fillText(i.name,s.x,s.y)}}drawDoors(e,t){for(const i of t.doors){if(i.wallIndex>=t.roomPoints.length)continue;const a=t.roomPoints[i.wallIndex],o=t.roomPoints[(i.wallIndex+1)%t.roomPoints.length],r=a.x+(o.x-a.x)*i.position,n=a.y+(o.y-a.y)*i.position,s=Math.atan2(o.y-a.y,o.x-a.x),l=i.width/2,c=Math.cos(s),d=Math.sin(s),h=Math.cos(s+Math.PI/2),u=Math.sin(s+Math.PI/2),p=[{x:r-l*c-40*h,y:n-l*d-40*u},{x:r+l*c-40*h,y:n+l*d-40*u},{x:r+l*c+40*h,y:n+l*d+40*u},{x:r-l*c+40*h,y:n-l*d+40*u}],m=p.map(e=>this.project({...e,z:0})),g=p.map(e=>this.project({...e,z:2e3}));e.strokeStyle="#8b5a2b",e.lineWidth=1,e.fillStyle="rgba(139, 90, 43, 0.6)",e.beginPath(),e.moveTo(g[0].x,g[0].y);for(let t=1;t<4;t++)e.lineTo(g[t].x,g[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(139, 90, 43, 0.5)":"rgba(139, 90, 43, 0.35)",e.beginPath(),e.moveTo(m[t].x,m[t].y),e.lineTo(m[i].x,m[i].y),e.lineTo(g[i].x,g[i].y),e.lineTo(g[t].x,g[t].y),e.closePath(),e.fill(),e.stroke()}}}drawWindows(e,t){for(const i of t.windows){if(i.wallIndex>=t.roomPoints.length)continue;const a=t.roomPoints[i.wallIndex],o=t.roomPoints[(i.wallIndex+1)%t.roomPoints.length],r=a.x+(o.x-a.x)*i.position,n=a.y+(o.y-a.y)*i.position,s=Math.atan2(o.y-a.y,o.x-a.x),l=i.width/2,c=i.height||1100,d=Math.cos(s),h=Math.sin(s),u=Math.cos(s+Math.PI/2),p=Math.sin(s+Math.PI/2),m=[{x:r-l*d-25*u,y:n-l*h-25*p},{x:r+l*d-25*u,y:n+l*h-25*p},{x:r+l*d+25*u,y:n+l*h+25*p},{x:r-l*d+25*u,y:n-l*h+25*p}],g=m.map(e=>this.project({...e,z:900})),v=m.map(e=>this.project({...e,z:900+c}));e.strokeStyle="#4a90a4",e.lineWidth=1,e.fillStyle="rgba(135, 206, 235, 0.4)",e.beginPath(),e.moveTo(v[0].x,v[0].y);for(let t=1;t<4;t++)e.lineTo(v[t].x,v[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(135, 206, 235, 0.35)":"rgba(135, 206, 235, 0.25)",e.beginPath(),e.moveTo(g[t].x,g[t].y),e.lineTo(g[i].x,g[i].y),e.lineTo(v[i].x,v[i].y),e.lineTo(v[t].x,v[t].y),e.closePath(),e.fill(),e.stroke()}}}drawZones(e,t){const i=this.wallHeight;for(const a of t.zones){const t=it[a.type]||it.detection,o=a.points;if("entry"===a.type&&2===o.length){const r=o[0],n=o[1],s=this.project({x:r.x,y:r.y,z:0}),l=this.project({x:n.x,y:n.y,z:0}),c=this.project({x:r.x,y:r.y,z:i}),d=this.project({x:n.x,y:n.y,z:i});e.fillStyle=t.fill.replace("0.25","0.4"),e.strokeStyle=t.stroke,e.lineWidth=3,e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(l.x,l.y),e.lineTo(d.x,d.y),e.lineTo(c.x,c.y),e.closePath(),e.fill(),e.stroke();const h=this.project({x:(r.x+n.x)/2,y:(r.y+n.y)/2,z:i/2});e.fillStyle=t.stroke,e.font="bold 14px sans-serif",e.textAlign="center",e.fillText("left"===a.inDirection?"← IN":"IN →",h.x,h.y)}else if(o.length>=3){e.fillStyle=t.fill,e.strokeStyle=t.stroke,e.lineWidth=2,e.beginPath();const r=this.project({x:o[0].x,y:o[0].y,z:10});e.moveTo(r.x,r.y);for(let t=1;t<o.length;t++){const i=this.project({x:o[t].x,y:o[t].y,z:10});e.lineTo(i.x,i.y)}e.closePath(),e.fill(),e.stroke(),e.fillStyle=t.fill.replace("0.2","0.15"),e.beginPath();const n=this.project({x:o[0].x,y:o[0].y,z:i});e.moveTo(n.x,n.y);for(let t=1;t<o.length;t++){const a=this.project({x:o[t].x,y:o[t].y,z:i});e.lineTo(a.x,a.y)}e.closePath(),e.fill(),e.stroke();for(let a=0;a<o.length;a++){const r=o[a],n=o[(a+1)%o.length],s=this.project({x:r.x,y:r.y,z:10}),l=this.project({x:n.x,y:n.y,z:10}),c=this.project({x:n.x,y:n.y,z:i}),d=this.project({x:r.x,y:r.y,z:i});e.fillStyle=t.fill.replace("0.2","0.12"),e.strokeStyle=t.stroke,e.lineWidth=1,e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(l.x,l.y),e.lineTo(c.x,c.y),e.lineTo(d.x,d.y),e.closePath(),e.fill(),e.stroke()}const s=o.reduce((e,t)=>e+t.x,0)/o.length,l=o.reduce((e,t)=>e+t.y,0)/o.length,c=this.project({x:s,y:l,z:i/2});e.fillStyle=t.stroke,e.font="bold 12px sans-serif",e.textAlign="center",e.fillText(a.name,c.x,c.y)}}}drawSensors(e,t){for(const i of t.sensors){const t=i.heightMm??2e3,a=this.project({x:i.x,y:i.y,z:t}),o=i.fov/2*Math.PI/180,r=(i.rotation-90)*Math.PI/180,n=r-o,s=r+o,l=i.x+Math.cos(n)*i.range,c=i.y+Math.sin(n)*i.range,d=i.x+Math.cos(s)*i.range,h=i.y+Math.sin(s)*i.range,u=this.project({x:i.x,y:i.y,z:0}),p=this.project({x:l,y:c,z:0}),m=this.project({x:d,y:h,z:0});e.fillStyle="rgba(67, 97, 238, 0.15)",e.strokeStyle="#4361ee",e.lineWidth=2,e.beginPath(),e.moveTo(u.x,u.y),e.lineTo(p.x,p.y),e.lineTo(m.x,m.y),e.closePath(),e.fill(),e.stroke(),e.strokeStyle="rgba(67, 97, 238, 0.5)",e.lineWidth=1,e.setLineDash([4,4]),e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(u.x,u.y),e.stroke(),e.setLineDash([]),e.fillStyle="#4361ee",e.beginPath(),e.arc(a.x,a.y,12,0,2*Math.PI),e.fill(),e.fillStyle="white",e.font="bold 10px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText("📡",a.x,a.y)}}drawTargets(e,t){for(let i=0;i<t.targets.length;i++){const a=t.targets[i].x,o=t.targets[i].y;e.save();const r=this.project({x:a+80,y:o+80,z:5});e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.ellipse(r.x,r.y,25,10,.3,0,2*Math.PI),e.fill(),this.drawCapsule(e,a-60,o,0,60,700,"#8b9299","#6b7280"),this.drawCapsule(e,a+60,o,0,60,700,"#8b9299","#6b7280"),this.drawCapsule(e,a-160,o,900,50,380,"#8b9299","#6b7280"),this.drawCapsule(e,a+160,o,900,50,380,"#8b9299","#6b7280"),this.drawCapsule(e,a,o,700,120,600,"#b8bfc7","#9ca3af"),this.drawSphere(e,a,o,1500,110);const n=this.project({x:a,y:o,z:1700});e.fillStyle="rgba(239, 68, 68, 0.95)",e.beginPath(),e.arc(n.x,n.y,14,0,2*Math.PI),e.fill(),e.strokeStyle="rgba(255, 255, 255, 0.6)",e.lineWidth=2,e.stroke(),e.fillStyle="white",e.font="bold 12px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText(`${i+1}`,n.x,n.y),e.restore()}}drawCapsule(e,t,i,a,o,r,n,s){const l=.8*o,c=a+r,d=[];for(let e=0;e<8;e++){const r=e/8*Math.PI*2,n=(e+1)/8*Math.PI*2,s=t+Math.cos(r)*o,h=i+Math.sin(r)*l,u=t+Math.cos(n)*o,p=i+Math.sin(n)*l,m=this.project({x:s,y:h,z:a}),g=this.project({x:u,y:p,z:a}),v=this.project({x:u,y:p,z:c}),f=this.project({x:s,y:h,z:c});d.push({points:[m,g,v,f],depth:(h+p)/2,isTop:!1})}const h=[];for(let e=0;e<8;e++){const a=e/8*Math.PI*2;h.push(this.project({x:t+Math.cos(a)*o,y:i+Math.sin(a)*l,z:c}))}d.push({points:h,depth:-1e3,isTop:!0}),d.sort((e,t)=>t.depth-e.depth);for(const t of d){e.beginPath(),e.moveTo(t.points[0].x,t.points[0].y);for(let i=1;i<t.points.length;i++)e.lineTo(t.points[i].x,t.points[i].y);e.closePath(),e.fillStyle=t.isTop?n:this.shadeColor(n,t.depth>0?.85:1),e.fill(),e.strokeStyle=s,e.lineWidth=.5,e.stroke()}}drawSphere(e,t,i,a,o){const r=this.project({x:t,y:i,z:a}),n=this.project({x:t,y:i,z:a+o}),s=Math.abs(r.y-n.y),l=e.createRadialGradient(r.x-.35*s,r.y-.35*s,0,r.x,r.y,s);l.addColorStop(0,"#ffffff"),l.addColorStop(.3,"#e5e7eb"),l.addColorStop(.7,"#d1d5db"),l.addColorStop(1,"#9ca3af"),e.fillStyle=l,e.beginPath(),e.arc(r.x,r.y,s,0,2*Math.PI),e.fill(),e.strokeStyle="#6b7280",e.lineWidth=1,e.stroke()}shadeColor(e,t){const i=e.replace("#","");return`rgb(${Math.round(parseInt(i.substr(0,2),16)*t)}, ${Math.round(parseInt(i.substr(2,2),16)*t)}, ${Math.round(parseInt(i.substr(4,2),16)*t)})`}}const rt=e=>"number"==typeof e?e>1e12?e:1e3*e:Date.parse(String(e)),nt=async(e,t,i)=>{let a;try{return await Promise.race([e.callWS(t),new Promise((e,o)=>{a=window.setTimeout(()=>o(new Error(`${t.type} timed out`)),i)})])}finally{void 0!==a&&window.clearTimeout(a)}},st=(e,t)=>{if(e.length<=t)return e;const i=e[0],a=e[e.length-1],o=e.slice(1,-1),r=Math.max(1,Math.floor((t-2)/2)),n=[i];for(let e=0;e<r;e+=1){const t=Math.floor(e*o.length/r),i=Math.floor((e+1)*o.length/r),a=o.slice(t,i);if(!a.length)continue;const s=a.reduce((e,t)=>t.v<e.v?t:e),l=a.reduce((e,t)=>t.v>e.v?t:e);n.push(...s.t<=l.t?[s,l]:[l,s])}return n.push(a),n.filter((e,t,i)=>0===t||e.t!==i[t-1].t||e.v!==i[t-1].v)},lt=async(e,t,i,a,o={})=>{const r=[...new Set(t.filter(Boolean))];if(!r.length)return{};const n=o.period??"5minute",s=Math.max(2,o.maxPoints??360),l=o.timeoutMs??25e3,[c,d]=await Promise.allSettled([nt(e,{type:"recorder/statistics_during_period",start_time:i.toISOString(),end_time:a.toISOString(),statistic_ids:r,period:n,types:["mean","min","max"]},l),nt(e,{type:"history/history_during_period",start_time:i.toISOString(),end_time:a.toISOString(),entity_ids:r,minimal_response:!0,no_attributes:!0,significant_changes_only:o.significantChangesOnly??!0},l)]),h={};for(const e of r){const t=o.factor?.(e)??1,i=("fulfilled"===c.status&&c.value[e]||[]).map(e=>{const i=Number(e.mean),a=Number(e.min??e.mean),o=Number(e.max??e.mean),r=t<0?o*t:a*t,n=t<0?a*t:o*t;return{t:rt(e.start),end:rt(e.end),v:i*t,min:r,max:n}}).filter(e=>Number.isFinite(e.t)&&e.t>0&&Number.isFinite(e.v)&&Number.isFinite(e.min)&&Number.isFinite(e.max));if(i.length>1){h[e]=st(i,s);continue}const a=("fulfilled"===d.status&&d.value[e]||[]).map(e=>{const i=e.lu??e.lc??e.last_updated??e.last_changed;return{t:rt(i),v:t*Number(e.s??e.state)}}).filter(e=>Number.isFinite(e.t)&&e.t>0&&Number.isFinite(e.v));h[e]=st(a,s)}return h},ct=e=>e?Array.isArray(e.sensors)&&e.sensors.length?e.sensors.filter(Boolean):e.sensor?[e.sensor]:[]:[],dt=(e,t,i)=>{if(i){const t=e.find(e=>e.id===i);if(t)return t}const a=new Set(t.filter(e=>Boolean(e))),o=e.find(e=>ct(e).some(e=>Boolean(e.deviceId&&a.has(e.deviceId))));if(o)return o;const r=e.filter(e=>{const t=ct(e);return 1===t.length&&!t[0].deviceId});return 1===e.length&&1===r.length?r[0]:null},ht=e=>{const t=Number(e??360);return Number.isFinite(t)?Math.min(720,Math.max(240,Math.round(t))):360};class ut extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this.entityPrefix="",this.deviceName="",this.isOpen=!1,this._settings=[],this._zones=[],this._activeTab="mmwave",this._showZoneEditor=!1,this._saving=!1,this._pendingChanges=new Map}updated(e){e.has("isOpen")&&this.isOpen&&this._loadSettings()}_loadSettings(){if(!this.hass||!this.entityPrefix)return;const e=[],t=this.entityPrefix;[{suffix:"max_distance",name:"Max Afstand",unit:"mm",min:100,max:6e3,step:100}].forEach(i=>{const a=`number.${t}_${i.suffix}`,o=this.hass.states[a];o&&"unavailable"!==o.state&&e.push({entityId:a,name:i.name,value:parseFloat(o.state),min:i.min,max:i.max,step:i.step,unit:i.unit,group:"mmwave"})});[{suffix:"temperature_offset",name:"Temp Offset",unit:"°C",min:-10,max:10,step:.1},{suffix:"humidity_offset",name:"Humidity Offset",unit:"%",min:-20,max:20,step:1}].forEach(i=>{const a=`number.${t}_${i.suffix}`,o=this.hass.states[a];o&&"unavailable"!==o.state&&e.push({entityId:a,name:i.name,value:parseFloat(o.state),min:i.min,max:i.max,step:i.step,unit:i.unit,group:"calibration"})});const i=[];for(let e=1;e<=4;e++)i.push({id:e,beginX:this._getNum(`zone_${e}_begin_x`),endX:this._getNum(`zone_${e}_end_x`),beginY:this._getNum(`zone_${e}_begin_y`),endY:this._getNum(`zone_${e}_end_y`)});this._settings=e,this._zones=i}_getNum(e){const t=`number.${this.entityPrefix}_${e}`,i=this.hass?.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_handleChange(e,t){this._pendingChanges.set(e,t),this.requestUpdate()}async _saveChanges(){if(this.hass&&0!==this._pendingChanges.size){this._saving=!0;try{for(const[e,t]of this._pendingChanges)await this.hass.callService("number","set_value",{entity_id:e,value:t});this._pendingChanges.clear(),setTimeout(()=>this._loadSettings(),500)}catch(e){console.error("Save failed:",e)}finally{this._saving=!1}}}async _saveZone(e){if(this.hass){this._saving=!0;try{const t=this.entityPrefix;await Promise.all([this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_begin_x`,value:e.beginX}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_end_x`,value:e.endX}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_begin_y`,value:e.beginY}),this.hass.callService("number","set_value",{entity_id:`number.${t}_zone_${e.id}_end_y`,value:e.endY})])}catch(e){console.error("Zone save failed:",e)}finally{this._saving=!1}}}_close(){this.dispatchEvent(new CustomEvent("close"))}_renderSetting(e){const t=this._pendingChanges.has(e.entityId)?this._pendingChanges.get(e.entityId):e.value;return K`
      <div class="setting-item">
        <div>
          <div class="setting-name">${e.name}</div>
          <div class="setting-value">${e.value}${e.unit?" "+e.unit:""}</div>
        </div>
        <div class="number-control">
          <button class="number-btn" @click=${()=>this._handleChange(e.entityId,Math.max(e.min,t-e.step))} ?disabled=${t<=e.min}>−</button>
          <input class="number-input" type="number" .value=${t.toString()} @change=${t=>this._handleChange(e.entityId,parseFloat(t.target.value))} />
          <button class="number-btn" @click=${()=>this._handleChange(e.entityId,Math.min(e.max,t+e.step))} ?disabled=${t>=e.max}>+</button>
          ${e.unit?K`<span class="number-unit">${e.unit}</span>`:Y}
        </div>
      </div>
    `}_renderZone(e){const t=0!==e.beginX||0!==e.endX||0!==e.beginY||0!==e.endY;return K`
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
    `}render(){if(!this.isOpen)return Y;const e=this._settings.filter(e=>"mmwave"===e.group),t=this._settings.filter(e=>"calibration"===e.group);return K`
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
            ${"mmwave"===this._activeTab?K`
              ${e.length>0?K`
                <div class="group-title"><ha-icon icon="mdi:radar"></ha-icon> Radar Instellingen</div>
                ${e.map(e=>this._renderSetting(e))}
              `:K`<div class="empty-state">No mmWave settings found</div>`}
            `:Y}

            ${"zones"===this._activeTab?K`
              <div class="group-title"><ha-icon icon="mdi:vector-square"></ha-icon> Zone Configuratie</div>
              <button class="btn btn-primary" style="width: 100%; margin-bottom: 16px; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" @click=${()=>this._showZoneEditor=!0}>
                <ha-icon icon="mdi:pencil-ruler"></ha-icon> Open Visuele Editor
              </button>
              ${this._zones.map(e=>this._renderZone(e))}
            `:Y}

            ${"calibration"===this._activeTab?K`
              ${t.length>0?K`
                <div class="group-title"><ha-icon icon="mdi:tune"></ha-icon> Sensor Calibratie</div>
                ${t.map(e=>this._renderSetting(e))}
              `:K`<div class="empty-state">No calibration settings found</div>`}
            `:Y}
          </div>

          <div class="modal-footer">
            <div class="changes-badge">
              ${this._pendingChanges.size>0?K`<ha-icon icon="mdi:alert-circle"></ha-icon> ${this._pendingChanges.size} wijzigingen`:Y}
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
    `}}ut.styles=c`
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
  `,a([ve({attribute:!1})],ut.prototype,"hass",void 0),a([ve()],ut.prototype,"entityPrefix",void 0),a([ve()],ut.prototype,"deviceName",void 0),a([ve({type:Boolean})],ut.prototype,"isOpen",void 0),a([fe()],ut.prototype,"_settings",void 0),a([fe()],ut.prototype,"_zones",void 0),a([fe()],ut.prototype,"_activeTab",void 0),a([fe()],ut.prototype,"_showZoneEditor",void 0),a([fe()],ut.prototype,"_saving",void 0),a([fe()],ut.prototype,"_pendingChanges",void 0);const pt=[{metric:"temperature",label:"Temperature",visibilityKey:"show_temperature",trendKey:"show_temperature_trend"},{metric:"humidity",label:"Humidity",visibilityKey:"show_humidity",trendKey:"show_humidity_trend"},{metric:"co2",label:"CO2",visibilityKey:"show_co2",trendKey:"show_co2_trend"},{metric:"illuminance",label:"Illuminance",visibilityKey:"show_illuminance",trendKey:"show_illuminance_trend"},{metric:"voc",label:"VOC index",visibilityKey:"show_voc",trendKey:"show_voc_trend"},{metric:"nox",label:"NOx index",visibilityKey:"show_nox",trendKey:"show_nox_trend"}],mt=e=>{const t=Number(e??6);return Number.isFinite(t)?Math.min(168,Math.max(1,Math.round(t))):6},gt=[["sensor","scd41_temperature"],["sensor","temperature"],["sensor","bme280_temperature"],["sensor","scd41_humidity"],["sensor","humidity"],["sensor","scd41_co2"],["sensor","co2"],["sensor","bh1750_illuminance"],["sensor","illuminance"],["sensor","voc_index"],["sensor","nox_index"],["sensor","uptime"],["sensor","wifi_signal"],["number","temperature_offset"],["number","humidity_offset"]];class vt extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={},this._targets=[],this._zones=[],this._environment={temperature:null,humidity:null,co2:null,illuminance:null,voc:null,nox:null,pm1_0:null,pm2_5:null,pm4_0:null,pm10:null,typical_particle_size:null},this._entityPrefix="",this._radarPrefix="",this._deviceName="",this._entityIds={targets:[]},this._showSettings=!1,this._rooms=[],this._selectedRoomId=null,this._roomsError=null,this._roomViewMode="2d",this._trends={},this._room3d=new ot,this._isDragging3D=!1,this._lastMouseX=0,this._lastMouseY=0,this._trendLoading=!1,this._trendSignature="",this._lastTrendFetch=0,this._roomsLoaded=!1,this._on3DMouseDown=e=>{this._isDragging3D=!0,this._lastMouseX=e.clientX,this._lastMouseY=e.clientY},this._on3DMouseMove=e=>{if(!this._isDragging3D)return;const t=e.clientX-this._lastMouseX,i=e.clientY-this._lastMouseY;this._lastMouseX=e.clientX,this._lastMouseY=e.clientY,this._room3d.orbit(-t,.6*i),this._render3DView()},this._on3DMouseUp=()=>{this._isDragging3D=!1},this._on3DWheel=e=>{e.preventDefault(),this._room3d.zoomBy(e.deltaY>0?1.1:.9),this._render3DView()}}_fireMoreInfo(e){if(!e)return;const t=new CustomEvent("hass-more-info",{detail:{entityId:e},bubbles:!0,composed:!0});this.dispatchEvent(t)}static getConfigElement(){return document.createElement("smarthomeshop-ultimatesensor-card-editor")}static getStubConfig(){return{max_distance:6e3,show_header:!0,show_status:!0,show_radar:!0,show_target_details:!0,show_environment:!0,show_pm_gauge:!0,show_pm_values:!0,show_nox:!0,show_trends:!0,trend_hours:6,show_zones:!0,show_grid:!0}}setConfig(e){this._config={max_distance:6e3,show_header:!0,show_status:!0,show_radar:!0,show_target_details:!0,show_environment:!0,show_pm_gauge:!0,show_pm_values:!0,show_nox:!0,show_trends:!0,trend_hours:6,show_zones:!0,show_grid:!0,...e},this._roomViewMode=this._config.room_view_mode||"2d",this._roomsLoaded&&this._syncSelectedRoom(),"3d"===this._roomViewMode&&setTimeout(()=>this._init3DView(),100)}getCardSize(){return 6}getGridOptions(){return{columns:12,min_columns:4,min_rows:4}}connectedCallback(){super.connectedCallback(),this._startUpdates()}disconnectedCallback(){super.disconnectedCallback(),this._stopUpdates()}_startUpdates(){this._updateData(),this._updateInterval=window.setInterval(()=>this._updateData(),1e3)}async _loadRooms(){if(this.hass)if(this._roomsLoaded)Ye("SmartHomeShop: Rooms already loaded, skipping");else try{Ye("SmartHomeShop: Loading rooms via WebSocket...");const e=await this.hass.callWS({type:"smarthomeshop/rooms"});Ye("SmartHomeShop: WebSocket result:",e),this._rooms=Array.isArray(e?.rooms)?e.rooms:[],this._roomsError=null,this._syncSelectedRoom(),this._roomsLoaded=!0,Ye("SmartHomeShop: Loaded",this._rooms.length,"rooms:",this._rooms.map(e=>e.name).join(", ")),"3d"===this._roomViewMode&&setTimeout(()=>this._init3DView(),50)}catch(e){console.error("SmartHomeShop: Could not load rooms:",e),this._rooms=[],this._roomsLoaded=!0,this._roomsError="Rooms could not be loaded. Reload the card or check the SmartHomeShop integration."}else Ye("SmartHomeShop: _loadRooms called but hass not available")}_roomAliases(){return[this._config.device_id,this._entityPrefix,this._radarPrefix]}_syncSelectedRoom(){const e=dt(this._rooms,this._roomAliases(),this._config.room_id);this._selectedRoomId=e?.id||null}_roomSensor(e){return((e,t)=>{const i=new Set(t.filter(e=>Boolean(e))),a=ct(e);return a.find(e=>Boolean(e.deviceId&&i.has(e.deviceId)))||(1!==a.length||a[0].deviceId?null:a[0])})(e,this._roomAliases())}_stopUpdates(){this._updateInterval&&clearInterval(this._updateInterval)}updated(e){super.updated(e),this.hass&&!this._roomsLoaded&&this._loadRooms(),(e.has("hass")||e.has("_config"))&&this._detectEntityPrefix(),(e.has("_targets")||e.has("_zones"))&&(this._drawRadar(),"room"===this._config.view_mode&&"3d"===this._roomViewMode&&this._render3DView()),e.has("_roomViewMode")&&"3d"===this._roomViewMode&&setTimeout(()=>this._render3DView(),50),(e.has("_entityPrefix")||e.has("_radarPrefix"))&&this._syncSelectedRoom()}firstUpdated(){this._drawRadar(),this.hass&&!this._roomsLoaded&&this._loadRooms()}_detectEntityPrefix(){if(this.hass){if(this._config.device_id){const e=this._getEntitiesForDevice(this._config.device_id),t=e.find(e=>e.includes("target_1_x"));if(t){const i=t.match(/^sensor\.(.+)_target_1_x$/);if(i){const t=new Set(e);this._radarPrefix=i[1],this._entityPrefix=this._resolveDevicePrefix(i[1],e=>t.has(e));const a=this.hass.devices?.[this._config.device_id];return void(this._deviceName=a?.name||"UltimateSensor")}}}if(this._config.entity_prefix)return this._entityPrefix=this._config.entity_prefix,this._radarPrefix=this._resolveRadarPrefix(this._config.entity_prefix),void(this._deviceName=this._config.title||"UltimateSensor");for(const e of Object.keys(this.hass.states))if(e.includes("target_1_x")&&e.startsWith("sensor.")){const t=e.match(/^sensor\.(.+)_target_1_x$/);if(t)return this._radarPrefix=t[1],this._entityPrefix=this._resolveDevicePrefix(t[1],e=>!!this.hass?.states[e]),void(this._deviceName="UltimateSensor")}}}_resolveDevicePrefix(e,t){let i=e;for(let e=0;e<=2;e++){if(gt.some(([e,a])=>t(`${e}.${i}_${a}`)))return i;const e=i.lastIndexOf("_");if(e<=0)break;i=i.slice(0,e)}return e}_resolveRadarPrefix(e){if(!this.hass)return e;if(this.hass.states[`sensor.${e}_target_1_x`])return e;for(const t of Object.keys(this.hass.states)){if(!t.startsWith(`sensor.${e}_`))continue;const i=t.match(/^sensor\.(.+)_target_1_x$/);if(i)return i[1]}return e}_getEntitiesForDevice(e){return this.hass?.entities?Object.entries(this.hass.entities).filter(([t,i])=>i.device_id===e).map(([e])=>e):[]}_getOfflineInfo(){if(!this.hass)return{offline:!1,lastSeen:null};const e=this._config.device_id,t=this.hass.entities;if(e&&t){let i=!1,a=null,o=null;for(const[r,n]of Object.entries(t)){if(n.device_id!==e)continue;if("esphome"!==n.platform)continue;if(!r.startsWith("sensor.")&&!r.startsWith("binary_sensor."))continue;const t=this.hass.states[r];if(!t)continue;if("connectivity"===t.attributes?.device_class){if("on"===t.state)return{offline:!1,lastSeen:null};"off"===t.state&&(o=t.last_changed??null);continue}if(i=!0,"unavailable"!==t.state)return{offline:!1,lastSeen:null};const s=t.last_changed;s&&(!a||s>a)&&(a=s)}return o?{offline:!0,lastSeen:o}:{offline:i,lastSeen:a}}if(!this._entityPrefix)return{offline:!1,lastSeen:null};const i=[`sensor.${this._entityPrefix}_`,`binary_sensor.${this._entityPrefix}_`];let a=!1,o=null,r=null;for(const[e,t]of Object.entries(this.hass.states)){if(e.endsWith("_cc"))continue;if(!i.some(t=>e.startsWith(t)))continue;if("connectivity"===t.attributes?.device_class){if("on"===t.state)return{offline:!1,lastSeen:null};"off"===t.state&&(r=t.last_changed??null);continue}if(a=!0,"unavailable"!==t.state)return{offline:!1,lastSeen:null};const n=t.last_changed;n&&(!o||n>o)&&(o=n)}return r?{offline:!0,lastSeen:r}:{offline:a,lastSeen:o}}_getSensorState(e,t=this._entityPrefix){if(!this.hass||!t)return null;const i=`sensor.${t}_${e}`,a=this.hass.states[i]?.state;return a&&"unavailable"!==a&&"unknown"!==a?parseFloat(a):null}_findSensorEntityId(e){if(this.hass&&this._entityPrefix)for(const t of e){const e=`sensor.${this._entityPrefix}_${t}`,i=this.hass.states[e]?.state;if(i&&"unavailable"!==i&&"unknown"!==i)return e}}_getZoneBound(e,t){if(!this.hass)return 0;const i=this._radarPrefix&&this._radarPrefix!==this._entityPrefix?[this._radarPrefix,this._entityPrefix]:[this._entityPrefix];for(const a of i)if(a)for(const i of t){const t=this.hass.states[`number.${a}_zone_${e}_${i}`]?.state;if(t&&"unavailable"!==t&&"unknown"!==t){const e=parseFloat(t);if(!isNaN(e))return e}}return 0}_updateData(){if(!this.hass||!this._entityPrefix)return;const e=this._radarPrefix||this._entityPrefix,t=[],i=[];for(let a=1;a<=5;a++){const o=`sensor.${e}_target_${a}_x`,r=`sensor.${e}_target_${a}_y`;if(!this.hass.states[o]||!this.hass.states[r])continue;const n=this._getSensorState(`target_${a}_x`,e)??0,s=this._getSensorState(`target_${a}_y`,e)??0,l=[`binary_sensor.${e}_target_${a}_active`,`binary_sensor.${e}_target_${a}`].find(e=>this.hass?.states[e]),c=l?"on"===this.hass.states[l].state:0!==n||0!==s,d=`sensor.${e}_target_${a}_distance`,h=this._getSensorState(`target_${a}_distance`,e)??Math.hypot(n,s);t.push({x:n,y:s,active:c,distance:h}),i.push(this.hass.states[d]?d:o)}this._targets=t;const a=[];for(let e=1;e<=4;e++){const t=this._getZoneBound(e,["x1","begin_x"]),i=this._getZoneBound(e,["y1","begin_y"]),o=this._getZoneBound(e,["x2","end_x"]),r=this._getZoneBound(e,["y2","end_y"]);0===t&&0===i&&0===o&&0===r||a.push({beginX:t,beginY:i,endX:o,endY:r})}this._zones=a,this._environment={temperature:this._getSensorState("scd41_temperature")??this._getSensorState("temperature")??this._getSensorState("bme280_temperature"),humidity:this._getSensorState("scd41_humidity")??this._getSensorState("humidity")??this._getSensorState("bme280_humidity"),co2:this._getSensorState("scd41_co2")??this._getSensorState("co2"),illuminance:this._getSensorState("bh1750_illuminance")??this._getSensorState("illuminance"),voc:this._getSensorState("voc_index")??this._getSensorState("sgp41_voc_index")??this._getSensorState("sgp30_voc")??this._getSensorState("voc"),nox:this._getSensorState("nox_index")??this._getSensorState("sgp41_nox_index"),pm1_0:this._getSensorState("pm_1mm_weight_concentration")??this._getSensorState("pm_1um_weight_concentration")??this._getSensorState("pm_1_0"),pm2_5:this._getSensorState("pm_2_5mm_weight_concentration")??this._getSensorState("pm_2_5um_weight_concentration")??this._getSensorState("pm_2_5"),pm4_0:this._getSensorState("pm_4mm_weight_concentration")??this._getSensorState("pm_4um_weight_concentration")??this._getSensorState("pm_4_0"),pm10:this._getSensorState("pm_10mm_weight_concentration")??this._getSensorState("pm_10um_weight_concentration")??this._getSensorState("pm_10"),typical_particle_size:this._getSensorState("typical_particle_size")},this._entityIds={temperature:this._findSensorEntityId(["scd41_temperature","temperature","bme280_temperature"]),humidity:this._findSensorEntityId(["scd41_humidity","humidity","bme280_humidity"]),co2:this._findSensorEntityId(["scd41_co2","co2"]),illuminance:this._findSensorEntityId(["bh1750_illuminance","illuminance"]),voc:this._findSensorEntityId(["voc_index","sgp41_voc_index","sgp30_voc","voc"]),nox:this._findSensorEntityId(["nox_index","sgp41_nox_index"]),pm1_0:this._findSensorEntityId(["pm_1mm_weight_concentration","pm_1um_weight_concentration","pm_1_0"]),pm2_5:this._findSensorEntityId(["pm_2_5mm_weight_concentration","pm_2_5um_weight_concentration","pm_2_5"]),pm4_0:this._findSensorEntityId(["pm_4mm_weight_concentration","pm_4um_weight_concentration","pm_4_0"]),pm10:this._findSensorEntityId(["pm_10mm_weight_concentration","pm_10um_weight_concentration","pm_10"]),typical_particle_size:this._findSensorEntityId(["typical_particle_size"]),targets:i},this._fetchTrends(),this._drawRadar()}async _fetchTrends(){if(!this.hass||this._trendLoading)return;if(!1===this._config.show_trends)return void(Object.keys(this._trends).length&&(this._trends={}));const e=this._trendHours(),t=pt.filter(e=>!1!==this._config[e.visibilityKey]&&this._trendEnabled(e.metric)).map(e=>this._entityIds[e.metric]).filter(e=>Boolean(e));if(!t.length)return void(Object.keys(this._trends).length&&(this._trends={}));const i=`${e}|${t.slice().sort().join("|")}`,a=Date.now();if(!(i===this._trendSignature&&a-this._lastTrendFetch<3e5)){this._trendLoading=!0,this._trendSignature=i,this._lastTrendFetch=a;try{const i=new Date(a),o=new Date(a-60*e*60*1e3),r=await lt(this.hass,t,o,i,{period:"5minute",maxPoints:Math.min(360,Math.max(74,12*e+2)),significantChangesOnly:!1}),n={};for(const e of t){const t=r[e]||[],i=Number(this.hass.states[e]?.state),s=[...t.filter(e=>e.t<a),...Number.isFinite(i)?[{t:a,end:a,v:i,min:i,max:i}]:[]].sort((e,t)=>e.t-t.t);s.length<2||(n[e]={points:s,change:s[s.length-1].v-s[0].v,start:o.getTime(),end:a})}this._trends=n}catch(e){console.warn("SmartHomeShop: Could not load environmental trends",e)}finally{this._trendLoading=!1}}}_trendHours(){return mt(this._config.trend_hours)}_trendEnabled(e){const t=pt.find(t=>t.metric===e);return!1!==this._config.show_trends&&(!t||!1!==this._config[t.trendKey])}_renderTrend(e,t,i,a=0){if(!t||!this._trendEnabled(e))return Y;const o=this._trends[t];if(!o||o.points.length<2)return Y;const r=this._trendHours(),n=1===r?"hour":"hours",s=`${r}h`,l=240,c=Math.min(...o.points.map(e=>e.min??e.v)),d=Math.max(...o.points.map(e=>e.max??e.v)),h=d-c,u=a>0?.2:1,p=Math.max(u,.08*h),m=c-p,g=d+p,v=Math.max(1e-4,g-m),f=Math.max(1,o.end-o.start),y=e=>Math.max(0,Math.min(l,(e-o.start)/f*l)),b=e=>45-(e-m)/v*42,w=o.points.map((e,t)=>`${0===t?"M":"L"} ${y(e.t).toFixed(1)} ${b(e.v).toFixed(1)}`).join(" "),x=`${o.points.map((e,t)=>`${0===t?"M":"L"} ${y(e.t).toFixed(1)} ${b(e.max??e.v).toFixed(1)}`).join(" ")} ${[...o.points].reverse().map(e=>`L ${y(e.t).toFixed(1)} ${b(e.min??e.v).toFixed(1)}`).join(" ")} Z`,_=o.change,k=a>0?.05:.5,S=Math.abs(_)<k?"flat":_>0?"up":"down",C="up"===S?"mdi:trending-up":"down"===S?"mdi:trending-down":"mdi:minus",$="flat"===S?`Stable · ${s}`:`${_>0?"+":""}${_.toFixed(a)}${i?` ${i}`:""} · ${s}`,z=o.points[o.points.length-1],E=y(z.t),P=b(z.v),M=`${c.toFixed(a)}–${d.toFixed(a)}${i?` ${i}`:""}`;return K`
      <div class="env-card-trend" title="Change over the last ${r} ${n}">
        <div class="trend-summary">
          <span class="trend-range">Range ${M}</span>
          <span class="trend-change"><ha-icon icon=${C}></ha-icon>${$}</span>
        </div>
        <div class="trend-chart">
          <svg viewBox="0 0 ${l} ${48}" preserveAspectRatio="none" role="img"
            aria-label="${$}; range ${M} over the last ${r} ${n}">
            <title>${$}; range ${M}</title>
            <line class="trend-grid" x1="0" y1=${24..toFixed(1)} x2=${l} y2=${24..toFixed(1)}></line>
            <path class="trend-band" d=${x}></path>
            <path class="trend-line" d=${w}></path>
            <circle class="trend-end" cx=${E.toFixed(1)} cy=${P.toFixed(1)} r="2.6"></circle>
          </svg>
          <div class="trend-axis" aria-hidden="true"><span>${s} ago</span><span>Now</span></div>
        </div>
      </div>
    `}_drawRadar(){const e=this.shadowRoot?.querySelector(".radar-canvas");if(!e)return;const t=e.getContext("2d");if(!t)return;const i=e.getBoundingClientRect();if(i.width<10||i.height<50)return;const a=window.devicePixelRatio||1;e.width=i.width*a,e.height=i.height*a,t.scale(a,a);const o=i.width,r=i.height,n=o/2,s=r-25,l=this._config.max_distance||6e3,c=Math.max(.001,(r-50)/l);if(t.clearRect(0,0,o,r),!1!==this._config.show_grid){t.strokeStyle="rgba(255, 255, 255, 0.1)",t.lineWidth=1,t.setLineDash([5,5]);for(let e=1e3;e<=l;e+=1e3){const i=e*c;t.beginPath(),t.arc(n,s,i,Math.PI,2*Math.PI),t.stroke()}t.beginPath(),t.moveTo(n,s),t.lineTo(n,10),t.stroke(),t.setLineDash([])}const d=120*Math.PI/180,h=l*c;t.beginPath(),t.moveTo(n,s),t.arc(n,s,h,Math.PI+(Math.PI-d)/2,Math.PI+(Math.PI+d)/2),t.closePath();const u=t.createRadialGradient(n,s,0,n,s,h);if(u.addColorStop(0,"rgba(100, 180, 255, 0.3)"),u.addColorStop(1,"rgba(100, 180, 255, 0.05)"),t.fillStyle=u,t.fill(),t.strokeStyle="rgba(100, 180, 255, 0.5)",t.lineWidth=2,t.stroke(),!1!==this._config.show_zones){const e=["rgba(76, 175, 80, 0.3)","rgba(33, 150, 243, 0.3)","rgba(255, 152, 0, 0.3)","rgba(156, 39, 176, 0.3)"];this._zones.forEach((i,a)=>{const o=n+i.beginX*c,r=s-i.beginY*c,l=n+i.endX*c,d=s-i.endY*c,h=Math.min(o,l),u=Math.min(r,d),p=Math.abs(l-o),m=Math.abs(d-r);if(p>5&&m>5){t.fillStyle=e[a%e.length],t.strokeStyle=e[a%e.length].replace("0.3","0.8"),t.lineWidth=2,t.beginPath();const i=Math.min(4,p/2,m/2);t.roundRect(h,u,p,m,Math.max(0,i)),t.fill(),t.stroke()}})}const p=["#e91e63","#9c27b0","#3f51b5"];this._targets.forEach((e,i)=>{if(!e.active||0===e.x&&0===e.y)return;const a=n+e.x*c,o=s-e.y*c,r=p[i%p.length];t.beginPath(),t.arc(a,o,20,0,2*Math.PI);const l=t.createRadialGradient(a,o,0,a,o,20);l.addColorStop(0,r.replace(")",", 0.4)").replace("rgb","rgba")),l.addColorStop(1,"transparent"),t.fillStyle=l,t.fill(),t.beginPath(),t.arc(a,o,10,0,2*Math.PI),t.fillStyle=r,t.fill(),t.strokeStyle="white",t.lineWidth=2,t.stroke(),t.beginPath(),t.arc(a,o,3,0,2*Math.PI),t.fillStyle="white",t.fill()}),t.fillStyle="#2196f3",t.beginPath(),t.arc(n,s,8,0,2*Math.PI),t.fill(),t.fillStyle="rgba(255, 255, 255, 0.6)",t.font="10px sans-serif",t.textAlign="center",t.fillText("SENSOR",n,s+18),t.fillStyle="rgba(255, 255, 255, 0.5)",t.font="10px sans-serif",t.textAlign="right";for(let e=1;e<=l/1e3;e++){const i=s-1e3*e*c;t.fillText(`${e}m`,o-8,i+4)}}_renderRoomView(){const e=K`
      <div class="room-view-header">
        <div class="room-view-toggle">
          <button class="${"2d"===this._roomViewMode?"active":""}" @click=${()=>this._setRoomViewMode("2d")}>2D</button>
          <button class="${"3d"===this._roomViewMode?"active":""}" @click=${()=>this._setRoomViewMode("3d")}>3D</button>
        </div>
      </div>
    `,t=this._rooms.find(e=>e.id===this._selectedRoomId),i=this._roomSensor(t),a=t?.walls||[],o=a.filter(e=>"number"==typeof e?.x1&&"number"==typeof e?.y1).map(e=>({x:e.x1/1e3,y:e.y1/1e3}));Ye("SmartHomeShop: _renderRoomView",{selectedRoomId:this._selectedRoomId,wallSegments:a.length,cornerPoints:o.length,room:t?.name});const r=o.length>=3;if(this._roomsError)return K`
        ${e}
        <div class="no-room-message" role="alert">
          <ha-icon icon="mdi:cloud-alert-outline"></ha-icon>
          <div>${this._roomsError}</div>
        </div>
      `;if(!t||!r||!i)return this._roomsLoaded&&this._rooms.length>0&&console.warn("SmartHomeShop: Room validation failed",{roomName:t?.name,wallSegmentsCount:a.length,cornerPointsCount:o.length}),K`
        ${e}
        <div class="no-room-message">
          <ha-icon icon="mdi:floor-plan"></ha-icon>
          <div>${this._roomsLoaded?t&&!i?"This sensor is not linked to the selected room":"No linked room configured for this sensor":"Loading rooms..."}</div>
          ${this._roomsLoaded?K`
            <div style="font-size: 0.8rem; margin-top: 8px;">
              Link this exact device to a sensor placement in Room Designer, or select a room override in the card editor.
            </div>
          `:Y}
        </div>
      `;const n=o.map(e=>e.x).filter(e=>!isNaN(e)),s=o.map(e=>e.y).filter(e=>!isNaN(e));if(0===n.length||0===s.length)return K`
        <div class="no-room-message">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <div>Invalid room data</div>
        </div>
      `;const l=Math.min(...n),c=Math.max(...n),d=Math.min(...s),h=Math.max(...s),u=.5,p=l-u,m=d-u,g=(c-l||1)+1,v=(h-d||1)+1;Ye("SmartHomeShop: ViewBox",{viewMinX:p,viewMinY:m,viewWidth:g,viewHeight:v,minX:l,maxX:c,minY:d,maxY:h});const f=o.map((e,t)=>`${0===t?"M":"L"} ${e.x} ${e.y}`).join(" ")+" Z",y=Number.isFinite(Number(i.x))?Number(i.x)/1e3:(l+c)/2,b=Number.isFinite(Number(i.y))?Number(i.y)/1e3:d+.5,w=Number.isFinite(Number(i.rotation))?Number(i.rotation):270,x=(Number.isFinite(Number(i.range))?Number(i.range):6e3)/1e3,_=Number.isFinite(Number(i.fov))?Number(i.fov):120,k=isNaN(y)?(l+c)/2:y,S=isNaN(b)?d+.5:b,C=this._targets.filter(e=>e.active&&Number.isFinite(e.x)&&Number.isFinite(e.y));Ye("SmartHomeShop: Room targets:",JSON.stringify(this._targets),"Active/visible:",C.length);const $=(w-90)*Math.PI/180,z=_/2*Math.PI/180,E=Math.min(x,3),P=$-z,M=$+z;if("3d"===this._roomViewMode)return K`
        ${e}
        <canvas class="canvas-3d"
          @mousedown=${this._on3DMouseDown}
          @mousemove=${this._on3DMouseMove}
          @mouseup=${this._on3DMouseUp}
          @mouseleave=${this._on3DMouseUp}
          @wheel=${this._on3DWheel}
        ></canvas>
      `;const A=[];for(let e=0;e<=32;e++){const t=P+e/32*(M-P);A.push(`${k+Math.cos(t)*E},${S+Math.sin(t)*E}`)}const L=`M ${k} ${S} L ${A.join(" L ")} Z`;return K`
      ${e}
      <svg class="room-floorplan" viewBox="${p} ${m} ${g} ${v}"
           style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 12px;">
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
        <rect x="${p}" y="${m}" width="${g}" height="${v}" fill="url(#room-grid)"/>
        <!-- Room walls - same style as zones-page -->
        <path d="${f}" fill="rgba(249, 115, 22, 0.08)" stroke="#475569" stroke-width="0.04"/>
        <!-- Sensor FOV - same style as zones-page (arc instead of triangle) -->
        <path d="${L}" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="0.015"/>
        <!-- Zones from room configuration -->
        ${(()=>{const e=t.zones||[];return Ye("SmartHomeShop: Rendering zones count:",e.length,"entry lines:",e.filter(e=>"entry"===e.type).length),e.map(e=>{if(!e.points||e.points.length<2)return Y;if("entry"===e.type&&2===e.points.length){const t=e.points[0].x/1e3,i=e.points[0].y/1e3,a=e.points[1].x/1e3,o=e.points[1].y/1e3,r=(t+a)/2,n=(i+o)/2,s=a-t,l=o-i,c=Math.sqrt(s*s+l*l);if(c<.01)return Y;const d=-l/c,h=s/c,u="left"===(e.inDirection||"left")?1:-1,p=.12,m=.02,g=r+d*u*(p+m),v=n+h*u*(p+m),f=r-d*u*(p+m),y=n-h*u*(p+m);return B`
                <line x1="${t}" y1="${i}" x2="${a}" y2="${o}" stroke="#10b981" stroke-width="0.04" stroke-linecap="round"/>
                <line x1="${g}" y1="${v}" x2="${r-d*u*m}" y2="${n-h*u*m}" stroke="#22c55e" stroke-width="0.025" marker-end="url(#arrow-in)"/>
                <line x1="${f}" y1="${y}" x2="${r+d*u*m}" y2="${n+h*u*m}" stroke="#ef4444" stroke-width="0.025" marker-end="url(#arrow-out)"/>
                <text x="${g+d*u*.05}" y="${v+h*u*.05+.025}" fill="#22c55e" font-size="0.07" text-anchor="middle" font-weight="bold">IN</text>
                <text x="${f-d*u*.05}" y="${y-h*u*.05+.025}" fill="#ef4444" font-size="0.07" text-anchor="middle" font-weight="bold">UIT</text>
              `}if(e.points.length<3)return Y;const t=e.points.map((e,t)=>`${0===t?"M":"L"} ${e.x/1e3} ${e.y/1e3}`).join(" ")+" Z",i="detection"===e.type;return B`
              <path d="${t}" fill="none" stroke="${i?"#22c55e":"#ef4444"}" stroke-width="0.025"/>
            `})})()}
        <!-- Doors - same style as zones-page (purple) -->
        ${(()=>{const e=t.doors||[],i=o;return i.length<3?Y:e.map(e=>{if(e.wallIndex>=i.length)return Y;const t=i[e.wallIndex],a=i[(e.wallIndex+1)%i.length],o=t.x+(a.x-t.x)*e.position,r=t.y+(a.y-t.y)*e.position,n=Math.atan2(a.y-t.y,a.x-t.x),s=(e.width||800)/1e3/2;return B`
              <line
                x1="${o-Math.cos(n)*s}"
                y1="${r-Math.sin(n)*s}"
                x2="${o+Math.cos(n)*s}"
                y2="${r+Math.sin(n)*s}"
                stroke="#a855f7" stroke-width="0.06" stroke-linecap="round"
              />
            `})})()}
        <!-- Windows - same style as zones-page (light blue) -->
        ${(()=>{const e=t.windows||[],i=o;return i.length<3?Y:e.map(e=>{if(e.wallIndex>=i.length)return Y;const t=i[e.wallIndex],a=i[(e.wallIndex+1)%i.length],o=t.x+(a.x-t.x)*e.position,r=t.y+(a.y-t.y)*e.position,n=Math.atan2(a.y-t.y,a.x-t.x),s=(e.width||1e3)/1e3/2;return B`
              <line
                x1="${o-Math.cos(n)*s}"
                y1="${r-Math.sin(n)*s}"
                x2="${o+Math.cos(n)*s}"
                y2="${r+Math.sin(n)*s}"
                stroke="#0ea5e9" stroke-width="0.06" stroke-linecap="round"
              />
            `})})()}
        <!-- Furniture - same style as zones-page (gray) -->
        ${(()=>{const e=(t.furniture||[]).filter(e=>"number"==typeof e?.x&&"number"==typeof e?.y&&e?.width&&e?.height);return e.map(e=>{const t=e.x/1e3,i=e.y/1e3,a=e.width/1e3,o=e.height/1e3,r=et(e);return B`
                <g transform="translate(${t}, ${i}) rotate(${r})">
                  <rect x="${-a/2}" y="${-o/2}" width="${a}" height="${o}"
                        fill="#334155" stroke="#475569" stroke-width="0.02" rx="0.03"/>
                </g>
              `})})()}
        <!-- Sensor icon - same style as zones-page -->
        <circle cx="${k}" cy="${S}" r="0.15" fill="#3b82f6" stroke="#1d4ed8" stroke-width="0.02"/>
        <!-- Sensor direction indicator -->
        <line x1="${k}" y1="${S}"
              x2="${k+.2*Math.cos($)}" y2="${S+.2*Math.sin($)}"
              stroke="white" stroke-width="0.04" stroke-linecap="round"/>
        <!-- Targets - same style as zones-page (white circle with colored border) -->
        ${(()=>{const e=["#ef4444","#f97316","#eab308"];return C.map((t,i)=>{const a=t.x/1e3,o=t.y/1e3,r=k+o*Math.cos($)-a*Math.sin($),n=S+o*Math.sin($)+a*Math.cos($);if(isNaN(r)||isNaN(n))return Y;const s=e[i]||"#ef4444";return B`
              <g class="live-target">
                <!-- Outer ring with animation -->
                <circle cx="${r}" cy="${n}" r="0.15" fill="none" stroke="${s}" stroke-width="0.01" opacity="0.6">
                  <animate attributeName="r" values="0.15;0.25;0.15" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <!-- Main circle - white fill with colored border -->
                <circle cx="${r}" cy="${n}" r="0.1" fill="white" stroke="${s}" stroke-width="0.025"/>
                <!-- Number label - colored text -->
                <text x="${r}" y="${n+.035}" text-anchor="middle" fill="${s}" font-size="0.08" font-weight="bold">${i+1}</text>
              </g>
            `})})()}
      </svg>
    `}_getCo2Status(e){return e<600?{label:"Excellent",class:"excellent"}:e<800?{label:"Good",class:"good"}:e<1e3?{label:"Moderate",class:"moderate"}:e<1500?{label:"Poor",class:"poor"}:{label:"Unhealthy",class:"unhealthy"}}_setRoomViewMode(e){this._roomViewMode=e,"3d"===e&&setTimeout(()=>this._init3DView(),50)}_init3DView(){const e=this._rooms.find(e=>e.id===this._selectedRoomId);if(!e)return;const t=(e.walls||[]).map(e=>({x:e.x1,y:e.y1}));this._room3d.resetCamera(t),this._render3DView()}_render3DView(){const e=this.shadowRoot?.querySelector(".canvas-3d");if(!e)return;const t=this._rooms.find(e=>e.id===this._selectedRoomId);t&&this._room3d.render(e,this._buildScene3D(t))}_buildScene3D(e){const t=(e.walls||[]).map(e=>({x:e.x1,y:e.y1})),i=(e.furniture||[]).map(e=>({x:e.x,y:e.y,width:e.width,height:e.height||e.depth||e.width,rotation:et(e),name:e.name||e.typeId||"Furniture"})),a=this._roomSensor(e),o=a&&Number.isFinite(Number(a.x))&&Number.isFinite(Number(a.y))?[{x:Number(a.x),y:Number(a.y),rotation:Number.isFinite(Number(a.rotation))?Number(a.rotation):270,range:Number.isFinite(Number(a.range))?Number(a.range):6e3,fov:Number.isFinite(Number(a.fov))?Number(a.fov):120,heightMm:Number.isFinite(Number(a.heightMm))?Number(a.heightMm):2e3}]:[],r=a?this._targets.filter(e=>e.active&&Number.isFinite(e.x)&&Number.isFinite(e.y)).map(e=>{const t=((Number.isFinite(Number(a.rotation))?Number(a.rotation):270)-90)*Math.PI/180;return{x:Number(a.x)+e.y*Math.cos(t)-e.x*Math.sin(t),y:Number(a.y)+e.y*Math.sin(t)+e.x*Math.cos(t)}}):[];return{roomPoints:t,furniture:i,doors:e.doors||[],windows:e.windows||[],zones:e.zones||[],sensors:o,targets:r}}_getCo2BarPosition(e){return(Math.max(400,Math.min(2e3,e))-400)/1600*100}_getPm25Status(e){return e<=12?{label:"Excellent",labelEn:"Excellent",class:"excellent",color:"#4caf50"}:e<=35.4?{label:"Good",labelEn:"Good",class:"good",color:"#8bc34a"}:e<=55.4?{label:"Moderate",labelEn:"Moderate",class:"moderate",color:"#ffeb3b"}:e<=150.4?{label:"Unhealthy for Sensitive",labelEn:"Unhealthy for Sensitive",class:"unhealthy-sensitive",color:"#ff9800"}:e<=250.4?{label:"Unhealthy",labelEn:"Unhealthy",class:"unhealthy",color:"#f44336"}:e<=350.4?{label:"Very Unhealthy",labelEn:"Very Unhealthy",class:"very-unhealthy",color:"#9c27b0"}:{label:"Hazardous",labelEn:"Hazardous",class:"hazardous",color:"#880e4f"}}_getPm25BarPosition(e){return e<=12?e/12*8.3:e<=35.4?8.3+(e-12)/23.4*8.3:e<=55.4?16.6+(e-35.4)/20*8.4:e<=150.4?25+(e-55.4)/95*8.3:e<=250.4?33.3+(e-150.4)/100*16.7:e<=350.4?50+(e-250.4)/100*16.6:Math.min(100,66.6+(e-350.4)/150*33.4)}_hasAirQualityData(){const{pm1_0:e,pm2_5:t,pm4_0:i,pm10:a}=this._environment;return null!==e||null!==t||null!==i||null!==a}_findRoomQualityEntity(){if(!this.hass)return null;const e=[];for(const[t,i]of Object.entries(this.hass.states))t.startsWith("sensor.")&&t.includes("room_quality")&&!t.includes("label")&&!t.includes("percentage")&&void 0!==i.attributes?.recommendations&&void 0!==i.attributes?.color&&e.push({entityId:t,state:i});const t=this._config.device_id,i=this.hass.entities;if(t&&i){const a=e.find(e=>i[e.entityId]?.device_id===t);if(a)return Ye("SmartHomeShop: Found Room Quality entity:",a.entityId,"score:",a.state.state),a}const a=this._entityPrefix?e.find(e=>e.entityId.startsWith(`sensor.${this._entityPrefix}_`)):void 0;return a?(Ye("SmartHomeShop: Found Room Quality entity:",a.entityId,"score:",a.state.state),a):1!==e.length||t||this._entityPrefix?(Ye("SmartHomeShop: No Room Quality entity for this device, using local calculation"),null):(Ye("SmartHomeShop: Found Room Quality entity:",e[0].entityId,"score:",e[0].state.state),e[0])}_calculateRoomScore(){const e=this._findRoomQualityEntity();if(e){const{state:t}=e,i=parseFloat(t.state)||0,a=t.attributes||{},o=(a.recommendations||[]).map(e=>{let t="mdi:information";return e.includes("CO₂")||e.includes("Ventilat")?t="mdi:molecule-co2":e.includes("Particulate")||e.includes("dust")?t="mdi:weather-dust":e.includes("VOC")?t="mdi:air-purifier":e.includes("cool")||e.includes("cold")||e.includes("Warm up")?t="mdi:thermometer-low":e.includes("warm")||e.includes("hot")||e.includes("Cool down")?t="mdi:thermometer-high":e.includes("dry")?t="mdi:water-percent":e.includes("humid")&&(t="mdi:water-percent-alert"),{icon:t,text:e}}).slice(0,3);return{score:i,color:a.color||"#ffc107",label:a.label||"Unknown",recommendations:o}}return this._calculateRoomScoreLocal()}_calculateRoomScoreLocal(){const{temperature:e,humidity:t,co2:i,voc:a,pm2_5:o}=this._environment,r=[];let n=0,s=0;if(null!==i){let e=10;i>2e3?(e=1,r.push({icon:"mdi:molecule-co2",text:"Ventilate now!",priority:10})):i>1500?(e=3,r.push({icon:"mdi:molecule-co2",text:"CO₂ unhealthy, ventilate",priority:8})):i>1e3?(e=5,r.push({icon:"mdi:air-filter",text:"Ventilation recommended",priority:6})):i>800?e=7:i>600&&(e=9),n+=.3*e,s+=.3}if(null!==o){let e=10;o>150?(e=1,r.push({icon:"mdi:weather-dust",text:"Particulate matter dangerous!",priority:9})):o>55?(e=3,r.push({icon:"mdi:weather-dust",text:"Particulate matter high",priority:7})):o>35?(e=5,r.push({icon:"mdi:weather-dust",text:"Particulate matter elevated",priority:5})):o>12&&(e=7),n+=.25*e,s+=.25}if(null!==a){let e=10;a>400?(e=2,r.push({icon:"mdi:air-purifier",text:"High VOC, ventilate",priority:7})):a>250?(e=5,r.push({icon:"mdi:air-purifier",text:"Elevated VOC",priority:5})):a>150?e=7:a>100&&(e=9),n+=.15*e,s+=.15}if(null!==e){let t=10;e<16?(t=4,r.push({icon:"mdi:thermometer-low",text:"Warm up the room",priority:4})):e<18?(t=7,r.push({icon:"mdi:thermometer-low",text:"It is a bit cool",priority:2})):e>28?(t=3,r.push({icon:"mdi:thermometer-high",text:"Cool down the room",priority:4})):e>25?(t=6,r.push({icon:"mdi:thermometer-high",text:"It is a bit warm",priority:2})):e>22&&(t=8),n+=.15*t,s+=.15}if(null!==t){let e=10;t<25?(e=4,r.push({icon:"mdi:water-percent-alert",text:"Air too dry",priority:4})):t<35?(e=7,r.push({icon:"mdi:water-percent",text:"Air is dry",priority:2})):t>75?(e=4,r.push({icon:"mdi:water-percent-alert",text:"Air too humid",priority:4})):t>65&&(e=7,r.push({icon:"mdi:water-percent",text:"Air is humid",priority:2})),n+=.15*e,s+=.15}const l=s>0?n/s:0;let c="#22C55E",d="Excellent";l<4?(c="#EF4444",d="Poor"):l<5.5?(c="#F97316",d="Moderate"):l<7?(c="#F59E0B",d="Fair"):l<8.5&&(c="#84CC16",d="Good");const h=r.sort((e,t)=>t.priority-e.priority),u=h.slice(0,3).map(e=>({icon:e.icon,text:e.text}));return{score:l,color:c,label:d,recommendations:u}}_hasEnvironmentData(){const{temperature:e,humidity:t,co2:i,voc:a,nox:o,pm2_5:r}=this._environment;return null!==e||null!==t||null!==i||null!==a||null!==o||null!==r}_hasAnyEnvironmentEnabled(){const{temperature:e,humidity:t,co2:i,illuminance:a,voc:o,nox:r}=this._environment;return null!==e&&!1!==this._config.show_temperature||null!==t&&!1!==this._config.show_humidity||null!==i&&!1!==this._config.show_co2||null!==a&&!1!==this._config.show_illuminance||null!==o&&!1!==this._config.show_voc||null!==r&&!1!==this._config.show_nox}render(){if(!this.hass)return Y;if(!this._entityPrefix)return K`
        <ha-card>
          <div class="no-device">
            <ha-icon icon="mdi:radar"></ha-icon>
            <div>Select an UltimateSensor device</div>
            <div style="font-size: 0.8rem; margin-top: 8px;">
              Open the card editor to choose a device
            </div>
          </div>
      </ha-card>
      `;const e=this._targets.filter(e=>e.active).length,t=this._config.title||this._deviceName||"UltimateSensor",i=Ge(/mini/i.test(this._entityPrefix)?"ultimatesensor_mini":"ultimatesensor"),a=this._getOfflineInfo();if(a.offline)return K`
        <ha-card>
          ${!1!==this._config.show_header?K`
            <div class="header">
              <div class="header-left">
                <div class="header-icon">
                  ${i?xe(i):K`<ha-icon icon="mdi:radar"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${t}</h2>
                  <div class="header-subtitle">Presence &amp; climate</div>
                </div>
              </div>
              ${!1!==this._config.show_status?K`
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
              ${a.lastSeen?`Last seen ${We(a.lastSeen)}`:"Waiting for the device to reconnect"}
            </div>
            <div class="offline-hint">Check the power supply and Wi-Fi connection.</div>
          </div>
        </ha-card>
      `;const{temperature:o,humidity:r,co2:n,illuminance:s,voc:l,nox:c,pm1_0:d,pm2_5:h,pm4_0:u,pm10:p}=this._environment,m=null!==n?this._getCo2Status(n):null,g=this._hasEnvironmentData()&&!1!==this._config.show_room_score,v=!1!==this._config.show_environment&&this._hasAnyEnvironmentEnabled(),f=this._hasAirQualityData()&&!1!==this._config.show_air_quality,y=g||v||f;return K`
      <ha-card>
        ${!1!==this._config.show_header?K`
          <div class="header">
            <div class="header-left">
              <div class="header-icon ${e>0?"active":""}">
                ${i?xe(i):K`<ha-icon icon="mdi:radar"></ha-icon>`}
              </div>
              <div>
                <h2 class="header-title">${t}</h2>
                <div class="header-subtitle">Presence &amp; climate</div>
              </div>
            </div>
            ${!1!==this._config.show_status?K`
              <div class="status-badge ${e>0?"status-active":"status-ok"}">
                <ha-icon icon="${e>0?"mdi:motion-sensor":"mdi:motion-sensor-off"}"></ha-icon>
                <span>${e} ${1===e?"person":"people"}</span>
              </div>
            `:Y}
          </div>
        `:Y}

        ${g?(()=>{const e=this._calculateRoomScore();return K`
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
              ${e.recommendations.length>0?K`
                <div class="room-score-recommendations">
                  ${e.recommendations.map(e=>K`
                    <div class="recommendation-item"><ha-icon icon="${e.icon}"></ha-icon>${e.text}</div>
                  `)}
                </div>
              `:K`
                <div class="room-score-recommendations">
                  <div class="recommendation-item positive"><ha-icon icon="mdi:check-circle"></ha-icon>All values optimal</div>
                </div>
              `}
            </div>
          `})():Y}

        ${v?K`
          <div class="environment-section">
            <div class="environment-grid">
              ${null!==o&&!1!==this._config.show_temperature?K`
                <div class="env-card temperature" @click=${()=>this._fireMoreInfo(this._entityIds.temperature)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:thermometer"></ha-icon>
                    <span class="env-card-label">Temperature</span>
                  </div>
                  <div class="env-card-value">${o.toFixed(1)}<span>°C</span></div>
                  ${this._renderTrend("temperature",this._entityIds.temperature,"°C",1)}
                </div>
              `:Y}

              ${null!==r&&!1!==this._config.show_humidity?K`
                <div class="env-card humidity" @click=${()=>this._fireMoreInfo(this._entityIds.humidity)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:water-percent"></ha-icon>
                    <span class="env-card-label">Humidity</span>
                  </div>
                  <div class="env-card-value">${r.toFixed(0)}<span>%</span></div>
                  ${this._renderTrend("humidity",this._entityIds.humidity,"%")}
                </div>
              `:Y}

              ${null!==n&&!1!==this._config.show_co2?K`
                <div class="env-card co2" @click=${()=>this._fireMoreInfo(this._entityIds.co2)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:molecule-co2"></ha-icon>
                    <span class="env-card-label">CO₂</span>
                  </div>
                  <div class="env-card-value">${n.toFixed(0)}<span>ppm</span></div>
                  ${this._renderTrend("co2",this._entityIds.co2,"ppm")}
                </div>
              `:Y}

              ${null!==s&&!1!==this._config.show_illuminance?K`
                <div class="env-card illuminance" @click=${()=>this._fireMoreInfo(this._entityIds.illuminance)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:brightness-6"></ha-icon>
                    <span class="env-card-label">Illuminance</span>
                  </div>
                  <div class="env-card-value">${s.toFixed(0)}<span>lx</span></div>
                  ${this._renderTrend("illuminance",this._entityIds.illuminance,"lx")}
                </div>
              `:Y}

              ${null!==l&&!1!==this._config.show_voc?K`
                <div class="env-card voc" @click=${()=>this._fireMoreInfo(this._entityIds.voc)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:air-filter"></ha-icon>
                    <span class="env-card-label">VOC Index</span>
                  </div>
                  <div class="env-card-value">${l.toFixed(0)}<span></span></div>
                  ${this._renderTrend("voc",this._entityIds.voc,"")}
                </div>
              `:Y}

              ${null!==c&&!1!==this._config.show_nox?K`
                <div class="env-card nox" @click=${()=>this._fireMoreInfo(this._entityIds.nox)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:molecule"></ha-icon>
                    <span class="env-card-label">NOx Index</span>
                  </div>
                  <div class="env-card-value">${c.toFixed(0)}</div>
                  ${this._renderTrend("nox",this._entityIds.nox,"")}
                </div>
              `:Y}
            </div>

            ${null!==n&&m&&!1!==this._config.show_co2_bar?K`
              <div class="co2-quality" @click=${()=>this._fireMoreInfo(this._entityIds.co2)}>
                <div class="co2-quality-header">
                  <div class="co2-quality-label">
                    <ha-icon icon="mdi:molecule-co2"></ha-icon>
                    CO₂ Quality
                  </div>
                  <div class="co2-quality-status ${m.class}">${m.label}</div>
                </div>
                <div class="co2-bar-container">
                  <div class="co2-bar-indicator" style="left: calc(${this._getCo2BarPosition(n)}% - 2px)"></div>
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


        ${f?K`
          <div class="air-quality-section">
            <div class="air-quality-header">
              <div class="air-quality-title">
                <ha-icon icon="mdi:weather-dust"></ha-icon>
                Particulate matter (PM)
              </div>
              ${null!==h?K`
                <div class="air-quality-status ${this._getPm25Status(h).class}">
                  ${this._getPm25Status(h).label}
                </div>
              `:Y}
            </div>

            ${null!==h&&!1!==this._config.show_pm_gauge?K`
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

            ${!1!==this._config.show_pm_values?K`<div class="pm-grid">
              ${null!==d?K`
                <div class="pm-item pm1" @click=${()=>this._fireMoreInfo(this._entityIds.pm1_0)}>
                  <div class="pm-item-label">PM1.0</div>
                  <div class="pm-item-value">${d.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Y}
              ${null!==h?K`
                <div class="pm-item pm2_5" @click=${()=>this._fireMoreInfo(this._entityIds.pm2_5)}>
                  <div class="pm-item-label">PM2.5</div>
                  <div class="pm-item-value">${h.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Y}
              ${null!==u?K`
                <div class="pm-item pm4" @click=${()=>this._fireMoreInfo(this._entityIds.pm4_0)}>
                  <div class="pm-item-label">PM4.0</div>
                  <div class="pm-item-value">${u.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Y}
              ${null!==p?K`
                <div class="pm-item pm10" @click=${()=>this._fireMoreInfo(this._entityIds.pm10)}>
                  <div class="pm-item-label">PM10</div>
                  <div class="pm-item-value">${p.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              `:Y}
            </div>`:Y}

          </div>
        `:Y}

        ${!1!==this._config.show_radar?K`
          ${y?K`<div class="section-divider"></div>`:Y}

          <div class="radar-section">
            ${"room"===this._config.view_mode?K`
              <div
                class="room-view-container"
                style=${`--shs-room-view-height: ${ht(this._config.room_height)}px`}
              >
                ${this._renderRoomView()}
              </div>
            `:K`
              <div class="radar-container">
                <canvas class="radar-canvas"></canvas>
              </div>
            `}

            ${!1!==this._config.show_target_details?K`
              <div class="target-info">
                ${this._targets.map((e,t)=>K`
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
    `}}vt.styles=c`
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
      min-width: 0;
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
    .env-card.nox ha-icon { color: #ff7043; }
    .env-card.temperature .env-card-trend { color: #ff5722; }
    .env-card.humidity .env-card-trend { color: #2196f3; }
    .env-card.co2 .env-card-trend { color: #4caf50; }
    .env-card.illuminance .env-card-trend { color: #d89b00; }
    .env-card.voc .env-card-trend { color: #9c27b0; }
    .env-card.nox .env-card-trend { color: #ff7043; }
    .env-card-trend {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid color-mix(in srgb, var(--divider-color) 75%, transparent);
      color: var(--secondary-text-color);
    }
    .trend-summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 17px; }
    .trend-range { color: var(--secondary-text-color); font-size: 0.65rem; font-variant-numeric: tabular-nums; }
    .trend-chart { position: relative; margin-top: 4px; }
    .env-card-trend svg { display: block; width: 100%; height: 48px; overflow: visible; }
    .trend-grid { stroke: color-mix(in srgb, var(--divider-color) 72%, transparent); stroke-width: 1; vector-effect: non-scaling-stroke; }
    .trend-band { fill: currentColor; opacity: 0.11; }
    .trend-line { fill: none; stroke: currentColor; stroke-width: 1.8; vector-effect: non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; }
    .trend-end { fill: currentColor; }
    .trend-change { display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; font-size: 0.68rem; font-weight: 650; }
    .trend-change ha-icon { --mdc-icon-size: 14px; color: currentColor; }
    .trend-axis { display: flex; justify-content: space-between; margin-top: 1px; color: var(--secondary-text-color); font-size: 0.58rem; line-height: 1; opacity: 0.85; }

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
      height: var(--shs-room-view-height, 360px);
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
    .room-floorplan { width: 100%; height: var(--shs-room-view-height, 360px); }
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
  `,a([ve({attribute:!1})],vt.prototype,"hass",void 0),a([fe()],vt.prototype,"_config",void 0),a([fe()],vt.prototype,"_targets",void 0),a([fe()],vt.prototype,"_zones",void 0),a([fe()],vt.prototype,"_environment",void 0),a([fe()],vt.prototype,"_entityPrefix",void 0),a([fe()],vt.prototype,"_radarPrefix",void 0),a([fe()],vt.prototype,"_deviceName",void 0),a([fe()],vt.prototype,"_entityIds",void 0),a([fe()],vt.prototype,"_showSettings",void 0),a([fe()],vt.prototype,"_rooms",void 0),a([fe()],vt.prototype,"_selectedRoomId",void 0),a([fe()],vt.prototype,"_roomsError",void 0),a([fe()],vt.prototype,"_roomViewMode",void 0),a([fe()],vt.prototype,"_trends",void 0);class ft extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={},this._devices=[],this._rooms=[],this._roomsLoaded=!1,this._roomsError=null}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&(this._findDevices(),this._loadRooms())}async _loadRooms(){if(this.hass&&!this._roomsLoaded)try{const e=await this.hass.callWS({type:"smarthomeshop/rooms"});this._rooms=Array.isArray(e?.rooms)?e.rooms:[],this._roomsError=null}catch(e){console.error("SmartHomeShop: Could not load rooms in card editor:",e),this._rooms=[],this._roomsError="Rooms could not be loaded right now."}finally{this._roomsLoaded=!0}}_automaticRoom(){return dt(this._rooms,[this._config.device_id])}_findDevices(){if(!this.hass?.devices||!this.hass?.entities)return;const e=[];for(const[t,i]of Object.entries(this.hass.devices)){const a=Object.entries(this.hass.entities).filter(([e,i])=>i.device_id===t).map(([e])=>e),o=a.some(e=>e.includes("target_1_x")),r=a.some(e=>e.includes("scd41")||e.includes("bh1750")||e.includes("co2"));(o||r)&&e.push({id:t,name:i.name||i.name_by_user||"UltimateSensor"})}this._devices=e}_valueChanged(e,t){const i={...this._config,[e]:t};"device_id"===e&&(delete i.entity_prefix,delete i.room_id),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}_trendHoursChanged(e){const t=e.target,i=mt(t.value);t.value=String(i),this._valueChanged("trend_hours",i)}render(){return K`
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
          ${this._devices.map(e=>K`
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
          ${!1!==this._config.show_header?K`
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
          ${!1!==this._config.show_environment?K`
            <div class="nested-options">
              ${[["show_temperature","Temperature"],["show_humidity","Humidity"],["show_co2","CO2"],["show_illuminance","Illuminance"],["show_voc","VOC index"],["show_nox","NOx index"]].map(([e,t])=>K`
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
              <div class="trend-settings">
                <div class="trend-settings-head">
                  <div class="checkbox-row">
                    <input type="checkbox" id="show_trends" .checked=${!1!==this._config.show_trends}
                      @change=${e=>this._valueChanged("show_trends",e.target.checked)} />
                    <label for="show_trends">Value graphs</label>
                  </div>
                  <div class="trend-settings-note">Home Assistant Recorder history</div>
                </div>
                ${!1!==this._config.show_trends?K`
                  <div class="trend-details">
                    <div class="trend-hours-row">
                      <div class="trend-hours-label">
                        History range
                        <div class="trend-hours-hint">Show the latest 1–168 hours</div>
                      </div>
                      <div class="trend-hours-control">
                        <input id="trend_hours" type="number" min="1" max="168" step="1"
                          aria-label="Number of hours shown in value graphs"
                          .value=${String(mt(this._config.trend_hours))}
                          @input=${this._trendHoursChanged} />
                        <span class="trend-hours-unit">hours</span>
                      </div>
                    </div>
                    <div class="trend-sensor-title">Graphs shown</div>
                    <div class="trend-sensor-grid">
                      ${pt.map(e=>{const t=!1!==this._config[e.visibilityKey];return K`
                          <label class="trend-sensor-toggle ${t?"":"disabled"}"
                            title=${t?`Show ${e.label} graph`:`Enable ${e.label} first`}>
                            <input type="checkbox" id=${String(e.trendKey)}
                              .checked=${!1!==this._config[e.trendKey]}
                              ?disabled=${!t}
                              aria-label="Show ${e.label} graph"
                              @change=${t=>this._valueChanged(String(e.trendKey),t.target.checked)} />
                            <span>${e.label}</span>
                          </label>
                        `})}
                    </div>
                  </div>
                `:Y}
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
          ${!1!==this._config.show_air_quality?K`
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
          ${!1!==this._config.show_radar?K`
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

      ${!1!==this._config.show_radar?K`
        <div class="divider"></div>

        <div class="form-row">
          <label>View mode</label>
          <select @change=${e=>this._valueChanged("view_mode",e.target.value)}>
            <option value="radar" ?selected=${"room"!==this._config.view_mode}>Radar view</option>
            <option value="room" ?selected=${"room"===this._config.view_mode}>Room view</option>
          </select>
          <div class="info">Radar shows the sensor view. Room shows your drawn room with live tracking.</div>
        </div>

        ${"room"===this._config.view_mode?K`
          <div class="form-row">
            <label>Room</label>
            <select
              aria-label="Room shown for this UltimateSensor"
              @change=${e=>this._valueChanged("room_id",e.target.value||void 0)}
            >
              <option value="" ?selected=${!this._config.room_id}>
                Automatic${this._automaticRoom()?.name?` — ${this._automaticRoom()?.name}`:""}
              </option>
              ${this._rooms.map(e=>K`
                <option value=${e.id} ?selected=${this._config.room_id===e.id}>
                  ${e.name||"Unnamed room"}
                </option>
              `)}
            </select>
            <div class="info">
              ${this._roomsError?this._roomsError:this._roomsLoaded?"Automatic uses the Room Designer room linked to this exact Home Assistant device.":"Loading rooms…"}
            </div>
          </div>

          <div class="form-row">
            <label>Default room view</label>
            <select @change=${e=>this._valueChanged("room_view_mode",e.target.value)}>
              <option value="2d" ?selected=${"3d"!==this._config.room_view_mode}>2D floor plan</option>
              <option value="3d" ?selected=${"3d"===this._config.room_view_mode}>3D view</option>
            </select>
            <div class="info">The view the card starts in. You can still switch views on the card.</div>
          </div>

          <div class="form-row">
            <label>Room view height</label>
            <select
              aria-label="Height of the room visual"
              @change=${e=>this._valueChanged("room_height",Number(e.target.value))}
            >
              <option value="300" ?selected=${300===ht(this._config.room_height)}>Compact — 300 px</option>
              <option value="360" ?selected=${360===ht(this._config.room_height)}>Standard — 360 px</option>
              <option value="480" ?selected=${480===ht(this._config.room_height)}>Large — 480 px</option>
              <option value="600" ?selected=${600===ht(this._config.room_height)}>Extra large — 600 px</option>
            </select>
            <div class="info">In a Sections dashboard you can also drag the card wider. The card requests the full row by default.</div>
          </div>
        `:Y}

        ${"room"!==this._config.view_mode?K`
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
    `}}ft.styles=c`
    :host { display: block; container-type: inline-size; }
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
    .trend-settings {
      margin-top: 11px;
      padding-top: 11px;
      border-top: 1px solid var(--divider-color);
    }
    .trend-settings-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .trend-settings-head .checkbox-row { margin-bottom: 0; }
    .trend-settings-note {
      color: var(--secondary-text-color);
      font-size: 11px;
      line-height: 1.35;
      text-align: right;
    }
    .trend-details {
      margin-top: 11px;
      padding-left: 26px;
    }
    .trend-hours-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 11px;
    }
    .trend-hours-label {
      min-width: 0;
      color: var(--primary-text-color);
      font-size: 12px;
      font-weight: 500;
    }
    .trend-hours-hint {
      margin-top: 2px;
      color: var(--secondary-text-color);
      font-size: 10.5px;
      font-weight: 400;
    }
    .trend-hours-control {
      display: flex;
      align-items: stretch;
      flex: 0 0 auto;
      overflow: hidden;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
    }
    .trend-hours-control:focus-within { border-color: var(--primary-color); }
    .trend-hours-control input[type='number'] {
      width: 62px;
      padding: 7px 8px;
      border: 0;
      border-radius: 0;
      text-align: right;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
    .trend-hours-control input[type='number']:focus { border-color: transparent; }
    .trend-hours-unit {
      display: flex;
      align-items: center;
      padding: 0 9px;
      border-left: 1px solid var(--divider-color);
      color: var(--secondary-text-color);
      background: var(--secondary-background-color);
      font-size: 11px;
    }
    .trend-sensor-title {
      margin-bottom: 6px;
      color: var(--secondary-text-color);
      font-size: 10px;
      font-weight: 650;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .trend-sensor-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }
    .trend-sensor-toggle {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
      margin: 0;
      padding: 7px 8px;
      border-radius: 7px;
      background: color-mix(in srgb, var(--primary-color) 4%, var(--card-background-color));
      color: var(--primary-text-color);
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
    }
    .trend-sensor-toggle input { width: 16px; height: 16px; flex: 0 0 auto; margin: 0; }
    .trend-sensor-toggle span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .trend-sensor-toggle.disabled { opacity: 0.46; cursor: not-allowed; }
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
    @container (max-width: 360px) {
      .trend-settings-head, .trend-hours-row { align-items: stretch; flex-direction: column; }
      .trend-settings-note { text-align: left; }
      .trend-hours-control { align-self: flex-start; }
      .trend-sensor-grid { grid-template-columns: 1fr; }
    }
  `,a([ve({attribute:!1})],ft.prototype,"hass",void 0),a([fe()],ft.prototype,"_config",void 0),a([fe()],ft.prototype,"_devices",void 0),a([fe()],ft.prototype,"_rooms",void 0),a([fe()],ft.prototype,"_roomsLoaded",void 0),a([fe()],ft.prototype,"_roomsError",void 0);const yt=e=>String(e??"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g," ").trim(),bt=e=>yt(e).replace(/\s+/g,""),wt=e=>{const t=(e.identifiers??[]).flatMap(e=>e).join(" ");return yt([e.name,e.name_by_user,e.model,e.manufacturer,t].join(" "))},xt=(e,t)=>{const i=bt(e);return!t.exclude?.some(e=>i.includes(bt(e)))&&t.aliases.some(e=>i.includes(bt(e)))},_t=(e,t)=>{if(!e?.devices)return[];const i=new Map;for(const a of Object.values(e.devices))xt(wt(a),t)&&i.set(a.id,a);if(e.entities)for(const[a,o]of Object.entries(e.entities)){if(!o.device_id)continue;const r=e.states[a],n=`${a} ${r?.attributes.friendly_name??""}`;if(!xt(n,t))continue;const s=e.devices[o.device_id];s&&i.set(s.id,s)}return[...i.values()].sort((e,t)=>kt(e).localeCompare(kt(t)))},kt=e=>e?.name_by_user||e?.name||e?.model||"SmartHomeShop device",St=(e,t,i)=>t&&e?.devices?.[t]?e.devices[t]:_t(e,i)[0],Ct=e=>(e??[]).map(bt).filter(Boolean),$t=(e,t)=>{const[i,a=""]=e.entityId.split(".",2);if(t.domains&&!t.domains.includes(i))return-1;const o=String(e.state.attributes.friendly_name??""),r=bt(a),n=bt(o),s=`${r}${n}`;if(Ct(t.excludes).some(e=>s.includes(e)))return-1;let l=0,c=!1;const d=Ct(t.suffixes);for(const e of d)r.endsWith(e)?(l=Math.max(l,120+e.length),c=!0):n.endsWith(e)&&(l=Math.max(l,105+e.length),c=!0);const h=Ct(t.exactNames);for(const e of h)r!==e&&n!==e||(l=Math.max(l,140+e.length),c=!0);const u=Ct(t.includesAll);u.length>0&&u.every(e=>s.includes(e))&&(l=Math.max(l,70+u.reduce((e,t)=>e+t.length,0)),c=!0);const p=Ct(t.includesAny).filter(e=>s.includes(e));p.length>0&&(l=Math.max(l,40+p.reduce((e,t)=>e+t.length,0)),c=!0);const m=bt(e.state.attributes.device_class);Ct(t.deviceClasses).includes(m)&&(l+=18,c=!0);const g=bt(e.state.attributes.unit_of_measurement);return Ct(t.units).includes(g)&&(l+=8,c=!0),c?("unknown"!==e.state.state&&"unavailable"!==e.state.state&&(l+=4),"esphome"===e.registry?.platform&&(l+=2),l):-1},zt=(e,t,i,a)=>{if(!e)return;let o;for(const r of((e,t,i)=>{const a=[];for(const[o,r]of Object.entries(e.states)){const n=e.entities?.[o];if(!t||!e.entities||n?.device_id===t){if(!t&&i){const e=`${o} ${r.attributes.friendly_name??""}`;if(!xt(e,i))continue}a.push({entityId:o,state:r,registry:n})}}return a})(e,t,a)){const e=$t(r,i);e<0||o&&o.score>=e||(o={entityId:r.entityId,score:e})}return o?.entityId},Et=(e,t)=>{if(!e||!t)return null;const i=e.states[t]?.state;if(!i||"unknown"===i||"unavailable"===i)return null;const a=Number(i);return Number.isFinite(a)?a:null},Pt=(e,t)=>{if(!e||!t)return null;const i=e.states[t]?.state;return i&&"unknown"!==i&&"unavailable"!==i?!!["on","home","open","detected","occupied","true"].includes(i.toLowerCase())||!["off","not_home","closed","clear","idle","false"].includes(i.toLowerCase())&&null:null},Mt=(e,t)=>t&&e?.states[t]?.attributes.unit_of_measurement||"",At=(e,t)=>{if(!e||!t||!e.entities)return{offline:!1,lastSeen:null,hasEntities:!1};let i=!1,a=!1,o=null,r=null;for(const[n,s]of Object.entries(e.entities)){if(s.device_id!==t||s.disabled_by)continue;const l=e.states[n];if(l)if(i=!0,"connectivity"!==l.attributes.device_class)"esphome"===s.platform&&"unavailable"!==l.state&&(a=!0),l.last_changed&&(!o||l.last_changed>o)&&(o=l.last_changed);else{if("on"===l.state)return{offline:!1,lastSeen:null,hasEntities:!0};"off"===l.state&&(r=l.last_changed)}}return r?{offline:!0,lastSeen:r,hasEntities:i}:{offline:i&&!a,lastSeen:o,hasEntities:i}},Lt=(e,t=0,i="-")=>null===e?i:new Intl.NumberFormat(void 0,{minimumFractionDigits:t,maximumFractionDigits:t}).format(e),Nt=e=>{if(null===e)return{value:"-",unit:"W"};const t=Math.abs(e);return t>=1e3?{value:Lt(t/1e3,t>=1e4?1:2),unit:"kW"}:{value:Lt(t,0),unit:"W"}},Tt={aliases:["p1meterkit","p1 meter kit"],exclude:["waterp1meterkit","water p1 meter kit"]},Dt={show_header:!0,show_status:!0,show_power_flow:!0,show_energy_totals:!0,show_phases:!0,show_insights:!0,show_gas:!0,show_environment:!0};class Ht extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={...Dt},this._cachedEntities={}}setConfig(e){this._config={...Dt,...e},this._cachedDeviceId=void 0}getCardSize(){return 6}static getConfigElement(){return document.createElement("smarthomeshop-p1meterkit-card-editor")}static getStubConfig(){return{...Dt}}_device(){return St(this.hass,this._config.device_id,Tt)}_resolveEntities(){const e=this._device(),t=e?.id;if(this._cachedDeviceId===t&&this._cachedRegistry===this.hass?.entities)return this._cachedEntities;const i=e=>zt(this.hass,t,e,Tt);return this._cachedEntities={connectivity:i({domains:["binary_sensor"],deviceClasses:["connectivity"]}),powerConsumed:i({domains:["sensor"],suffixes:["power_consumed"],excludes:["phase","net"]}),powerProduced:i({domains:["sensor"],suffixes:["power_produced"],excludes:["phase"]}),netPower:i({domains:["sensor"],suffixes:["net_grid_power_cc","net_power_cc"],includesAll:["net","power"]}),consumedTariff1:i({domains:["sensor"],suffixes:["energy_consumed_tariff_1"]}),consumedTariff2:i({domains:["sensor"],suffixes:["energy_consumed_tariff_2"]}),producedTariff1:i({domains:["sensor"],suffixes:["energy_produced_tariff_1"]}),producedTariff2:i({domains:["sensor"],suffixes:["energy_produced_tariff_2"]}),currentPhase1:i({domains:["sensor"],suffixes:["current_phase_1"]}),currentPhase2:i({domains:["sensor"],suffixes:["current_phase_2"]}),currentPhase3:i({domains:["sensor"],suffixes:["current_phase_3"]}),powerPhase1:i({domains:["sensor"],suffixes:["power_consumed_phase_1"]}),powerPhase2:i({domains:["sensor"],suffixes:["power_consumed_phase_2"]}),powerPhase3:i({domains:["sensor"],suffixes:["power_consumed_phase_3"]}),standbyPower:i({domains:["sensor"],suffixes:["standby_power_cc"]}),standbyCost:i({domains:["sensor"],suffixes:["standby_cost_per_year_cc","standby_cost_year_cc"]}),monthPeak:i({domains:["sensor"],suffixes:["month_peak_cc"]}),costToday:i({domains:["sensor"],suffixes:["energy_cost_today_cc"]}),costMonth:i({domains:["sensor"],suffixes:["energy_cost_this_month_cc","energy_cost_month_cc"]}),phaseMaxLoad:i({domains:["sensor"],suffixes:["highest_phase_load_cc","phase_max_load_cc"]}),availableGridPower:i({domains:["sensor"],suffixes:["available_grid_power_cc"]}),gas:i({domains:["sensor"],suffixes:["gas_consumed"],deviceClasses:["gas"]}),temperature:i({domains:["sensor"],suffixes:["temperature"],deviceClasses:["temperature"],excludes:["cpu"]}),humidity:i({domains:["sensor"],suffixes:["humidity"],deviceClasses:["humidity"]})},this._cachedDeviceId=t,this._cachedRegistry=this.hass?.entities,this._cachedEntities}_watts(e){const t=Et(this.hass,e);return null===t?null:"kw"===Mt(this.hass,e).toLowerCase()?1e3*t:t}_metric(e,t,i=2,a){const o=Et(this.hass,t);if(null===o)return Y;const r=a??Mt(this.hass,t);return K`
      <button class="metric" type="button" @click=${()=>t&&je(this,t)}>
        <div class="metric-label">${e}</div>
        <div class="metric-value">${Lt(o,i)}<span>${r}</span></div>
      </button>
    `}_phase(e,t,i,a){const o=Et(this.hass,t),r=this._watts(i);if(null===o&&null===r)return Y;const n=null===o||a<=0?0:Math.min(100,o/a*100),s=Nt(r);return K`
      <div class="phase">
        <div class="phase-top">
          <span class="phase-name">${e}</span>
          <span class="phase-current">${Lt(o,1)}<span>A</span></span>
        </div>
        <div class="phase-bar"><span style="width:${n}%"></span></div>
        <div class="phase-power">${s.value} ${s.unit}</div>
      </div>
    `}render(){if(!this.hass)return Y;const e=this._device(),t=this._resolveEntities(),i=Ge("p1meterkit");if(!e)return K`
        <ha-card>
          <div class="card-content">
            <div class="empty-state">
              ${i?K`<span class="product-logo">${xe(i)}</span>`:K`<ha-icon icon="mdi:meter-electric-outline"></ha-icon>`}
              <strong>No P1MeterKit found</strong>
              <span>Add the P1MeterKit to Home Assistant or select its device in the card editor.</span>
            </div>
          </div>
        </ha-card>
      `;const a=At(this.hass,e.id),o=this._watts(t.powerConsumed)??0,r=this._watts(t.powerProduced)??0,n=this._watts(t.netPower)??o-r,s=n>10?"importing":n<-10?"exporting":"balanced",l="importing"===s?"Importing":"exporting"===s?"Exporting":"Balanced",c=Nt(n),d=Nt(o),h=Nt(r),u=[Et(this.hass,t.currentPhase1),Et(this.hass,t.currentPhase2),Et(this.hass,t.currentPhase3)],p=Math.max(1,...u.map(e=>e??0)),m=u.some(e=>null!==e),g=[t.consumedTariff1,t.consumedTariff2,t.producedTariff1,t.producedTariff2].some(e=>null!==Et(this.hass,e)),v=[t.costToday,t.costMonth,t.standbyPower,t.standbyCost,t.monthPeak,t.phaseMaxLoad,t.availableGridPower].some(e=>null!==Et(this.hass,e)),f=null!==Et(this.hass,t.temperature)||null!==Et(this.hass,t.humidity);return K`
      <ha-card>
        <div class="card-content">
          ${!1!==this._config.show_header?K`
            <div class="header">
              <div class="header-left">
                <div class="header-icon">
                  ${i?xe(i):K`<ha-icon icon="mdi:meter-electric-outline"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${this._config.title||kt(e)}</h2>
                  <div class="header-subtitle">Energy monitoring</div>
                </div>
              </div>
              ${!1!==this._config.show_status?K`
                <div class="status-badge ${a.offline?"offline":s}">
                  <ha-icon icon="${a.offline?"mdi:lan-disconnect":"exporting"===s?"mdi:transmission-tower-export":"importing"===s?"mdi:transmission-tower-import":"mdi:check-circle"}"></ha-icon>
                  <span>${a.offline?"Offline":l}</span>
                </div>
              `:Y}
            </div>
          `:Y}

          ${!1!==this._config.show_power_flow?K`
            <div class="power-flow">
              <button class="power-side" type="button" @click=${()=>t.powerConsumed&&je(this,t.powerConsumed)}>
                <div class="power-label"><ha-icon icon="mdi:transmission-tower-import"></ha-icon>From grid</div>
                <div class="power-reading">${d.value}<span>${d.unit}</span></div>
              </button>
              <div class="net-power">
                <div class="net-icon"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></div>
                <div class="net-value">${c.value} ${c.unit}</div>
                <div class="net-caption">${l}</div>
              </div>
              <button class="power-side export" type="button" @click=${()=>t.powerProduced&&je(this,t.powerProduced)}>
                <div class="power-label">To grid<ha-icon icon="mdi:transmission-tower-export"></ha-icon></div>
                <div class="power-reading">${h.value}<span>${h.unit}</span></div>
              </button>
            </div>
          `:Y}

          ${!1!==this._config.show_phases&&m?K`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:sine-wave"></ha-icon>Phase load</div>
              <div class="phase-grid">
                ${this._phase("L1",t.currentPhase1,t.powerPhase1,p)}
                ${this._phase("L2",t.currentPhase2,t.powerPhase2,p)}
                ${this._phase("L3",t.currentPhase3,t.powerPhase3,p)}
              </div>
            </section>
          `:Y}

          ${!1!==this._config.show_energy_totals&&g?K`
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

          ${!1!==this._config.show_insights&&v?K`
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

          ${!1!==this._config.show_gas&&null!==Et(this.hass,t.gas)?K`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:fire"></ha-icon>Gas</div>
              <div class="metric-grid">${this._metric("Total gas consumed",t.gas,3)}</div>
            </section>
          `:Y}

          ${!1!==this._config.show_environment&&f?K`
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
    `}}Ht.styles=[Ve,c`
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
    `],a([ve({attribute:!1})],Ht.prototype,"hass",void 0),a([fe()],Ht.prototype,"_config",void 0);class Rt extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={...Dt}}setConfig(e){this._config={...Dt,...e}}_change(e,t){this._config={...this._config,[e]:t},this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}render(){const e=_t(this.hass,Tt);return K`
      <div class="editor">
        <div class="field">
          <label for="device">P1MeterKit device</label>
          <select id="device" .value=${this._config.device_id??""} @change=${e=>this._change("device_id",e.target.value)}>
            <option value="">Automatic</option>
            ${e.map(e=>K`<option value=${e.id}>${kt(e)}</option>`)}
          </select>
          <div class="hint">The card links entities through the Home Assistant device registry, so renamed entity IDs keep working.</div>
        </div>
        <div class="field">
          <label for="title">Card title</label>
          <input id="title" type="text" .value=${this._config.title??""} placeholder="Use device name" @input=${e=>this._change("title",e.target.value)}>
        </div>
        <div class="options">
          <div class="group-title">Visible sections</div>
          ${[["show_header","Header"],["show_status","Connection and grid status"],["show_power_flow","Live import and export"],["show_phases","Phase load"],["show_energy_totals","Meter totals"],["show_insights","Costs, peak and standby insights"],["show_gas","Gas meter"],["show_environment","Meter temperature and humidity"]].map(([e,t])=>K`
            <label class="check">
              <input type="checkbox" .checked=${!1!==this._config[e]} @change=${t=>this._change(e,t.target.checked)}>
              <span>${t}</span>
            </label>
          `)}
        </div>
      </div>
    `}}Rt.styles=c`
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
  `,a([ve({attribute:!1})],Rt.prototype,"hass",void 0),a([fe()],Rt.prototype,"_config",void 0);const Wt={aliases:["ceilsense","ceil sense"]},It={show_header:!0,show_status:!0,show_presence:!0,show_zones:!0,show_distances:!0,show_environment:!0,show_room_quality:!0};class jt extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={...It},this._cachedEntities={zoneCounts:[],zoneOccupancy:[]}}setConfig(e){this._config={...It,...e},this._cachedDeviceId=void 0}getCardSize(){return 6}static getConfigElement(){return document.createElement("smarthomeshop-ceilsense-card-editor")}static getStubConfig(){return{...It}}_device(){return St(this.hass,this._config.device_id,Wt)}_resolveEntities(){const e=this._device(),t=e?.id;if(this._cachedDeviceId===t&&this._cachedRegistry===this.hass?.entities)return this._cachedEntities;const i=e=>zt(this.hass,t,e,Wt);return this._cachedEntities={presence:i({domains:["binary_sensor"],suffixes:["presence","occupancy"],includesAny:["presence","occupancy"],excludes:["zone"]}),movingTarget:i({domains:["binary_sensor"],suffixes:["moving_target"]}),stillTarget:i({domains:["binary_sensor"],suffixes:["still_target"]}),targetCount:i({domains:["sensor"],suffixes:["target_count"],excludes:["zone","moving","still"]}),movingTargetCount:i({domains:["sensor"],suffixes:["moving_target_count"]}),stillTargetCount:i({domains:["sensor"],suffixes:["still_target_count"]}),movingDistance:i({domains:["sensor"],suffixes:["moving_distance"]}),stillDistance:i({domains:["sensor"],suffixes:["still_distance"]}),detectionDistance:i({domains:["sensor"],suffixes:["detection_distance"]}),moveEnergy:i({domains:["sensor"],suffixes:["move_energy"]}),stillEnergy:i({domains:["sensor"],suffixes:["still_energy"]}),target1X:i({domains:["sensor"],suffixes:["target_1_x"]}),target1Y:i({domains:["sensor"],suffixes:["target_1_y"]}),target2X:i({domains:["sensor"],suffixes:["target_2_x"]}),target2Y:i({domains:["sensor"],suffixes:["target_2_y"]}),target3X:i({domains:["sensor"],suffixes:["target_3_x"]}),target3Y:i({domains:["sensor"],suffixes:["target_3_y"]}),zoneCounts:[1,2,3,4].map(e=>i({domains:["sensor"],suffixes:[`zone_${e}_target_count`]})),zoneOccupancy:[1,2,3,4].map(e=>i({domains:["binary_sensor"],suffixes:[`zone_${e}_occupancy`,`zone_${e}_presence`]})),temperature:i({domains:["sensor"],suffixes:["scd41_temperature","temperature"],deviceClasses:["temperature"],excludes:["cpu","bmp"]}),humidity:i({domains:["sensor"],suffixes:["scd41_humidity","humidity"],deviceClasses:["humidity"]}),co2:i({domains:["sensor"],suffixes:["scd41_co2","co2"],deviceClasses:["carbon_dioxide"]}),illuminance:i({domains:["sensor"],suffixes:["bh1750_illuminance","illuminance"],deviceClasses:["illuminance"]}),pressure:i({domains:["sensor"],suffixes:["pressure"],deviceClasses:["atmospheric_pressure"]}),roomQualityScore:i({domains:["sensor"],suffixes:["room_quality_score_cc","room_quality_percentage_cc"]}),roomQualityLabel:i({domains:["sensor"],suffixes:["room_quality_label_cc"]})},this._cachedDeviceId=t,this._cachedRegistry=this.hass?.entities,this._cachedEntities}_metric(e,t,i,a=0){const o=Et(this.hass,i);return null===o?Y:K`
      <button class="metric" type="button" @click=${()=>i&&je(this,i)}>
        <div class="metric-head">
          <div class="metric-icon"><ha-icon icon=${t}></ha-icon></div>
          <div class="metric-label">${e}</div>
        </div>
        <div class="metric-value">${Lt(o,a)}<span>${Mt(this.hass,i)}</span></div>
      </button>
    `}_targetPositions(e,t){const i=[[e.target1X,e.target1Y],[e.target2X,e.target2Y],[e.target3X,e.target3Y]].flatMap(([e,t])=>{const i=Et(this.hass,e),a=Et(this.hass,t);return null===i||null===a||0===i&&0===a?[]:[{left:Math.max(10,Math.min(90,50+i/6e3*45)),top:Math.max(12,Math.min(78,84-a/6e3*70))}]});return 0===i.length&&t?[{left:50,top:38}]:i}render(){if(!this.hass)return Y;const e=this._device(),t=this._resolveEntities(),i=Ge("ceilsense");if(!e)return K`
        <ha-card>
          <div class="card-content">
            <div class="empty-state">
              ${i?K`<span class="product-logo">${xe(i)}</span>`:K`<ha-icon icon="mdi:ceiling-light-outline"></ha-icon>`}
              <strong>No CeilSense found</strong>
              <span>Add a CeilSense to Home Assistant or select its device in the card editor.</span>
            </div>
          </div>
        </ha-card>
      `;const a=At(this.hass,e.id),o=!0===Pt(this.hass,t.presence),r=!0===Pt(this.hass,t.movingTarget),n=!0===Pt(this.hass,t.stillTarget),s=Et(this.hass,t.targetCount)??(Et(this.hass,t.movingTargetCount)??0)+(Et(this.hass,t.stillTargetCount)??0),l=((e,t)=>{if(!e||!t)return null;const i=e.states[t]?.last_changed;if(!i)return null;const a=Math.max(0,Date.now()-new Date(i).getTime()),o=Math.floor(a/6e4);if(o<1)return"just now";if(o<60)return`${o} min ago`;const r=Math.floor(o/60);return r<24?`${r} h ago`:`${Math.floor(r/24)} d ago`})(this.hass,t.presence),c=this._targetPositions(t,o),d=t.zoneCounts.map((e,i)=>{const a=Et(this.hass,e),o=!0===Pt(this.hass,t.zoneOccupancy[i])||(a??0)>0;return{entityId:e??t.zoneOccupancy[i],count:a,active:o,index:i+1}}).filter(e=>e.entityId),h=[t.movingDistance,t.stillDistance,t.detectionDistance,t.moveEnergy,t.stillEnergy].some(e=>null!==Et(this.hass,e)),u=[t.temperature,t.humidity,t.co2,t.illuminance,t.pressure].some(e=>null!==Et(this.hass,e)),p=Et(this.hass,t.roomQualityScore),m=t.roomQualityLabel?this.hass.states[t.roomQualityLabel]?.state:void 0;return K`
      <ha-card>
        <div class="card-content">
          ${!1!==this._config.show_header?K`
            <div class="header">
              <div class="header-left">
                <div class="header-icon">
                  ${i?xe(i):K`<ha-icon icon="mdi:ceiling-light-outline"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${this._config.title||kt(e)}</h2>
                  <div class="header-subtitle">Ceiling presence & climate</div>
                </div>
              </div>
              ${!1!==this._config.show_status?K`
                <div class="status-badge ${a.offline?"offline":o?"occupied":"clear"}">
                  <ha-icon icon="${a.offline?"mdi:lan-disconnect":o?"mdi:account-radar":"mdi:check-circle"}"></ha-icon>
                  <span>${a.offline?"Offline":o?"Occupied":"Clear"}</span>
                </div>
              `:Y}
            </div>
          `:Y}

          ${!1!==this._config.show_presence?K`
            <div class="presence-panel">
              <div class="presence-copy">
                <div class="presence-kicker"><ha-icon icon="mdi:motion-sensor"></ha-icon>Live presence</div>
                <div class="presence-title">${o?`${Lt(s,0)} ${1===s?"person":"people"}`:"Room clear"}</div>
                <div class="presence-detail">${l?`Changed ${l}`:"Waiting for presence data"}</div>
                <div class="presence-types">
                  <span class="presence-chip ${r?"active":""}"><ha-icon icon="mdi:run"></ha-icon>Moving</span>
                  <span class="presence-chip ${n?"active":""}"><ha-icon icon="mdi:human-handsdown"></ha-icon>Still</span>
                </div>
              </div>
              <div class="radar" @click=${()=>t.presence&&je(this,t.presence)}>
                <div class="radar-ring one"></div>
                <div class="radar-ring two"></div>
                <div class="radar-ring three"></div>
                <div class="radar-sensor"><ha-icon icon="mdi:radar"></ha-icon></div>
                ${c.map(e=>K`<span class="radar-target" style="left:${e.left}%;top:${e.top}%"></span>`)}
              </div>
            </div>
          `:Y}

          ${!1!==this._config.show_room_quality&&null!==p?K`
            <div class="quality" @click=${()=>t.roomQualityScore&&je(this,t.roomQualityScore)}>
              <div class="quality-icon"><ha-icon icon="mdi:home-heart"></ha-icon></div>
              <div>
                <div class="quality-label">${m&&!["unknown","unavailable"].includes(m.toLowerCase())?m:"Room quality"}</div>
                <div class="quality-subtitle">Combined climate assessment</div>
              </div>
              <div class="quality-score">${Lt(p,0)}<span>/100</span></div>
            </div>
          `:Y}

          ${!1!==this._config.show_zones&&d.length>0?K`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:floor-plan"></ha-icon>Detection zones</div>
              <div class="zone-list">
                ${d.map(e=>K`
                  <div class="zone ${e.active?"active":""}" @click=${()=>e.entityId&&je(this,e.entityId)}>
                    <span class="zone-index">${e.index}</span>
                    <span class="zone-name">Zone ${e.index}</span>
                    <span class="zone-state">${e.active?`${Lt(e.count??1,0)} active`:"Clear"}</span>
                  </div>
                `)}
              </div>
            </section>
          `:Y}

          ${!1!==this._config.show_distances&&h?K`
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

          ${!1!==this._config.show_environment&&u?K`
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
    `}}jt.styles=[Ve,c`
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
    `],a([ve({attribute:!1})],jt.prototype,"hass",void 0),a([fe()],jt.prototype,"_config",void 0);class Ft extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={...It}}setConfig(e){this._config={...It,...e}}_change(e,t){this._config={...this._config,[e]:t},this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}render(){const e=_t(this.hass,Wt);return K`
      <div class="editor">
        <div class="field">
          <label for="device">CeilSense device</label>
          <select id="device" .value=${this._config.device_id??""} @change=${e=>this._change("device_id",e.target.value)}>
            <option value="">Automatic</option>
            ${e.map(e=>K`<option value=${e.id}>${kt(e)}</option>`)}
          </select>
          <div class="hint">Optional sensor blocks are hidden automatically when that CeilSense hardware variant does not provide them.</div>
        </div>
        <div class="field">
          <label for="title">Card title</label>
          <input id="title" type="text" .value=${this._config.title??""} placeholder="Use device name" @input=${e=>this._change("title",e.target.value)}>
        </div>
        <div class="options">
          <div class="group-title">Visible sections</div>
          ${[["show_header","Header"],["show_status","Connection and occupancy status"],["show_presence","Live presence visualization"],["show_room_quality","Combined room quality"],["show_zones","Detection zones"],["show_distances","Distance and radar energy"],["show_environment","Temperature, humidity, CO₂, light and pressure"]].map(([e,t])=>K`
            <label class="check">
              <input type="checkbox" .checked=${!1!==this._config[e]} @change=${t=>this._change(e,t.target.checked)}>
              <span>${t}</span>
            </label>
          `)}
        </div>
      </div>
    `}}Ft.styles=c`
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
  `,a([ve({attribute:!1})],Ft.prototype,"hass",void 0),a([fe()],Ft.prototype,"_config",void 0);class Ot extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this.entityPrefix="",this.deviceName="",this.isOpen=!1,this.maxDistance=6e3,this._zones=[],this._targets=[],this._selectedZone=null,this._dragMode="none",this._dragStart=null,this._saving=!1,this._hasChanges=!1,this._viewMode="2d",this._detectionRange=6e3,this._canvasWidth=600,this._canvasHeight=450,this._canvas3D=null,this._ctx=null,this._animationFrame=null,this._liveInterval=null,this._camera={azimuth:0,elevation:.22*Math.PI,distance:1200,targetX:0,targetY:0,targetZ:300},this._orbitDragging=!1,this._orbitLastX=0,this._orbitLastY=0,this.WALL_HEIGHT=200,this.FOV_DEG=120,this.CAMERA_FOV=55,this._zoneColors=["#3b82f6","#8b5cf6","#ec4899","#f59e0b"],this._handleOrbitStart=e=>{this._orbitDragging=!0,this._orbitLastX=e.clientX,this._orbitLastY=e.clientY},this._handleOrbitMove=e=>{if(!this._orbitDragging)return;const t=e.clientX-this._orbitLastX,i=e.clientY-this._orbitLastY;if(e.shiftKey){const e=.002*this._camera.distance,a=Math.cos(this._camera.azimuth),o=Math.sin(this._camera.azimuth);this._camera.targetX-=t*a*e,this._camera.targetZ-=t*o*e,this._camera.targetY+=i*e*.5}else this._camera.azimuth+=.008*t,this._camera.elevation=Math.max(.05,Math.min(.45*Math.PI,this._camera.elevation-.008*i));this._orbitLastX=e.clientX,this._orbitLastY=e.clientY},this._handleOrbitEnd=()=>{this._orbitDragging=!1},this._handleWheel=e=>{e.preventDefault();const t=e.deltaY>0?1.1:.9;this._camera.distance=Math.max(400,Math.min(3e3,this._camera.distance*t))},this._handleMouseMove=e=>{if(!this._dragStart||"none"===this._dragMode)return;const t=this._getSvgPoint(e),i=this._fromSvg(this._dragStart.x,this._dragStart.y),a=this._fromSvg(t.x,t.y),o=a.x-i.x,r=a.y-i.y,n=this._zones.find(e=>e.id===this._selectedZone);if(!n)return;const s=this._dragStart.zone,l=100;"move"===this._dragMode?(n.beginX=Math.round((s.beginX+o)/l)*l,n.endX=Math.round((s.endX+o)/l)*l,n.beginY=Math.round((s.beginY+r)/l)*l,n.endY=Math.round((s.endY+r)/l)*l):(this._dragMode.includes("w")&&(n.beginX=Math.round((s.beginX+o)/l)*l),this._dragMode.includes("e")&&(n.endX=Math.round((s.endX+o)/l)*l),this._dragMode.includes("n")&&(n.endY=Math.round((s.endY+r)/l)*l),this._dragMode.includes("s")&&(n.beginY=Math.round((s.beginY+r)/l)*l)),n.beginX=Math.max(-4e3,Math.min(4e3,n.beginX)),n.endX=Math.max(-4e3,Math.min(4e3,n.endX)),n.beginY=Math.max(0,Math.min(6e3,n.beginY)),n.endY=Math.max(0,Math.min(6e3,n.endY)),this._hasChanges=!0,this.requestUpdate()},this._handleMouseUp=()=>{this._dragMode="none",this._dragStart=null,window.removeEventListener("mousemove",this._handleMouseMove),window.removeEventListener("mouseup",this._handleMouseUp)}}connectedCallback(){super.connectedCallback(),this.isOpen&&(this._loadZones(),this._startLiveUpdates())}disconnectedCallback(){super.disconnectedCallback(),this._stopLiveUpdates(),this._stopAnimation()}updated(e){e.has("isOpen")&&(this.isOpen?(this._loadZones(),this._startLiveUpdates(),"3d"===this._viewMode&&this._setup3DCanvas()):(this._stopLiveUpdates(),this._stopAnimation())),e.has("_viewMode")&&this.isOpen&&("3d"===this._viewMode?this._setup3DCanvas():this._stopAnimation())}_setup3DCanvas(){requestAnimationFrame(()=>{this._canvas3D=this.shadowRoot?.querySelector(".canvas-3d"),this._canvas3D&&(this._ctx=this._canvas3D.getContext("2d",{alpha:!0}),this._setupCanvasEvents(),this._startAnimation())})}_setupCanvasEvents(){this._canvas3D&&(this._canvas3D.addEventListener("mousedown",this._handleOrbitStart),this._canvas3D.addEventListener("wheel",this._handleWheel,{passive:!1}),window.addEventListener("mousemove",this._handleOrbitMove),window.addEventListener("mouseup",this._handleOrbitEnd))}_startAnimation(){const e=()=>{this._render3D(),this._animationFrame=requestAnimationFrame(e)};e()}_stopAnimation(){this._animationFrame&&(cancelAnimationFrame(this._animationFrame),this._animationFrame=null)}_startLiveUpdates(){this._updateTargets(),this._liveInterval=window.setInterval(()=>this._updateTargets(),100)}_stopLiveUpdates(){this._liveInterval&&(clearInterval(this._liveInterval),this._liveInterval=null)}_updateTargets(){if(!this.hass||!this.entityPrefix)return;const e=[];for(let t=1;t<=5;t++){const i=`sensor.${this.entityPrefix}_target_${t}_x`,a=`sensor.${this.entityPrefix}_target_${t}_y`;if(!this.hass.states[i]||!this.hass.states[a])continue;const o=parseFloat(this.hass.states[i]?.state||"0"),r=parseFloat(this.hass.states[a]?.state||"0"),n=[`binary_sensor.${this.entityPrefix}_target_${t}_active`,`binary_sensor.${this.entityPrefix}_target_${t}`].find(e=>this.hass?.states[e]),s=n?"on"===this.hass.states[n].state:0!==o||0!==r;e.push({id:t,x:o,y:r,active:s&&(0!==o||0!==r)})}this._targets=e}_loadZones(){if(!this.hass||!this.entityPrefix)return;const e=[];for(let t=1;t<=4;t++)e.push({id:t,beginX:this._getNum(`zone_${t}_begin_x`),endX:this._getNum(`zone_${t}_end_x`),beginY:this._getNum(`zone_${t}_begin_y`),endY:this._getNum(`zone_${t}_end_y`),color:this._zoneColors[t-1]});this._zones=e,this._hasChanges=!1;const t=`number.${this.entityPrefix}_max_distance`,i=parseFloat(this.hass.states[t]?.state||"6000");this._detectionRange=i}_getNum(e){const t=`number.${this.entityPrefix}_${e}`,i=this.hass?.states[t]?.state;return i&&"unavailable"!==i?parseFloat(i):0}_render3D(){if(!this._ctx||!this._canvas3D)return;const e=this._canvas3D,t=this._ctx,i=window.devicePixelRatio||1,a=e.getBoundingClientRect();e.width=a.width*i,e.height=a.height*i,t.scale(i,i);const o=a.width,r=a.height;t.fillStyle="#0a0e14",t.fillRect(0,0,o,r);const n=this._camera,s=n.targetX+n.distance*Math.cos(n.elevation)*Math.sin(n.azimuth),l=n.targetY+n.distance*Math.sin(n.elevation),c=n.targetZ+n.distance*Math.cos(n.elevation)*Math.cos(n.azimuth),d=Math.cos(n.azimuth),h=Math.sin(n.azimuth),u=Math.cos(n.elevation),p=Math.sin(n.elevation),m=this.CAMERA_FOV*Math.PI/180,g=.5*r/Math.tan(m/2),v=o/2,f=r/2,y=(e,t,i)=>{const a=e-s,o=t-l,r=i-c,n=h*a+d*r,m=-(p*o+u*n);return m<=.1?null:{x:v+(d*a-h*r)*g/m,y:f-(u*o-p*n)*g/m,z:m}};this._drawGrid3D(t,y),this._drawFov3D(t,y),this._drawZones3D(t,y),this._drawTargets3D(t,y),this._drawSensor3D(t,y)}_drawGrid3D(e,t){const i=this._detectionRange,a=1e3;e.strokeStyle="rgba(59, 130, 246, 0.15)",e.lineWidth=.5;for(let o=-4e3;o<=4e3;o+=a){const a=t(o,0,0),r=t(o,0,i);a&&r&&(e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(r.x,r.y),e.stroke())}for(let o=0;o<=i;o+=a){const i=t(-4e3,0,o),a=t(4e3,0,o);i&&a&&(e.beginPath(),e.moveTo(i.x,i.y),e.lineTo(a.x,a.y),e.stroke())}e.fillStyle="rgba(148, 163, 184, 0.5)",e.font="11px system-ui, sans-serif";for(let o=a;o<=i;o+=a){const i=t(4200,0,o);i&&e.fillText(o/1e3+"m",i.x,i.y+4)}}_drawFov3D(e,t){const i=this._detectionRange,a=this.FOV_DEG/2*Math.PI/180,o=[{x:0,z:0}];for(let e=-a;e<=a;e+=.05)o.push({x:i*Math.sin(e),z:i*Math.cos(e)});o.push({x:0,z:0}),e.beginPath();let r=!0;for(const i of o){const a=t(i.x,0,i.z);a&&(r?(e.moveTo(a.x,a.y),r=!1):e.lineTo(a.x,a.y))}e.closePath();const n=e.createRadialGradient(e.canvas.width/2/(window.devicePixelRatio||1),e.canvas.height/(window.devicePixelRatio||1),0,e.canvas.width/2/(window.devicePixelRatio||1),e.canvas.height/(window.devicePixelRatio||1),300);n.addColorStop(0,"rgba(59, 130, 246, 0.25)"),n.addColorStop(1,"rgba(59, 130, 246, 0.02)"),e.fillStyle=n,e.fill(),e.strokeStyle="rgba(59, 130, 246, 0.3)",e.lineWidth=1,e.stroke()}_drawZones3D(e,t){const i=this.WALL_HEIGHT;for(const a of this._zones){if(!(0!==a.beginX||0!==a.endX||0!==a.beginY||0!==a.endY))continue;const o=Math.min(a.beginX,a.endX),r=Math.max(a.beginX,a.endX),n=Math.min(a.beginY,a.endY),s=Math.max(a.beginY,a.endY),l=this._selectedZone===a.id,c=[t(o,0,n),t(r,0,n),t(r,0,s),t(o,0,s)].filter(e=>null!==e);if(4===c.length){e.beginPath(),e.moveTo(c[0].x,c[0].y);for(let t=1;t<c.length;t++)e.lineTo(c[t].x,c[t].y);e.closePath(),e.fillStyle=a.color+"30",e.fill(),e.strokeStyle=a.color+"80",e.lineWidth=l?2.5:1.5,e.stroke()}const d=[{pts:[[o,n],[r,n]],label:"front"},{pts:[[r,n],[r,s]],label:"right"},{pts:[[r,s],[o,s]],label:"back"},{pts:[[o,s],[o,n]],label:"left"}];for(const o of d){const[[r,n],[s,c]]=o.pts,d=t(r,0,n),h=t(s,0,c),u=t(r,i,n),p=t(s,i,c);d&&h&&u&&p&&(e.beginPath(),e.moveTo(d.x,d.y),e.lineTo(h.x,h.y),e.lineTo(p.x,p.y),e.lineTo(u.x,u.y),e.closePath(),e.fillStyle=a.color+"20",e.fill(),e.strokeStyle=a.color+(l?"cc":"60"),e.lineWidth=l?2:1,e.stroke())}const h=t((o+r)/2,i+30,(n+s)/2);h&&(e.fillStyle=a.color,e.font="bold 13px system-ui, sans-serif",e.textAlign="center",e.fillText(`Zone ${a.id}`,h.x,h.y))}}_drawTargets3D(e,t){for(const i of this._targets){if(!i.active)continue;const a=170;if(!t(i.x,a/2,i.y))continue;const o=t(i.x,a,i.y),r=t(i.x,0,i.y);o&&r&&(e.strokeStyle="#22c55e",e.lineWidth=8,e.lineCap="round",e.beginPath(),e.moveTo(r.x,r.y),e.lineTo(o.x,o.y),e.stroke(),e.fillStyle="#22c55e",e.beginPath(),e.arc(o.x,o.y,12,0,2*Math.PI),e.fill(),e.shadowColor="#22c55e",e.shadowBlur=20,e.beginPath(),e.arc(o.x,o.y,8,0,2*Math.PI),e.fill(),e.shadowBlur=0,e.fillStyle="#22c55e",e.font="bold 11px system-ui, sans-serif",e.textAlign="center",e.fillText(`T${i.id}`,o.x,o.y-20));const n=t(i.x,0,i.y);n&&(e.beginPath(),e.arc(n.x,n.y,6,0,2*Math.PI),e.fillStyle="rgba(34, 197, 94, 0.5)",e.fill())}}_drawSensor3D(e,t){const i=t(0,10,0);i&&(e.fillStyle="#3b82f6",e.shadowColor="#3b82f6",e.shadowBlur=15,e.beginPath(),e.arc(i.x,i.y,10,0,2*Math.PI),e.fill(),e.shadowBlur=0,e.fillStyle="#60a5fa",e.beginPath(),e.arc(i.x,i.y,4,0,2*Math.PI),e.fill(),e.fillStyle="rgba(148, 163, 184, 0.7)",e.font="10px system-ui, sans-serif",e.textAlign="center",e.fillText("SENSOR",i.x,i.y+25))}_toSvg(e,t){const i=this._detectionRange,a=this._canvasWidth/2,o=this._canvasHeight-40,r=(this._canvasHeight-80)/i;return{x:a+e*r,y:o-t*r}}_fromSvg(e,t){const i=this._detectionRange,a=this._canvasWidth/2,o=this._canvasHeight-40,r=(this._canvasHeight-80)/i;return{x:(e-a)/r,y:(o-t)/r}}_getSvgPoint(e){const t=this.shadowRoot?.querySelector(".editor-svg");if(!t)return{x:0,y:0};const i=t.getBoundingClientRect(),a=e.clientX-i.left,o=e.clientY-i.top;return{x:a*(this._canvasWidth/i.width),y:o*(this._canvasHeight/i.height)}}_handleMouseDown(e,t,i){e.stopPropagation(),e.preventDefault();const a=this._zones.find(e=>e.id===t);a&&(this._selectedZone=t,this._dragMode=i,this._dragStart={...this._getSvgPoint(e),zone:{...a}},window.addEventListener("mousemove",this._handleMouseMove),window.addEventListener("mouseup",this._handleMouseUp))}async _saveAllZones(){if(this.hass&&this.entityPrefix){this._saving=!0;try{const e=[];for(const t of this._zones){const i={...t,beginX:Math.max(-4e3,Math.min(4e3,t.beginX)),endX:Math.max(-4e3,Math.min(4e3,t.endX)),beginY:Math.max(0,Math.min(6e3,t.beginY)),endY:Math.max(0,Math.min(6e3,t.endY))};e.push(this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_begin_x`,value:i.beginX}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_end_x`,value:i.endX}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_begin_y`,value:i.beginY}),this.hass.callService("number","set_value",{entity_id:`number.${this.entityPrefix}_zone_${t.id}_end_y`,value:i.endY}))}await Promise.all(e),this._hasChanges=!1}catch(e){console.error("Failed to save zones:",e)}finally{this._saving=!1}}}_close(){this._stopLiveUpdates(),this._stopAnimation(),this.dispatchEvent(new CustomEvent("close"))}_renderGrid(){const e=[],t=[],i=this._detectionRange;for(let a=1e3;a<=i;a+=1e3){const o=this._toSvg(0,a),r=(this._canvasHeight-80)*(a/i);e.push(B`
        <circle
          cx="${this._canvasWidth/2}"
          cy="${this._canvasHeight-40}"
          r="${r}"
          class="grid-line"
          fill="none"
        />
      `),t.push(B`
        <text x="${this._canvasWidth-15}" y="${o.y+4}" class="grid-label" text-anchor="end">
          ${a/1e3}m
        </text>
      `)}return e.push(B`
      <line
        x1="${this._canvasWidth/2}"
        y1="${this._canvasHeight-40}"
        x2="${this._canvasWidth/2}"
        y2="20"
        class="grid-line"
      />
    `),[...e,...t]}_renderCoverageArc(){const e=this._canvasWidth/2,t=this._canvasHeight-40,i=this._detectionRange,a=(this._canvasHeight-80)*(i/i),o=this.FOV_DEG/2*Math.PI/180,r=e+a*Math.sin(-o),n=t-a*Math.cos(-o),s=e+a*Math.sin(o),l=t-a*Math.cos(o);return B`
      <defs>
        <radialGradient id="coverageGradient" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stop-color="rgba(59, 130, 246, 0.35)" />
          <stop offset="100%" stop-color="rgba(59, 130, 246, 0.02)" />
        </radialGradient>
      </defs>
      <path
        class="coverage-arc"
        d="M ${e} ${t} L ${r} ${n} A ${a} ${a} 0 0 1 ${s} ${l} Z"
      />
    `}_renderTargets(){return this._targets.filter(e=>e.active).map(e=>{const t=this._toSvg(e.x,e.y);return B`
        <g class="target-marker">
          <circle class="target-pulse" cx="${t.x}" cy="${t.y}" r="6" />
          <circle cx="${t.x}" cy="${t.y}" r="8" fill="#22c55e" />
          <circle cx="${t.x}" cy="${t.y}" r="4" fill="#4ade80" />
          <text x="${t.x}" y="${t.y-15}" fill="#22c55e" font-size="11" font-weight="bold" text-anchor="middle">
            T${e.id}
          </text>
        </g>
      `})}_renderZone(e){if(!(0!==e.beginX||0!==e.endX||0!==e.beginY||0!==e.endY))return Y;const t=this._toSvg(Math.min(e.beginX,e.endX),Math.max(e.beginY,e.endY)),i=this._toSvg(Math.max(e.beginX,e.endX),Math.min(e.beginY,e.endY)),a=t.x,o=t.y,r=i.x-t.x,n=i.y-t.y,s=this._selectedZone===e.id,l=s?[{name:"nw",x:a,y:o},{name:"ne",x:a+r,y:o},{name:"sw",x:a,y:o+n},{name:"se",x:a+r,y:o+n},{name:"n",x:a+r/2,y:o},{name:"s",x:a+r/2,y:o+n},{name:"w",x:a,y:o+n/2},{name:"e",x:a+r,y:o+n/2}]:[];return B`
      <g>
        <rect
          x="${a}" y="${o}"
          width="${r}" height="${n}"
          fill="${e.color}35"
          stroke="${e.color}"
          stroke-width="${s?3:2}"
          rx="6"
          class="zone-rect ${s?"selected":""}"
          @mousedown=${t=>this._handleMouseDown(t,e.id,"move")}
        />
        <text
          x="${a+r/2}" y="${o+22}"
          fill="white"
          font-size="13"
          font-weight="700"
          text-anchor="middle"
          pointer-events="none"
          style="text-shadow: 0 2px 6px rgba(0,0,0,0.9)"
        >
          Zone ${e.id}
        </text>
        ${l.map(t=>B`
          <circle
            cx="${t.x}" cy="${t.y}"
            r="${8}"
            class="resize-handle ${t.name}"
            stroke="${e.color}"
            @mousedown=${i=>this._handleMouseDown(i,e.id,`resize-${t.name}`)}
          />
        `)}
      </g>
    `}render(){return this.isOpen?K`
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

                ${"3d"===this._viewMode?K`
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
                  ${this._zones.map(e=>{const t=0!==e.beginX||0!==e.endX||0!==e.beginY||0!==e.endY;return K`
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
                ${this._targets.filter(e=>e.active).length>0?this._targets.filter(e=>e.active).map(e=>K`
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></div>
                        <span style="color: #e2e8f0; font-size: 0.85rem;">Target ${e.id}: ${Math.round(e.x)}mm, ${Math.round(e.y)}mm</span>
                      </div>
                    `):K`<span style="color: #64748b; font-size: 0.85rem;">No active targets</span>`}
              </div>

              <div class="info-card">
                <h4>${"3d"===this._viewMode?"3D Controls":"Instructies"}</h4>
                <ul>
                  ${"3d"===this._viewMode?K`
                    <li>Drag to rotate</li>
                    <li>Shift + drag to pan</li>
                    <li>Scroll to zoom</li>
                    <li>Edit zones in 2D mode</li>
                  `:K`
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
              ${this._hasChanges?K`
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
    `:Y}}Ot.styles=c`
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
  `,a([ve({attribute:!1})],Ot.prototype,"hass",void 0),a([ve()],Ot.prototype,"entityPrefix",void 0),a([ve()],Ot.prototype,"deviceName",void 0),a([ve({type:Boolean})],Ot.prototype,"isOpen",void 0),a([ve({type:Number})],Ot.prototype,"maxDistance",void 0),a([fe()],Ot.prototype,"_zones",void 0),a([fe()],Ot.prototype,"_targets",void 0),a([fe()],Ot.prototype,"_selectedZone",void 0),a([fe()],Ot.prototype,"_dragMode",void 0),a([fe()],Ot.prototype,"_dragStart",void 0),a([fe()],Ot.prototype,"_saving",void 0),a([fe()],Ot.prototype,"_hasChanges",void 0),a([fe()],Ot.prototype,"_viewMode",void 0),a([fe()],Ot.prototype,"_detectionRange",void 0);const Vt=c`
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
`;function Ut(e){if(!e)return[];const t=new Map,i=[{pattern:"waterp1meterkit",type:"WaterP1MeterKit"},{pattern:"watermeterkit",type:"WaterMeterKit"},{pattern:"waterflowkit",type:"WaterFlowKit"}];return Object.keys(e.states).forEach(a=>{const o=e.states[a],r=(o?.attributes?.friendly_name||"").toLowerCase(),n=a.toLowerCase();for(const{pattern:e,type:a}of i)if(r.includes(e)||n.includes(e)){const i=n.match(new RegExp(`${e}[_-]?([a-f0-9]{6})`)),r=i?i[1]:e;if(!t.has(r)){const e=(o?.attributes?.friendly_name||"").split(" ").slice(0,2).join(" ")||`${a} ${r.toUpperCase()}`;t.set(r,{id:r,name:e,type:a})}break}}),Array.from(t.values())}class Gt extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&(this._devices=Ut(this.hass).filter(e=>"WaterMeterKit"===e.type||"WaterFlowKit"===e.type))}_valueChanged(e,t){if(this._config[e]===t)return;const i={...this._config,[e]:t};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){const e=this._devices.find(e=>e.id===this._config.device_id);return K`
      <div class="form-row">
        <label>Device</label>
        <select
          @change=${e=>this._valueChanged("device_id",e.target.value||void 0)}
        >
          <option value="">Auto detect</option>
          ${this._devices.map(e=>K`
              <option value=${e.id} ?selected=${e.id===this._config.device_id}>
                ${e.name} (${e.type})
              </option>
            `)}
        </select>
        ${e?K`
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
          ${!1!==this._config.show_header?K`
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
          ${!1!==this._config.show_water_totals?K`
            <div class="nested-options">
              ${["today","week","month","year"].map(e=>K`
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
    `}}Gt.styles=Vt,a([ve({attribute:!1})],Gt.prototype,"hass",void 0),a([fe()],Gt.prototype,"_config",void 0),a([fe()],Gt.prototype,"_devices",void 0);class qt extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this._config={},this._devices=[]}setConfig(e){this._config=e}updated(e){e.has("hass")&&this.hass&&(this._devices=Ut(this.hass).filter(e=>"WaterP1MeterKit"===e.type))}_valueChanged(e,t){if(this._config[e]===t)return;const i={...this._config,[e]:t};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){const e=this._devices.find(e=>e.id===this._config.device_id);return K`
      <div class="form-row">
        <label>Device</label>
        <select
          @change=${e=>this._valueChanged("device_id",e.target.value||void 0)}
        >
          <option value="">Auto detect</option>
          ${this._devices.map(e=>K`
              <option value=${e.id} ?selected=${e.id===this._config.device_id}>
                ${e.name}
              </option>
            `)}
        </select>
        ${e?K`
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
          ${!1!==this._config.show_header?K`
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
          ${!1!==this._config.show_water?K`
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
              ${!1!==this._config.show_water_totals?K`
                <div class="nested-options">
                  ${["today","week","month","year"].map(e=>K`
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
          ${!1!==this._config.show_energy?K`
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
    `}}let Kt,Bt;qt.styles=Vt,a([ve({attribute:!1})],qt.prototype,"hass",void 0),a([fe()],qt.prototype,"_config",void 0),a([fe()],qt.prototype,"_devices",void 0);const Zt=new Set;let Yt;const Xt=async(e,t,i=8e3)=>{let a;try{return await Promise.race([e.callWS(t),new Promise((e,o)=>{a=window.setTimeout(()=>o(new Error(`${t.type} timed out`)),i)})])}finally{void 0!==a&&window.clearTimeout(a)}},Qt=(e,t)=>{const i=Object.values(e.entities||{}),a=t.p1_device?i.filter(e=>e.device_id===t.p1_device&&e.entity_id.startsWith("sensor.")):[],o=a.find(e=>e.entity_id.includes("_net_grid_power"))?.entity_id,r=a.find(e=>e.entity_id.endsWith("_power_consumed"))?.entity_id,n=a.find(e=>e.entity_id.endsWith("_power_produced"))?.entity_id;return o||r||n?{netEntity:o,gridImportEntity:r,gridExportEntity:n}:{netEntity:Object.keys(e.states||{}).find(e=>e.startsWith("sensor.")&&e.includes("_net_grid_power")),gridImportEntity:void 0,gridExportEntity:void 0}},Jt=async(e,t)=>{const i=[t.netEntity,t.gridImportEntity,t.gridExportEntity,t.sources.solar_power,t.sources.battery_power].filter(Boolean);if(!i.length)return{};const a=new Date;return a.setHours(0,0,0,0),lt(e,i,a,new Date,{period:"5minute",maxPoints:360,significantChangesOnly:!0,factor:i=>{const a=i===t.sources.solar_power?!!t.sources.solar_invert:i===t.sources.battery_power&&!!t.sources.battery_invert;return ti(e,i)*(a?-1:1)}})},ei=async e=>!!customElements.get("statistics-chart")||!!window.loadCardHelpers&&(window.__shsStatisticsChartReady||(window.__shsStatisticsChartReady=(async()=>((await window.loadCardHelpers()).createCardElement({type:"statistics-graph",entities:e?[e]:["sensor.invalid"]}),Promise.race([customElements.whenDefined("statistics-chart").then(()=>!0),new Promise(e=>window.setTimeout(()=>e(!1),8e3))])))().catch(()=>!1)),window.__shsStatisticsChartReady),ti=(e,t)=>{const i=String(t&&e.states[t]?.attributes?.unit_of_measurement||"");return/^kw$/i.test(i)?1e3:1},ii=(e,t,i=!1)=>{if(!t)return null;const a=e.states[t];if(!a||"unknown"===a.state||"unavailable"===a.state)return null;const o=Number(a.state);return Number.isFinite(o)?o*ti(e,t)*(i?-1:1):null},ai=(e,t)=>{if(!t)return!1;const i=e.states[t];return!i||"unknown"===i.state||"unavailable"===i.state},oi=(e,t)=>{if(!t)return null;const i=ii(e,t.netEntity);if(null!==i)return i;const a=ii(e,t.gridImportEntity),o=ii(e,t.gridExportEntity);return t.gridImportEntity&&null===a||t.gridExportEntity&&null===o||null===a&&null===o?null:(a??0)-(o??0)},ri=(e,t)=>{if(!e)return[];const i=e.gridImportEntity&&t[e.gridImportEntity]||[],a=e.gridExportEntity&&t[e.gridExportEntity]||[],o=e.netEntity&&t[e.netEntity]||[];if(i.length+a.length<2)return o;const r=[...new Set([...i.map(e=>e.t),...a.map(e=>e.t)])].sort((e,t)=>e-t);let n,s,l=0,c=0;return r.map(e=>{for(;l<i.length&&i[l].t<=e;)n=i[l++];for(;c<a.length&&a[c].t<=e;)s=a[c++];const t=n?.v??0,o=s?.v??0;return{t:e,end:Math.max(n?.end??e,s?.end??e),v:t-o,min:(n?.min??t)-(s?.max??o),max:(n?.max??t)-(s?.min??o)}})},ni=(e,t=!1)=>{if(null===e)return{value:"-",unit:""};const i=t?Math.abs(e):e;return Math.abs(i)>=1e3?{value:(i/1e3).toFixed(2),unit:"kW"}:{value:String(Math.round(i)),unit:"W"}},si=e=>null!=e&&Number.isFinite(Number(e))?`€ ${Number(e).toFixed(3)}`:"-",li=e=>`${e<0?"−":""}€ ${Math.abs(e).toFixed(2)}`,ci=e=>{const t=new Date(e);return Number.isFinite(t.getTime())?t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"-"},di=(e,t,i)=>{const a=t?.priceEntity?e.states[t.priceEntity]?.attributes:void 0,o="today"===i?a?.prices_today:a?.prices_tomorrow;return(Array.isArray(o)&&o.length?o:Array.isArray(a?.forecast)?a.forecast.filter(e=>{if(!e||"string"!=typeof e.start)return!1;const t=new Date;"tomorrow"===i&&t.setDate(t.getDate()+1);const a=new Date(e.start);return Number.isFinite(a.getTime())&&a.getFullYear()===t.getFullYear()&&a.getMonth()===t.getMonth()&&a.getDate()===t.getDate()}):[]).filter(e=>e&&"string"==typeof e.start&&Number.isFinite(Number(e.consumer))).map(e=>({start:e.start,end:"string"==typeof e.end?e.end:void 0,resolution:"quarter-hour"===e.resolution?"quarter-hour":"hour",market:Number.isFinite(Number(e.market))?Number(e.market):void 0,consumer:Number(e.consumer),feed_in:Number.isFinite(Number(e.feed_in))?Number(e.feed_in):void 0,kind:"predicted"===e.kind?"predicted":"confirmed",confidence:Number.isFinite(Number(e.confidence))?Math.max(0,Math.min(1,Number(e.confidence))):void 0}))},hi=(e,t,i)=>{if(!t)return null;const a=Date.now(),o=new Date;o.setHours(0,0,0,0);const r=oi(e,t),n=[...ri(t,i).filter(e=>e.t<a),...null===r?[]:[{t:a,end:a,v:r,min:r,max:r}]].filter(e=>e.t<=a&&(e.end??e.t)>=o.getTime()).sort((e,t)=>e.t-t.t);if(n.length<2)return null;const s="dynamic"===String(t.account?.contract?.type||"").toLowerCase(),l=s?di(e,t,"today"):[],c=Number(t.account?.current?.electricity),d=Number(t.account?.current?.feed_in);let h=0,u=0,p=0,m=0,g=0,v=0;const f=e=>{if(!s)return{imported:c,exported:d};const i=l.find(t=>{const i=Date.parse(t.start);return Number.isFinite(i)&&i<=e&&(e=>{const t=e.end?Date.parse(e.end):Number.NaN;return Number.isFinite(t)?t:Date.parse(e.start)+("quarter-hour"===e.resolution?9e5:36e5)})(t)>e});return{imported:Number(i?.consumer),exported:Number(i?.feed_in??t.account?.current?.feed_in)}};for(let e=0;e<n.length-1;e+=1){const t=n[e],i=n[e+1],r=Math.max(o.getTime(),t.t),s=Math.min(a,t.end??i.t,i.t);if(!Number.isFinite(t.v)||s<=r)continue;const l=Math.abs(t.v)/1e3*((s-r)/36e5);if(!Number.isFinite(l))continue;v+=l;const c=f(r+(s-r)/2);t.v>=0?(h+=l,Number.isFinite(c.imported)&&(p+=l*c.imported,g+=l)):(u+=l,Number.isFinite(c.exported)&&(m+=l*c.exported,g+=l))}return 0===h&&0===u?null:{importedKwh:h,exportedKwh:u,importCost:p,exportValue:m,netCost:p-m,averageImportPrice:h>0?p/h:null,averageExportPrice:u>0?m/u:null,coverage:v>0?Math.max(0,Math.min(1,g/v)):1,predictedPrices:s&&l.length>0&&l.every(e=>"predicted"===e.kind)}},ui=(e,t)=>{t&&e.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:t},bubbles:!0,composed:!0}))};class pi extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this.loading=!0,this.loadError="",this.loadStarted=!1}connectedCallback(){var e;super.connectedCallback(),this.unsubscribeRefresh=(e=()=>{this.load(!0)},Zt.add(e),void 0===Yt&&(Yt=window.setInterval(()=>{Zt.forEach(e=>e())},6e4)),()=>{Zt.delete(e),Zt.size||void 0===Yt||(window.clearInterval(Yt),Yt=void 0)})}disconnectedCallback(){this.unsubscribeRefresh?.(),this.unsubscribeRefresh=void 0,super.disconnectedCallback()}firstUpdated(){this.loadStarted||this.load()}async load(e=!1){if(this.hass){this.loadStarted=!0,this.context||(this.loading=!0);try{this.context=await(async(e,t=!1)=>{const i=Kt&&Date.now()-Kt.loadedAt<3e4;if(!t&&i){const t=Qt(e,Kt.value.sources);return{...Kt.value,...t}}return Bt||(Bt=(async()=>{const[t,i,a,o]=await Promise.allSettled([Xt(e,{type:"smarthomeshop/energy_sources"}),Xt(e,{type:"smarthomeshop/prices/entities"}),Xt(e,{type:"smarthomeshop/account"},12e3),Xt(e,{type:"smarthomeshop/savings"})]),r="fulfilled"===t.status&&t.value.sources||{},n={sources:r,...Qt(e,r),priceEntity:"fulfilled"===i.status&&i.value.entities?.electricity_price||void 0,priceEntities:"fulfilled"===i.status&&i.value.entities||{},account:"fulfilled"===a.status&&a.value||{},savings:"fulfilled"===o.status&&o.value.savings||{}};return Kt={loadedAt:Date.now(),value:n},n})().finally(()=>{Bt=void 0}),Bt)})(this.hass,e),this.loadError="",await this.afterContextLoaded()}catch(e){this.loadError=e?.message||"Smart Energy data could not be loaded."}finally{this.loading=!1}}}async afterContextLoaded(){}renderHeader(e,t,i){return!1===this.config.show_header?null:{title:this.config.title||e,subtitle:t,icon:i}}}a([ve({attribute:!1})],pi.prototype,"hass",void 0),a([fe()],pi.prototype,"context",void 0),a([fe()],pi.prototype,"loading",void 0),a([fe()],pi.prototype,"loadError",void 0);const mi=c`
  :host {
    display: block;
    color: var(--primary-text-color);
    --shs-blue: var(--primary-color, #4361ee);
    --shs-green: var(--success-color, #159957);
    --shs-amber: var(--warning-color, #d8890b);
    --shs-red: var(--error-color, #d34a4a);
    --shs-blue-soft: color-mix(in srgb, var(--shs-blue) 11%, var(--card-background-color));
    --shs-green-soft: color-mix(in srgb, var(--shs-green) 11%, var(--card-background-color));
    --shs-amber-soft: color-mix(in srgb, var(--shs-amber) 12%, var(--card-background-color));
    --shs-red-soft: color-mix(in srgb, var(--shs-red) 10%, var(--card-background-color));
    --shs-line: color-mix(in srgb, var(--divider-color) 82%, transparent);
    --shs-surface: color-mix(in srgb, var(--secondary-background-color) 72%, var(--card-background-color));
  }

  * { box-sizing: border-box; }
  ha-card { overflow: hidden; container-type: inline-size; }
  button { font: inherit; -webkit-tap-highlight-color: transparent; }
  button:focus-visible, [tabindex="0"]:focus-visible {
    outline: 2px solid var(--shs-blue);
    outline-offset: 2px;
  }
  .sr-only {
    width: 1px;
    height: 1px;
    padding: 0;
    position: absolute;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .card-shell { padding: 18px; }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 16px;
  }
  .head-main { display: flex; align-items: center; min-width: 0; gap: 11px; }
  .head-icon {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--shs-blue);
    background: var(--shs-blue-soft);
  }
  .head-icon ha-icon { --mdc-icon-size: 20px; }
  .head-title { margin: 0; font-size: 15px; font-weight: 720; line-height: 1.25; }
  .head-subtitle {
    margin-top: 2px;
    color: var(--secondary-text-color);
    font-size: 11px;
    line-height: 1.3;
  }
  .loading, .empty {
    min-height: 132px;
    padding: 24px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 9px;
    color: var(--secondary-text-color);
    text-align: center;
    font-size: 12px;
    line-height: 1.5;
  }
  .empty ha-icon { --mdc-icon-size: 28px; color: var(--shs-blue); }
  .empty strong { color: var(--primary-text-color); font-size: 14px; }
  .skeleton {
    width: min(280px, 80%);
    height: 9px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--shs-surface), var(--shs-line), var(--shs-surface));
    background-size: 200% 100%;
    animation: shs-energy-loading 1.4s ease-in-out infinite;
  }
  @keyframes shs-energy-loading { to { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }

  @container (max-width: 420px) {
    .card-shell { padding: 14px; }
    .card-head { margin-bottom: 13px; }
    .head-icon { width: 31px; height: 31px; flex-basis: 31px; border-radius: 9px; }
  }
`,gi={nl:{"Loading smart savings...":"Smart Savings laden...","Smart savings unavailable":"Smart Savings niet beschikbaar","Smart Savings is paused":"Smart Savings is gepauzeerd","An active SmartHomeShop energy contract is needed to calculate savings.":"Een actief SmartHomeShop-energiecontract is nodig om besparingen te berekenen.","Previously measured total: {value}":"Eerder gemeten totaal: {value}","Smart savings":"Smart Savings","Measured value created by smart energy":"Gemeten waarde door slimme energie",Today:"Vandaag",Tomorrow:"Morgen","This month":"Deze maand","All time":"Totaal","Saved compared with today's average electricity price.":"Bespaard ten opzichte van de gemiddelde stroomprijs van vandaag.","Smart actions cost more than today's average so far.":"Slimme acties kostten tot nu toe meer dan het daggemiddelde.","Smart actions have not created measured value yet today.":"Slimme acties hebben vandaag nog geen gemeten waarde opgeleverd.","Cumulative value this calendar month":"Opgetelde waarde deze kalendermaand","Since Smart Savings started measuring":"Sinds Smart Savings is gaan meten","Battery today":"Batterij vandaag","Charging and discharging":"Laden en ontladen","Schedules today":"Schema's vandaag","Loads shifted in time":"Verbruik in de tijd verschoven","Measured every 15 minutes from battery flows and running schedules, valued against the day-average electricity price.":"Elke 15 minuten gemeten aan de hand van batterijstroom en actieve schema's, gewaardeerd tegen de gemiddelde stroomprijs van de dag.","Live energy":"Live energie","Live power flow":"Live energiestroom","Direction and speed follow the power moving right now":"Richting en snelheid volgen het vermogen van dit moment","Pause flow animation":"Animatie pauzeren","Resume flow animation":"Animatie hervatten",Home:"Woning","Live usage":"Actueel verbruik","Incomplete sensor data":"Onvolledige sensordata","{count} source connected":"{count} bron verbonden","{count} sources connected":"{count} bronnen verbonden","Live energy unavailable":"Live energie niet beschikbaar","Home consumption":"Thuisverbruik","A connected power sensor is unavailable":"Een verbonden vermogenssensor is niet beschikbaar","Power used by your home right now":"Vermogen dat je huis nu gebruikt","{share}% from grid":"{share}% van het net","Solar + battery":"Zon + batterij","Running on solar":"Draait op zonne-energie","Running on battery":"Draait op de batterij","Sensor unavailable":"Sensor niet beschikbaar",Grid:"Net",Solar:"Zonne-energie",Battery:"Batterij","No reading":"Geen meting","Importing from grid":"Afname van het net","Exporting to grid":"Teruglevering aan het net","Grid balanced":"Net in balans","Producing now":"Produceert nu","No production":"Geen productie",Discharging:"Ontladen",Charging:"Laden",Idle:"Inactief","No active energy contract":"Geen actief energiecontract","No price forecast yet":"Nog geen prijsverwachting","Select an active SmartHomeShop energy contract in Energy Settings.":"Selecteer een actief SmartHomeShop-energiecontract in Energie-instellingen.","Connect dynamic prices in SmartHomeShop Energy Settings.":"Verbind dynamische prijzen in SmartHomeShop Energie-instellingen.","Price outlook":"Prijsverwachting","All-in consumer price":"All-in consumentenprijs","all-in price":"all-in prijs","Price day":"Prijsdag","Current price":"Huidige prijs","Price now":"Prijs nu","Below daily average":"Onder het daggemiddelde","Above daily average":"Boven het daggemiddelde","{value}% below average":"{value}% onder het gemiddelde","{value}% above average":"{value}% boven het gemiddelde","Daily average":"Daggemiddelde","Feed-in now":"Teruglevering nu","Next lower":"Volgende lagere prijs","None today":"Geen vandaag",Lowest:"Laagste",Highest:"Hoogste","Negative prices":"Negatieve prijzen","Daily spread":"Dagspreiding","{count} hour":"{count} uur","{count} hours":"{count} uur","{day} by hour (EUR/kWh)":"{day} per uur (EUR/kWh)",Lower:"Lager",Higher:"Hoger",Now:"Nu","Hourly electricity prices":"Stroomprijzen per uur","Use the left and right arrow keys to inspect each hour.":"Gebruik de pijltoetsen links en rechts om elk uur te bekijken.","Cheapest consecutive block · {day}":"Goedkoopste aaneengesloten blok · {day}","{price}/kWh average":"gemiddeld {price}/kWh","Not available":"Niet beschikbaar","Cheapest block duration":"Duur van goedkoopste blok","Open price entity details":"Open details van prijsentiteit","{time}, save {price}":"{time}, bespaar {price}","{price} at {time}":"{price} om {time}","Power trend":"Vermogenstrend","Today · 5-minute statistics to now":"Vandaag · 5-minutenstatistieken tot nu","No power statistics available":"Geen vermogensstatistieken beschikbaar","Configure a P1 meter, solar or battery power source in SmartHomeShop Energy Settings.":"Configureer een P1-meter, zonne-energie- of batterijbron in SmartHomeShop Energie-instellingen.","Grid now":"Net nu","Export now":"Teruglevering nu","Import now":"Afname nu","Peak import":"Piekafname","Peak export":"Piekteruglevering","Grid import":"Netafname","Grid export":"Netteruglevering","Power (W) · mean with min/max range":"Vermogen (W) · gemiddelde met min/max-bereik","Loading Home Assistant chart...":"Home Assistant-grafiek laden...","Electricity costs":"Stroomkosten","Imported, returned and net value today":"Afname, teruglevering en netto waarde vandaag","Calculating today's electricity costs...":"Stroomkosten van vandaag berekenen...","Electricity costs unavailable":"Stroomkosten niet beschikbaar","Connect an active SmartHomeShop contract to value today's imported and returned electricity.":"Verbind een actief SmartHomeShop-contract om de afname en teruglevering van vandaag te waarderen.","No P1 meter selected":"Geen P1-meter geselecteerd","Select a P1 meter in SmartHomeShop Energy settings first.":"Selecteer eerst een P1-meter in de SmartHomeShop Energy-instellingen.","Not enough history yet":"Nog niet genoeg historie","The card will calculate today's costs as soon as Recorder has grid power history.":"De kaart berekent de kosten van vandaag zodra Recorder netvermogenhistorie heeft.","Net earned today":"Netto verdiend vandaag","Net electricity cost":"Netto stroomkosten","Return value is higher than import cost.":"De terugleverwaarde is hoger dan de afnamekosten.","{value} return value deducted":"{value} terugleverwaarde afgetrokken","No measured return value deducted yet.":"Nog geen gemeten terugleverwaarde afgetrokken.",priced:"geprijsd","Electricity imported":"Stroom afgenomen","Electricity returned":"Stroom teruggeleverd","Fixed daily contract cost":"Vaste dagelijkse contractkosten","Full daily charge from your active contract":"Volledig dagbedrag uit je actieve contract","avg.":"gem.","active contract":"het actieve contract","Estimated from recorded 5-minute grid power and prices from {contract}.":"Geschat op basis van geregistreerd netvermogen per 5 minuten en prijzen van {contract}.","Predicted prices are used until confirmed prices arrive.":"Voorspelde prijzen worden gebruikt totdat bevestigde prijzen beschikbaar zijn.","{coverage}% of measured energy has matching price data.":"{coverage}% van de gemeten energie heeft bijpassende prijsdata.","Fixed daily charges and gas are excluded.":"Vaste dagkosten en gas zijn niet meegerekend.","The fixed daily contract cost is included; gas is excluded.":"De vaste dagelijkse contractkosten zijn meegerekend; gas is niet meegerekend.","Smart automations":"Slimme automatiseringen","{enabled} enabled · {total} configured":"{enabled} ingeschakeld · {total} geconfigureerd","Price, solar and deadline control":"Prijs-, zonne-energie- en deadlinebesturing","{count} enabled":"{count} ingeschakeld","Open Smart Energy settings":"Open Smart Energy-instellingen","Reactive automations":"Reactieve automatiseringen","Deadline schedules":"Deadlineschema's","No Smart Automations yet":"Nog geen slimme automatiseringen","Create price, solar or deadline controls in SmartHomeShop Energy Settings. They will appear here automatically.":"Maak prijs-, zonne-energie- of deadlinebesturing in SmartHomeShop Energie-instellingen. Ze verschijnen hier automatisch.","Open Energy Settings":"Open Energie-instellingen","No entities":"Geen entiteiten","Disabled - no automatic actions":"Uitgeschakeld - geen automatische acties","Running an action now":"Voert nu een actie uit","Ready - waiting for its trigger":"Gereed - wacht op een trigger","Never triggered":"Nog nooit geactiveerd","Last run unknown":"Laatste uitvoering onbekend","Triggered just now":"Zojuist geactiveerd","Triggered {minutes} min ago":"{minutes} min geleden geactiveerd","Triggered {hours} h ago":"{hours} uur geleden geactiveerd","Last run {date}":"Laatste uitvoering {date}","Pause automation":"Automatisering pauzeren","Enable automation":"Automatisering inschakelen","Edit setup":"Instellingen bewerken","More information":"Meer informatie","Disabled - deadline planning is paused":"Uitgeschakeld - deadlineplanning is gepauzeerd","Running now to meet the deadline":"Draait nu om de deadline te halen","Running in a selected low-price hour":"Draait in een geselecteerd goedkoop uur","Pause schedule":"Schema pauzeren","Enable schedule":"Schema inschakelen","{hours} h needed":"{hours} uur nodig","Run in the cheapest hours":"Draai tijdens de goedkoopste uren","Run while electricity is cheap":"Draai zolang stroom goedkoop is","Pause during price peaks":"Pauzeer tijdens prijspieken","Pre-heat cheap, ease off at peak":"Goedkoop voorverwarmen, terugschakelen bij piek","Use solar surplus":"Gebruik zonne-overschot","Heat on solar surplus":"Verwarm met zonne-overschot","Keep solar export near zero":"Houd teruglevering rond nul","Avoid negative-price solar export":"Voorkom teruglevering bij negatieve prijs","Self-consume on negative feed-in":"Zelf verbruiken bij negatieve terugleverprijs","Charge the car in the cheapest hours":"Laad de auto tijdens de goedkoopste uren","Cheapest {hours}-hour window is active":"Goedkoopste blok van {hours} uur is actief","Waiting for the cheapest {hours}-hour window":"Wacht op het goedkoopste blok van {hours} uur","Electricity is cheap now":"Stroom is nu goedkoop","Waiting for a below-average price":"Wacht op een prijs onder het gemiddelde","Price peak - selected loads should be paused":"Prijspiek - geselecteerd verbruik moet worden gepauzeerd","No price peak right now":"Nu geen prijspiek","Pre-heating in the cheap window":"Voorverwarmen in het goedkope blok","Peak mode is active":"Piekmodus is actief","Waiting for a cheap window or price peak":"Wacht op een goedkoop blok of prijspiek","{watts} W grid export meets the surplus threshold":"{watts} W netteruglevering haalt de overschotdrempel","Waiting for at least {watts} W solar surplus":"Wacht op minimaal {watts} W zonne-overschot","Reducing exported solar power":"Teruggeleverd zonnevermogen wordt verlaagd","Monitoring grid flow":"Netstroom bewaken","Curtailing export during negative feed-in":"Teruglevering beperken bij negatieve terugleverprijs","No unwanted paid export":"Geen ongewenste betaalde teruglevering","Negative feed-in - self-consumption active":"Negatieve terugleverprijs - zelfverbruik actief","Feed-in price is not negative":"Terugleverprijs is niet negatief","Next start {time} · ready by {ready}":"Volgende start {time} · klaar om {ready}","Waiting for prices · ready by {ready}":"Wacht op prijzen · klaar om {ready}","{done} of {required} hours completed":"{done} van {required} uur voltooid","Schedules could not be refreshed. Showing the latest available data.":"Schema's konden niet worden vernieuwd. De laatst beschikbare gegevens worden getoond.","Could not enable the automation.":"De automatisering kon niet worden ingeschakeld.","Could not pause the automation.":"De automatisering kon niet worden gepauzeerd.","Could not update the schedule.":"Het schema kon niet worden bijgewerkt.","The Smart Energy editor could not be loaded. Open SmartHomeShop Energy Settings to edit this automation.":"De Smart Energy-editor kon niet worden geladen. Open SmartHomeShop Energie-instellingen om deze automatisering te bewerken."},de:{"Loading smart savings...":"Smart Savings wird geladen…","Smart savings unavailable":"Smart Savings nicht verfügbar","Smart Savings is paused":"Smart Savings wird angehalten","An active SmartHomeShop energy contract is needed to calculate savings.":"Ein aktiver SmartHomeShop-Energievertrag ist erforderlich, um Einsparungen zu berechnen.","Previously measured total: {value}":"Zuvor gemessene Gesamtmenge: {value}","Smart savings":"Smart Savings","Measured value created by smart energy":"Gemessener Mehrwert durch Smart Energy",Today:"Heute",Tomorrow:"Morgen","This month":"Diesen Monat","All time":"Gesamt","Saved compared with today's average electricity price.":"Gespart im Vergleich zum heutigen Durchschnittsstrompreis.","Smart actions cost more than today's average so far.":"Intelligente Aktionen kosten bisher mehr als der heutige Durchschnitt.","Smart actions have not created measured value yet today.":"Intelligente Aktionen haben heute noch keinen Messwert geschaffen.","Cumulative value this calendar month":"Kumulierter Wert in diesem Kalendermonat","Since Smart Savings started measuring":"Seit Smart Savings mit der Messung begonnen hat","Battery today":"Batterie heute","Charging and discharging":"Aufladen und Entladen","Schedules today":"Zeitpläne heute","Loads shifted in time":"In der Zeit verschobene Lasten","Measured every 15 minutes from battery flows and running schedules, valued against the day-average electricity price.":"Gemessen alle 15 Minuten aus Batteriestrom und Fahrplänen, bewertet gegen den Tagesdurchschnittsstrompreis.","Live energy":"Live-Energie","Live power flow":"Live-Leistungsfluss","Direction and speed follow the power moving right now":"Richtung und Geschwindigkeit folgen dem aktuellen Energiefluss","Pause flow animation":"Flussanimation pausieren","Resume flow animation":"Flussanimation fortsetzen",Home:"Zuhause","Live usage":"Aktueller Verbrauch","Incomplete sensor data":"Unvollständige Sensordaten","{count} source connected":"{count}-Quelle verbunden","{count} sources connected":"{count}-Quellen verbunden","Live energy unavailable":"Live-Energie nicht verfügbar","Home consumption":"Hausverbrauch","A connected power sensor is unavailable":"Ein angeschlossener Stromsensor ist nicht verfügbar","Power used by your home right now":"Leistung, die dein Zuhause gerade verbraucht","{share}% from grid":"{share}% aus dem Netz","Solar + battery":"Solar + Batterie","Running on solar":"Versorgung durch Solarenergie","Running on battery":"Versorgung durch die Batterie","Sensor unavailable":"Sensor nicht verfügbar",Grid:"Netz",Solar:"Solar",Battery:"Batterie","No reading":"Kein Messwert","Importing from grid":"Import aus dem Netz","Exporting to grid":"Export ins Netz","Grid balanced":"Netz ausgeglichen","Producing now":"Erzeugt gerade","No production":"Keine Produktion",Discharging:"Entladen",Charging:"Laden",Idle:"Inaktiv","No active energy contract":"Kein aktiver Energievertrag","No price forecast yet":"Noch keine Preisprognose","Select an active SmartHomeShop energy contract in Energy Settings.":"Wählen Sie einen aktiven SmartHomeShop-Energievertrag in den Energieeinstellungen.","Connect dynamic prices in SmartHomeShop Energy Settings.":"Verbinden Sie dynamische Preise in SmartHomeShop Energy Settings.","Price outlook":"Preisausblick","All-in consumer price":"All-in-Verbrauchspreis","all-in price":"All-in Preis","Price day":"Preistag","Current price":"Aktueller Preis","Price now":"Jetzt Preis","Below daily average":"Unter dem Tagesdurchschnitt","Above daily average":"Über dem Tagesdurchschnitt","{value}% below average":"{value}% unterdurchschnittlich","{value}% above average":"{value}% überdurchschnittlich","Daily average":"Tagesdurchschnitt","Feed-in now":"Einspeisung jetzt","Next lower":"Nächster niedriger","None today":"Heute keine",Lowest:"Niedrigster Preis",Highest:"Höchster Preis","Negative prices":"Negative Preise","Daily spread":"Tägliche Ausbreitung","{count} hour":"{count} Stunde","{count} hours":"{count} Stunden","{day} by hour (EUR/kWh)":"{day} pro Stunde (EUR/kWh)",Lower:"niedriger",Higher:"Höher",Now:"Jetzt","Hourly electricity prices":"Stündliche Strompreise","Use the left and right arrow keys to inspect each hour.":"Verwenden Sie die linke und rechte Pfeiltaste, um jede Stunde zu inspizieren.","Cheapest consecutive block · {day}":"Günstiger aufeinanderfolgender Block · {day}","{price}/kWh average":"{price}/kWh Durchschnitt","Not available":"Nicht verfügbar","Cheapest block duration":"Billigste Blockdauer","Open price entity details":"Angaben zum Eröffnungspreis","{time}, save {price}":"{time}, speichern {price}","{price} at {time}":"{price} bei {time}","Power trend":"Leistungsverlauf","Today · 5-minute statistics to now":"Heute · 5-Minuten-Statistik bis jetzt","No power statistics available":"Keine Stromstatistik verfügbar","Configure a P1 meter, solar or battery power source in SmartHomeShop Energy Settings.":"Konfigurieren Sie ein P1-Messgerät, eine Solar- oder Batteriestromquelle in den SmartHomeShop-Energieeinstellungen.","Grid now":"Netz jetzt","Export now":"Jetzt exportieren","Import now":"Jetzt importieren","Peak import":"Spitzeneinfuhren","Peak export":"Spitzenausfuhren","Grid import":"Netzeinfuhr","Grid export":"Netzausfuhr","Power (W) · mean with min/max range":"Leistung (W) · Mittelwert mit min/max Bereich","Loading Home Assistant chart...":"Laden Home Assistant Diagramm...","Electricity costs":"Stromkosten","Imported, returned and net value today":"Importiert, zurückgegeben und Nettowert heute","Calculating today's electricity costs...":"Die heutigen Stromkosten berechnen...","Electricity costs unavailable":"Stromkosten nicht verfügbar","Connect an active SmartHomeShop contract to value today's imported and returned electricity.":"Verbinden Sie einen aktiven SmartHomeShop-Vertrag, um den heutigen importierten und zurückgegebenen Strom zu bewerten.","No P1 meter selected":"Kein P1-Meter ausgewählt","Select a P1 meter in SmartHomeShop Energy settings first.":"Wählen Sie zuerst ein P1-Messgerät in den SmartHomeShop-Energieeinstellungen aus.","Not enough history yet":"Noch nicht genug Geschichte","The card will calculate today's costs as soon as Recorder has grid power history.":"Die Karte berechnet die heutigen Kosten, sobald Recorder die Netzstromhistorie hat.","Net earned today":"Heute netto verdient","Net electricity cost":"Netto-Stromkosten","Return value is higher than import cost.":"Der Rückgabewert ist höher als die Importkosten.","{value} return value deducted":"{value} Rückgabewert abgezogen","No measured return value deducted yet.":"Noch kein gemessener Rückgabewert abgezogen.",priced:"Preis","Electricity imported":"Strombezug","Electricity returned":"Netzeinspeisung","Fixed daily contract cost":"Feste tägliche Vertragskosten","Full daily charge from your active contract":"Volle tägliche Gebühr von Ihrem aktiven Vertrag","avg.":"avg.","active contract":"Aktiver Vertrag","Estimated from recorded 5-minute grid power and prices from {contract}.":"Geschätzt aus aufgezeichnetem 5-Minuten-Netzstrom und Preisen von {contract}.","Predicted prices are used until confirmed prices arrive.":"Voraussichtliche Preise werden verwendet, bis bestätigte Preise eintreffen.","{coverage}% of measured energy has matching price data.":"{coverage}% der gemessenen Energie hat übereinstimmende Preisdaten.","Fixed daily charges and gas are excluded.":"Feste Tagesgebühren und Gas sind ausgeschlossen.","The fixed daily contract cost is included; gas is excluded.":"Die festen täglichen Vertragskosten sind inbegriffen; Gas ist ausgeschlossen.","Smart automations":"Smart-Automatisierungen","{enabled} enabled · {total} configured":"{enabled} aktiviert · {total} konfiguriert","Price, solar and deadline control":"Preis-, Solar- und Terminkontrolle","{count} enabled":"{count} aktiviert","Open Smart Energy settings":"Smart Energy Einstellungen öffnen","Reactive automations":"Reaktive Automatisierung","Deadline schedules":"Fristen","No Smart Automations yet":"Noch keine Smart Automation","Create price, solar or deadline controls in SmartHomeShop Energy Settings. They will appear here automatically.":"Erstellen Sie Preis-, Solar- oder Terminkontrollen in den SmartHomeShop Energieeinstellungen. Sie werden hier automatisch erscheinen.","Open Energy Settings":"Energieeinstellungen öffnen","No entities":"Keine Entitäten","Disabled - no automatic actions":"Disabled - keine automatischen Aktionen","Running an action now":"Jetzt eine Aktion ausführen","Ready - waiting for its trigger":"Ready - Warten auf seinen Auslöser","Never triggered":"Niemals ausgelöst","Last run unknown":"Letzter Lauf unbekannt","Triggered just now":"Ausgelöst gerade jetzt","Triggered {minutes} min ago":"Ausgelöst {minutes} vor min","Triggered {hours} h ago":"Ausgelöst {hours} h ago","Last run {date}":"Letzter Lauf {date}","Pause automation":"Pausenautomatisierung","Enable automation":"Automatisierung ermöglichen","Edit setup":"Einrichtung bearbeiten","More information":"Weitere Informationen","Disabled - deadline planning is paused":"Disabled - Terminplanung wird pausiert","Running now to meet the deadline":"Jetzt laufen, um die Frist einzuhalten","Running in a selected low-price hour":"Laufen in einer ausgewählten Niedrigpreisstunde","Pause schedule":"Pausenplan","Enable schedule":"Zeitplan aktivieren","{hours} h needed":"{hours} h benötigt","Run in the cheapest hours":"Laufen Sie in den billigsten Stunden","Run while electricity is cheap":"Laufen, während Strom billig ist","Pause during price peaks":"Pause während der Preisspitzen","Pre-heat cheap, ease off at peak":"Vorwärmen billig, entspannen Sie sich in der Spitze","Use solar surplus":"Solarüberschuss","Heat on solar surplus":"Wärme auf Sonnenüberschuss","Keep solar export near zero":"Solarexport nahe Null","Avoid negative-price solar export":"Negativpreis-Solarexport vermeiden","Self-consume on negative feed-in":"Eigenverbrauch durch negative Einspeisung","Charge the car in the cheapest hours":"Laden Sie das Auto in den billigsten Stunden","Cheapest {hours}-hour window is active":"Das günstigste {hours}-Stundenfenster ist aktiv","Waiting for the cheapest {hours}-hour window":"Waiting für das günstigste {hours}-Stundenfenster","Electricity is cheap now":"Strom ist jetzt billig","Waiting for a below-average price":"Waiting zu einem unterdurchschnittlichen Preis","Price peak - selected loads should be paused":"Preisspitze - ausgewählte Lasten sollten angehalten werden","No price peak right now":"Keine Preisspitze im Moment","Pre-heating in the cheap window":"Vorwärmen im billigen Fenster","Peak mode is active":"Peak Mode ist aktiv","Waiting for a cheap window or price peak":"Waiting für ein günstiges Fenster oder Preisspitze","{watts} W grid export meets the surplus threshold":"{watts} W-Netzexport erreicht Überschussschwelle","Waiting for at least {watts} W solar surplus":"Waiting für mindestens {watts} W Solarüberschuss","Reducing exported solar power":"Reduzierung der exportierten Solarenergie","Monitoring grid flow":"Überwachungsnetzfluss","Curtailing export during negative feed-in":"Einschränkung des Exports bei negativer Einspeisung","No unwanted paid export":"Keine unerwünschte bezahlte Ausfuhr","Negative feed-in - self-consumption active":"Negative Einspeisung - Eigenverbrauch aktiv","Feed-in price is not negative":"Einspeisepreis ist nicht negativ","Next start {time} · ready by {ready}":"Nächster Start {time} · ready by {ready}","Waiting for prices · ready by {ready}":"Waiting für Preise · bereit von {ready}","{done} of {required} hours completed":"{done} von {required} Stunden abgeschlossen","Schedules could not be refreshed. Showing the latest available data.":"Zeitpläne konnten nicht aktualisiert werden. Anzeige der neuesten verfügbaren Daten.","Could not enable the automation.":"Die Automatisierung konnte nicht ermöglicht werden.","Could not pause the automation.":"Ich konnte die Automatisierung nicht unterbrechen.","Could not update the schedule.":"Ich konnte den Zeitplan nicht aktualisieren.","The Smart Energy editor could not be loaded. Open SmartHomeShop Energy Settings to edit this automation.":"Der Smart Energy Editor konnte nicht geladen werden. Open SmartHomeShop Energieeinstellungen zum Bearbeiten dieser Automatisierung."},fr:{"Loading smart savings...":"Chargement de Smart Savings…","Smart savings unavailable":"Smart Savings indisponible","Smart Savings is paused":"Smart Savings est interrompu","An active SmartHomeShop energy contract is needed to calculate savings.":"Un contrat énergétique SmartHomeShop actif est nécessaire pour calculer les économies.","Previously measured total: {value}":"Total précédemment mesuré : {value}","Smart savings":"Smart Savings","Measured value created by smart energy":"Valeur mesurée créée par Smart Energy",Today:"Aujourd'hui",Tomorrow:"Demain","This month":"Ce mois-ci","All time":"Total","Saved compared with today's average electricity price.":"Economisez par rapport au prix moyen de l'électricité d'aujourd'hui.","Smart actions cost more than today's average so far.":"Les actions intelligentes coûtent plus cher que la moyenne actuelle.","Smart actions have not created measured value yet today.":"Les actions intelligentes n'ont pas encore créé de valeur mesurée.","Cumulative value this calendar month":"Valeur cumulée ce mois civil","Since Smart Savings started measuring":"Depuis que Smart Savings a commencé à mesurer","Battery today":"Batterie aujourd'hui","Charging and discharging":"Chargement et déchargement","Schedules today":"Planifications aujourd’hui","Loads shifted in time":"Charges décalées dans le temps","Measured every 15 minutes from battery flows and running schedules, valued against the day-average electricity price.":"Mesuré toutes les 15 minutes à partir du débit de la batterie et des horaires de fonctionnement, évalué par rapport au prix moyen journalier de l'électricité.","Live energy":"Énergie en direct","Live power flow":"Flux d’énergie en direct","Direction and speed follow the power moving right now":"La direction et la vitesse suivent le flux d’énergie actuel","Pause flow animation":"Mettre l’animation du flux en pause","Resume flow animation":"Reprendre l’animation du flux",Home:"Maison","Live usage":"Consommation actuelle","Incomplete sensor data":"Données incomplètes du capteur","{count} source connected":"Source {count} connectée","{count} sources connected":"Sources {count} connectées","Live energy unavailable":"Énergie en direct indisponible","Home consumption":"Consommation du logement","A connected power sensor is unavailable":"Un capteur de puissance connecté n'est pas disponible","Power used by your home right now":"Puissance consommée actuellement par votre logement","{share}% from grid":"{share}% de la grille","Solar + battery":"Solaire + batterie","Running on solar":"Alimenté par le solaire","Running on battery":"Alimenté par la batterie","Sensor unavailable":"Capteur non disponible",Grid:"Réseau",Solar:"Solaire",Battery:"Batterie","No reading":"Aucune mesure","Importing from grid":"Importation depuis le réseau","Exporting to grid":"Exportation vers le réseau","Grid balanced":"Réseau équilibré","Producing now":"Production en cours","No production":"Pas de production",Discharging:"Décharge",Charging:"Charge",Idle:"Inactif","No active energy contract":"Aucun contrat d'énergie active","No price forecast yet":"Pas encore de prévisions de prix","Select an active SmartHomeShop energy contract in Energy Settings.":"Sélectionnez un contrat d'énergie SmartHomeShop actif dans Paramètres énergétiques.","Connect dynamic prices in SmartHomeShop Energy Settings.":"Connectez les prix dynamiques dans les paramètres énergétiques SmartHomeShop.","Price outlook":"Prévision des prix","All-in consumer price":"Prix consommateur tout compris","all-in price":"Prix total","Price day":"Jour du prix","Current price":"Prix actuel","Price now":"Prix maintenant","Below daily average":"En dessous de la moyenne quotidienne","Above daily average":"Au-dessus de la moyenne quotidienne","{value}% below average":"{value}% inférieur à la moyenne","{value}% above average":"{value}% supérieur à la moyenne","Daily average":"Moyenne journalière","Feed-in now":"Injection actuelle","Next lower":"Suivant inférieur","None today":"Aucun aujourd’hui",Lowest:"Le plus bas",Highest:"Le plus élevé","Negative prices":"Prix négatifs","Daily spread":"Répartition quotidienne","{count} hour":"{count} heure","{count} hours":"{count} heures","{day} by hour (EUR/kWh)":"{day} par heure (EUR/kWh)",Lower:"Moins",Higher:"Plus haut",Now:"Tout de suite","Hourly electricity prices":"Prix horaires de l'électricité","Use the left and right arrow keys to inspect each hour.":"Utilisez les touches fléchées gauche et droite pour inspecter chaque heure.","Cheapest consecutive block · {day}":"Bloc consécutif le moins cher · {day}","{price}/kWh average":"{price}/kWh moyenne","Not available":"Non disponible","Cheapest block duration":"Durée du bloc le moins cher","Open price entity details":"Ouvrir les détails de l'entité","{time}, save {price}":"{time}, enregistrer {price}","{price} at {time}":"{price} à {time}","Power trend":"Évolution de la puissance","Today · 5-minute statistics to now":"Aujourd'hui · statistiques de 5 minutes à ce jour","No power statistics available":"Pas de statistiques sur la puissance disponible","Configure a P1 meter, solar or battery power source in SmartHomeShop Energy Settings.":"Configurez un compteur P1, une source d'énergie solaire ou batterie dans les paramètres énergétiques SmartHomeShop.","Grid now":"Réseau maintenant","Export now":"Exporter maintenant","Import now":"Importer maintenant","Peak import":"Importation maximale","Peak export":"Exportation maximale","Grid import":"Importation de grille","Grid export":"Exportation de grille","Power (W) · mean with min/max range":"Puissance (W) · moyenne avec une plage min/max","Loading Home Assistant chart...":"Chargement du graphique Home Assistant...","Electricity costs":"Coûts d’électricité","Imported, returned and net value today":"Importé, retourné et valeur nette aujourd'hui","Calculating today's electricity costs...":"Calculer les coûts d'électricité d'aujourd'hui...","Electricity costs unavailable":"Coûts de l'électricité non disponibles","Connect an active SmartHomeShop contract to value today's imported and returned electricity.":"Connectez un contrat actif SmartHomeShop à la valeur de l'électricité importée et retournée aujourd'hui.","No P1 meter selected":"Aucun compteur P1 sélectionné","Select a P1 meter in SmartHomeShop Energy settings first.":"Sélectionnez un compteur P1 dans les paramètres d'énergie SmartHomeShop.","Not enough history yet":"Pas encore assez d'histoire","The card will calculate today's costs as soon as Recorder has grid power history.":"La carte calculera les coûts d'aujourd'hui dès que Recorder aura l'historique du réseau électrique.","Net earned today":"Gain net aujourd’hui","Net electricity cost":"Coût net de l’électricité","Return value is higher than import cost.":"La valeur de retour est plus élevée que le coût d'importation.","{value} return value deducted":"Valeur de retour {value} déduite","No measured return value deducted yet.":"Aucune valeur de retour mesurée n'a encore été déduite.",priced:"prix","Electricity imported":"Électricité prélevée","Electricity returned":"Électricité injectée","Fixed daily contract cost":"Coût journalier fixe","Full daily charge from your active contract":"Charge quotidienne complète de votre contrat actif","avg.":"Avg.","active contract":"contrat actif","Estimated from recorded 5-minute grid power and prices from {contract}.":"Estimation à partir de la puissance réseau de 5 minutes enregistrée et des prix de {contract}.","Predicted prices are used until confirmed prices arrive.":"Les prix prévus sont utilisés jusqu'à l'arrivée des prix confirmés.","{coverage}% of measured energy has matching price data.":"{coverage}% de l'énergie mesurée a des données de prix correspondantes.","Fixed daily charges and gas are excluded.":"Les charges journalières fixes et le gaz sont exclus.","The fixed daily contract cost is included; gas is excluded.":"Le coût journalier fixe est inclus; le gaz est exclu.","Smart automations":"Automatisations intelligentes","{enabled} enabled · {total} configured":"{enabled} activé · {total} configuré","Price, solar and deadline control":"Contrôle des prix, solaire et échéance","{count} enabled":"{count} activé","Open Smart Energy settings":"Ouvrir les paramètres Smart Energy","Reactive automations":"Automatisations réactives","Deadline schedules":"Calendrier des échéances","No Smart Automations yet":"Pas encore d'automatisation intelligente","Create price, solar or deadline controls in SmartHomeShop Energy Settings. They will appear here automatically.":"Créez des contrôles de prix, solaires ou de date limite dans les paramètres énergétiques SmartHomeShop. Ils apparaîtront ici automatiquement.","Open Energy Settings":"Ouvrir les paramètres Energy","No entities":"Aucune entité","Disabled - no automatic actions":"Handicapé - pas d'action automatique","Running an action now":"Lancer une action maintenant","Ready - waiting for its trigger":"Prêt - attendant son déclencheur","Never triggered":"Jamais déclenché","Last run unknown":"Dernier essai inconnu","Triggered just now":"Déclenchement tout de suite","Triggered {minutes} min ago":"Triggered {minutes} il y a quelques minutes","Triggered {hours} h ago":"Triggered {hours} il y a h","Last run {date}":"Dernière exécution {date}","Pause automation":"Automatisation des pauses","Enable automation":"Activer l'automatisation","Edit setup":"Modifier la configuration","More information":"Plus d’informations","Disabled - deadline planning is paused":"Handicapé - la planification de la date limite est interrompue","Running now to meet the deadline":"Courir maintenant pour respecter la date limite","Running in a selected low-price hour":"Courant dans une heure choisie à bas prix","Pause schedule":"Horaire de la pause","Enable schedule":"Activer le calendrier","{hours} h needed":"{hours} h nécessaire","Run in the cheapest hours":"Cours dans les heures les moins chères","Run while electricity is cheap":"Courez alors que l'électricité est bon marché","Pause during price peaks":"Pause pendant les pics de prix","Pre-heat cheap, ease off at peak":"Préchauffer bon marché, se détendre au pic","Use solar surplus":"Utiliser l'excédent solaire","Heat on solar surplus":"Chaleur sur surplus solaire","Keep solar export near zero":"Gardez l'exportation solaire près de zéro","Avoid negative-price solar export":"Éviter les exportations solaires à prix négatif","Self-consume on negative feed-in":"Autoconsommation sur l'alimentation négative","Charge the car in the cheapest hours":"Charger la voiture dans les heures les moins chères","Cheapest {hours}-hour window is active":"La fenêtre {hours} la moins chère est active","Waiting for the cheapest {hours}-hour window":"Waiting pour la fenêtre {hours} la moins chère","Electricity is cheap now":"L'électricité est bon marché maintenant","Waiting for a below-average price":"Waiting pour un prix inférieur à la moyenne","Price peak - selected loads should be paused":"Prix maximum - les charges sélectionnées doivent être suspendues","No price peak right now":"Pas de pic de prix en ce moment","Pre-heating in the cheap window":"Préchauffage dans la fenêtre bon marché","Peak mode is active":"Le mode pic est actif","Waiting for a cheap window or price peak":"Waiting pour une fenêtre bon marché ou un pic de prix","{watts} W grid export meets the surplus threshold":"{watts} L'exportation de la grille W respecte le seuil d'excédent","Waiting for at least {watts} W solar surplus":"Waiting pour au moins {watts} W surplus solaire","Reducing exported solar power":"Réduction de l'énergie solaire exportée","Monitoring grid flow":"Surveillance du débit du réseau","Curtailing export during negative feed-in":"Exportation de la quenouille pendant l'alimentation négative","No unwanted paid export":"Aucune exportation non désirée payée","Negative feed-in - self-consumption active":"Alimentation négative - autoconsommation active","Feed-in price is not negative":"Le prix d'entrée n'est pas négatif","Next start {time} · ready by {ready}":"Prochain démarrage {time} · prêt par {ready}","Waiting for prices · ready by {ready}":"Waiting pour les prix · ready by {ready}","{done} of {required} hours completed":"{done} des heures de {required} terminées","Schedules could not be refreshed. Showing the latest available data.":"Les horaires ne pouvaient pas être actualisés. Affichage des dernières données disponibles.","Could not enable the automation.":"Impossible d'activer l'automatisation.","Could not pause the automation.":"Ne pouvait pas interrompre l'automatisation.","Could not update the schedule.":"Impossible de mettre à jour le calendrier.","The Smart Energy editor could not be loaded. Open SmartHomeShop Energy Settings to edit this automation.":"L'éditeur Smart Energy n'a pu être chargé. Ouvrir SmartHomeShop Paramètres énergétiques pour modifier cette automatisation."},es:{"Loading smart savings...":"Cargando Smart Savings…","Smart savings unavailable":"Smart Savings no disponible","Smart Savings is paused":"Smart Savings se detiene","An active SmartHomeShop energy contract is needed to calculate savings.":"Se necesita un contrato de energía SmartHomeShop activo para calcular los ahorros.","Previously measured total: {value}":"Total medido anteriormente: {value}","Smart savings":"Smart Savings","Measured value created by smart energy":"Valor medido generado por Smart Energy",Today:"Hoy",Tomorrow:"Mañana","This month":"Este mes","All time":"Total","Saved compared with today's average electricity price.":"Se ahorra en comparación con el precio medio de la electricidad de hoy.","Smart actions cost more than today's average so far.":"Las acciones inteligentes cuestan más que el promedio de hoy hasta ahora.","Smart actions have not created measured value yet today.":"Las acciones inteligentes no han creado valor medido todavía hoy.","Cumulative value this calendar month":"Valor acumulativo de este mes calendario","Since Smart Savings started measuring":"Desde Smart Savings comenzó a medir","Battery today":"Batería hoy","Charging and discharging":"Carga y descarga","Schedules today":"Programaciones de hoy","Loads shifted in time":"Las cargas cambiaron de tiempo","Measured every 15 minutes from battery flows and running schedules, valued against the day-average electricity price.":"Medido cada 15 minutos de los flujos de batería y los horarios de funcionamiento, valorado contra el precio de la electricidad del día.","Live energy":"Energía en tiempo real","Live power flow":"Flujo de energía en tiempo real","Direction and speed follow the power moving right now":"La dirección y la velocidad siguen el flujo de energía actual","Pause flow animation":"Pausar la animación del flujo","Resume flow animation":"Reanudar la animación del flujo",Home:"Hogar","Live usage":"Consumo actual","Incomplete sensor data":"Datos de sensores incompletos","{count} source connected":"Fuente {count} conectada","{count} sources connected":"Fuentes {count} conectadas","Live energy unavailable":"Energía en tiempo real no disponible","Home consumption":"Consumo del hogar","A connected power sensor is unavailable":"Un sensor de potencia conectado no está disponible","Power used by your home right now":"Potencia que consume tu hogar ahora mismo","{share}% from grid":"{share}% de la red","Solar + battery":"Batería solar +","Running on solar":"Funcionando con energía solar","Running on battery":"Funcionando con la batería","Sensor unavailable":"Sensor no disponible",Grid:"Red",Solar:"Solar",Battery:"Batería","No reading":"Sin lectura","Importing from grid":"Importación de la red","Exporting to grid":"Exportación a la red","Grid balanced":"Red equilibrada","Producing now":"Produciendo ahora","No production":"No hay producción",Discharging:"Descargando",Charging:"Cargando",Idle:"Inactivo","No active energy contract":"No contrato de energía activo","No price forecast yet":"No hay previsión de precios todavía","Select an active SmartHomeShop energy contract in Energy Settings.":"Seleccione un contrato de energía SmartHomeShop activo en Ajustes de Energía.","Connect dynamic prices in SmartHomeShop Energy Settings.":"Conecte precios dinámicos en SmartHomeShop Energy Settings.","Price outlook":"Previsión de precios","All-in consumer price":"Precio final para el consumidor","all-in price":"precio total","Price day":"Día del precio","Current price":"Precio actual","Price now":"Precio ahora","Below daily average":"Promedio diario","Above daily average":"Sobre la media diaria","{value}% below average":"{value}% debajo del promedio","{value}% above average":"{value}% por encima del promedio","Daily average":"Media diaria","Feed-in now":"Inyección actual","Next lower":"Siguiente inferior","None today":"Ninguno hoy",Lowest:"Más bajo",Highest:"Más alto","Negative prices":"Precios negativos","Daily spread":"Difusión diaria","{count} hour":"{count} hora","{count} hours":"Horas {count}","{day} by hour (EUR/kWh)":"{day} por hora (EUR/kWh)",Lower:"Bajo",Higher:"Superior",Now:"Ahora","Hourly electricity prices":"Precios de electricidad por hora","Use the left and right arrow keys to inspect each hour.":"Utilice las teclas de flecha izquierda y derecha para inspeccionar cada hora.","Cheapest consecutive block · {day}":"bloque consecutivo más barato · {day}","{price}/kWh average":"{price}/kWh promedio","Not available":"No disponible","Cheapest block duration":"La duración del bloque más barata","Open price entity details":"Detalles de la entidad de precio abierto","{time}, save {price}":"{time}, guardar {price}","{price} at {time}":"{price} en {time}","Power trend":"Tendencia de potencia","Today · 5-minute statistics to now":"Hoy · 5 minutos de estadísticas para ahora","No power statistics available":"No hay estadísticas de potencia disponibles","Configure a P1 meter, solar or battery power source in SmartHomeShop Energy Settings.":"Configure un medidor P1, fuente de energía solar o de batería en SmartHomeShop Energy Settings.","Grid now":"Red ahora","Export now":"Exportar ahora","Import now":"Importe ahora","Peak import":"Importación de pico","Peak export":"Peak export","Grid import":"Importación de rejas","Grid export":"Grid export","Power (W) · mean with min/max range":"Potencia (W) · media con rango min/max","Loading Home Assistant chart...":"Cargando Home Assistant gráfica...","Electricity costs":"Costes de electricidad","Imported, returned and net value today":"Importado, devuelto y valor neto hoy","Calculating today's electricity costs...":"Calculando los costos de electricidad de hoy...","Electricity costs unavailable":"Gastos de electricidad no disponibles","Connect an active SmartHomeShop contract to value today's imported and returned electricity.":"Conecte un contrato SmartHomeShop activo para valorar la electricidad importada y devuelta de hoy.","No P1 meter selected":"No se ha seleccionado el medidor P1","Select a P1 meter in SmartHomeShop Energy settings first.":"Seleccione un medidor P1 en la configuración de SmartHomeShop Energy primero.","Not enough history yet":"Aún no es suficiente historia","The card will calculate today's costs as soon as Recorder has grid power history.":"La tarjeta calculará los costos de hoy tan pronto como Recorder tenga historial de energía de red.","Net earned today":"Ganancia neta de hoy","Net electricity cost":"Coste neto de electricidad","Return value is higher than import cost.":"El valor de retorno es superior al costo de importación.","{value} return value deducted":"Valor de retorno {value} deducido","No measured return value deducted yet.":"Todavía no se ha deducido el valor de retorno medido.",priced:"precio","Electricity imported":"Electricidad importada","Electricity returned":"Electricidad inyectada","Fixed daily contract cost":"Costo fijo del contrato diario","Full daily charge from your active contract":"Cargo diario completo de su contrato activo","avg.":"avg.","active contract":"contrato activo","Estimated from recorded 5-minute grid power and prices from {contract}.":"Estimación de la potencia y los precios de la red registradas de 5 minutos desde {contract}.","Predicted prices are used until confirmed prices arrive.":"Los precios predecidos se utilizan hasta que lleguen los precios confirmados.","{coverage}% of measured energy has matching price data.":"{coverage}% de energía medida tiene datos de precios iguales.","Fixed daily charges and gas are excluded.":"Se excluyen los cargos diarios fijos y el gas.","The fixed daily contract cost is included; gas is excluded.":"El costo del contrato diario fijo está incluido; el gas está excluido.","Smart automations":"Automatizaciones inteligentes","{enabled} enabled · {total} configured":"{enabled} habilitado · {total} configurado","Price, solar and deadline control":"Control de precios, solar y plazo","{count} enabled":"{count} habilitado","Open Smart Energy settings":"Ajustes de Smart Energy abiertos","Reactive automations":"Automatizaciones reactivas","Deadline schedules":"Calendarios fijos","No Smart Automations yet":"Sin automatizaciones inteligentes todavía","Create price, solar or deadline controls in SmartHomeShop Energy Settings. They will appear here automatically.":"Cree controles de precio, solares o plazos en SmartHomeShop Energy Settings. Ellos aparecerán aquí automáticamente.","Open Energy Settings":"Abrir ajustes de Energy","No entities":"No entidades","Disabled - no automatic actions":"Impedidos - sin acciones automáticas","Running an action now":"Corriendo una acción ahora","Ready - waiting for its trigger":"Listo - esperando su gatillo","Never triggered":"Nunca disparado","Last run unknown":"Última carrera desconocida","Triggered just now":"Triggered just now","Triggered {minutes} min ago":"Triggered {minutes} min ago","Triggered {hours} h ago":"Triggered {hours} h ago","Last run {date}":"Última carrera {date}","Pause automation":"Automatización de la pausa","Enable automation":"Automatización habilitada","Edit setup":"Editar configuración","More information":"Más información","Disabled - deadline planning is paused":"Discapacitados - se detiene la planificación del plazo","Running now to meet the deadline":"Correr ahora para cumplir con el plazo","Running in a selected low-price hour":"Correr en una hora de precio bajo seleccionada","Pause schedule":"Pause schedule","Enable schedule":"Calendario habilitado","{hours} h needed":"{hours} h necesario","Run in the cheapest hours":"Corre en las horas más baratas","Run while electricity is cheap":"Corre mientras la electricidad es barata","Pause during price peaks":"Pausa durante los picos de precios","Pre-heat cheap, ease off at peak":"Precalentamiento barato, aléjate en el pico","Use solar surplus":"Uso de excedentes solares","Heat on solar surplus":"Caliente sobre el superávit solar","Keep solar export near zero":"Mantener la exportación solar cerca de cero","Avoid negative-price solar export":"Evite la exportación solar de precio negativo","Self-consume on negative feed-in":"Self-consume on negative feed-in","Charge the car in the cheapest hours":"Cargar el coche en las horas más baratas","Cheapest {hours}-hour window is active":"La ventana más barata {hours}-hour está activa","Waiting for the cheapest {hours}-hour window":"Waiting para la ventana {hours}-hour más barata","Electricity is cheap now":"La electricidad es barata ahora","Waiting for a below-average price":"Waiting por un precio por debajo del promedio","Price peak - selected loads should be paused":"Precio máximo - las cargas seleccionadas deben ser pausadas","No price peak right now":"No hay pico de precio ahora mismo","Pre-heating in the cheap window":"Precalentamiento en la ventana barata","Peak mode is active":"Modo de pico activo","Waiting for a cheap window or price peak":"Waiting por una ventana barata o precio pico","{watts} W grid export meets the surplus threshold":"{watts} W exportación de red cumple con el umbral de excedente","Waiting for at least {watts} W solar surplus":"Waiting por lo menos {watts} W superávit solar","Reducing exported solar power":"Reducción de la energía solar exportada","Monitoring grid flow":"Corriente de vigilancia","Curtailing export during negative feed-in":"Reducción de la exportación durante la entrada negativa","No unwanted paid export":"Ninguna exportación pagada no deseada","Negative feed-in - self-consumption active":"Alimentación negativa - autoconsumo activo","Feed-in price is not negative":"El precio no es negativo","Next start {time} · ready by {ready}":"Siguiente inicio {time} · listo por {ready}","Waiting for prices · ready by {ready}":"Waiting para precios · listo por {ready}","{done} of {required} hours completed":"{done} de {required} horas completadas","Schedules could not be refreshed. Showing the latest available data.":"Los horarios no se pueden actualizar. Mostrando los últimos datos disponibles.","Could not enable the automation.":"No podía permitir la automatización.","Could not pause the automation.":"No podía detener la automatización.","Could not update the schedule.":"No podía actualizar el horario.","The Smart Energy editor could not be loaded. Open SmartHomeShop Energy Settings to edit this automation.":"El editor Smart Energy no puede ser cargado. Open SmartHomeShop Ajustes de energía para editar esta automatización."}},vi=(e,t,i={})=>{const a=$e(e);return(gi[a]?.[t]||t).replace(/\{(\w+)\}/g,(e,t)=>Object.prototype.hasOwnProperty.call(i,t)?String(i[t]):e)};class fi extends ue{constructor(){super(...arguments),this._localization=new De(this,()=>this.hass),this.cardType="live",this.config={}}setConfig(e){this.config={...e}}setValue(e,t){const i={...this.config};void 0===t||""===t?delete i[e]:i[e]=t,this.config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}toggle(e,t,i,a=!0){const o=this.config[e]??a;return K`
      <label class="toggle">
        <span class="toggle-copy"><span class="toggle-name">${t}</span><span class="toggle-note">${i}</span></span>
        <input type="checkbox" .checked=${o} @change=${t=>this.setValue(e,t.target.checked)}>
      </label>
    `}render(){return K`
      <div class="intro">
        <ha-icon icon="mdi:lightning-bolt-outline"></ha-icon>
        <span>Uses the entities and energy contract configured in SmartHomeShop Energy settings. No duplicate entity setup is needed in this card.</span>
      </div>
      <div class="field">
        <label class="label" for="title">Card title (optional)</label>
        <input id="title" type="text" .value=${this.config.title||""}
          placeholder=${this._defaultTitle()}
          @input=${e=>this.setValue("title",e.target.value)}>
      </div>
      ${this.toggle("show_header","Show card header","Title, icon and a short explanation")}
      <div class="section-title">Content</div>
      ${this._typeFields()}
    `}_defaultTitle(){return{live:"Live energy",price:"Price outlook",power:"Power trend",costs:"Electricity costs",savings:"Smart savings",automations:"Smart automations"}[this.cardType]}_typeFields(){if("live"===this.cardType){const e=this.config.show_flow??!1;return K`
        ${this.toggle("show_flow","Live power flow","Show the direction and speed of power moving between grid, solar, home and battery",!1)}
        ${e?K`
          ${this.toggle("animate_flow","Animate power flow","Moving dots follow the live direction; speed reflects power",!0)}
          ${this.toggle("show_details","Source details below flow","Keep the familiar home overview and source rows below the flow",!0)}
        `:Y}
        <div class="section-title">Sources</div>
        ${this.toggle("show_home","Home consumption",e?"Large calculated consumption overview below the flow":"Large calculated consumption overview")}
        ${this.toggle("show_grid","Grid","Current grid import or export")}
        ${this.toggle("show_solar","Solar","Live solar production when configured")}
        ${this.toggle("show_battery","Battery","Battery flow and state of charge")}
      `}return"price"===this.cardType?K`
        <div class="pair">
          <div class="field">
            <label class="label" for="day">Initial day</label>
            <select id="day" .value=${this.config.day||"auto"}
              @change=${e=>this.setValue("day",e.target.value)}>
              <option value="auto">Automatic</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
            </select>
          </div>
          <div class="field">
            <label class="label" for="hours">Cheapest block</label>
            <select id="hours" .value=${String(this.config.cheapest_hours||3)}
              @change=${e=>this.setValue("cheapest_hours",Number(e.target.value))}>
              ${[1,2,3,4,5,6].map(e=>K`<option value=${e}>${e} hour${e>1?"s":""}</option>`)}
            </select>
          </div>
        </div>
        ${this.toggle("show_facts","Price insights","Daily average, low, high and feed-in facts")}
        ${this.toggle("show_cheapest_block","Cheapest block","Show the best consecutive period below the chart")}
      `:"power"===this.cardType?K`
        ${this.toggle("show_summary","Current and peak values","Summary strip above the graph")}
        ${this.toggle("show_grid_import","Grid import line","Power drawn from the grid")}
        ${this.toggle("show_grid_export","Grid export line","Power returned to the grid")}
        ${this.toggle("show_solar","Solar line","Solar production during the day")}
        ${this.toggle("show_battery","Battery line","Charging and discharging power")}
      `:"costs"===this.cardType?K`
        ${this.toggle("show_details","Import and return details","Show today's kWh and value for both grid directions")}
        ${this.toggle("show_prices","Average prices","Show the measured average import and return price per kWh")}
        ${this.toggle("include_fixed_daily_cost","Include fixed daily cost","Add the full daily contract charge to today's net electricity cost",!1)}
        ${this.toggle("show_explanation","Calculation explanation","Explain the price source, coverage and contract charges")}
      `:"savings"===this.cardType?K`
        ${this.toggle("show_breakdown","Today's breakdown","Separate battery and schedule contributions")}
        ${this.toggle("show_explanation","Measurement explanation","Explain how Smart Savings is calculated")}
      `:"automations"===this.cardType?K`
        <div class="field">
          <label class="label" for="view">Card density</label>
          <select id="view" .value=${this.config.view||"expanded"}
            @change=${e=>this.setValue("view",e.target.value)}>
            <option value="expanded">Expanded - status and details</option>
            <option value="compact">Compact - status only</option>
          </select>
        </div>
        ${this.toggle("show_schedules","Deadline schedules","Show ready-by schedules below reactive automations")}
        ${this.toggle("show_controls","Quick controls","Pause and resume directly from the card")}
        ${this.toggle("show_last_triggered","Last triggered","Show when each automation last ran")}
      `:Y}}fi.styles=c`
    :host { display: block; }
    * { box-sizing: border-box; }
    .intro {
      margin-bottom: 17px;
      padding: 12px 13px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      border-radius: 10px;
      color: var(--secondary-text-color);
      background: color-mix(in srgb, var(--primary-color) 8%, var(--card-background-color));
      font-size: 12px;
      line-height: 1.45;
    }
    .intro ha-icon { --mdc-icon-size: 19px; flex: 0 0 auto; color: var(--primary-color); }
    .field { margin-bottom: 16px; }
    .label, .section-title {
      display: block;
      margin-bottom: 6px;
      color: var(--primary-text-color);
      font-size: 12px;
      font-weight: 650;
    }
    .section-title {
      margin: 19px 0 10px;
      color: var(--secondary-text-color);
      font-size: 10.5px;
      letter-spacing: .6px;
      text-transform: uppercase;
    }
    input[type="text"], select {
      width: 100%;
      min-height: 42px;
      padding: 9px 11px;
      border: 1px solid var(--divider-color);
      border-radius: 9px;
      outline: 0;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
    }
    input[type="text"]:focus, select:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color);
    }
    .toggle {
      min-height: 43px;
      padding: 9px 2px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 72%, transparent);
      cursor: pointer;
    }
    .toggle:last-child { border-bottom: 0; }
    .toggle-copy { min-width: 0; }
    .toggle-name { display: block; color: var(--primary-text-color); font-size: 13px; font-weight: 560; }
    .toggle-note { display: block; margin-top: 2px; color: var(--secondary-text-color); font-size: 10.5px; line-height: 1.35; }
    input[type="checkbox"] { width: 19px; height: 19px; flex: 0 0 auto; accent-color: var(--primary-color); }
    .pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    @media (max-width: 420px) { .pair { grid-template-columns: 1fr; } }
  `,a([ve({attribute:!1})],fi.prototype,"hass",void 0),a([ve({attribute:!1})],fi.prototype,"cardType",void 0),a([fe()],fi.prototype,"config",void 0);const yi={show_header:!0,show_flow:!1,animate_flow:!0,show_details:!0,show_home:!0,show_grid:!0,show_solar:!0,show_battery:!0};class bi extends pi{constructor(){super(...arguments),this.config={...yi},this.flowPaused=!1}setConfig(e){if(!e)throw new Error("Energy Live card configuration is required.");this.config={...yi,...e}}getCardSize(){return 4}static getStubConfig(){return{show_header:!0,show_flow:!0,animate_flow:!0,show_details:!0,show_home:!0,show_grid:!0,show_solar:!0,show_battery:!0}}static getConfigElement(){const e=document.createElement("smarthomeshop-energy-card-editor");return e.cardType="live",e}_t(e,t){return vi(this.hass,e,t)}_sourcePill(e,t,i,a){if(null===e||e<=0)return null;const o=Math.max(0,e-Math.max(0,i)-Math.max(0,a));if(null!==t&&t>5&&o>5){const t=Math.min(100,Math.round(o/e*100));return K`<div class="source-pill grid"><ha-icon icon="mdi:transmission-tower-import"></ha-icon>${this._t("{share}% from grid",{share:t})}</div>`}return i>5&&a>5?K`<div class="source-pill"><span class="dot"></span>${this._t("Solar + battery")}</div>`:i>5?K`<div class="source-pill"><span class="dot"></span>${this._t("Running on solar")}</div>`:a>5?K`<div class="source-pill"><span class="dot"></span>${this._t("Running on battery")}</div>`:null}_flowDuration(e){const t=Math.max(0,Math.abs(e)),i=Math.min(1,Math.log10(t+1)/Math.log10(5001));return Number((3.2-2.25*i).toFixed(2))}_flowPath(e,t,i,a){const o=null!==t&&Math.abs(t)>5,r=o&&!1!==this.config.animate_flow&&!this.flowPaused;return B`
      <path class="flow-track" d=${e} pathLength="100"></path>
      ${o?B`
        <path
          class="flow-line ${r?"moving":""} ${i?"reverse":""}"
          d=${e}
          pathLength="100"
          style=${`--flow-color:${a};--flow-duration:${this._flowDuration(t??0)}s`}
        ></path>
      `:Y}
    `}_flowNode(e,t,i,a,o,r,n){const s=ai(this.hass,i)||null===a,l=ni(a,!0),c=K`
      <div class="flow-orb"><ha-icon icon=${o}></ha-icon></div>
      <div class="flow-copy">
        <span>${t}</span>
        <strong>${l.value}<small>${l.unit}</small></strong>
        <em>${s?this._t("Sensor unavailable"):r}</em>
      </div>
    `,d=`flow-node ${e} ${"grid"===e||"solar"===e?"left":""} ${s?"unavailable":""}`,h=`--flow-node-color:${s?"var(--secondary-text-color)":n}`,u=`${t}: ${l.value} ${l.unit}. ${s?this._t("Sensor unavailable"):r}`;return i?K`<button
          class=${d}
          style=${h}
          type="button"
          aria-label=${u}
          @click=${()=>ui(this,i)}
        >${c}</button>`:K`<div class=${d} style=${h} aria-label=${u}>${c}</div>`}_renderFlow(e,t,i,a,o,r){const n=this.context.sources,s=!1!==this.config.show_grid,l=!1!==this.config.show_solar&&!!n.solar_power,c=!1!==this.config.show_battery&&!!n.battery_power,d=null!==e&&e<-5,h=null!==i&&i<-5,u=d?"var(--shs-green)":"var(--shs-red)",p=ni(o),m=this._t(null===e?"No reading":e>5?"Importing from grid":e<-5?"Exporting to grid":"Grid balanced"),g=this._t(t>5?"Producing now":"No production"),v=`${this._t(null===i?"No reading":i>5?"Discharging":i<-5?"Charging":"Idle")}${null!==a?` · ${Math.round(a)}%`:""}`,f=this.flowPaused?this._t("Resume flow animation"):this._t("Pause flow animation");return K`
      <section class="flow-panel ${!1===this.config.show_details?"flow-only":""}" aria-label=${this._t("Live power flow")}>
        <div class="flow-toolbar">
          <div class="flow-heading">
            <strong>${this._t("Live power flow")}</strong>
            <span>${this._t("Direction and speed follow the power moving right now")}</span>
          </div>
          ${!1!==this.config.animate_flow?K`
            <button
              class="flow-control"
              type="button"
              title=${f}
              aria-label=${f}
              aria-pressed=${this.flowPaused?"true":"false"}
              @click=${()=>{this.flowPaused=!this.flowPaused}}
            >
              <ha-icon icon=${this.flowPaused?"mdi:play":"mdi:pause"}></ha-icon>
            </button>
          `:Y}
        </div>
        <div class="flow-map">
          <svg class="flow-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${s?this._flowPath("M 24 16 C 35 16 37 38 42 46",e,d,u):Y}
            ${l?this._flowPath("M 24 84 C 35 84 37 62 42 54",t,!1,"var(--shs-amber)"):Y}
            ${c?this._flowPath("M 76 50 C 69 50 65 50 58 50",i,h,"var(--shs-blue)"):Y}
          </svg>

          ${s?this._flowNode("grid",this._t("Grid"),this.context.netEntity||this.context.gridImportEntity||this.context.gridExportEntity,e,d?"mdi:transmission-tower-export":"mdi:transmission-tower-import",m,u):Y}
          ${l?this._flowNode("solar",this._t("Solar"),n.solar_power,t,"mdi:solar-power-variant",g,"var(--shs-amber)"):Y}
          ${c?this._flowNode("battery",this._t("Battery"),n.battery_power,i,h?"mdi:battery-arrow-up-outline":"mdi:battery-arrow-down-outline",v,"var(--shs-blue)"):Y}

          <div
            class="flow-node home ${r||null===o?"unavailable":""}"
            aria-label=${`${this._t("Home consumption")}: ${p.value} ${p.unit}`}
          >
            <div class="flow-home-content">
              <ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon>
              <span>${this._t("Home")}</span>
              <strong>${p.value}<small>${p.unit}</small></strong>
              <em>${this._t(r?"Incomplete sensor data":"Live usage")}</em>
            </div>
          </div>
        </div>
      </section>
    `}_row(e,t,i,a,o,r,n="",s){const l=ni(i,!0),c=ai(this.hass,t),d=K`
      <div class="source-icon ${o}"><ha-icon icon=${a}></ha-icon></div>
      <div>
        <div class="source-name">${e}</div>
        <div class="source-status ${c?"bad":n}">${c?this._t("Sensor unavailable"):r}</div>
      </div>
      <div>
        <div class="source-value">${l.value}<span>${l.unit}</span></div>
        ${null!=s?K`
          <div class="battery-meta">
            <span class="battery-glyph"><i style="width:${Math.max(0,Math.min(100,s))}%"></i></span>
            <small>${Math.round(s)}%</small>
          </div>
        `:Y}
      </div>
    `;return t?K`<button class="source-row" type="button" @click=${()=>ui(this,t)}>${d}</button>`:K`<div class="source-row">${d}</div>`}render(){if(!this.hass)return Y;if(this.loading&&!this.context)return K`<ha-card><div class="loading" role="status" aria-live="polite"><div class="skeleton"></div><div class="skeleton"></div></div></ha-card>`;if(!this.context)return K`<ha-card><div class="empty" role="alert"><ha-icon icon="mdi:cloud-alert-outline"></ha-icon><strong>${this._t("Live energy unavailable")}</strong><span>${this.loadError}</span></div></ha-card>`;const e=this.context.sources,t=oi(this.hass,this.context),i=e.solar_power?Math.max(0,ii(this.hass,e.solar_power,!!e.solar_invert)??0):0,a=e.battery_power?ii(this.hass,e.battery_power,!!e.battery_invert):null,o=ii(this.hass,e.battery_soc),r=((e,t)=>{if(!t)return!1;if(t.netEntity&&!ai(e,t.netEntity))return!1;const i=[t.gridImportEntity,t.gridExportEntity].filter(Boolean);return i.length?i.some(t=>ai(e,t)):!!t.netEntity&&ai(e,t.netEntity)})(this.hass,this.context)||!!e.solar_power&&ai(this.hass,e.solar_power)||!!e.battery_power&&ai(this.hass,e.battery_power),n=null===t||r?null:Math.max(0,t+i+(a??0)),s=ni(n),l=!0===this.config.show_flow,c=!l||!1!==this.config.show_details,d=1+(e.solar_power?1:0)+(e.battery_power?1:0),h=this.renderHeader(this._t("Live energy"),this._t(1===d?"{count} source connected":"{count} sources connected",{count:d}),"mdi:home-lightning-bolt-outline"),u=[!1!==this.config.show_grid?this._row(this._t("Grid"),this.context.netEntity||this.context.gridImportEntity||this.context.gridExportEntity,t,null!==t&&t<-5?"mdi:transmission-tower-export":"mdi:transmission-tower-import",null===t||Math.abs(t)<=5?"":t>5?"import":"export",this._t(null===t?"No reading":t>5?"Importing from grid":t<-5?"Exporting to grid":"Grid balanced"),null!==t&&t<-5?"good":""):Y,!1!==this.config.show_solar&&e.solar_power?this._row(this._t("Solar"),e.solar_power,i,"mdi:solar-power-variant","solar",this._t(i>5?"Producing now":"No production"),i>5?"good":""):Y,!1!==this.config.show_battery&&e.battery_power?this._row(this._t("Battery"),e.battery_power,a,null!==a&&a<-5?"mdi:battery-arrow-up-outline":"mdi:battery-arrow-down-outline","battery",this._t(null===a?"No reading":a>5?"Discharging":a<-5?"Charging":"Idle"),null!==a&&a>5?"good":"",o):Y];return K`
      <ha-card>
        <div class="card-shell">
          ${h?K`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon=${h.icon}></ha-icon></div>
                <div><h2 class="head-title">${h.title}</h2><div class="head-subtitle">${h.subtitle}</div></div>
              </div>
            </div>
          `:Y}
          ${l?this._renderFlow(t,i,a,o,n,r):Y}
          ${c?K`<div class="live-layout ${!1===this.config.show_home?"no-home":""}">
            ${!1!==this.config.show_home?K`
              <div class="home">
                <div class="home-label"><ha-icon icon="mdi:home-outline"></ha-icon>${this._t("Home consumption")}</div>
                <div class="home-power">${s.value}<span>${s.unit}</span></div>
                <div class="home-caption ${r?"error":""}">
                  ${this._t(r?"A connected power sensor is unavailable":"Power used by your home right now")}
                </div>
                ${this._sourcePill(n,t,i,a??0)}
              </div>
            `:Y}
            <div class="sources">${u}</div>
          </div>`:Y}
        </div>
      </ha-card>
    `}}bi.styles=[mi,c`
      .live-layout {
        display: grid;
        grid-template-columns: minmax(190px, .78fr) minmax(250px, 1.22fr);
        margin: 0 -18px -18px;
        border-top: 1px solid var(--shs-line);
      }
      .home {
        min-height: 204px;
        padding: 23px 22px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: var(--shs-blue-soft);
        border-right: 1px solid var(--shs-line);
      }
      .home-label {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--secondary-text-color);
        font-size: 10.5px;
        font-weight: 720;
        letter-spacing: .55px;
        text-transform: uppercase;
      }
      .home-label ha-icon { --mdc-icon-size: 16px; color: var(--shs-blue); }
      .home-power {
        margin-top: 17px;
        color: var(--primary-text-color);
        font-size: clamp(35px, 8cqi, 49px);
        font-weight: 760;
        letter-spacing: -.025em;
        line-height: .95;
      }
      .home-power span {
        margin-left: 4px;
        color: var(--secondary-text-color);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0;
      }
      .home-caption {
        margin-top: 11px;
        color: var(--secondary-text-color);
        font-size: 11px;
        line-height: 1.4;
      }
      .home-caption.error { color: var(--error-color, var(--shs-red)); }
      .source-pill {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 14px;
        padding: 5px 9px;
        border-radius: 999px;
        color: var(--shs-green);
        background: var(--shs-green-soft);
        font-size: 10.5px;
        font-weight: 680;
      }
      .source-pill.grid { color: var(--shs-amber); background: var(--shs-amber-soft); }
      .source-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
      .source-pill ha-icon { --mdc-icon-size: 14px; }
      .sources { display: grid; align-content: stretch; }
      .source-row {
        appearance: none;
        width: 100%;
        min-height: 68px;
        padding: 12px 16px;
        display: grid;
        grid-template-columns: 36px minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        border: 0;
        border-bottom: 1px solid var(--shs-line);
        background: transparent;
        color: inherit;
        text-align: left;
      }
      button.source-row { cursor: pointer; }
      button.source-row:hover { background: var(--shs-surface); }
      .source-row:last-child { border-bottom: 0; }
      .source-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        color: var(--secondary-text-color);
        background: var(--shs-surface);
      }
      .source-icon ha-icon { --mdc-icon-size: 20px; }
      .source-icon.import { color: var(--shs-red); background: var(--shs-red-soft); }
      .source-icon.export, .source-icon.solar { color: var(--shs-green); background: var(--shs-green-soft); }
      .source-icon.battery { color: var(--shs-blue); background: var(--shs-blue-soft); }
      .source-name { font-size: 12px; font-weight: 710; }
      .source-status { margin-top: 2px; color: var(--secondary-text-color); font-size: 10.5px; }
      .source-status.good { color: var(--shs-green); }
      .source-status.bad { color: var(--error-color, var(--shs-red)); }
      .source-value { display: flex; align-items: baseline; gap: 4px; font-size: 19px; font-weight: 740; white-space: nowrap; }
      .source-value span { color: var(--secondary-text-color); font-size: 10.5px; font-weight: 600; }
      .battery-meta { margin-top: 5px; display: flex; align-items: center; justify-content: flex-end; gap: 5px; }
      .battery-glyph {
        width: 27px; height: 12px; padding: 2px;
        position: relative; display: block;
        border: 1px solid var(--secondary-text-color); border-radius: 3px;
      }
      .battery-glyph::after {
        content: ''; position: absolute; right: -4px; top: 3px;
        width: 2px; height: 5px; border-radius: 0 2px 2px 0;
        background: var(--secondary-text-color);
      }
      .battery-glyph i { display: block; height: 100%; border-radius: 1px; background: var(--shs-green); }
      .battery-meta small { color: var(--secondary-text-color); font-size: 9.5px; }
      .flow-panel {
        margin: 0 -18px;
        padding: 13px 18px 17px;
        border-top: 1px solid var(--shs-line);
        background: var(--shs-surface);
      }
      .flow-panel.flow-only { margin-bottom: -18px; }
      .flow-toolbar {
        min-height: 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .flow-heading { min-width: 0; }
      .flow-heading strong {
        display: block;
        color: var(--primary-text-color);
        font-size: 11.5px;
        font-weight: 710;
        line-height: 1.25;
      }
      .flow-heading span {
        display: block;
        margin-top: 2px;
        color: var(--secondary-text-color);
        font-size: 9.5px;
        line-height: 1.3;
      }
      .flow-control {
        width: 30px;
        height: 30px;
        flex: 0 0 30px;
        display: grid;
        place-items: center;
        border: 1px solid var(--shs-line);
        border-radius: 50%;
        background: var(--card-background-color);
        color: var(--secondary-text-color);
        cursor: pointer;
      }
      .flow-control:hover { color: var(--shs-blue); border-color: var(--shs-blue); }
      .flow-control ha-icon { --mdc-icon-size: 16px; }
      .flow-map {
        height: 252px;
        position: relative;
        isolation: isolate;
      }
      .flow-lines {
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: visible;
        pointer-events: none;
      }
      .flow-track, .flow-line {
        fill: none;
        vector-effect: non-scaling-stroke;
        stroke-linecap: round;
      }
      .flow-track {
        stroke: color-mix(in srgb, var(--secondary-text-color) 21%, transparent);
        stroke-width: 1.5;
      }
      .flow-line {
        stroke: var(--flow-color, var(--shs-blue));
        stroke-width: 3;
        stroke-dasharray: 1.5 7;
        filter: drop-shadow(0 0 1px color-mix(in srgb, var(--flow-color) 38%, transparent));
      }
      .flow-line.moving {
        animation: shs-flow-forward var(--flow-duration, 2s) linear infinite;
      }
      .flow-line.moving.reverse { animation-name: shs-flow-reverse; }
      @keyframes shs-flow-forward { to { stroke-dashoffset: -17; } }
      @keyframes shs-flow-reverse { to { stroke-dashoffset: 17; } }
      .flow-node {
        width: 136px;
        min-height: 58px;
        padding: 5px 0;
        position: absolute;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 9px;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: left;
      }
      button.flow-node { cursor: pointer; }
      button.flow-node:hover .flow-orb { border-color: currentColor; transform: scale(1.04); }
      .flow-node.left { flex-direction: row-reverse; text-align: right; }
      .flow-node.grid { left: 0; top: 12px; color: var(--flow-node-color, var(--shs-red)); }
      .flow-node.solar { left: 0; bottom: 12px; color: var(--shs-amber); --flow-node-color: var(--shs-amber); }
      .flow-node.battery { right: 0; top: calc(50% - 29px); color: var(--shs-blue); --flow-node-color: var(--shs-blue); }
      .flow-node.home {
        width: 112px;
        height: 112px;
        min-height: 112px;
        padding: 0;
        left: 50%;
        top: 50%;
        display: grid;
        place-items: center;
        transform: translate(-50%, -50%);
        border: 1px solid color-mix(in srgb, var(--shs-blue) 26%, var(--shs-line));
        border-radius: 50%;
        background: var(--card-background-color);
        box-shadow: 0 8px 22px color-mix(in srgb, var(--primary-text-color) 8%, transparent);
        text-align: center;
      }
      .flow-orb {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        display: grid;
        place-items: center;
        border: 1px solid color-mix(in srgb, currentColor 30%, var(--shs-line));
        border-radius: 50%;
        background: color-mix(in srgb, currentColor 10%, var(--card-background-color));
        transition: transform 160ms ease-out, border-color 160ms ease-out;
      }
      .flow-orb ha-icon { --mdc-icon-size: 21px; }
      .flow-node.unavailable { color: var(--secondary-text-color); }
      .flow-node.unavailable .flow-orb {
        border-style: dashed;
        background: var(--card-background-color);
      }
      .flow-copy { min-width: 0; color: var(--primary-text-color); }
      .flow-copy span {
        display: block;
        color: var(--secondary-text-color);
        font-size: 9px;
        font-weight: 690;
        letter-spacing: .45px;
        line-height: 1.2;
        text-transform: uppercase;
      }
      .flow-copy strong {
        display: block;
        margin-top: 2px;
        font-size: 16px;
        font-weight: 740;
        letter-spacing: -.01em;
        line-height: 1.15;
        white-space: nowrap;
      }
      .flow-copy strong small {
        margin-left: 2px;
        color: var(--secondary-text-color);
        font-size: 9px;
        font-weight: 610;
      }
      .flow-copy em {
        display: block;
        margin-top: 2px;
        color: var(--flow-node-color, var(--secondary-text-color));
        font-size: 9px;
        font-style: normal;
        line-height: 1.2;
      }
      .flow-home-content { width: 92px; color: var(--primary-text-color); }
      .flow-home-content ha-icon { --mdc-icon-size: 20px; color: var(--shs-blue); }
      .flow-home-content span {
        display: block;
        margin-top: 4px;
        color: var(--secondary-text-color);
        font-size: 8.5px;
        font-weight: 700;
        letter-spacing: .5px;
        text-transform: uppercase;
      }
      .flow-home-content strong {
        display: block;
        margin-top: 3px;
        font-size: 18px;
        font-weight: 760;
        line-height: 1.1;
        white-space: nowrap;
      }
      .flow-home-content strong small {
        margin-left: 2px;
        color: var(--secondary-text-color);
        font-size: 9px;
        font-weight: 610;
      }
      .flow-home-content em {
        display: block;
        margin-top: 4px;
        color: var(--secondary-text-color);
        font-size: 8.5px;
        font-style: normal;
        line-height: 1.15;
      }
      .no-home .sources { grid-column: 1 / -1; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
      .no-home .source-row { border-right: 1px solid var(--shs-line); }

      @container (max-width: 540px) {
        .live-layout { grid-template-columns: 1fr; margin: 0 -14px -14px; }
        .home { min-height: 168px; padding: 20px; border-right: 0; border-bottom: 1px solid var(--shs-line); }
        .home-power { font-size: 40px; }
        .flow-panel { margin: 0 -14px; padding-inline: 14px; }
        .flow-panel.flow-only { margin-bottom: -14px; }
        .flow-map { height: 270px; }
        .flow-node { width: 112px; gap: 7px; }
        .flow-node.home { width: 94px; height: 94px; min-height: 94px; }
        .flow-home-content { width: 78px; }
        .flow-home-content strong { font-size: 16px; }
        .flow-orb { width: 36px; height: 36px; flex-basis: 36px; }
        .flow-orb ha-icon { --mdc-icon-size: 18px; }
        .flow-copy strong { font-size: 14px; }
      }

      @container (max-width: 350px) {
        .flow-heading span { display: none; }
        .flow-map { height: 286px; }
        .flow-node { width: 100px; }
        .flow-node.grid { top: 7px; }
        .flow-node.solar { bottom: 7px; }
        .flow-copy em { max-width: 64px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .flow-line.moving { animation: none; }
        .flow-orb { transition: none; }
      }
    `],a([fe()],bi.prototype,"flowPaused",void 0);const wi={show_header:!0,day:"auto",cheapest_hours:3,show_facts:!0,show_cheapest_block:!0};class xi extends pi{constructor(){super(...arguments),this.config={...wi},this.selectedDay="today",this.hoverIndex=-1,this.chartWidth=620}setConfig(e){if(!e)throw new Error("Energy Price Outlook card configuration is required.");this.config={...wi,...e,cheapest_hours:Math.max(1,Math.min(6,Number(e.cheapest_hours??3)))},"tomorrow"===e.day&&(this.selectedDay="tomorrow"),"today"===e.day&&(this.selectedDay="today")}getCardSize(){return 6}static getStubConfig(){return{show_header:!0,day:"auto",cheapest_hours:3,show_facts:!0,show_cheapest_block:!0}}static getConfigElement(){const e=document.createElement("smarthomeshop-energy-card-editor");return e.cardType="price",e}_t(e,t){return vi(this.hass,e,t)}disconnectedCallback(){this.chartObserver?.disconnect(),this.chartObserver=void 0,super.disconnectedCallback()}updated(){const e=this.renderRoot.querySelector(".chart-host");e&&e!==this.chartElement&&(this.chartObserver?.disconnect(),this.chartElement=e,this.chartObserver=new ResizeObserver(([e])=>{const t=Math.round(e.contentRect.width);t>0&&Math.abs(t-this.chartWidth)>2&&(this.chartWidth=t)}),this.chartObserver.observe(e))}_insights(e,t){if(!e.length)return null;const i=Date.now(),a=e.find(e=>Date.parse(e.start)<=i&&this._rowEnd(e)>i),o=a?.consumer??Number(this.context?.account?.current?.electricity);if(!Number.isFinite(o))return null;const r=e.reduce((e,t)=>e+t.consumer,0)/e.length,n=e.reduce((e,t)=>t.consumer<e.consumer?t:e),s=e.reduce((e,t)=>t.consumer>e.consumer?t:e),l=[...e,...t].filter(e=>Date.parse(e.start)>i&&e.consumer<o).sort((e,t)=>Date.parse(e.start)-Date.parse(t.start))[0];return{current:o,average:r,difference:o-r,percentage:Math.abs(r)>1e-6?(o-r)/Math.abs(r)*100:null,lowest:n,highest:s,nextLower:l,feedIn:a?.feed_in??Number(this.context?.account?.current?.feed_in),spread:s.consumer-n.consumer,negative:e.filter(e=>e.consumer<0).reduce((e,t)=>e+(this._rowEnd(t)-Date.parse(t.start))/36e5,0)}}_rowEnd(e){const t=e.end?Date.parse(e.end):Number.NaN;return Number.isFinite(t)?t:Date.parse(e.start)+("quarter-hour"===e.resolution?9e5:36e5)}_cheapest(e,t){const i=[...e].sort((e,t)=>Date.parse(e.start)-Date.parse(t.start));let a=null;for(let e=0;e<i.length;e+=1){const o=[],r=Date.parse(i[e].start)+36e5*t;let n=Date.parse(i[e].start);for(let t=e;t<i.length&&n<r;t+=1){const e=i[t];if(Math.abs(Date.parse(e.start)-n)>=1e3)break;o.push(e),n=this._rowEnd(e)}if(!o.length||Math.abs(n-r)>=1e3)continue;const s=o.reduce((e,t)=>e+(this._rowEnd(t)-Date.parse(t.start))/36e5,0),l=o.reduce((e,t)=>e+t.consumer*((this._rowEnd(t)-Date.parse(t.start))/36e5),0)/s;(!a||l<a.average)&&(a={start:o[0].start,end:n,average:l})}return a}_chart(e){const t=Math.max(280,this.chartWidth),i=t<430?195:215,a=t<400?34:42,o=t-8,r=22,n=i-27,s=e.map(e=>e.consumer),l=Math.min(...s),c=Math.max(...s),d=Math.max(.01,1.08*c),h=Math.min(0,1.08*l),u=Math.max(.001,d-h),p=e=>r+(d-e)/u*(n-r),m=p(0),g=(o-a)/e.length,v=Date.now(),f=e.findIndex(e=>Date.parse(e.start)<=v&&this._rowEnd(e)>v),y=h<0?[d,0,h]:[d,d/2,0],b=t<400?3:4,w=Array.from({length:b},(t,i)=>Math.min(e.length-1,Math.floor(i*e.length/b))),x=this.hoverIndex>=0&&this.hoverIndex<e.length?this.hoverIndex:-1,_=x>=0?`${ci(e[x].start)} ${si(e[x].consumer)}/kWh`:"",k=[this._t("quarter-hour"===e[0]?.resolution?"Quarter-hour electricity prices":"Hourly electricity prices"),this._t("Use the left and right arrow keys to inspect each price period."),_].filter(Boolean).join(" ");return K`
      <svg viewBox="0 0 ${t} ${i}" role="img" tabindex="0" aria-label=${k}
        @keydown=${t=>this._onChartKeydown(t,e)}
        @pointerleave=${()=>{this.hoverIndex=-1}}>
        ${y.map(e=>B`
          <line class="grid" x1=${a} y1=${p(e)} x2=${o} y2=${p(e)}></line>
          <text x=${a-5} y=${p(e)+3} text-anchor="end">${e.toFixed(2)}</text>
        `)}
        ${e.map((e,t)=>{const i=p(e.consumer);return B`
            <rect
              x=${a+t*g+1}
              y=${Math.min(m,i)}
              width=${Math.max(2,g-2)}
              height=${Math.max(2,Math.abs(i-m))}
              rx="2"
              fill=${(e=>{const t=c===l?.5:(e-l)/(c-l);return t<=.34?"#159957":t<=.67?"#d8890b":"#d34a4a"})(e.consumer)}
              opacity=${t===f||t===x?1:.62}
            ></rect>
          `})}
        ${f>=0?B`
          <line class="now-line" x1=${a+(f+.5)*g} y1=${r} x2=${a+(f+.5)*g} y2=${n}></line>
          <text class="now-text" x=${a+(f+.5)*g} y="12" text-anchor="middle">${this._t("Now")}</text>
        `:Y}
        ${w.map((t,o)=>B`
          <text x=${a+(t+.5)*g} y=${i-7} text-anchor=${0===o?"start":"middle"}>${ci(e[t].start)}</text>
        `)}
        ${e.map((e,t)=>B`
          <rect class="hit" x=${a+t*g} y=${r} width=${g} height=${n-r}
            @pointerenter=${()=>{this.hoverIndex=t}}
            @click=${()=>{this.hoverIndex=t}}>
            <title>${ci(e.start)} ${si(e.consumer)}/kWh</title>
          </rect>
        `)}
        ${x>=0?this._tooltip(e[x],a+(x+.5)*g,a,o,r):Y}
      </svg>
      <div class="sr-only" aria-live="polite">${_}</div>
      <table class="sr-only">
        <caption>${this._t("quarter-hour"===e[0]?.resolution?"Quarter-hour electricity prices":"Hourly electricity prices")}</caption>
        <tbody>
          ${e.map(e=>K`<tr><th>${ci(e.start)}</th><td>${si(e.consumer)}/kWh</td></tr>`)}
        </tbody>
      </table>
    `}_onChartKeydown(e,t){if(!t.length)return;let i=this.hoverIndex;if("ArrowRight"===e.key)i=Math.min(t.length-1,Math.max(0,i+1));else if("ArrowLeft"===e.key)i=i<0?t.length-1:Math.max(0,i-1);else if("Home"===e.key)i=0;else if("End"===e.key)i=t.length-1;else{if("Escape"!==e.key)return;i=-1}e.preventDefault(),this.hoverIndex=i}_tooltip(e,t,i,a,o){const r=104,n=Math.max(i+52,Math.min(a-52,t));return B`
      <g pointer-events="none">
        <rect class="tip-bg" x=${n-52} y=${o+2} width=${r} height="38" rx="6"></rect>
        <text class="tip-time" x=${n} y=${o+17} text-anchor="middle">${ci(e.start)}</text>
        <text class="tip-price" x=${n} y=${o+32} text-anchor="middle">${si(e.consumer)}/kWh</text>
      </g>
    `}_renderContractOverview(){const e=this.context?.account||{},t=e.contract||{},i=e.tariffs||{},a=e.current||{},o=e.fixed_costs||{},r=String(t.type||"fixed");let n=e.capabilities?.requires_tariff_selection?[["Import T1",i.electricity_t1,"/kWh"],["Import T2",i.electricity_t2,"/kWh"],["Feed-in T1",i.feed_in_t1,"/kWh"],["Feed-in T2",i.feed_in_t2,"/kWh"]]:[["Import now",a.electricity,"/kWh"],["Feed-in now",a.feed_in,"/kWh"]];if(!n.some(([,e])=>Number.isFinite(Number(e)))){const e={electricity_t1:"Import T1",electricity_t2:"Import T2",electricity_single:"Import",feed_in_t1:"Feed-in T1",feed_in_t2:"Feed-in T2",feed_in_single:"Feed-in",feed_in:"Feed-in"};n=Object.entries(i).filter(([e,t])=>(e.startsWith("electricity_")||e.startsWith("feed_in"))&&Number.isFinite(Number(t))).map(([t,i])=>[e[t]||t.split("_").join(" "),i,"/kWh"])}return n.push(["Gas",a.gas??i.gas,"/m³"],["Water",a.water??i.water,"/m³"],["Fixed cost/day",o.daily,"/day"],["Fixed cost/year",o.yearly,"/year"]),K`
      <ha-card>
        <div class="card-shell">
          ${this.renderHeader(this._t("Energy prices"),`${t.name||this._t("Energy contract")} · ${r.charAt(0).toUpperCase()}${r.slice(1)}`,"mdi:file-document-outline")?K`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon="mdi:file-document-outline"></ha-icon></div>
                <div><h2 class="head-title">${this._t("Energy prices")}</h2><div class="head-subtitle">${t.name||this._t("Energy contract")}</div></div>
              </div>
            </div>`:Y}
          <div class="contract-overview">
            <div class="contract-banner">
              <ha-icon icon="mdi:receipt-text-outline"></ha-icon>
              <div><div class="contract-name">${t.provider_details?.name||t.provider||t.supplier||t.name}</div>
              <div class="contract-meta">${r.charAt(0).toUpperCase()}${r.slice(1)} contract${t.product?` · ${t.product}`:""}</div></div>
            </div>
            <div class="tariff-grid">
              ${n.filter(([,e])=>Number.isFinite(Number(e))).map(([e,t,i])=>K`
                  <div class="tariff"><div class="tariff-label">${e}</div>
                  <div class="tariff-value">${si(Number(t))}<span>${i}</span></div></div>
                `)}
            </div>
            <div class="contract-note">
              ${e.capabilities?.requires_tariff_selection?this._t("The active T1/T2 tariff is unknown. Both tariffs are shown separately; SmartHomeShop never guesses."):this._t("This contract has no changing intraday price curve, so cheapest-hour controls and price optimisation are not shown.")}
            </div>
          </div>
        </div>
      </ha-card>
    `}render(){if(!this.hass)return Y;if(this.loading&&!this.context)return K`<ha-card><div class="loading" role="status" aria-live="polite"><div class="skeleton"></div><div class="skeleton"></div></div></ha-card>`;const e=di(this.hass,this.context,"today"),t=di(this.hass,this.context,"tomorrow");if("ok"===this.context?.account?.status&&!1===this.context.account?.capabilities?.price_optimisation)return this._renderContractOverview();if(!e.length&&!t.length){const e="no_contract"===this.context?.account?.status,t="ok"===this.context?.account?.status&&"dynamic"===this.context?.account?.contract?.type;return K`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon=${e?"mdi:file-document-alert-outline":"mdi:chart-timeline-variant-shimmer"}></ha-icon>
            <strong>${this._t(e?"No active energy contract":t?"Price data is being fetched":"No contract prices available")}</strong>
            <span>${this._t(e?"Select an active SmartHomeShop energy contract in Energy Settings.":t?"Your dynamic contract is active. Daily prices appear here as soon as confirmed prices or a forecast is available.":"Check the selected contract in SmartHomeShop Energy Settings.")}</span>
          </div>
        </ha-card>
      `}const i=this.config.day||"auto",a="today"===i?"today":"tomorrow"===i?t.length?"tomorrow":"today":"tomorrow"===this.selectedDay&&t.length?"tomorrow":"today",o="tomorrow"===a?t:e,r=this._insights(e,t);if(!o.length||!r)return Y;const n=o.every(e=>"predicted"===e.kind),s=o.map(e=>e.confidence).filter(e=>Number.isFinite(e)),l=s.length?s.reduce((e,t)=>e+t,0)/s.length:null,c=r.difference<=0,d=Math.max(1,Math.min(6,Number(this.config.cheapest_hours||3))),h=this._cheapest(o,d),u=this.context?.account?.contract?.name,p=this.renderHeader(this._t("Price outlook"),u?`${u} · ${this._t(n?"Predicted all-in price":"all-in price")}`:this._t(n?"Predicted all-in consumer price":"All-in consumer price"),"mdi:chart-bar");return K`
      <ha-card>
        <div class="card-shell">
          ${p?K`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon=${p.icon}></ha-icon></div>
                <div><h2 class="head-title">${p.title}</h2><div class="head-subtitle">${p.subtitle}</div></div>
              </div>
              ${"auto"===i&&t.length?K`
                <div class="day-switch" role="group" aria-label=${this._t("Price day")}>
                  <button type="button" class=${"today"===a?"active":""} aria-pressed=${"today"===a}
                    @click=${()=>{this.selectedDay="today",this.hoverIndex=-1}}>${this._t("Today")}</button>
                  <button type="button" class=${"tomorrow"===a?"active":""} aria-pressed=${"tomorrow"===a}
                    @click=${()=>{this.selectedDay="tomorrow",this.hoverIndex=-1}}>${this._t("Tomorrow")}</button>
                </div>
              `:Y}
            </div>
          `:Y}

          <div class="price-layout">
            <button class="summary" type="button" aria-label=${this._t("Open price entity details")}
              @click=${()=>ui(this,this.context?.priceEntity)}>
              <div class="summary-label">${this._t(n?"tomorrow"===a?"Estimated price":"Estimated price now":"tomorrow"===a?"Current price":"Price now")}</div>
              <div class="summary-price">${si(r.current)}<span>/kWh</span></div>
              <div class="price-state ${c?"":"high"}">
                <ha-icon icon=${n?"mdi:chart-timeline-variant-shimmer":c?"mdi:trending-down":"mdi:trending-up"}></ha-icon>
                ${n?this._t(null===l?"Forecast · not used for automation":"Forecast · {value}% confidence",{value:null===l?"":Math.round(100*l)}):null===r.percentage?this._t(c?"Below daily average":"Above daily average"):this._t(c?"{value}% below average":"{value}% above average",{value:Math.abs(r.percentage).toFixed(0)})}
              </div>
              ${!1!==this.config.show_facts?K`
                <div class="facts">
                  <div class="fact"><div class="fact-label">${this._t(n?"Forecast average":"Daily average")}</div><div class="fact-value">${si(r.average)}</div></div>
                  <div class="fact"><div class="fact-label">${this._t(n?"Estimated feed-in now":"Feed-in now")}</div><div class="fact-value">${si(r.feedIn)}</div></div>
                  <div class="fact"><div class="fact-label">${this._t("Next lower")}</div><div class="fact-value">${r.nextLower?this._t("{time}, save {price}",{time:ci(r.nextLower.start),price:si(r.current-r.nextLower.consumer)}):this._t("None today")}</div></div>
                  <div class="fact"><div class="fact-label">${this._t("Lowest")}</div><div class="fact-value">${this._t("{price} at {time}",{price:si(r.lowest.consumer),time:ci(r.lowest.start)})}</div></div>
                  <div class="fact"><div class="fact-label">${this._t("Highest")}</div><div class="fact-value">${this._t("{price} at {time}",{price:si(r.highest.consumer),time:ci(r.highest.start)})}</div></div>
                  <div class="fact"><div class="fact-label">${this._t(r.negative?"Negative prices":"Daily spread")}</div><div class="fact-value">${r.negative?this._t(1===r.negative?"{count} hour":"{count} hours",{count:r.negative}):si(r.spread)}</div></div>
                </div>
              `:Y}
            </button>
            <div class="chart-column">
              <div class="chart-heading">
                <div class="chart-title">${this._t("quarter-hour"===o[0]?.resolution?n?"{day} forecast by quarter hour (EUR/kWh)":"{day} by quarter hour (EUR/kWh)":n?"{day} forecast by hour (EUR/kWh)":"{day} by hour (EUR/kWh)",{day:this._t("tomorrow"===a?"Tomorrow":"Today")})}</div>
                <div class="legend"><span><i style="background:#159957"></i>${this._t("Lower")}</span><span><i style="background:#d34a4a"></i>${this._t("Higher")}</span></div>
              </div>
              <div class="chart-host">${this._chart(o)}</div>
            </div>
          </div>

          ${!1!==this.config.show_cheapest_block?K`
            <div class="cheapest">
              <div>
                <div class="cheapest-label">${this._t(n?"Cheapest predicted block · {day}":"Cheapest consecutive block · {day}",{day:this._t("tomorrow"===a?"Tomorrow":"Today")})}</div>
                <div class="cheapest-value">
                  ${h?K`${ci(h.start)}-${ci(h.end)}<span>${this._t("{price}/kWh average",{price:si(h.average)})}</span>`:this._t("Not available")}
                </div>
              </div>
              <div class="hours" role="group" aria-label=${this._t("Cheapest block duration")}>
                ${[1,2,3,4,5,6].map(e=>K`
                  <button type="button" class=${d===e?"active":""} aria-pressed=${d===e}
                    @click=${()=>{this.config={...this.config,cheapest_hours:e}}}>${e}h</button>
                `)}
              </div>
            </div>
          `:Y}
        </div>
      </ha-card>
    `}}xi.styles=[mi,c`
      .day-switch {
        display: inline-flex;
        padding: 3px;
        border-radius: 9px;
        background: var(--shs-surface);
      }
      .day-switch button {
        min-height: 34px;
        padding: 0 10px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: var(--secondary-text-color);
        font-size: 10.5px;
        font-weight: 670;
        cursor: pointer;
      }
      .day-switch button.active {
        color: var(--primary-text-color);
        background: var(--card-background-color);
        box-shadow: 0 1px 2px color-mix(in srgb, var(--primary-text-color) 10%, transparent);
      }
      .price-layout {
        display: grid;
        grid-template-columns: minmax(210px, .72fr) minmax(320px, 1.28fr);
        margin: 0 -18px;
        border-top: 1px solid var(--shs-line);
        border-bottom: 1px solid var(--shs-line);
      }
      .summary {
        appearance: none;
        width: 100%;
        padding: 22px;
        border: 0;
        background: var(--shs-amber-soft);
        border-right: 1px solid var(--shs-line);
        color: inherit;
        text-align: left;
        cursor: pointer;
      }
      .summary:hover { filter: brightness(.99); }
      .summary-label {
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 730;
        letter-spacing: .55px;
        text-transform: uppercase;
      }
      .summary-price {
        margin-top: 15px;
        font-size: clamp(33px, 7cqi, 45px);
        font-weight: 760;
        line-height: .95;
        letter-spacing: -.025em;
      }
      .summary-price span {
        margin-left: 3px;
        color: var(--secondary-text-color);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0;
      }
      .price-state {
        margin-top: 9px;
        display: flex;
        align-items: center;
        gap: 5px;
        color: var(--shs-green);
        font-size: 10.5px;
        font-weight: 700;
      }
      .price-state.high { color: var(--shs-red); }
      .price-state ha-icon { --mdc-icon-size: 15px; }
      .facts {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 19px;
        border-top: 1px solid var(--shs-line);
      }
      .fact { min-width: 0; padding: 10px 8px 0 0; }
      .fact:nth-child(even) { padding-left: 10px; border-left: 1px solid var(--shs-line); }
      .fact:nth-child(n + 3) { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--shs-line); }
      .fact-label { color: var(--secondary-text-color); font-size: 9.5px; }
      .fact-value { margin-top: 2px; font-size: 11px; font-weight: 700; line-height: 1.25; overflow-wrap: anywhere; }
      .chart-column { min-width: 0; padding: 18px 14px 10px; }
      .chart-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 5px;
      }
      .chart-title { font-size: 10.5px; font-weight: 700; }
      .legend { display: flex; gap: 10px; color: var(--secondary-text-color); font-size: 9px; }
      .legend span { display: inline-flex; align-items: center; gap: 4px; }
      .legend i { width: 7px; height: 7px; border-radius: 2px; }
      .chart-host { width: 100%; min-height: 202px; }
      svg { width: 100%; height: 215px; display: block; overflow: visible; }
      svg:focus-visible { outline-offset: -2px; }
      svg text { fill: var(--secondary-text-color); font-family: inherit; font-size: 9px; }
      svg .grid { stroke: var(--shs-line); stroke-width: 1; }
      svg .now-line { stroke: var(--shs-blue); stroke-width: 1.2; stroke-dasharray: 4 3; }
      svg .now-text { fill: var(--shs-blue); font-size: 9px; font-weight: 720; }
      svg .hit { fill: transparent; cursor: crosshair; }
      svg .tip-bg { fill: var(--card-background-color); stroke: var(--shs-line); stroke-width: 1; }
      svg .tip-time { fill: var(--primary-text-color); font-size: 9px; font-weight: 720; }
      svg .tip-price { fill: var(--secondary-text-color); font-size: 8.5px; }
      .cheapest {
        margin: 0 -18px -18px;
        padding: 13px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        background: var(--shs-surface);
      }
      .cheapest-label { color: var(--secondary-text-color); font-size: 9px; font-weight: 720; letter-spacing: .4px; text-transform: uppercase; }
      .cheapest-value { margin-top: 3px; font-size: 13px; font-weight: 740; }
      .cheapest-value span { margin-left: 7px; color: var(--secondary-text-color); font-size: 10px; font-weight: 500; }
      .hours { display: inline-flex; padding: 3px; border: 1px solid var(--shs-line); border-radius: 9px; background: var(--card-background-color); }
      .hours button {
        width: 38px; min-height: 34px; border: 0; border-radius: 6px;
        background: transparent; color: var(--secondary-text-color);
        font-size: 10px; font-weight: 680; cursor: pointer;
      }
      .hours button.active { color: var(--primary-text-color); background: var(--shs-surface); }
      .contract-overview {
        padding: 18px;
        display: grid;
        gap: 14px;
        border: 1px solid var(--shs-line);
        border-radius: 14px;
        background: var(--shs-surface);
      }
      .contract-banner { display: flex; align-items: center; gap: 12px; }
      .contract-banner ha-icon {
        width: 38px; height: 38px; padding: 9px; border-radius: 11px;
        color: var(--shs-blue); background: var(--shs-blue-soft);
      }
      .contract-name { font-size: 15px; font-weight: 740; }
      .contract-meta { margin-top: 3px; color: var(--secondary-text-color); font-size: 10.5px; }
      .tariff-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 9px; }
      .tariff { min-width: 0; padding: 12px; border-radius: 10px; background: var(--card-background-color); }
      .tariff-label { color: var(--secondary-text-color); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
      .tariff-value { margin-top: 4px; font-size: 15px; font-weight: 740; }
      .tariff-value span { color: var(--secondary-text-color); font-size: 9px; font-weight: 500; }
      .contract-note { color: var(--secondary-text-color); font-size: 10.5px; line-height: 1.45; }

      @container (max-width: 690px) {
        .price-layout { grid-template-columns: 1fr; margin: 0 -14px; }
        .summary { padding: 20px; border-right: 0; border-bottom: 1px solid var(--shs-line); }
        .facts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .fact, .fact:nth-child(even) { padding-left: 10px; border-left: 1px solid var(--shs-line); }
        .fact:nth-child(3n + 1) { padding-left: 0; border-left: 0; }
        .fact:nth-child(n + 3) { margin-top: 0; padding-top: 10px; border-top: 0; }
        .fact:nth-child(n + 4) { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--shs-line); }
        .cheapest { margin: 0 -14px -14px; }
      }
      @container (max-width: 430px) {
        .card-head { align-items: flex-start; }
        .day-switch { margin-left: auto; }
        .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .fact:nth-child(3n + 1) { padding-left: 10px; border-left: 1px solid var(--shs-line); }
        .fact:nth-child(odd) { padding-left: 0; border-left: 0; }
        .fact:nth-child(n + 3) { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--shs-line); }
        .chart-column { padding-inline: 8px; }
        .cheapest { align-items: flex-start; flex-direction: column; }
        .hours { width: 100%; }
        .hours button { flex: 1; }
      }
      @media (pointer: coarse) {
        .day-switch button, .hours button { min-height: 44px; }
        .day-switch button { padding-inline: 14px; }
      }
    `],a([fe()],xi.prototype,"selectedDay",void 0),a([fe()],xi.prototype,"hoverIndex",void 0),a([fe()],xi.prototype,"chartWidth",void 0);const _i={show_header:!0,show_summary:!0,show_grid_import:!0,show_grid_export:!0,show_solar:!0,show_battery:!0};class ki extends pi{constructor(){super(...arguments),this.config={..._i},this.history={},this.statisticsChartReady=!1}setConfig(e){if(!e)throw new Error("Energy Power Trend card configuration is required.");this.config={..._i,...e}}getCardSize(){return 5}getGridOptions(){return{columns:12,min_columns:6,min_rows:3}}static getStubConfig(){return{type:"custom:smarthomeshop-energy-power-card",..._i}}static getConfigElement(){const e=document.createElement("smarthomeshop-energy-card-editor");return e.cardType="power",e}_t(e,t){return vi(this.hass,e,t)}async afterContextLoaded(){if(!this.hass||!this.context)return;const e=this.context.netEntity||this.context.gridImportEntity||this.context.gridExportEntity||this.context.sources.solar_power||this.context.sources.battery_power,[t,i]=await Promise.all([Jt(this.hass,this.context).catch(()=>{}),ei(e)]);t&&(this.history=t),this.statisticsChartReady=i}_withCurrent(e,t,i,a=!1){if(!this.hass)return t;const o=ii(this.hass,e,a);return null===o?t:[...t.filter(e=>e.t<i),{t:i,end:i,v:o,min:o,max:o}]}_mapPoint(e,t,i=!1){const a=e.min??e.v,o=e.max??e.v,r=t(i?o:a),n=t(i?a:o);return{...e,v:t(e.v),min:Math.min(r,n),max:Math.max(r,n)}}_gridWithCurrent(e){if(!this.hass||!this.context)return[];const t=ri(this.context,this.history),i=oi(this.hass,this.context);return null===i?t:[...t.filter(t=>t.t<e),{t:e,end:e,v:i,min:i,max:i}]}_series(){if(!this.context)return[];const e=[],t=this.context.sources,i=Date.now(),a=this._gridWithCurrent(i);if(a.length>1&&!1!==this.config.show_grid_import&&e.push({key:"grid-import",label:this._t("Grid import"),color:"#d34a4a",points:a.map(e=>this._mapPoint(e,e=>Math.max(0,e)))}),a.length>1&&!1!==this.config.show_grid_export&&e.push({key:"grid-export",label:this._t("Grid export"),color:"#159957",points:a.map(e=>this._mapPoint(e,e=>Math.max(0,-e),!0))}),t.solar_power&&!1!==this.config.show_solar){const a=this._withCurrent(t.solar_power,this.history[t.solar_power]||[],i,!!t.solar_invert);a.length>1&&e.push({key:"solar",label:this._t("Solar"),color:"#d8890b",points:a.map(e=>this._mapPoint(e,e=>Math.max(0,e)))})}if(t.battery_power&&!1!==this.config.show_battery){const a=this._withCurrent(t.battery_power,this.history[t.battery_power]||[],i,!!t.battery_invert);a.length>1&&e.push({key:"battery",label:this._t("Battery"),color:"#4361ee",points:a})}return e}_statistics(e){const t=Date.now();return Object.fromEntries(e.map(e=>[`shs:${e.key}`,e.points.map((i,a)=>({start:i.t,end:i.end||e.points[a+1]?.t||Math.min(t,i.t+3e5),mean:i.v,min:i.min??i.v,max:i.max??i.v}))]))}_metadata(e){return Object.fromEntries(e.map(e=>[`shs:${e.key}`,{statistic_id:`shs:${e.key}`,source:"smarthomeshop",name:e.label,statistics_unit_of_measurement:"W",unit_class:"power",has_sum:!1,mean_type:1}]))}_names(e){return Object.fromEntries(e.map(e=>[`shs:${e.key}`,e.label]))}_colors(e){return Object.fromEntries(e.map(e=>[`shs:${e.key}`,e.color]))}render(){if(!this.hass)return Y;if(this.loading&&!this.context||this.context&&!Object.keys(this.history).length&&this.loading)return K`<ha-card><div class="loading" role="status" aria-live="polite"><div class="skeleton"></div><div class="skeleton"></div></div></ha-card>`;const e=this._series();if(!e.length)return K`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:chart-line-variant"></ha-icon>
            <strong>${this._t("No power statistics available")}</strong>
            <span>${this._t("Configure a P1 meter, solar or battery power source in SmartHomeShop Energy Settings.")}</span>
          </div>
        </ha-card>
      `;const t=oi(this.hass,this.context),i=ri(this.context,this.history),a=Math.max(0,t??0,...i.map(e=>e.max??e.v)),o=Math.abs(Math.min(0,t??0,...i.map(e=>e.min??e.v))),r=ni(t,!0),n=ni(a),s=ni(o),l=this._t(null===t?"Grid now":t<0?"Export now":"Import now"),c=this.renderHeader(this._t("Power trend"),this._t("Today · 5-minute statistics to now"),"mdi:chart-timeline-variant"),d=new Date;return d.setHours(0,0,0,0),K`
      <ha-card>
        <div class="card-shell">
          ${c?K`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon=${c.icon}></ha-icon></div>
                <div><h2 class="head-title">${c.title}</h2><div class="head-subtitle">${c.subtitle}</div></div>
              </div>
            </div>
          `:Y}
          ${!1!==this.config.show_summary?K`
            <div class="summary">
              <div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${r.value} ${r.unit}</div></div>
              <div class="stat"><div class="stat-label">${this._t("Peak import")}</div><div class="stat-value">${n.value} ${n.unit}</div></div>
              <div class="stat"><div class="stat-label">${this._t("Peak export")}</div><div class="stat-value">${s.value} ${s.unit}</div></div>
            </div>
          `:Y}
          <div class="chart-wrap">
            <div class="chart-label">${this._t("Power (W) · mean with min/max range")}</div>
            ${this.statisticsChartReady?K`
              <statistics-chart
                .hass=${this.hass}
                .statisticsData=${this._statistics(e)}
                .metadata=${this._metadata(e)}
                .names=${this._names(e)}
                .colors=${this._colors(e)}
                .statTypes=${["mean","min","max"]}
                .chartType=${"line"}
                .period=${"5minute"}
                .startTime=${d}
                .endTime=${new Date}
                .unit=${"W"}
                .height=${"100%"}
                .clickForMoreInfo=${!1}
              ></statistics-chart>
            `:K`
              <div class="chart-loading" role="status" aria-live="polite"><div class="skeleton"></div><span>${this._t("Loading Home Assistant chart...")}</span></div>
            `}
          </div>
        </div>
      </ha-card>
    `}}ki.styles=[mi,c`
      .summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 0 -18px;
        border-top: 1px solid var(--shs-line);
        border-bottom: 1px solid var(--shs-line);
      }
      .stat { padding: 13px 18px; border-right: 1px solid var(--shs-line); }
      .stat:last-child { border-right: 0; }
      .stat-label {
        color: var(--secondary-text-color);
        font-size: 9.5px;
        font-weight: 650;
        letter-spacing: .35px;
        text-transform: uppercase;
      }
      .stat-value { margin-top: 3px; font-size: 16px; font-weight: 740; }
      .chart-wrap { margin: 0 -10px -8px; padding: 16px 0 0; }
      .chart-label {
        padding: 0 10px 5px;
        font-size: 10.5px;
        font-weight: 700;
      }
      statistics-chart {
        display: block;
        width: 100%;
        height: 278px;
        --chart-max-height: 278px;
      }
      .chart-loading {
        min-height: 250px;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 9px;
        color: var(--secondary-text-color);
        font-size: 11px;
      }
      @container (max-width: 520px) {
        .summary { margin: 0 -14px; }
        .stat { padding: 11px 12px; }
        .stat-value { font-size: 14px; }
        statistics-chart {
          height: 252px;
          --chart-max-height: 252px;
        }
      }
    `],a([fe()],ki.prototype,"history",void 0),a([fe()],ki.prototype,"statisticsChartReady",void 0);const Si={show_header:!0,show_details:!0,show_prices:!0,show_explanation:!0,include_fixed_daily_cost:!1};class Ci extends pi{constructor(){super(...arguments),this.config={...Si},this.history={},this.historyLoading=!0}setConfig(e){if(!e)throw new Error("Energy costs card configuration is required.");this.config={...Si,...e}}static getStubConfig(){return{type:"custom:smarthomeshop-energy-cost-card",...Si}}static getConfigElement(){const e=document.createElement("smarthomeshop-energy-card-editor");return e.cardType="costs",e}getCardSize(){return!1===this.config.show_details?2:3}async afterContextLoaded(){if(this.hass&&this.context){this.historyLoading=!0;try{this.history=await Jt(this.hass,this.context)}finally{this.historyLoading=!1}}}_energy(e){return`${e.toFixed(e<1?3:2)} kWh`}render(){const e=(e,t)=>vi(this.hass,e,t),t=this.renderHeader(e("Electricity costs"),e("Imported, returned and net value today"),"mdi:cash-clock");if((this.loading||this.historyLoading)&&!Object.keys(this.history).length)return K`
        <ha-card>
          <div class="loading" role="status" aria-live="polite">
            <div class="skeleton"></div>
            <div>${e("Calculating today's electricity costs...")}</div>
          </div>
        </ha-card>
      `;if(this.loadError&&!this.context)return K`
        <ha-card>
          <div class="empty" role="alert">
            <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
            <strong>${e("Electricity costs unavailable")}</strong>
            <span>${this.loadError}</span>
          </div>
        </ha-card>
      `;if("no_contract"===this.context?.account?.status)return K`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:file-document-alert-outline"></ha-icon>
            <strong>${e("No active energy contract")}</strong>
            <span>${e("Connect an active SmartHomeShop contract to value today's imported and returned electricity.")}</span>
          </div>
        </ha-card>
      `;if(!this.context?.netEntity&&!this.context?.gridImportEntity&&!this.context?.gridExportEntity)return K`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:transmission-tower-off"></ha-icon>
            <strong>${e("No P1 meter selected")}</strong>
            <span>${e("Select a P1 meter in SmartHomeShop Energy settings first.")}</span>
          </div>
        </ha-card>
      `;const i=hi(this.hass,this.context,this.history);if(!i)return K`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:chart-clock"></ha-icon>
            <strong>${e("Not enough history yet")}</strong>
            <span>${e("The card will calculate today's costs as soon as Recorder has grid power history.")}</span>
          </div>
        </ha-card>
      `;const a=Number(this.context?.account?.fixed_costs?.daily),o=!0===this.config.include_fixed_daily_cost&&Number.isFinite(a),r=o?a:0,n=i.netCost+r,s=n<-.004,l=n>.004,c=this.context?.account?.contract?.name||e("active contract"),d=Math.round(100*i.coverage),h=i.coverage<.995,u=!1!==this.config.show_prices&&null!==i.averageImportPrice?` · ${e("avg.")} ${si(i.averageImportPrice)}/kWh`:"",p=!1!==this.config.show_prices&&null!==i.averageExportPrice?` · ${e("avg.")} ${si(i.averageExportPrice)}/kWh`:"";return K`
      <ha-card>
        <div class="card-shell">
          ${t?K`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon=${t.icon}></ha-icon></div>
                <div>
                  <h2 class="head-title">${t.title}</h2>
                  <div class="head-subtitle">${t.subtitle}</div>
                </div>
              </div>
            </div>
          `:Y}

          <div class="statement ${s?"earned":l?"cost":""}">
            <div>
              <div class="statement-label">${e(s?"Net earned today":"Net electricity cost")}</div>
              <div class="statement-copy">
                ${s?e("Return value is higher than import cost."):i.exportValue>0?e("{value} return value deducted",{value:li(i.exportValue)}):e("No measured return value deducted yet.")}
                ${h?K`<span class="coverage">${d}% ${e("priced")}</span>`:Y}
              </div>
            </div>
            <div class="statement-value">${li(Math.abs(n))}</div>
          </div>

          ${!1!==this.config.show_details?K`
            <div class="flows ${o?"with-fixed":""}">
              <div class="flow">
                <div class="flow-icon import"><ha-icon icon="mdi:transmission-tower-import"></ha-icon></div>
                <div>
                  <div class="flow-name">${e("Electricity imported")}</div>
                  <div class="flow-energy">${this._energy(i.importedKwh)}${u}</div>
                </div>
                <div class="flow-value">${li(i.importCost)}</div>
              </div>
              <div class="flow">
                <div class="flow-icon export"><ha-icon icon="mdi:transmission-tower-export"></ha-icon></div>
                <div>
                  <div class="flow-name">${e("Electricity returned")}</div>
                  <div class="flow-energy">${this._energy(i.exportedKwh)}${p}</div>
                </div>
                <div class="flow-value ${i.exportValue>=0?"export":""}">${li(i.exportValue)}</div>
              </div>
            </div>
            ${o?K`
              <div class="fixed-charge">
                <div class="flow-icon"><ha-icon icon="mdi:receipt-text-outline"></ha-icon></div>
                <div>
                  <div class="flow-name">${e("Fixed daily contract cost")}</div>
                  <div class="flow-energy">${e("Full daily charge from your active contract")}</div>
                </div>
                <div class="flow-value">${li(r)}</div>
              </div>
            `:Y}
          `:Y}

          ${!1!==this.config.show_explanation?K`
            <div class="note">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              <span>
                ${e("Estimated from recorded 5-minute grid power and prices from {contract}.",{contract:c})}
                ${i.predictedPrices?` ${e("Predicted prices are used until confirmed prices arrive.")}`:""}
                ${h?` ${e("{coverage}% of measured energy has matching price data.",{coverage:d})}`:""}
                ${e(o?"The fixed daily contract cost is included; gas is excluded.":"Fixed daily charges and gas are excluded.")}
              </span>
            </div>
          `:Y}
        </div>
      </ha-card>
    `}}Ci.styles=[mi,c`
      .statement {
        min-height: 92px;
        padding: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        border: 1px solid var(--shs-line);
        border-radius: 13px 13px 0 0;
        background: var(--shs-surface);
      }
      .statement.cost { background: var(--shs-red-soft); }
      .statement.earned { background: var(--shs-green-soft); }
      .statement-label {
        color: var(--secondary-text-color);
        font-size: 10.5px;
        font-weight: 720;
        letter-spacing: .6px;
        text-transform: uppercase;
      }
      .statement-copy {
        margin-top: 5px;
        color: var(--secondary-text-color);
        font-size: 11px;
        line-height: 1.35;
      }
      .statement-value {
        flex: 0 0 auto;
        font-size: clamp(27px, 8cqi, 38px);
        font-weight: 770;
        line-height: 1;
        letter-spacing: -.025em;
        white-space: nowrap;
      }
      .statement.cost .statement-value { color: var(--shs-red); }
      .statement.earned .statement-value { color: var(--shs-green); }
      .flows {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        border: 1px solid var(--shs-line);
        border-top: 0;
        border-radius: 0 0 13px 13px;
        overflow: hidden;
      }
      .flows.with-fixed { border-radius: 0; }
      .flow {
        min-width: 0;
        padding: 15px 16px;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
      }
      .flow + .flow { border-left: 1px solid var(--shs-line); }
      .flow-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 9px;
      }
      .flow-icon.import { color: var(--shs-red); background: var(--shs-red-soft); }
      .flow-icon.export { color: var(--shs-green); background: var(--shs-green-soft); }
      .flow-icon ha-icon { --mdc-icon-size: 19px; }
      .flow-name { font-size: 12px; font-weight: 700; }
      .flow-energy {
        margin-top: 2px;
        color: var(--secondary-text-color);
        font-size: 10px;
        line-height: 1.35;
      }
      .flow-value {
        text-align: right;
        font-size: 16px;
        font-weight: 750;
        white-space: nowrap;
      }
      .flow-value.export { color: var(--shs-green); }
      .fixed-charge {
        min-height: 56px;
        padding: 10px 16px;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--shs-line);
        border-top: 0;
        border-radius: 0 0 13px 13px;
        background: color-mix(in srgb, var(--shs-blue) 4%, var(--shs-surface));
      }
      .fixed-charge .flow-icon {
        color: var(--shs-blue);
        background: color-mix(in srgb, var(--shs-blue) 11%, var(--shs-surface));
      }
      .note {
        margin: 11px 1px 0;
        display: flex;
        align-items: flex-start;
        gap: 7px;
        color: var(--secondary-text-color);
        font-size: 10px;
        line-height: 1.45;
      }
      .note ha-icon {
        --mdc-icon-size: 14px;
        flex: 0 0 auto;
        margin-top: 1px;
        color: var(--shs-blue);
      }
      .coverage {
        display: inline-flex;
        align-items: center;
        margin-left: 5px;
        padding: 2px 6px;
        border-radius: 999px;
        color: color-mix(in srgb, var(--shs-amber) 55%, var(--primary-text-color));
        background: var(--shs-amber-soft);
        font-size: 9px;
        font-weight: 720;
        vertical-align: 1px;
      }
      @container (max-width: 460px) {
        .statement {
          min-height: 86px;
          padding: 15px;
          align-items: flex-end;
        }
        .statement-value { font-size: 28px; }
        .flows { grid-template-columns: 1fr; }
        .flow + .flow {
          border-left: 0;
          border-top: 1px solid var(--shs-line);
        }
        .flow { padding: 14px; }
        .fixed-charge { padding: 12px 14px; }
      }
      @container (max-width: 300px) {
        .statement { display: block; }
        .statement-value { margin-top: 10px; }
        .flow { grid-template-columns: 31px minmax(0, 1fr); }
        .flow-value { grid-column: 2; text-align: left; margin-top: 2px; }
        .fixed-charge { grid-template-columns: 31px minmax(0, 1fr); }
        .fixed-charge .flow-value { grid-column: 2; }
      }
    `],a([fe()],Ci.prototype,"history",void 0),a([fe()],Ci.prototype,"historyLoading",void 0);const $i={show_header:!0,show_breakdown:!0,show_explanation:!0};class zi extends pi{constructor(){super(...arguments),this.config={...$i}}setConfig(e){this.config={...$i,...e}}static getStubConfig(){return{type:"custom:smarthomeshop-energy-savings-card",...$i}}static getConfigElement(){const e=document.createElement("smarthomeshop-energy-card-editor");return e.cardType="savings",e}getCardSize(){return!1===this.config.show_breakdown?3:4}_tone(e){return e>0?"positive":e<0?"negative":""}render(){const e=(e,t)=>vi(this.hass,e,t),t=this.renderHeader(e("Smart savings"),e("Measured value created by smart energy"),"mdi:piggy-bank-outline");if(this.loading&&!this.context)return K`<ha-card><div class="loading" role="status" aria-live="polite"><div class="skeleton"></div><div>${e("Loading smart savings...")}</div></div></ha-card>`;if(this.loadError&&!this.context)return K`<ha-card><div class="empty" role="alert"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><strong>${e("Smart savings unavailable")}</strong><span>${this.loadError}</span></div></ha-card>`;if("no_contract"===this.context?.account?.status){const t=Number(this.context.savings?.total_eur||0);return K`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:piggy-bank-outline"></ha-icon>
            <strong>${e("Smart Savings is paused")}</strong>
            <span>${e("An active SmartHomeShop energy contract is needed to calculate savings.")}</span>
            ${0!==t?K`<span>${e("Previously measured total: {value}",{value:li(t)})}</span>`:Y}
          </div>
        </ha-card>
      `}if(!1===this.context?.savings?.supported)return K`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:piggy-bank-outline"></ha-icon>
            <strong>${e("Smart Savings requires dynamic prices")}</strong>
            <span>${e("Your fixed or variable contract is connected correctly. Savings from shifting usage can only be measured when prices change during the day.")}</span>
          </div>
        </ha-card>
      `;const i=this.context?.savings||{},a=Number(i.today_eur||0),o=Number(i.month_eur||0),r=Number(i.total_eur||0),n=Number(i.today_battery_eur||0),s=Number(i.today_schedule_eur||0);return K`
      <ha-card>
        <div class="card-shell">
          ${t?K`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon=${t.icon}></ha-icon></div>
                <div>
                  <h2 class="head-title">${t.title}</h2>
                  <div class="head-subtitle">${t.subtitle}</div>
                </div>
              </div>
            </div>
          `:Y}

          <div class="hero">
            <div class="today">
              <div class="eyebrow">${e("Today")}</div>
              <div class="today-value ${this._tone(a)}">${li(a)}</div>
              <div class="today-caption">
                ${e(a>0?"Saved compared with today's average electricity price.":a<0?"Smart actions cost more than today's average so far.":"Smart actions have not created measured value yet today.")}
              </div>
            </div>
            <div class="periods">
              <div class="period">
                <div class="eyebrow">${e("This month")}</div>
                <div class="period-value ${this._tone(o)}">${li(o)}</div>
                <div class="period-caption">${e("Cumulative value this calendar month")}</div>
              </div>
              <div class="period">
                <div class="eyebrow">${e("All time")}</div>
                <div class="period-value ${this._tone(r)}">${li(r)}</div>
                <div class="period-caption">${e("Since Smart Savings started measuring")}</div>
              </div>
            </div>
          </div>

          ${!1!==this.config.show_breakdown?K`
            <div class="breakdown">
              <div class="contributor">
                <div class="contributor-icon"><ha-icon icon="mdi:home-battery-outline"></ha-icon></div>
                <div><div class="contributor-name">${e("Battery today")}</div><div class="contributor-note">${e("Charging and discharging")}</div></div>
                <div class="contributor-value ${this._tone(n)}">${li(n)}</div>
              </div>
              <div class="contributor">
                <div class="contributor-icon schedule"><ha-icon icon="mdi:calendar-clock-outline"></ha-icon></div>
                <div><div class="contributor-name">${e("Schedules today")}</div><div class="contributor-note">${e("Loads shifted in time")}</div></div>
                <div class="contributor-value ${this._tone(s)}">${li(s)}</div>
              </div>
            </div>
          `:Y}

          ${!1!==this.config.show_explanation?K`
            <div class="explanation">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              <span>${e("Measured every 15 minutes from battery flows and running schedules, valued against the day-average electricity price.")}</span>
            </div>
          `:Y}
        </div>
      </ha-card>
    `}}let Ei;zi.styles=[mi,c`
      .hero {
        display: grid;
        grid-template-columns: minmax(160px, .82fr) minmax(240px, 1.18fr);
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--shs-line);
        border-radius: 14px;
        background: var(--shs-line);
      }
      .today {
        min-height: 154px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: linear-gradient(145deg, var(--shs-green-soft), var(--card-background-color));
      }
      .eyebrow {
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 720;
        letter-spacing: .65px;
        text-transform: uppercase;
      }
      .today-value {
        margin-top: 8px;
        font-size: clamp(31px, 8cqi, 44px);
        font-weight: 760;
        letter-spacing: -.025em;
        line-height: 1;
      }
      .positive { color: var(--shs-green); }
      .negative { color: var(--shs-red); }
      .today-caption {
        margin-top: 10px;
        color: var(--secondary-text-color);
        font-size: 11px;
        line-height: 1.4;
      }
      .periods {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        background: var(--card-background-color);
      }
      .period {
        min-width: 0;
        padding: 20px 18px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .period + .period { border-left: 1px solid var(--shs-line); }
      .period-value {
        margin-top: 7px;
        font-size: 23px;
        font-weight: 740;
        letter-spacing: -.015em;
      }
      .period-caption {
        margin-top: 5px;
        color: var(--secondary-text-color);
        font-size: 10.5px;
        line-height: 1.35;
      }
      .breakdown {
        margin-top: 13px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
      }
      .contributor {
        padding: 11px 12px;
        display: grid;
        grid-template-columns: 31px minmax(0, 1fr) auto;
        align-items: center;
        gap: 9px;
        border-radius: 11px;
        background: var(--shs-surface);
      }
      .contributor-icon {
        width: 31px;
        height: 31px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        color: var(--shs-blue);
        background: var(--shs-blue-soft);
      }
      .contributor-icon.schedule { color: var(--shs-amber); background: var(--shs-amber-soft); }
      .contributor-icon ha-icon { --mdc-icon-size: 17px; }
      .contributor-name { font-size: 11.5px; font-weight: 680; }
      .contributor-note { margin-top: 2px; color: var(--secondary-text-color); font-size: 9.5px; }
      .contributor-value { font-size: 13px; font-weight: 720; }
      .explanation {
        margin: 13px 1px 0;
        display: flex;
        align-items: flex-start;
        gap: 8px;
        color: var(--secondary-text-color);
        font-size: 10.5px;
        line-height: 1.45;
      }
      .explanation ha-icon {
        --mdc-icon-size: 15px;
        flex: 0 0 auto;
        margin-top: 1px;
        color: var(--shs-blue);
      }
      @container (max-width: 430px) {
        .hero { grid-template-columns: 1fr; }
        .today { min-height: 124px; }
        .periods { border-top: 1px solid var(--shs-line); }
        .period { padding: 15px; }
        .period-value { font-size: 20px; }
        .breakdown { grid-template-columns: 1fr; }
      }
    `];const Pi={run_cheapest_block:{title:"Run in the cheapest hours",icon:"mdi:clock-star-four-points-outline",color:"#159957",aliasStem:"Run in cheapest"},run_while_cheap_now:{title:"Run while electricity is cheap",icon:"mdi:cash-clock",color:"#159957",aliasStem:"Run while cheap"},pause_on_price_peak:{title:"Pause during price peaks",icon:"mdi:transmission-tower-off",color:"#d34a4a",aliasStem:"Pause on price peak"},precharge_climate_before_peak:{title:"Pre-heat cheap, ease off at peak",icon:"mdi:home-thermometer",color:"#d8890b",aliasStem:"Pre-heat cheap"},solar_surplus_switch:{title:"Use solar surplus",icon:"mdi:solar-power-variant",color:"#d8890b",aliasStem:"Solar surplus"},solar_surplus_heat_boost:{title:"Heat on solar surplus",icon:"mdi:water-boiler",color:"#d8890b",aliasStem:"Heat on solar surplus"},keep_solar_export_near_zero:{title:"Keep solar export near zero",icon:"mdi:transmission-tower-export",color:"#4361ee",aliasStem:"Keep solar export near zero"},avoid_negative_price_solar_export:{title:"Avoid negative-price solar export",icon:"mdi:solar-power-variant-outline",color:"#d34a4a",aliasStem:"Avoid negative-price solar export"},dump_load_on_negative_feed_in:{title:"Self-consume on negative feed-in",icon:"mdi:transmission-tower-import",color:"#4361ee",aliasStem:"Self-consume on negative feed-in"},ev_charge_cheapest_block:{title:"Charge the car in the cheapest hours",icon:"mdi:car-electric",color:"#4361ee",aliasStem:"Charge EV cheapest"}},Mi={show_header:!0,view:"expanded",show_schedules:!0,show_controls:!0,show_last_triggered:!0};let Ai;class Li extends pi{constructor(){super(...arguments),this.config={...Mi},this.automations=[],this.schedules=[],this.priceEntities={},this.busy=new Set,this.dataError=""}setConfig(e){if(!e)throw new Error("Smart Automations card configuration is required.");this.config={...Mi,...e},this.toggleAttribute("data-view",!1),this.setAttribute("data-view",this.config.view||"expanded")}getCardSize(){return Math.max(3,Math.min(8,this.automations.length+this.schedules.length+1))}getGridOptions(){return{columns:12,min_columns:6,min_rows:3}}static getStubConfig(){return{type:"custom:smarthomeshop-energy-automations-card",...Mi}}static getConfigElement(){const e=document.createElement("smarthomeshop-energy-card-editor");return e.cardType="automations",e}_t(e,t){return vi(this.hass,e,t)}async afterContextLoaded(){if(!this.hass)return;const e=Object.entries(this.hass.states||{}).filter(([e,t])=>{if(!e.startsWith("automation.")||!t.attributes?.id)return!1;const i=String(t.attributes?.friendly_name||"");return Object.values(Pi).some(e=>i.includes(e.aliasStem))}),t=e.map(([e,t])=>`${e}|${t.attributes?.id}|${t.attributes?.friendly_name||""}`).sort().join("\n"),i=Ai?.signature===t&&Date.now()-Ai.loadedAt<3e5?Ai.value:void 0,a=i?Promise.resolve(i):Promise.allSettled(e.map(async([e,t])=>{const i=String(t.attributes.id),a=String(t.attributes.friendly_name||i);try{const t=await this.hass.callApi("GET",`config/automation/config/${i}`),o=(e=>{const t=e.variables?.shs_managed_settings;if("string"==typeof t)try{const e=JSON.parse(t);if(!e?.scenario||!Array.isArray(e.targets))return;return e}catch{return}})(t);if(!o||!Pi[o.scenario])return;const r=String(t.alias||a);return{id:i,entityId:e,alias:r,deviceName:r.split(" - ")[0]||"Smart energy",scenario:o.scenario,targets:o.targets,params:o.params||{}}}catch{const t=Object.entries(Pi).find(([,e])=>a.includes(e.aliasStem))?.[0];if(!t)return;const o=Number(a.match(/(\d+)h\b/)?.[1]);return{id:i,entityId:e,alias:a,deviceName:a.split(" - ")[0]||"Smart energy",scenario:t,targets:[],params:Number.isFinite(o)?{hours:o}:{}}}})).then(e=>e.filter(e=>"fulfilled"===e.status).map(e=>e.value).filter(e=>!!e).sort((e,t)=>e.alias.localeCompare(t.alias))),[o,r]=await Promise.all([a,this.hass.callWS({type:"smarthomeshop/schedules"}).catch(()=>{})]);this.automations=o,i||(Ai={signature:t,loadedAt:Date.now(),value:o}),r&&(this.schedules=r.schedules||[]),this.priceEntities=this.context?.priceEntities||{},this.dataError=r?"":this._t("Schedules could not be refreshed. Showing the latest available data.")}_state(e){return e?this.hass?.states[e]:void 0}_targetNames(e){if(!this.hass||!e.length)return this._t("No entities");const t=e.map(e=>String(this.hass.states[e]?.attributes?.friendly_name||e));return t.length<=2?t.join(" + "):`${t.slice(0,2).join(" + ")} +${t.length-2}`}_automationRuntime(e){const t=this._state(e.entityId);if(!t||"off"===t.state)return{tone:"attention",label:this._t("Disabled - no automatic actions")};if(Number(t.attributes?.current||0)>0)return{tone:"active",label:this._t("Running an action now")};const i=e=>this._state(this.priceEntities[e]||void 0),a=(this.hass?oi(this.hass,this.context):null)??NaN,o=Math.round(e.params.hours||("ev_charge_cheapest_block"===e.scenario?4:3)),r=Number(e.params.device_power||e.params.export_threshold||100),n=Number(i("feed_in_price")?.state);let s=!1,l=this._t("Ready - waiting for its trigger");if("run_cheapest_block"===e.scenario||"ev_charge_cheapest_block"===e.scenario)s="on"===i(`cheapest_${o}h_window_now`)?.state,l=this._t(s?"Cheapest {hours}-hour window is active":"Waiting for the cheapest {hours}-hour window",{hours:o});else if("run_while_cheap_now"===e.scenario)s="on"===i("cheap_now")?.state,l=this._t(s?"Electricity is cheap now":"Waiting for a below-average price");else if("pause_on_price_peak"===e.scenario)s="peak"===i("price_level")?.state,l=this._t(s?"Price peak - selected loads should be paused":"No price peak right now");else if("precharge_climate_before_peak"===e.scenario){const e="on"===i(`cheapest_${o}h_window_now`)?.state,t="peak"===i("price_level")?.state;s=e||t,l=this._t(e?"Pre-heating in the cheap window":t?"Peak mode is active":"Waiting for a cheap window or price peak")}else if("solar_surplus_switch"===e.scenario||"solar_surplus_heat_boost"===e.scenario)s=Number.isFinite(a)&&a<=-r,l=s?this._t("{watts} W grid export meets the surplus threshold",{watts:Math.round(Math.abs(a))}):this._t("Waiting for at least {watts} W solar surplus",{watts:Math.round(r)});else if("keep_solar_export_near_zero"===e.scenario)s=Number.isFinite(a)&&a<-r,l=this._t(s?"Reducing exported solar power":"Monitoring grid flow");else if("avoid_negative_price_solar_export"===e.scenario){const t=Number(e.params.feed_in_threshold||0);s=Number.isFinite(n)&&n<t&&Number.isFinite(a)&&a<0,l=this._t(s?"Curtailing export during negative feed-in":"No unwanted paid export")}else"dump_load_on_negative_feed_in"===e.scenario&&(s=Number.isFinite(n)&&n<0,l=this._t(s?"Negative feed-in - self-consumption active":"Feed-in price is not negative"));return{tone:s?"active":"waiting",label:l}}_lastTriggered(e){const t=this._state(e.entityId)?.attributes?.last_triggered;if(!t)return this._t("Never triggered");const i=new Date(String(t)).getTime();if(!Number.isFinite(i))return this._t("Last run unknown");const a=Math.max(0,Math.round((Date.now()-i)/6e4));return a<1?this._t("Triggered just now"):a<60?this._t("Triggered {minutes} min ago",{minutes:a}):a<1440?this._t("Triggered {hours} h ago",{hours:Math.round(a/60)}):this._t("Last run {date}",{date:new Date(i).toLocaleDateString()})}async _toggleAutomation(e){if(!this.hass||this.busy.has(e.entityId))return;const t="off"===this._state(e.entityId)?.state;this.busy=new Set(this.busy).add(e.entityId);try{await this.hass.callService("automation",t?"turn_on":"turn_off",{entity_id:e.entityId}),this.dataError=""}catch(e){this.dataError=`${this._t(t?"Could not enable the automation.":"Could not pause the automation.")} ${e?.message||""}`}finally{const t=new Set(this.busy);t.delete(e.entityId),this.busy=t}}async _toggleSchedule(e){if(this.hass&&!this.busy.has(e.id)){this.busy=new Set(this.busy).add(e.id);try{const t=await this.hass.callWS({type:"smarthomeshop/schedules/set",schedule_id:e.id,name:e.name,target_entity:e.target_entity,hours:e.hours,ready_by:e.ready_by,earliest:e.earliest??null,interruptible:e.interruptible??!0,enabled:!1===e.enabled});this.schedules=this.schedules.map(i=>i.id===e.id?t.schedule:i),this.dataError=""}catch(e){this.dataError=`${this._t("Could not update the schedule.")} ${e?.message||""}`}finally{const t=new Set(this.busy);t.delete(e.id),this.busy=t}}}_renderAutomation(e){const t=Pi[e.scenario],i=this._automationRuntime(e),a="off"!==this._state(e.entityId)?.state,o=this.busy.has(e.entityId);return K`
      <article class=${"automation-row"+(a?"":" disabled")}>
        <div class="scenario-icon" style=${`--scenario-color:${t.color}`}>
          <ha-icon icon=${t.icon}></ha-icon>
        </div>
        <div class="row-copy">
          <div class="row-title">${this._t(t.title)}</div>
          <div class=${`row-state ${i.tone}`}>
            <i class="state-dot"></i><span>${i.label}</span>
          </div>
          <div class="row-detail">
            <span><ha-icon icon="mdi:devices"></ha-icon>${this._targetNames(e.targets)}</span>
            ${!1!==this.config.show_last_triggered?K`<span><ha-icon icon="mdi:history"></ha-icon>${this._lastTriggered(e)}</span>`:Y}
          </div>
        </div>
        <div class="row-actions">
          ${!1!==this.config.show_controls&&this.hass?.user?.is_admin?K`
            <button type="button" class=${"icon-btn"+(a?" danger":" primary")}
              title=${this._t(a?"Pause automation":"Enable automation")}
              aria-label=${`${this._t(a?"Pause automation":"Enable automation")}: ${this._t(t.title)}`}
              aria-pressed=${!a} aria-busy=${o}
              ?disabled=${o} @click=${()=>this._toggleAutomation(e)}>
              <ha-icon icon=${a?"mdi:pause":"mdi:play-circle-outline"}></ha-icon>
            </button>
          `:Y}
          ${this.hass?.user?.is_admin?K`
            <button type="button" class="icon-btn" title=${this._t("Edit setup")} aria-label=${`${this._t("Edit setup")}: ${this._t(t.title)}`}
              @click=${()=>{this._editAutomation(e)}}>
              <ha-icon icon="mdi:pencil-outline"></ha-icon>
            </button>
          `:K`
            <button type="button" class="icon-btn" title=${this._t("More information")} aria-label=${this._t("More information")}
              @click=${()=>ui(this,e.entityId)}>
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </button>
          `}
        </div>
      </article>
    `}_renderSchedule(e){const t=!1!==e.enabled,i=t&&!!e.active,a=e.entity_id?this._state(e.entity_id):void 0,o=Number(a?.attributes?.hours_done||0),r=Math.max(1,Number(a?.attributes?.hours_needed||e.hours||1)),n=Math.max(0,Math.min(100,o/r*100)),s=t?i?this._t(e.forced?"Running now to meet the deadline":"Running in a selected low-price hour"):e.next_start?this._t("Next start {time} · ready by {ready}",{time:ci(e.next_start),ready:e.ready_by}):e.reason||this._t("Waiting for prices · ready by {ready}",{ready:e.ready_by}):this._t("Disabled - deadline planning is paused");return K`
      <article class=${"automation-row schedule-row"+(t?"":" disabled")}>
        <div class="scenario-icon"><ha-icon icon="mdi:calendar-clock-outline"></ha-icon></div>
        <div class="row-copy">
          <div class="row-title">${e.name}</div>
          <div class=${"row-state "+(i?"active":t?"waiting":"attention")}>
            <i class="state-dot"></i><span>${s}</span>
          </div>
          <div class="row-detail">
            <span><ha-icon icon="mdi:devices"></ha-icon>${this._targetNames([e.target_entity])}</span>
            <span><ha-icon icon="mdi:timer-outline"></ha-icon>${this._t("{hours} h needed",{hours:e.hours})}</span>
          </div>
          ${"compact"!==this.config.view&&o>0?K`
            <div class="schedule-progress" title=${this._t("{done} of {required} hours completed",{done:o.toFixed(1),required:r})}>
              <i style=${`--progress:${n}%`}></i>
            </div>
          `:Y}
        </div>
        <div class="row-actions">
          ${!1!==this.config.show_controls&&this.hass?.user?.is_admin?K`
            <button type="button" class=${"icon-btn"+(t?" danger":" primary")}
              title=${this._t(t?"Pause schedule":"Enable schedule")}
              aria-label=${`${this._t(t?"Pause schedule":"Enable schedule")}: ${e.name}`}
              aria-pressed=${!t} aria-busy=${this.busy.has(e.id)}
              ?disabled=${this.busy.has(e.id)}
              @click=${()=>this._toggleSchedule(e)}>
              <ha-icon icon=${t?"mdi:pause":"mdi:play-circle-outline"}></ha-icon>
            </button>
          `:Y}
          ${e.entity_id?K`
            <button type="button" class="icon-btn" title=${this._t("More information")} aria-label=${this._t("More information")}
              @click=${()=>ui(this,e.entity_id)}>
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </button>
          `:Y}
        </div>
      </article>
    `}_openEnergySettings(){window.history.pushState(null,"","/smarthomeshop?energy-settings=automations"),window.dispatchEvent(new CustomEvent("location-changed"))}async _editAutomation(e){await(customElements.get("shs-energy-automations")?Promise.resolve(!0):(Ei||(Ei=new Promise(e=>{const t=document.createElement("script");t.type="module",t.src="/smarthomeshop_files/smarthomeshop-panel.js?v=1.13.1",t.onload=()=>{customElements.whenDefined("shs-energy-automations").then(()=>e(!0))},t.onerror=()=>e(!1),document.head.appendChild(t),window.setTimeout(()=>e(!!customElements.get("shs-energy-automations")),8e3)})),Ei))?this.editing=e:this.dataError=this._t("The Smart Energy editor could not be loaded. Open SmartHomeShop Energy Settings to edit this automation.")}_renderEditDialog(){const e=this.editing;if(!e||!this.hass||!this.context)return Y;const t=this.context.sources.p1_device||"",i=Object.values(this.hass.entities||{}).filter(e=>!t||e.device_id===t);return K`
      <shs-energy-automations
        .hass=${this.hass}
        .deviceId=${t||"smart-energy"}
        .deviceName=${e.deviceName}
        .deviceEntities=${i}
        .dialogOnly=${!0}
        .showHeader=${!1}
        .autoEditScenario=${e.scenario}
        .autoEditId=${e.id}
        .autoEditEntityId=${e.entityId}
        .autoEditEnabled=${"off"!==this._state(e.entityId)?.state}
        @shs-dialog-closed=${()=>{this.editing=void 0,Ai=void 0,this.load(!0)}}
      ></shs-energy-automations>
    `}render(){if(!this.hass)return Y;if(this.loading&&!this.context)return K`<ha-card><div class="loading" role="status" aria-live="polite"><div class="skeleton"></div><div class="skeleton"></div></div></ha-card>`;const e=!1===this.config.show_schedules?[]:this.schedules,t=this.automations.length+e.length,i=this.automations.filter(e=>"off"!==this._state(e.entityId)?.state).length+e.filter(e=>!1!==e.enabled).length,a=this.renderHeader(this._t("Smart automations"),t?this._t("{enabled} enabled · {total} configured",{enabled:i,total:t}):this._t("Price, solar and deadline control"),"mdi:robot-outline");return K`
      <ha-card>
        <div class="card-shell">
          ${a?K`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon=${a.icon}></ha-icon></div>
                <div><h2 class="head-title">${a.title}</h2><div class="head-subtitle">${a.subtitle}</div></div>
              </div>
              <div class="head-tools">
                ${t?K`
                  <div class="overview"><i class="overview-dot"></i>${this._t("{count} enabled",{count:i})}</div>
                `:Y}
                ${this.hass.user?.is_admin?K`
                  <button type="button" class="head-settings" title=${this._t("Open Smart Energy settings")}
                    aria-label=${this._t("Open Smart Energy settings")} @click=${this._openEnergySettings}>
                    <ha-icon icon="mdi:cog-outline"></ha-icon>
                  </button>
                `:Y}
              </div>
            </div>
          `:Y}

          ${t?K`
            <div class="automation-list">
              ${this.automations.length?K`
                <div class="group-label"><ha-icon icon="mdi:robot-outline"></ha-icon>${this._t("Reactive automations")}</div>
                ${this.automations.map(e=>this._renderAutomation(e))}
              `:Y}
              ${e.length?K`
                <div class="group-label"><ha-icon icon="mdi:calendar-clock-outline"></ha-icon>${this._t("Deadline schedules")}</div>
                ${e.map(e=>this._renderSchedule(e))}
              `:Y}
            </div>
          `:K`
            <div class="empty" role="status">
              <ha-icon icon="mdi:robot-confused-outline"></ha-icon>
              <strong>${this._t("No Smart Automations yet")}</strong>
              <span>${this._t("Create price, solar or deadline controls in SmartHomeShop Energy Settings. They will appear here automatically.")}</span>
              ${this.hass.user?.is_admin?K`
                <button type="button" class="empty-action" @click=${this._openEnergySettings}>${this._t("Open Energy Settings")}</button>
              `:Y}
            </div>
          `}
          ${this.dataError?K`<div class="error" role="alert">${this.dataError}</div>`:Y}
        </div>
      </ha-card>
      ${this._renderEditDialog()}
    `}}Li.styles=[mi,c`
      .card-shell { padding-bottom: 12px; }
      .card-head { margin-bottom: 12px; }
      .overview {
        display: flex;
        align-items: center;
        gap: 9px;
        color: var(--secondary-text-color);
        font-size: 10.5px;
      }
      .overview strong { color: var(--primary-text-color); font-size: 12px; }
      .head-tools { display: flex; align-items: center; gap: 8px; }
      .head-settings {
        width: 40px;
        height: 40px;
        display: inline-grid;
        place-items: center;
        border: 1px solid var(--shs-line);
        border-radius: 9px;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
      }
      .head-settings:hover { color: var(--primary-text-color); background: var(--shs-surface); }
      .head-settings:focus-visible { outline: 2px solid var(--shs-blue); outline-offset: 1px; }
      .head-settings ha-icon { --mdc-icon-size: 18px; }
      .overview-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--shs-green);
        box-shadow: 0 0 0 4px var(--shs-green-soft);
      }
      .automation-list { margin: 0 -18px; border-top: 1px solid var(--shs-line); }
      .automation-row {
        position: relative;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        min-height: 76px;
        padding: 12px 18px;
        border-bottom: 1px solid var(--shs-line);
        transition: background-color 160ms ease-out;
      }
      .automation-row:last-child { border-bottom: 0; }
      .automation-row:hover { background: var(--shs-surface); }
      .automation-row.disabled { opacity: .68; }
      .scenario-icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        color: var(--scenario-color);
        background: color-mix(in srgb, var(--scenario-color) 12%, var(--card-background-color));
      }
      .scenario-icon ha-icon { --mdc-icon-size: 20px; }
      .row-copy { min-width: 0; }
      .row-title {
        overflow: hidden;
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 690;
        line-height: 1.3;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .row-state {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 3px;
        color: var(--secondary-text-color);
        font-size: 11px;
        line-height: 1.35;
      }
      .state-dot {
        width: 6px;
        height: 6px;
        flex: 0 0 6px;
        border-radius: 50%;
        background: var(--secondary-text-color);
      }
      .row-state.active { color: var(--shs-green); }
      .row-state.active .state-dot { background: var(--shs-green); }
      .row-state.attention { color: var(--shs-red); }
      .row-state.attention .state-dot { background: var(--shs-red); }
      .row-detail {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 10px;
        margin-top: 6px;
        color: var(--secondary-text-color);
        font-size: 10px;
      }
      .row-detail span { display: inline-flex; align-items: center; gap: 4px; }
      .row-detail ha-icon { --mdc-icon-size: 13px; }
      .row-actions { display: flex; align-items: center; gap: 4px; }
      .icon-btn, .text-btn {
        min-width: 40px;
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        border: 1px solid transparent;
        border-radius: 9px;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
      }
      .icon-btn:hover, .text-btn:hover {
        border-color: var(--shs-line);
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }
      .icon-btn:focus-visible, .text-btn:focus-visible {
        outline: 2px solid var(--shs-blue);
        outline-offset: 1px;
      }
      .icon-btn ha-icon { --mdc-icon-size: 18px; }
      .icon-btn.primary { color: var(--shs-blue); }
      .icon-btn.danger { color: var(--shs-red); }
      .icon-btn[disabled] { opacity: .4; cursor: default; }
      .group-label {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 15px 18px 8px;
        color: var(--secondary-text-color);
        font-size: 9.5px;
        font-weight: 720;
        letter-spacing: .55px;
        text-transform: uppercase;
      }
      .group-label ha-icon { --mdc-icon-size: 15px; }
      .schedule-row .scenario-icon { --scenario-color: var(--shs-amber); }
      .schedule-progress {
        width: min(150px, 100%);
        height: 3px;
        margin-top: 7px;
        overflow: hidden;
        border-radius: 99px;
        background: var(--shs-line);
      }
      .schedule-progress i {
        display: block;
        width: var(--progress);
        height: 100%;
        background: var(--shs-amber);
      }
      .empty { min-height: 170px; }
      .empty-action {
        margin-top: 3px;
        min-height: 44px;
        padding: 8px 14px;
        border: 1px solid var(--shs-line);
        border-radius: 9px;
        background: transparent;
        color: var(--shs-blue);
        cursor: pointer;
      }
      .error {
        margin: 10px 0 0;
        padding: 10px 12px;
        border-radius: 9px;
        background: var(--shs-red-soft);
        color: var(--shs-red);
        font-size: 11px;
        line-height: 1.4;
      }
      :host([data-view="compact"]) .automation-row { min-height: 62px; padding-block: 9px; }
      :host([data-view="compact"]) .scenario-icon { width: 34px; height: 34px; border-radius: 9px; }
      :host([data-view="compact"]) .row-detail { display: none; }
      @container (max-width: 520px) {
        .automation-list { margin-inline: -14px; }
        .automation-row {
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 10px;
          padding: 11px 14px;
        }
        .scenario-icon { width: 34px; height: 34px; border-radius: 9px; }
        .row-actions {
          grid-column: 2;
          justify-content: flex-start;
          margin-top: -3px;
        }
        .row-actions .icon-btn {
          min-width: 44px;
          min-height: 44px;
          border-color: var(--shs-line);
        }
        .group-label { padding-inline: 14px; }
      }
      @media (pointer: coarse) {
        .head-settings, .icon-btn, .text-btn {
          min-width: 44px;
          min-height: 44px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .automation-row { transition: none; }
      }
    `],a([fe()],Li.prototype,"automations",void 0),a([fe()],Li.prototype,"schedules",void 0),a([fe()],Li.prototype,"priceEntities",void 0),a([fe()],Li.prototype,"busy",void 0),a([fe()],Li.prototype,"editing",void 0),a([fe()],Li.prototype,"dataError",void 0);console.info("%c SMARTHOMESHOP-CARDS %c 1.13.1 ","color: white; background: #2196f3; font-weight: bold; padding: 2px 4px; border-radius: 4px 0 0 4px;","color: #2196f3; background: #e3f2fd; font-weight: bold; padding: 2px 4px; border-radius: 0 4px 4px 0;");const Ni=["M636.8 285.9c-.5-10.6-11-15.9-18.8-21.6L392.7 97.4c-3.2-2.4-9.4-2.4-12.6 0L147.8 269.5c-3.2 2.4-8.1 5.2-10.1 8.6-4.8 8.3-1.7 24.7-1.7 33.6v283.4c0 6.7 5.7 12.5 12.5 12.5h92.8c16.1 0 16.1-25 0-25h-80.4v-292l225.5-167 225.4 167v292.1h-80.4c-16.1 0-16.1 25 0 25h92.8c6.7 0 12.5-5.7 12.5-12.5V327.2c.1-13.8.7-27.6.1-41.3z","M261.7 428.8c0 27.7 13.7 53.7 36 69.9 17.3 12.5 37.1 16 58 16h55.4c19.1 0 37.3-.9 54.7-10.2 27.6-14.6 45.4-44.5 45.4-75.7 0-16.1-25-16.1-25 0 0 29.1-21.2 54.6-49.8 60-16 3-33.9 1-50 1s-34 2-50-1c-28.6-5.4-49.8-30.9-49.8-60 0-16-24.9-16.1-24.9 0z","M332.3 351.6a21.4 21.4 0 1 1-42.8 0 21.4 21.4 0 1 1 42.8 0z","M483.4 351.6a21.4 21.4 0 1 1-42.8 0 21.4 21.4 0 1 1 42.8 0z","M767.5 279.4 392.8 1.7c-3.2-2.4-9.4-2.4-12.6 0L5.4 279.4c-12.8 9.5-.3 31.1 12.6 21.5L386.6 28 755 300.9c12.8 9.6 25.3-12.1 12.5-21.5z"].join(""),Ti=async e=>"logo"!==e?{path:"",viewBox:"0 0 772.9 607.6"}:{path:Ni,viewBox:"0 0 772.9 607.6"};function Di(){const e=[document];for(let t=0;t<e.length;t+=1){e[t].querySelectorAll("*").forEach(t=>{if(t.shadowRoot&&e.push(t.shadowRoot),"ha-icon"===t.localName&&"shs:logo"===t.icon){const e=t;e.icon=void 0,requestAnimationFrame(()=>{e.icon="shs:logo"})}})}}window.customIcons=window.customIcons||{},window.customIcons.shs={getIcon:Ti},window.customIconsets=window.customIconsets||{},window.customIconsets.shs=Ti,[0,50,250,1e3,3e3].forEach(e=>{window.setTimeout(Di,e)});function Hi(){const e=[document];for(let t=0;t<e.length;t+=1){e[t].querySelectorAll("*").forEach(t=>{t.shadowRoot&&e.push(t.shadowRoot),"hui-error-card"===t.localName&&t.dispatchEvent(new CustomEvent("ll-rebuild",{bubbles:!0,composed:!0}))})}}[["smarthomeshop-water-card",qe],["smarthomeshop-waterp1-card",Xe],["smarthomeshop-waterflowkit-card",Qe],["smarthomeshop-ultimatesensor-card",vt],["smarthomeshop-p1meterkit-card",Ht],["smarthomeshop-ceilsense-card",jt],["smarthomeshop-energy-live-card",bi],["smarthomeshop-energy-price-card",xi],["smarthomeshop-energy-power-card",ki],["smarthomeshop-energy-cost-card",Ci],["smarthomeshop-energy-savings-card",zi],["smarthomeshop-energy-automations-card",Li],["smarthomeshop-water-card-editor",Gt],["smarthomeshop-waterp1-card-editor",qt],["smarthomeshop-waterflowkit-card-editor",Je],["smarthomeshop-ultimatesensor-card-editor",ft],["smarthomeshop-p1meterkit-card-editor",Rt],["smarthomeshop-ceilsense-card-editor",Ft],["smarthomeshop-energy-card-editor",fi],["smarthomeshop-sensor-settings",ut],["smarthomeshop-zone-editor",Ot]].forEach(([a,o])=>{var r,n;r=a,n=o,i||(i=t({registryAtLoad:globalThis.customElements,getCurrentRegistry:()=>globalThis.customElements,onHealed:t=>{window.dispatchEvent(new CustomEvent(e,{detail:{names:t}}))}})),i.defineElement(r,n)}),window.addEventListener(e,Hi),[0,100,500,1500].forEach(e=>{window.setTimeout(Hi,e)}),window.customCards=window.customCards||[],window.customCards.push({type:"smarthomeshop-water-card",name:"SmartHomeShop Water Card",description:"Water monitoring voor WaterMeterKit en WaterFlowKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-waterp1-card",name:"SmartHomeShop WaterP1 Card",description:"Water + Energy monitoring voor WaterP1MeterKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-ultimatesensor-card",name:"SmartHomeShop UltimateSensor Card",description:"Presence detection & omgevingssensoren voor UltimateSensor en UltimateSensor Mini",preview:!0,documentationURL:"https://docs.smarthomeshop.io/en/ultimatesensor/home-assistant-card"}),window.customCards.push({type:"smarthomeshop-waterflowkit-card",name:"SmartHomeShop WaterFlowKit Card",description:"Dual flow water monitoring met geanimeerde leidingen voor WaterFlowKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-p1meterkit-card",name:"SmartHomeShop P1MeterKit Card",description:"Live grid power, tariffs, phases and energy insights for P1MeterKit",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-ceilsense-card",name:"SmartHomeShop CeilSense Card",description:"Ceiling presence, target zones, distance and room climate for CeilSense",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-energy-live-card",name:"SmartHomeShop Live Energy Card",description:"Live home consumption, grid, solar and battery power",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-energy-price-card",name:"SmartHomeShop Price Outlook Card",description:"Interactive hourly energy prices and the cheapest consecutive block",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-energy-power-card",name:"SmartHomeShop Power Trend Card",description:"Today's grid import, grid export, solar and battery power history",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-energy-cost-card",name:"SmartHomeShop Energy Costs Card",description:"Today's imported electricity cost, return value and net balance",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-energy-savings-card",name:"SmartHomeShop Smart Savings Card",description:"Measured savings from battery control and smart schedules",preview:!0,documentationURL:"https://smarthomeshop.io"}),window.customCards.push({type:"smarthomeshop-energy-automations-card",name:"SmartHomeShop Smart Automations Card",description:"Live status, next action and controls for Smart Energy automations and schedules",preview:!0,documentationURL:"https://smarthomeshop.io"}),console.log("SmartHomeShop.io Cards loaded successfully!");export{jt as SmartHomeShopCeilSenseCard,Ft as SmartHomeShopCeilSenseCardEditor,Li as SmartHomeShopEnergyAutomationsCard,fi as SmartHomeShopEnergyCardEditor,Ci as SmartHomeShopEnergyCostCard,bi as SmartHomeShopEnergyLiveCard,ki as SmartHomeShopEnergyPowerCard,xi as SmartHomeShopEnergyPriceCard,zi as SmartHomeShopEnergySavingsCard,Ht as SmartHomeShopP1MeterKitCard,Rt as SmartHomeShopP1MeterKitCardEditor,ut as SmartHomeShopSensorSettings,vt as SmartHomeShopUltimateSensorCard,qe as SmartHomeShopWaterCard,Qe as SmartHomeShopWaterFlowKitCard,Je as SmartHomeShopWaterFlowKitCardEditor,Xe as SmartHomeShopWaterP1Card,Ot as SmartHomeShopZoneEditor};
