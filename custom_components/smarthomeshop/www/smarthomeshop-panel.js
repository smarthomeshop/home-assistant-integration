/* SmartHomeShop.io Panel v1.0.0 - Build: 2026-07-09T08:51:43.643Z */
function e(e,t,i,o){var s,n=arguments.length,r=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,o);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(r=(n<3?s(r):n>3?s(t,i,r):s(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap;let n=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=s.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(t,e))}return e}toString(){return this.cssText}};const r=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[o+1],e[0]);return new n(i,e,o)},a=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new n("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:l,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:g}=Object,u=globalThis,v=u.trustedTypes,m=v?v.emptyScript:"",_=u.reactiveElementPolyfillSupport,x=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?m:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},f=(e,t)=>!l(e,t),b={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:f};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=b){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(e,i,t);void 0!==o&&d(this.prototype,e,o)}}static getPropertyDescriptor(e,t,i){const{get:o,set:s}=c(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const n=o?.call(this);s?.call(this,t),this.requestUpdate(e,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??b}static _$Ei(){if(this.hasOwnProperty(x("elementProperties")))return;const e=g(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(x("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(x("properties"))){const e=this.properties,t=[...h(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(a(e))}else void 0!==e&&t.push(a(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(i)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of o){const o=document.createElement("style"),s=t.litNonce;void 0!==s&&o.setAttribute("nonce",s),o.textContent=i.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,i);if(void 0!==o&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(t,i.type);this._$Em=e,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$Em=null}}_$AK(e,t){const i=this.constructor,o=i._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=i.getPropertyOptions(o),s="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=o;const n=s.fromAttribute(t,e.type);this[o]=n??this._$Ej?.get(o)??n,this._$Em=null}}requestUpdate(e,t,i,o=!1,s){if(void 0!==e){const n=this.constructor;if(!1===o&&(s=this[e]),i??=n.getPropertyOptions(e),!((i.hasChanged??f)(s,t)||i.useDefault&&i.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:o,wrapped:s},n){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),!0!==s||void 0!==n)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,i,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[x("elementProperties")]=new Map,w[x("finalized")]=new Map,_?.({ReactiveElement:w}),(u.reactiveElementVersions??=[]).push("2.1.2");const $=globalThis,k=e=>e,z=$.trustedTypes,P=z?z.createPolicy("lit-html",{createHTML:e=>e}):void 0,M="$lit$",D=`lit$${Math.random().toFixed(9).slice(2)}$`,S="?"+D,I=`<${S}>`,T=document,C=()=>T.createComment(""),A=e=>null===e||"object"!=typeof e&&"function"!=typeof e,Z=Array.isArray,E="[ \t\n\f\r]",W=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,F=/-->/g,N=/>/g,R=RegExp(`>|${E}(?:([^\\s"'>=/]+)(${E}*=${E}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),O=/'/g,H=/"/g,j=/^(?:script|style|textarea|title)$/i,L=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),U=L(1),V=L(2),G=Symbol.for("lit-noChange"),B=Symbol.for("lit-nothing"),K=new WeakMap,Y=T.createTreeWalker(T,129);function q(e,t){if(!Z(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==P?P.createHTML(t):t}const X=(e,t)=>{const i=e.length-1,o=[];let s,n=2===t?"<svg>":3===t?"<math>":"",r=W;for(let t=0;t<i;t++){const i=e[t];let a,l,d=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===W?"!--"===l[1]?r=F:void 0!==l[1]?r=N:void 0!==l[2]?(j.test(l[2])&&(s=RegExp("</"+l[2],"g")),r=R):void 0!==l[3]&&(r=R):r===R?">"===l[0]?(r=s??W,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,a=l[1],r=void 0===l[3]?R:'"'===l[3]?H:O):r===H||r===O?r=R:r===F||r===N?r=W:(r=R,s=void 0);const h=r===R&&e[t+1].startsWith("/>")?" ":"";n+=r===W?i+I:d>=0?(o.push(a),i.slice(0,d)+M+i.slice(d)+D+h):i+D+(-2===d?t:h)}return[q(e,n+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class J{constructor({strings:e,_$litType$:t},i){let o;this.parts=[];let s=0,n=0;const r=e.length-1,a=this.parts,[l,d]=X(e,t);if(this.el=J.createElement(l,i),Y.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=Y.nextNode())&&a.length<r;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(M)){const t=d[n++],i=o.getAttribute(e).split(D),r=/([.?@])?(.*)/.exec(t);a.push({type:1,index:s,name:r[2],strings:i,ctor:"."===r[1]?oe:"?"===r[1]?se:"@"===r[1]?ne:ie}),o.removeAttribute(e)}else e.startsWith(D)&&(a.push({type:6,index:s}),o.removeAttribute(e));if(j.test(o.tagName)){const e=o.textContent.split(D),t=e.length-1;if(t>0){o.textContent=z?z.emptyScript:"";for(let i=0;i<t;i++)o.append(e[i],C()),Y.nextNode(),a.push({type:2,index:++s});o.append(e[t],C())}}}else if(8===o.nodeType)if(o.data===S)a.push({type:2,index:s});else{let e=-1;for(;-1!==(e=o.data.indexOf(D,e+1));)a.push({type:7,index:s}),e+=D.length-1}s++}}static createElement(e,t){const i=T.createElement("template");return i.innerHTML=e,i}}function Q(e,t,i=e,o){if(t===G)return t;let s=void 0!==o?i._$Co?.[o]:i._$Cl;const n=A(t)?void 0:t._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),void 0===n?s=void 0:(s=new n(e),s._$AT(e,i,o)),void 0!==o?(i._$Co??=[])[o]=s:i._$Cl=s),void 0!==s&&(t=Q(e,s._$AS(e,t.values),s,o)),t}class ee{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,o=(e?.creationScope??T).importNode(t,!0);Y.currentNode=o;let s=Y.nextNode(),n=0,r=0,a=i[0];for(;void 0!==a;){if(n===a.index){let t;2===a.type?t=new te(s,s.nextSibling,this,e):1===a.type?t=new a.ctor(s,a.name,a.strings,this,e):6===a.type&&(t=new re(s,this,e)),this._$AV.push(t),a=i[++r]}n!==a?.index&&(s=Y.nextNode(),n++)}return Y.currentNode=T,o}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class te{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,o){this.type=2,this._$AH=B,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Q(this,e,t),A(e)?e===B||null==e||""===e?(this._$AH!==B&&this._$AR(),this._$AH=B):e!==this._$AH&&e!==G&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>Z(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==B&&A(this._$AH)?this._$AA.nextSibling.data=e:this.T(T.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,o="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=J.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new ee(o,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=K.get(e.strings);return void 0===t&&K.set(e.strings,t=new J(e)),t}k(e){Z(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,o=0;for(const s of e)o===t.length?t.push(i=new te(this.O(C()),this.O(C()),this,this.options)):i=t[o],i._$AI(s),o++;o<t.length&&(this._$AR(i&&i._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=k(e).nextSibling;k(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ie{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,o,s){this.type=1,this._$AH=B,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=B}_$AI(e,t=this,i,o){const s=this.strings;let n=!1;if(void 0===s)e=Q(this,e,t,0),n=!A(e)||e!==this._$AH&&e!==G,n&&(this._$AH=e);else{const o=e;let r,a;for(e=s[0],r=0;r<s.length-1;r++)a=Q(this,o[i+r],t,r),a===G&&(a=this._$AH[r]),n||=!A(a)||a!==this._$AH[r],a===B?e=B:e!==B&&(e+=(a??"")+s[r+1]),this._$AH[r]=a}n&&!o&&this.j(e)}j(e){e===B?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class oe extends ie{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===B?void 0:e}}class se extends ie{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==B)}}class ne extends ie{constructor(e,t,i,o,s){super(e,t,i,o,s),this.type=5}_$AI(e,t=this){if((e=Q(this,e,t,0)??B)===G)return;const i=this._$AH,o=e===B&&i!==B||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,s=e!==B&&(i===B||o);o&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class re{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Q(this,e)}}const ae=$.litHtmlPolyfillSupport;ae?.(J,te),($.litHtmlVersions??=[]).push("3.3.2");const le=globalThis;class de extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const o=i?.renderBefore??t;let s=o._$litPart$;if(void 0===s){const e=i?.renderBefore??null;o._$litPart$=s=new te(t.insertBefore(C(),e),e,void 0,i??{})}return s._$AI(e),s})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}}de._$litElement$=!0,de.finalized=!0,le.litElementHydrateSupport?.({LitElement:de});const ce=le.litElementPolyfillSupport;ce?.({LitElement:de}),(le.litElementVersions??=[]).push("4.2.2");const he=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},pe={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:f},ge=(e=pe,t,i)=>{const{kind:o,metadata:s}=i;let n=globalThis.litPropertyMetadata.get(s);if(void 0===n&&globalThis.litPropertyMetadata.set(s,n=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),n.set(i.name,e),"accessor"===o){const{name:o}=i;return{set(i){const s=t.get.call(this);t.set.call(this,i),this.requestUpdate(o,s,e,!0,i)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=i;return function(i){const s=this[o];t.call(this,i),this.requestUpdate(o,s,e,!0,i)}}throw Error("Unsupported decorator location: "+o)};function ue(e){return(t,i)=>"object"==typeof i?ge(e,t,i):((e,t,i)=>{const o=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),o?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function ve(e){return ue({...e,state:!0,attribute:!1})}function me(e,t){return(t,i,o)=>((e,t,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,i),i))(t,i,{get(){return(t=>t.renderRoot?.querySelector(e)??null)(this)}})}let _e=class extends de{constructor(){super(...arguments),this._account=null,this._apiKeyInput="",this._savingKey=!1,this._showKeyForm=!1}connectedCallback(){super.connectedCallback(),this._load()}async _load(){try{this._account=await this.hass.callWS({type:"smarthomeshop/account"})}catch(e){console.error("account load failed",e)}}async _save(){if(!this._savingKey){this._savingKey=!0;try{this._account=await this.hass.callWS({type:"smarthomeshop/account/set",api_key:this._apiKeyInput.trim()}),this._apiKeyInput="",this._showKeyForm=!1}catch(e){console.error("account save failed",e)}this._savingKey=!1}}async _disconnect(){this._savingKey=!0;try{this._account=await this.hass.callWS({type:"smarthomeshop/account/set",api_key:""})}catch(e){console.error("disconnect failed",e)}this._savingKey=!1}render(){const e=this._account,t=e?.status||"unconfigured",i=e?.current,o={unconfigured:"The integration works fully locally — no account needed. Connect a key only to pull live dynamic spot prices.",ok:"Connected — live prices are being fetched.",unauthorized:"That API key is invalid or was revoked.",forbidden:"Your account needs an API subscription for dynamic prices.",error:"Could not reach the price service. Check your connection and try again."},s="ok"===t?"ok":"unconfigured"===t?"":"alert";return U`
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
              ${e?.has_key?U`<span class="status-badge ${"ok"===s?"ok":"alert"}">${"ok"===t?"Connected":t}</span>`:B}
              ${o[t]||o.error}
            </div>
          </div>

          ${"ok"===t&&i?U`
            <div class="chips">
              <div class="chip"><div class="chip-label">Electricity now</div><div class="chip-value">€ ${(i.electricity??0).toFixed(3)} <span class="unit">/kWh</span></div></div>
              ${i.level?U`<div class="chip"><div class="chip-label">Tariff level</div><div class="chip-value" style="text-transform: capitalize;">${String(i.level).replace("_"," ")}</div></div>`:B}
              ${null!=i.feed_in?U`<div class="chip"><div class="chip-label">Feed-in now</div><div class="chip-value">€ ${i.feed_in.toFixed(3)} <span class="unit">/kWh</span></div></div>`:B}
              ${null!=i.gas?U`<div class="chip"><div class="chip-label">Gas now</div><div class="chip-value">€ ${i.gas.toFixed(3)} <span class="unit">/m³</span></div></div>`:B}
            </div>
            <div class="hint">
              Point the Home Assistant Energy Dashboard at
              <code>sensor.smarthomeshop_energy_prices_electricity_price</code>
              ("use an entity with current price") for accurate dynamic cost tracking.
            </div>
          `:B}

          ${e?.has_key&&!this._showKeyForm?U`
            <div class="actions">
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
                ${this._savingKey?"Connecting…":"Connect"}
              </button>
            </div>
            <div class="hint">
              Fixed prices are set above and are free. For live spot prices, create an API key in
              your account at <b>smarthomeshop.io → Settings → API tokens</b> (requires an API
              subscription) and paste it here.
            </div>
          `}
        </div>
      </div>
    `}};_e.styles=r`
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
    .chips { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 14px; }
    .chip { background: var(--secondary-background-color); border-radius: 10px; padding: 10px 12px; }
    .chip-label { font-size: 11px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.4px; }
    .chip-value { font-size: 16px; font-weight: 700; color: var(--primary-text-color); margin-top: 2px; }
    .chip-value .unit { font-size: 11px; font-weight: 400; color: var(--secondary-text-color); }
    .form { display: flex; gap: 8px; margin-top: 14px; }
    .form input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .form input:focus { outline: none; border-color: var(--shs-primary); }
    .actions { display: flex; gap: 10px; margin-top: 14px; }
    .btn { padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border: none; }
    .btn.primary { background: var(--shs-primary); color: #fff; }
    .btn.primary:disabled { opacity: 0.5; cursor: default; }
    .btn.ghost { background: transparent; border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    .btn.ghost.danger { color: #ef4444; }
    .hint { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 12px; line-height: 1.5; }
    .hint code { background: var(--secondary-background-color); padding: 1px 5px; border-radius: 4px; font-size: 11px; }
  `,e([ue({attribute:!1})],_e.prototype,"hass",void 0),e([ve()],_e.prototype,"_account",void 0),e([ve()],_e.prototype,"_apiKeyInput",void 0),e([ve()],_e.prototype,"_savingKey",void 0),e([ve()],_e.prototype,"_showKeyForm",void 0),_e=e([he("shs-account-prices")],_e);const xe=["waterp1meterkit","p1meterkit"],ye=[{key:"radar",title:"Radar & Presence",icon:"mdi:radar",match:/radar|presence|target|zone|polygon|entry|people|distance|mount|angle|occupancy|timeout|bluetooth|multi/i},{key:"voice",title:"Voice Assistant",icon:"mdi:microphone",match:/wake|assist|spraak|wekwoord|voice|speaker|volume|mute|sound|audio/i},{key:"air",title:"Air Quality & Climate",icon:"mdi:air-filter",match:/sps30|co2|voc|nox|pm|temperature|humidity|offset|calibrat|pressure|ambient/i},{key:"other",title:"Other",icon:"mdi:tune",match:/.*/}];let fe=class extends de{constructor(){super(...arguments),this.embedded=!1,this._devices=[],this._entities=[],this._loading=!0,this._filter="",this._expandedGroups=new Set,this._configFields=[],this._configValues={},this._productType="",this._savingConfig=!1,this._configSaved=!1}connectedCallback(){super.connectedCallback(),this.embedded&&this.selectedDeviceId?this._loadEmbedded():this._loadDevices()}async _loadDevices(){this._loading=!0;try{const e=await this.hass.callWS({type:"smarthomeshop/devices"});this._devices=e.devices.filter(e=>e.product_type?.includes("sensor")),this._devices.length>0&&await this._selectDevice(this._devices[0])}catch(e){console.error("Failed to load devices:",e)}this._loading=!1}async _loadEmbedded(){this._loading=!0,this._selectedDevice={id:this.selectedDeviceId,name:"",entity_count:0},await this._loadEntities(this.selectedDeviceId),this._loading=!1}async _selectDevice(e){this._selectedDevice=e,this._expandedGroups=new Set,this.dispatchEvent(new CustomEvent("device-select",{detail:{deviceId:e.id}})),await this._loadEntities(e.id)}async _loadEntities(e){try{const t=await this.hass.callWS({type:"smarthomeshop/device/entities",device_id:e});this._entities=t.entities.filter(e=>["number","select","switch","button"].includes(e.domain))}catch(e){console.error("Failed to load entities:",e)}await this._loadConfig(e)}async _loadConfig(e){try{const t=await this.hass.callWS({type:"smarthomeshop/device/config",device_id:e});this._configFields=t.fields||[],this._productType=t.product_type||"";const i={};for(const e of this._configFields)i[e.key]=e.value;this._configValues=i}catch(e){console.error("Failed to load config:",e),this._configFields=[]}}async _saveConfig(){if(this._selectedDevice&&!this._savingConfig){this._savingConfig=!0,this._configSaved=!1;try{await this.hass.callWS({type:"smarthomeshop/device/config/set",device_id:this._selectedDevice.id,values:this._configValues}),this._configSaved=!0,window.setTimeout(()=>{this._configSaved=!1},2500)}catch(e){console.error("Failed to save config:",e)}this._savingConfig=!1}}_inputBooleanOptions(){const e=[{value:"",label:"None"}];for(const[t,i]of Object.entries(this.hass.states||{}))t.startsWith("input_boolean.")&&e.push({value:t,label:i.attributes?.friendly_name||t});return e}_renderConfigField(e){const t=this._configValues[e.key],i=t=>{this._configValues={...this._configValues,[e.key]:t}};let o;return o="number"===e.type?U`
        <input type="number" .value=${t??""} min=${e.min??B} max=${e.max??B} step=${e.step??B}
          @input=${e=>i(parseFloat(e.target.value))} />
        ${e.unit?U`<span class="cfg-unit">${e.unit}</span>`:B}`:"time"===e.type?U`<input type="time" .value=${t??""} @input=${e=>i(e.target.value)} />`:"entity"===e.type?U`
        <select @change=${e=>i(e.target.value)}>
          ${this._inputBooleanOptions().map(e=>U`<option value=${e.value} ?selected=${e.value===(t||"")}>${e.label}</option>`)}
        </select>`:U`<input type="text" .value=${t??""} @input=${e=>i(e.target.value)} />`,U`
      <div class="cfg-row">
        <div class="cfg-info">
          <div class="cfg-label">${e.label}</div>
          ${e.help?U`<div class="cfg-help">${e.help}</div>`:B}
        </div>
        <div class="cfg-control">${o}</div>
      </div>`}_renderConfigCard(){if(0===this._configFields.length)return B;const e=!!this.hass.user?.is_admin;return U`
      <div class="settings-group cfg-card">
        <div class="group-header">
          <ha-icon icon="mdi:cog-outline"></ha-icon>
          <span class="group-title">Product settings</span>
        </div>
        ${this._configFields.map(e=>this._renderConfigField(e))}
        <div class="cfg-foot">
          ${this._configSaved?U`<span class="cfg-saved"><ha-icon icon="mdi:check-circle"></ha-icon> Saved</span>`:B}
          <button class="cfg-save" ?disabled=${!e||this._savingConfig} @click=${this._saveConfig}>
            ${this._savingConfig?"Saving…":"Save settings"}
          </button>
        </div>
      </div>`}_groupEntities(){const e=this._filter.trim().toLowerCase(),t=new Map;for(const e of ye)t.set(e.key,[]);for(const i of this._entities){const o=`${i.name} ${i.entity_id}`;if(e&&!o.toLowerCase().includes(e))continue;const s=ye.find(e=>e.match.test(o));t.get(s.key).push(i)}for(const e of t.values())e.sort((e,t)=>e.name.localeCompare(t.name));return t}_callService(e,t,i,o={}){this.hass.callService(e,t,{entity_id:i,...o})}_renderControl(e){const t=this.hass.states[e.entity_id],i=t?.state,o=t?.attributes||{},s=!t||"unavailable"===i||"unknown"===i;if("switch"===e.domain){const t="on"===i;return U`
        <button class="toggle ${t?"on":""}" ?disabled=${s}
          @click=${()=>this._callService("switch",t?"turn_off":"turn_on",e.entity_id)}></button>
      `}if("select"===e.domain){const t=o.options||[];return U`
        <select ?disabled=${s}
          @change=${t=>this._callService("select","select_option",e.entity_id,{option:t.target.value})}>
          ${t.map(e=>U`<option value=${e} ?selected=${e===i}>${e}</option>`)}
        </select>
      `}if("number"===e.domain){const t=o.unit_of_measurement;return U`
        <input type="number" .value=${s?"":String(i)}
          min=${o.min??B} max=${o.max??B} step=${o.step??B}
          ?disabled=${s}
          @change=${t=>{const i=parseFloat(t.target.value);isNaN(i)||this._callService("number","set_value",e.entity_id,{value:i})}}/>
        ${t?U`<span class="unit">${t}</span>`:B}
      `}return"button"===e.domain?U`
        <button class="press-btn" ?disabled=${s}
          @click=${()=>this._callService("button","press",e.entity_id)}>Press</button>
      `:U`<span class="unit">${i??"-"}</span>`}_renderGroup(e,t){if(0===t.length)return B;const i=this._expandedGroups.has(e.key)||this._filter.trim().length>0?t:t.slice(0,12),o=t.length-i.length;return U`
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
        `:B}
      </div>
    `}render(){if(this._loading)return U`<div class="loading"><ha-circular-progress active></ha-circular-progress></div>`;const e=this._selectedDevice?this._groupEntities():null;return this.embedded?U`
        ${this._renderConfigCard()}
        ${xe.includes(this._productType)?U`<shs-account-prices .hass=${this.hass}></shs-account-prices>`:B}
        ${this._selectedDevice&&e?U`
          <input type="search" class="search-box" placeholder="Search settings..."
            .value=${this._filter}
            @input=${e=>this._filter=e.target.value} />
          ${ye.map(t=>this._renderGroup(t,e.get(t.key)||[]))}
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
        `:B}
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
            ${ye.map(t=>this._renderGroup(t,e.get(t.key)||[]))}
          `:U`
            <div class="empty-state">
              <ha-icon icon="mdi:radar"></ha-icon>
              <h3>No device selected</h3>
              <p>Select a device on the left to configure its settings.</p>
            </div>
          `}
        </div>
      </div>
    `}};fe.styles=r`
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
    .cfg-control { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .cfg-control input, .cfg-control select {
      padding: 7px 10px; border: 1px solid var(--divider-color); border-radius: 8px;
      background: var(--card-background-color); color: var(--primary-text-color);
      font-size: 13px; font-family: inherit;
    }
    .cfg-control input[type="number"] { width: 90px; text-align: right; }
    .cfg-control input:focus, .cfg-control select:focus { outline: none; border-color: var(--shs-primary); }
    .cfg-unit { font-size: 12px; color: var(--secondary-text-color); min-width: 34px; }
    .cfg-foot { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--divider-color); }
    .cfg-saved { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: #22c55e; }
    .cfg-saved ha-icon { --mdc-icon-size: 15px; }
    .cfg-save { padding: 9px 18px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .cfg-save:disabled { opacity: 0.5; cursor: default; }
  `,e([ue({attribute:!1})],fe.prototype,"hass",void 0),e([ue()],fe.prototype,"selectedDeviceId",void 0),e([ue({type:Boolean})],fe.prototype,"embedded",void 0),e([ve()],fe.prototype,"_devices",void 0),e([ve()],fe.prototype,"_selectedDevice",void 0),e([ve()],fe.prototype,"_entities",void 0),e([ve()],fe.prototype,"_loading",void 0),e([ve()],fe.prototype,"_filter",void 0),e([ve()],fe.prototype,"_expandedGroups",void 0),e([ve()],fe.prototype,"_configFields",void 0),e([ve()],fe.prototype,"_configValues",void 0),e([ve()],fe.prototype,"_productType",void 0),e([ve()],fe.prototype,"_savingConfig",void 0),e([ve()],fe.prototype,"_configSaved",void 0),fe=e([he("shs-settings-page")],fe);const be={ultimatesensor:["climate"],ultimatesensor_mini:["climate"],ceilsense:["climate"],waterp1meterkit:["water","energy"],watermeterkit:["water"],waterflowkit:["water"],p1meterkit:["energy"]},we=[{key:"co2_high",group:"climate",title:"High CO₂",color:"#22c55e",desc:"Notify when CO₂ stays too high — time to ventilate.",icon:"mdi:molecule-co2",match:{domain:"sensor",suffix:["co2"],excl:["calibrat","manual","offset","target"]},kind:"above",threshold:1e3,unit:"ppm",forMin:5,msgTitle:"High CO₂ in {room}",msg:"CO₂ is {value} ppm. Open a window to get some fresh air."},{key:"pm25_high",group:"climate",title:"Poor air quality (PM2.5)",color:"#f59e0b",desc:"Notify when fine dust rises above a healthy level.",icon:"mdi:air-filter",match:{domain:"sensor",suffix:["pm_2_5","pm2_5","pm25"],excl:["number","count"]},kind:"above",threshold:35,unit:"µg/m³",forMin:5,msgTitle:"Poor air quality in {room}",msg:"Fine dust (PM2.5) is {value} µg/m³."},{key:"voc_high",group:"climate",title:"High VOC",color:"#a855f7",desc:"Notify when chemical pollutants (VOC) rise.",icon:"mdi:scent",match:{domain:"sensor",suffix:["voc_index","voc"],excl:["calibrat"]},kind:"above",threshold:250,unit:"",forMin:5,msgTitle:"High VOC in {room}",msg:"VOC index is {value}. Ventilate the room."},{key:"humid_high",group:"climate",title:"Too humid",color:"#0096c7",desc:"Notify at high humidity (risk of mould).",icon:"mdi:water-percent",match:{domain:"sensor",suffix:["humidity"],excl:["offset","calibrat"]},kind:"above",threshold:70,unit:"%",forMin:15,msgTitle:"High humidity in {room}",msg:"Humidity is {value}%. Ventilate to prevent mould."},{key:"humid_low",group:"climate",title:"Too dry",color:"#94a3b8",desc:"Notify when the air gets very dry.",icon:"mdi:water-off",match:{domain:"sensor",suffix:["humidity"],excl:["offset","calibrat"]},kind:"below",threshold:30,unit:"%",forMin:15,msgTitle:"Dry air in {room}",msg:"Humidity is only {value}%."},{key:"temp_high",group:"climate",title:"Too warm",color:"#ef4444",desc:"Notify when the temperature climbs too high.",icon:"mdi:thermometer-high",match:{domain:"sensor",suffix:["temperature"],excl:["offset","calibrat"]},kind:"above",threshold:27,unit:"°C",forMin:10,msgTitle:"It is warm in {room}",msg:"Temperature is {value}°C."},{key:"temp_low",group:"climate",title:"Too cold",color:"#38bdf8",desc:"Notify when it gets cold in the room.",icon:"mdi:thermometer-low",match:{domain:"sensor",suffix:["temperature"],excl:["offset","calibrat"]},kind:"below",threshold:16,unit:"°C",forMin:10,msgTitle:"It is cold in {room}",msg:"Temperature is {value}°C."},{key:"presence_on",group:"climate",title:"Motion detected",color:"#4361ee",desc:"Notify on presence — handy as an away alarm.",icon:"mdi:motion-sensor",match:{domain:"binary_sensor",suffix:["occupancy"],excl:["zone"]},kind:"to_on",msgTitle:"Motion in {room}",msg:"{room} detected presence."},{key:"vacant",group:"climate",title:"Room became empty",color:"#64748b",desc:"Notify when nobody has been present for a while.",icon:"mdi:motion-sensor-off",match:{domain:"binary_sensor",suffix:["occupancy"],excl:["zone"]},kind:"to_off",forMin:10,msgTitle:"{room} is empty",msg:"No presence in {room} for {min} minutes."},{key:"leak_alarm",group:"water",title:"Possible water leak",color:"#ef4444",desc:"Notify when smart leak detection flags unusual usage.",icon:"mdi:water-alert",match:{domain:"binary_sensor",suffix:["leak_alarm_cc","smart_leak_detection_cc"]},kind:"to_on",msgTitle:"Possible water leak ({room})",msg:"Smart leak detection flagged unusual water usage."},{key:"hw_leak",group:"water",title:"Water leak sensor wet",color:"#dc2626",desc:"Notify the moment the hardware leak sensor detects water.",icon:"mdi:water",match:{domain:"binary_sensor",suffix:["water_leak_sensor","water_leak"]},kind:"to_on",msgTitle:"💧 Water detected!",msg:"The water leak sensor is wet — check immediately."},{key:"night_usage",group:"water",title:"Night-time water usage",color:"#6366f1",desc:"Notify when water is used during the night.",icon:"mdi:weather-night",match:{domain:"binary_sensor",suffix:["night_usage_cc"]},kind:"to_on",msgTitle:"Night-time water usage ({room})",msg:"Water is being used during the night."},{key:"continuous",group:"water",title:"Continuous water flow",color:"#f59e0b",desc:"Notify when water flows non-stop (running tap or leak).",icon:"mdi:water-pump",match:{domain:"binary_sensor",suffix:["continuous_flow_leak_cc","continuous_flow_cc"]},kind:"to_on",msgTitle:"Continuous water flow ({room})",msg:"Water has been flowing non-stop — possible leak or running tap."},{key:"usage_high",group:"water",title:"High water usage today",color:"#0096c7",desc:"Notify when today’s water usage passes a limit.",icon:"mdi:cup-water",match:{domain:"sensor",suffix:["usage_today_cc"]},kind:"above",threshold:500,unit:"L",msgTitle:"High water usage today ({room})",msg:"You have used {value} L today."},{key:"power_high",group:"energy",title:"High power usage",color:"#f72585",desc:"Notify when power draw stays above a limit.",icon:"mdi:flash-alert",match:{domain:"sensor",suffix:["power_consumed"],excl:["phase"]},kind:"above",threshold:3500,unit:"W",forMin:5,msgTitle:"High power usage",msg:"You are drawing {value} W right now."},{key:"fuse_near",group:"energy",title:"Close to fuse limit",color:"#e11d48",desc:"Notify when a phase gets close to your main fuse.",icon:"mdi:gauge-full",match:{domain:"sensor",suffix:["highest_phase_load_cc"]},kind:"above",threshold:80,unit:"%",forMin:1,msgTitle:"Close to fuse limit",msg:"Phase load is at {value}% of your main fuse."}];let $e=class extends de{constructor(){super(...arguments),this.deviceName="",this.productType="",this._entities=[],this._related=[],this._loading=!0,this._notifyTarget="persistent_notification.create",this._thresholds={},this._created={},this._busy="",this._error="",this._modalScenario=null,this._modalEntityId=""}connectedCallback(){super.connectedCallback(),this._load()}async _load(){this._loading=!0;try{const e=await this.hass.callWS({type:"smarthomeshop/device/entities",device_id:this.deviceId});this._entities=e.entities||[]}catch(e){console.error("automations: failed to load entities",e)}await this._loadRelated(),this._loading=!1}async _loadRelated(){try{const e=await this.hass.callWS({type:"search/related",item_type:"device",item_id:this.deviceId});this._related=e.automation||[]}catch(e){console.error("automations: search/related failed",e),this._related=[]}}_notifyOptions(){const e=[{value:"persistent_notification.create",label:"Home Assistant notification"}],t=this.hass.services?.notify||{};for(const i of Object.keys(t).sort()){if("persistent_notification"===i)continue;const t=i.replace(/^mobile_app_/,"📱 ").replace(/_/g," ");e.push({value:`notify.${i}`,label:`Notify: ${t}`})}return e}_findEntity(e){const t=e.match.excl||[],i=this._entities.filter(i=>i.entity_id.startsWith(e.match.domain+".")&&!t.some(e=>i.entity_id.toLowerCase().includes(e)));for(const t of e.match.suffix){const e=i.find(e=>e.entity_id.toLowerCase().endsWith(`_${t}`));if(e)return e.entity_id}return null}_threshold(e){return this._thresholds[e.key]??e.threshold??0}_buildConfig(e,t){const i=this.deviceName||"the room",o=`{{ states('${t}') }}`,s=e.forMin??0,n=e=>e.replace(/{room}/g,i).replace(/{value}/g,o).replace(/{min}/g,String(s));let r;"above"===e.kind||"below"===e.kind?(r={platform:"numeric_state",entity_id:t,[e.kind]:this._threshold(e)},e.forMin&&(r.for={minutes:e.forMin})):(r={platform:"state",entity_id:t,to:"to_on"===e.kind?"on":"off"},e.forMin&&(r.for={minutes:e.forMin}));const[a,l]=this._notifyTarget.split("."),d={service:`${a}.${l}`,data:{title:n(e.msgTitle),message:n(e.msg)}};return{alias:`${i} – ${e.title}`,description:"Created with the SmartHomeShop.io panel",mode:"single",trigger:[r],condition:[],action:[d]}}_openModal(e,t){this._error="",this._modalScenario=e,this._modalEntityId=t}_closeModal(){this._modalScenario=null,this._modalEntityId=""}async _create(e,t){if(!this.hass.user?.is_admin)return!1;this._busy=e.key,this._error="";const i=`shs_${this.deviceId.slice(0,6)}_${e.key}_${Date.now()}`;let o=!1;try{await this.hass.callApi("POST",`config/automation/config/${i}`,this._buildConfig(e,t)),this._created={...this._created,[e.key]:i},window.setTimeout(()=>this._loadRelated(),1200),o=!0}catch(t){console.error("automations: create failed",t),this._error=`Could not create "${e.title}". ${t?.message||""}`}return this._busy="",o}async _confirmModal(){if(!this._modalScenario)return;await this._create(this._modalScenario,this._modalEntityId)&&this._closeModal()}_existingAutomations(){const e=[];for(const t of this._related){const i=this.hass.states[t];i&&e.push({entityId:t,name:i.attributes?.friendly_name||t,on:"on"===i.state,id:i.attributes?.id})}return e.sort((e,t)=>e.name.localeCompare(t.name))}_scenarioAutomationId(e){const t=`${this.deviceName||"the room"} – ${e.title}`;for(const e of this._related){const i=this.hass.states[e];if(i&&i.attributes?.friendly_name===t)return i.attributes?.id||void 0}return this._created[e.key]}_renderScenario(e){const t=this._findEntity(e);if(!t)return B;const i=this._scenarioAutomationId(e),o=!!this.hass.user?.is_admin;return U`
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
              Created · <a href="/config/automation/edit/${i}">Edit</a>
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
    `}_renderModal(){const e=this._modalScenario;if(!e)return B;const t="above"===e.kind||"below"===e.kind,i=this.deviceName||"this device",o=e.forMin?` for ${e.forMin} min`:"";let s;return s=t?`When it goes ${"above"===e.kind?"above":"below"} ${this._threshold(e)} ${e.unit}${o}`:"to_on"===e.kind?`When it triggers${o}`:`When it clears${o}`,U`
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
            `:B}

            <label class="modal-label">Send notification to</label>
            <select class="modal-select"
              @change=${e=>{this._notifyTarget=e.target.value}}>
              ${this._notifyOptions().map(e=>U`<option value=${e.value} ?selected=${e.value===this._notifyTarget}>${e.label}</option>`)}
            </select>

            <div class="modal-when"><ha-icon icon="mdi:flash"></ha-icon> ${s}</div>
            ${this._error?U`<div class="warn" style="margin-top: 12px;">${this._error}</div>`:B}
          </div>

          <div class="modal-foot">
            <button class="btn-ghost" @click=${this._closeModal}>Cancel</button>
            <button class="create-btn" ?disabled=${this._busy===e.key} @click=${this._confirmModal}>
              <ha-icon icon="mdi:plus"></ha-icon>
              ${this._busy===e.key?"Creating…":"Create automation"}
            </button>
          </div>
        </div>
      </div>
    `}render(){if(this._loading)return U`<div class="loading"><ha-circular-progress active></ha-circular-progress></div>`;const e=be[this.productType]||[],t=!!this.hass.user?.is_admin,i=this._existingAutomations(),o={climate:"Air quality & climate",water:"Water",energy:"Energy"},s=e.some(e=>we.some(t=>t.group===e&&this._findEntity(t)));return U`
      <div class="intro">
        One-click automations for this device — pick the ones you want and choose where the
        notification goes. Each becomes a normal Home Assistant automation you can fine-tune
        later in the automation editor.
      </div>

      ${t?B:U`
        <div class="warn">You need an administrator account to create automations.</div>
      `}
      ${this._error&&!this._modalScenario?U`<div class="warn">${this._error}</div>`:B}

      ${s?e.map(e=>{const t=we.filter(t=>t.group===e&&this._findEntity(t));return 0===t.length?B:U`
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
              ${e.id?U`<a href="/config/automation/edit/${e.id}">Edit</a>`:B}
            </div>
          `)}
        </div>
      `:B}

      ${s?U`
        <div class="config-hint">
          A new automation doesn't appear under <b>Settings → Automations</b>? Make sure your
          <code>configuration.yaml</code> contains <code>automation: !include automations.yaml</code>
          (standard on a normal Home Assistant install).
        </div>
      `:B}

      ${this._renderModal()}
    `}};$e.styles=r`
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
  `,e([ue({attribute:!1})],$e.prototype,"hass",void 0),e([ue()],$e.prototype,"deviceId",void 0),e([ue()],$e.prototype,"deviceName",void 0),e([ue()],$e.prototype,"productType",void 0),e([ve()],$e.prototype,"_entities",void 0),e([ve()],$e.prototype,"_related",void 0),e([ve()],$e.prototype,"_loading",void 0),e([ve()],$e.prototype,"_notifyTarget",void 0),e([ve()],$e.prototype,"_thresholds",void 0),e([ve()],$e.prototype,"_created",void 0),e([ve()],$e.prototype,"_busy",void 0),e([ve()],$e.prototype,"_error",void 0),e([ve()],$e.prototype,"_modalScenario",void 0),e([ve()],$e.prototype,"_modalEntityId",void 0),$e=e([he("shs-automations-page")],$e);const ke={ultimatesensor:{icon:"mdi:radar",category:"sensor",color:"#4361ee"},ultimatesensor_mini:{icon:"mdi:radar",category:"sensor",color:"#4361ee"},waterp1meterkit:{icon:"mdi:water-pump",category:"water",color:"#0096c7"},watermeterkit:{icon:"mdi:water-circle",category:"water",color:"#0096c7"},waterflowkit:{icon:"mdi:waves",category:"water",color:"#0096c7"},p1meterkit:{icon:"mdi:flash",category:"energy",color:"#f72585"},ceilsense:{icon:"mdi:ceiling-light",category:"sensor",color:"#7209b7"}};let ze=class extends de{constructor(){super(...arguments),this._devices=[],this._loading=!0,this._detailDevice=null,this._insights=null,this._showMeterForm=!1,this._meterInput="",this._detailTab="overview",this._toggleMeterForm=()=>{if(this._showMeterForm=!this._showMeterForm,this._showMeterForm){const e=this._insights?.water?.meter_total;this._meterInput=e>0?e.toFixed(3):""}}}connectedCallback(){super.connectedCallback(),this._loadDevices()}async _loadDevices(){this._loading=!0;try{const e=await this.hass.callWS({type:"smarthomeshop/devices"}),t=await Promise.all(e.devices.map(async e=>{try{const t=await this.hass.callWS({type:"smarthomeshop/device/entities",device_id:e.id});return{...e,entities:t.entities}}catch{return{...e,entities:[]}}}));this._devices=t}catch(e){console.error("Failed to load devices:",e)}this._loading=!1}_selectDevice(e){this.dispatchEvent(new CustomEvent("device-select",{detail:{deviceId:e.id}}))}_navigateTo(e){this.dispatchEvent(new CustomEvent("navigate",{detail:{page:e}}))}_openDetail(e){this._detailDevice=e,this._insights=null,this._detailTab="overview",this._fetchInsights(),this._insightsTimer=window.setInterval(()=>this._fetchInsights(),5e3)}_closeDetail(){this._detailDevice=null,this._insights=null,this._showMeterForm=!1,this._meterInput="",this._insightsTimer&&(clearInterval(this._insightsTimer),this._insightsTimer=void 0)}disconnectedCallback(){super.disconnectedCallback(),this._insightsTimer&&clearInterval(this._insightsTimer)}async _fetchInsights(){if(this._detailDevice)try{this._insights=await this.hass.callWS({type:"smarthomeshop/device/insights",device_id:this._detailDevice.id})}catch(e){console.error("Failed to load insights:",e)}}_meterInputValid(){const e=parseFloat(this._meterInput.replace(",","."));return!isNaN(e)&&e>=0}async _saveMeterReading(e){if(!e||!this._meterInputValid())return;const t=parseFloat(this._meterInput.replace(",","."));await this.hass.callService("number","set_value",{entity_id:e,value:t}),this._showMeterForm=!1,this._meterInput="",this._fetchInsights()}_fmtTime(e){if(!e)return"";try{return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}catch{return""}}_relativeTime(e){if(!e)return"";const t=Date.now()-new Date(e).getTime(),i=Math.floor(t/6e4);if(i<1)return"just now";if(i<60)return`${i} min ago`;const o=Math.floor(i/60);if(o<24)return`${o} hour${1===o?"":"s"} ago`;const s=Math.floor(o/24);return`${s} day${1===s?"":"s"} ago`}_statusClass(e){if(!e)return"";return["excellent","good","ideal"].includes(e)?"ok":["moderate","fair","elevated","cool","warm","fairly dry","fairly humid"].includes(e)?"warn":"unknown"===e?"":"alert"}_scoreClass(e){return e>=60?"bad":e>=30?"warn":""}_niceCeil(e){if(e<=0)return 1;const t=Math.pow(10,Math.floor(Math.log10(e))),i=e/t;return(i<=1?1:i<=2?2:i<=5?5:10)*t}_fmtChartValue(e,t,i){return"W"===t&&e>=1e3?`${(e/1e3).toFixed(1)} kW`:`${e.toFixed(i)} ${t}`}_renderLineChart(e,t,i,o,s=1){const n=Date.now()/1e3,r=[...e||[],[n,t]].filter(e=>n-e[0]<=1200);if(r.length<2)return U`<div class="spark-empty">Collecting data...</div>`;const a=600,l=this._niceCeil(Math.max(...r.map(e=>e[1]))),d=e=>(e-(n-1200))/1200*a,c=e=>104-e/l*98;let h=`M ${d(r[0][0]).toFixed(1)} ${c(r[0][1]).toFixed(1)}`;for(let e=1;e<r.length;e++){const t=d(r[e-1][0]),i=c(r[e-1][1]),o=d(r[e][0]),s=c(r[e][1]),n=((t+o)/2).toFixed(1);h+=` C ${n} ${i.toFixed(1)}, ${n} ${s.toFixed(1)}, ${o.toFixed(1)} ${s.toFixed(1)}`}const p=r[r.length-1],g=`${h} L ${d(p[0]).toFixed(1)} ${104..toFixed(1)} L 0 ${104..toFixed(1)} Z`,u=`chart-grad-${i.replace("#","")}`,v=[c(l),c(l/2)];return U`
      <div class="chart-wrap">
        <svg class="chart-svg" viewBox="0 0 ${a} ${110}" preserveAspectRatio="none">
          <defs>
            <linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${i}" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="${i}" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          <line x1="0" y1="${v[0]}" x2="${a}" y2="${v[0]}" stroke="rgba(148, 163, 184, 0.12)" stroke-width="1"/>
          <line x1="0" y1="${v[1]}" x2="${a}" y2="${v[1]}" stroke="rgba(148, 163, 184, 0.12)" stroke-width="1"/>
          <path d="${g}" fill="url(#${u})"/>
          <path d="${h}" fill="none" stroke="${i}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          <circle cx="${d(p[0])}" cy="${c(p[1])}" r="7" fill="${i}" opacity="0.18"/>
          <circle cx="${d(p[0])}" cy="${c(p[1])}" r="3.5" fill="${i}"/>
        </svg>
        <span class="chart-ylabel" style="top: 0;">${this._fmtChartValue(l,o,s)}</span>
        <span class="chart-ylabel" style="top: calc(50% - 8px);">${this._fmtChartValue(l/2,o,s)}</span>
        <div class="chart-axis">
          <span>20 min ago</span>
          <span>10 min ago</span>
          <span>now</span>
        </div>
      </div>
    `}_renderDetail(){const e=this._detailDevice,t=this._getProductConfig(e.product_type),i=this._insights,o=i?.water,s=i?.energy,n=o?.leak_score,r=o?.baseline,a=i?!1===i.online:!1===e.online,l=(i?i.last_seen:e.last_seen)||null;return U`
      <div class="detail-header">
        <button class="back-btn" @click=${this._closeDetail}>
          <ha-icon icon="mdi:arrow-left" style="--mdc-icon-size: 16px;"></ha-icon>
          Back
        </button>
        <div class="detail-title">
          <div class="detail-name">
            ${e.name}
            ${a?U`<span class="offline-badge" style="vertical-align: 2px; margin-left: 6px;">Offline</span>`:B}
          </div>
          <div class="detail-sub">
            ${e.product_name}${a&&l?U` · Last seen ${this._relativeTime(l)}`:B}
          </div>
        </div>
        <a class="shop-link" href="/config/devices/device/${e.id}">
          Open in Home Assistant
          <ha-icon icon="mdi:open-in-new"></ha-icon>
        </a>
      </div>

      ${i&&!1===i.configured?U`
        <div class="not-configured">
          This device is not linked to the SmartHomeShop integration yet.
          Add it via <b>Settings → Devices & Services → Add integration → SmartHomeShop.io</b> to unlock leak detection, costs and insights.
        </div>
      `:B}

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

      ${"automations"===this._detailTab?U`
        <shs-automations-page
          .hass=${this.hass}
          .deviceId=${e.id}
          .deviceName=${e.name}
          .productType=${e.product_type||""}
        ></shs-automations-page>
      `:"settings"===this._detailTab?U`
        <shs-settings-page .hass=${this.hass} .selectedDeviceId=${e.id} embedded></shs-settings-page>
      `:a?U`
        <div class="insight-card offline-detail-card">
          <ha-icon icon="mdi:lan-disconnect"></ha-icon>
          <div style="flex: 1; min-width: 0;">
            <div class="offline-detail-title">Device is offline</div>
            <div class="offline-detail-sub">
              Live insights resume automatically when it reconnects.
              ${l?U`Last seen ${this._relativeTime(l)}. `:B}
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
        `:B}
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
          `:B}
          ${null!=o.usage_vs_average?U`
            <div class="chip-card">
              <div class="chip-label">vs 7-day average</div>
              <div class="chip-value ${o.usage_vs_average>25?"warn":o.usage_vs_average<0?"good":""}">${o.usage_vs_average>0?"+":""}${o.usage_vs_average} <span class="unit">%</span></div>
            </div>
          `:B}
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
              ${n?.is_leak_likely?U`<span class="insight-badge alert">Possible leak</span>`:U`<span class="insight-badge ok">No leak</span>`}
            </div>
            ${n?U`
              ${[["Continuous flow",n.continuous_flow_score],["Night usage",n.night_usage_score],["Micro leak",n.micro_leak_score],["Pattern anomaly",n.pattern_anomaly_score]].map(([e,t])=>U`
                <div class="score-row">
                  <span class="score-label">${e}</span>
                  <div class="score-track"><div class="score-fill ${this._scoreClass(Number(t))}" style="width: ${Math.min(100,Number(t))}%"></div></div>
                  <span class="score-value">${Math.round(Number(t))}</span>
                </div>
              `)}
              <div class="score-row" style="margin-top: 10px;">
                <span class="score-label" style="font-weight: 600; color: var(--primary-text-color);">Total score</span>
                <div class="score-track"><div class="score-fill ${this._scoreClass(n.total_score)}" style="width: ${Math.min(100,n.total_score)}%"></div></div>
                <span class="score-value">${Math.round(n.total_score)}/100</span>
              </div>
              <div class="leak-footnote">
                Each signal scores 0–100: how strongly the current water usage matches that
                leak pattern. Occasional spikes are normal — the alarm only triggers when
                the total score stays above <b>60</b>.
              </div>
            `:U`<div class="spark-empty">No leak data yet</div>`}
          </div>

          <div class="insight-card">
            <div class="insight-title">
              Baseline learning
              ${r?.is_ready?U`<span class="insight-badge ok">Ready</span>`:U`<span class="insight-badge" style="background: rgba(67, 97, 238, 0.12); color: #4361ee;">Learning</span>`}
            </div>
            ${r?U`
              <div class="score-row">
                <span class="score-label">Days learned</span>
                <div class="score-track"><div class="score-fill" style="width: ${Math.min(100,r.learning_days/Math.max(1,r.min_days_required)*100)}%"></div></div>
                <span class="score-value">${r.learning_days}/${r.min_days_required}</span>
              </div>
              <div class="session-row"><ha-icon icon="mdi:water"></ha-icon><span class="session-name">Average daily usage</span><span class="session-meta">${Math.round(r.avg_daily_usage_liters??0)} L</span></div>
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
            `:B}
          </div>
          <div class="meter-reading-value">
            ${(o.meter_total??0).toFixed(3)} <span class="unit">m³</span>
          </div>
          ${o.meter_initial_entity?B:U`
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
                It is stored on the device itself and the meter keeps counting from there —
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
          `:B}
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
        `:B}
      `:B}

      ${s?U`
        <div class="section-heading"><ha-icon icon="mdi:flash" style="color: #f59e0b;"></ha-icon>Energy</div>
        <div class="chips-row">
          ${null!=s.power_w?U`
            <div class="chip-card">
              <div class="chip-label">Power now</div>
              <div class="chip-value">${Math.round(s.power_w)} <span class="unit">W</span></div>
            </div>
          `:B}
          ${null!=s.cost_today?U`
            <div class="chip-card">
              <div class="chip-label">Energy cost today</div>
              <div class="chip-value">€ ${s.cost_today.toFixed(2)}</div>
            </div>
          `:B}
          ${null!=s.cost_month?U`
            <div class="chip-card">
              <div class="chip-label">This month</div>
              <div class="chip-value">€ ${s.cost_month.toFixed(2)}</div>
            </div>
          `:B}
          ${null!=s.month_peak_kw?U`
            <div class="chip-card">
              <div class="chip-label">Month peak</div>
              <div class="chip-value">${s.month_peak_kw.toFixed(2)} <span class="unit">kW</span></div>
            </div>
          `:B}
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
              `:B}
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
              `:B}
            `:U`<div class="spark-empty">No phase data available</div>`}
          </div>
        </div>
      `:B}

      ${i?.flows?Object.entries(i.flows).map(([e,t],i)=>{const o=t.leak_score;return U`
          <div class="section-heading"><ha-icon icon="mdi:water" style="color: #0096c7;"></ha-icon>Water line ${i+1}</div>
          <div class="chips-row">
            <div class="chip-card">
              <div class="chip-label">Flow now</div>
              <div class="chip-value ${Number(t.flow_rate)>.2?"good":""}">${null!=t.flow_rate?Number(t.flow_rate).toFixed(1):"–"} <span class="unit">L/min</span></div>
            </div>
            ${null!=t.today_usage?U`
              <div class="chip-card">
                <div class="chip-label">Today</div>
                <div class="chip-value">${Math.round(t.today_usage)} <span class="unit">L</span></div>
              </div>
            `:B}
            <div class="chip-card">
              <div class="chip-label">Total</div>
              <div class="chip-value">${null!=t.total?Number(t.total).toFixed(2):"–"} <span class="unit">m³</span></div>
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
                  How strongly this line's usage matches a leak pattern right now —
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
                `:B}
              `:U`<div class="spark-empty">No baseline data yet</div>`}
            </div>
          </div>
        `}):B}

      ${i?.room?U`
        <div class="detail-grid">
          <div class="insight-card">
            <div class="insight-title">
              Room quality
              <span class="status-badge" style="background: ${i.room.color}22; color: ${i.room.color};">${i.room.label}</span>
            </div>
            <div class="room-score-big">
              <span class="room-score-num" style="color: ${i.room.color};">${Number(i.room.score).toFixed(1)}</span>
              <span class="session-meta">/ 10 · ${i.room.score_percentage}%</span>
            </div>
            ${(i.room.recommendations||[]).length>0?i.room.recommendations.map(e=>U`
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
            `:B}
          </div>
        </div>
      `:B}

      ${i?.radar?U`
        <div class="chips-row">
          ${void 0!==i.radar.presence?U`
            <div class="chip-card">
              <div class="chip-label">Presence</div>
              <div class="chip-value ${i.radar.presence?"good":""}">${i.radar.presence?"Detected":"Clear"}</div>
            </div>
          `:B}
          ${null!=i.radar.target_count?U`
            <div class="chip-card">
              <div class="chip-label">Targets</div>
              <div class="chip-value">${Math.round(i.radar.target_count)}</div>
            </div>
          `:B}
          ${null!=i.radar.people_count?U`
            <div class="chip-card">
              <div class="chip-label">People count</div>
              <div class="chip-value">${Math.round(i.radar.people_count)}</div>
            </div>
          `:B}
          ${i.radar.last_crossing&&"none"!==i.radar.last_crossing?U`
            <div class="chip-card">
              <div class="chip-label">Last crossing</div>
              <div class="chip-value ${"in"===i.radar.last_crossing?"good":""}">${"in"===i.radar.last_crossing?"In":"Out"}</div>
            </div>
          `:B}
        </div>

        ${(i.radar.zones||[]).length>0?U`
          <div class="insight-card">
            <div class="insight-title">Polygon zones</div>
            ${i.radar.zones.map(e=>U`
              <div class="metric-row">
                <span class="metric-label">Zone ${e.zone}</span>
                <span class="status-badge ${e.occupied?"ok":""}">${e.occupied?"Occupied":"Empty"}</span>
              </div>
            `)}
          </div>
        `:B}

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
      `:B}

      ${o||s||i?.room||i?.radar||i?.flows&&Object.keys(i.flows).length>0||!i||!1===i.configured?B:U`
        <div class="insight-card">
          <div class="insight-title">Live values</div>
          ${this._renderDeviceSensors(e)}
        </div>
      `}
      `}
    `}_getProductConfig(e){return ke[e||""]||{icon:"mdi:devices",category:"other",color:"#4361ee"}}_getSensorValue(e,t){if(!e)return null;const i=t.toLowerCase(),o=e.filter(e=>(e.entity_id.startsWith("sensor.")||e.entity_id.startsWith("binary_sensor."))&&!e.entity_id.includes("offset")&&!e.entity_id.includes("calibrat")),s=o.find(e=>e.entity_id.toLowerCase().endsWith(`_${i}`))||o.find(e=>e.entity_id.toLowerCase().includes(i));return s&&s.state&&"unavailable"!==s.state&&"unknown"!==s.state?s.state:null}_formatValue(e,t,i=1){if(null===e)return"—";const o=parseFloat(e);return isNaN(o)?e:`${o.toFixed(i)}${t}`}_renderDeviceSensors(e){const t=this._getProductConfig(e.product_type),i=e.entities||[];if("water"===t.category){const e=this._getSensorValue(i,"flow_rate")||this._getSensorValue(i,"flow"),t=this._getSensorValue(i,"total_consumption")||this._getSensorValue(i,"total"),o=this._getSensorValue(i,"daily");return U`
        <div class="sensor-grid">
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:water"></ha-icon>
            <span class="sensor-value">${this._formatValue(e," L/m")}</span>
            <div class="sensor-label">Flow</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:counter"></ha-icon>
            <span class="sensor-value">${this._formatValue(t," L",0)}</span>
            <div class="sensor-label">Total</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:calendar-today"></ha-icon>
            <span class="sensor-value">${this._formatValue(o," L",0)}</span>
            <div class="sensor-label">Today</div>
          </div>
        </div>
      `}if("sensor"===t.category){const t=this._getSensorValue(i,"temperature"),o=this._getSensorValue(i,"humidity"),s=this._getSensorValue(i,"co2"),n=this._getSensorValue(i,"illuminance")||this._getSensorValue(i,"lux"),r=this._getSensorValue(i,"presence")||this._getSensorValue(i,"occupancy"),a=[];t&&a.push({icon:"mdi:thermometer",value:this._formatValue(t,"°C"),label:"Temp"}),o&&a.push({icon:"mdi:water-percent",value:this._formatValue(o,"%",0),label:"Humidity"}),s&&a.push({icon:"mdi:molecule-co2",value:this._formatValue(s," ppm",0),label:"CO₂"}),n&&a.push({icon:"mdi:brightness-6",value:this._formatValue(n," lx",0),label:"Light"}),r&&a.push({icon:"mdi:motion-sensor",value:"on"===r?"Yes":"No",label:"Motion"});const l=a.slice(0,3);return 0===l.length?U`
          <div class="sensor-grid">
            <div class="sensor-item" style="grid-column: span 3;">
              <span class="sensor-value">${e.entity_count}</span>
              <div class="sensor-label">Entities</div>
            </div>
          </div>
        `:U`
        <div class="sensor-grid">
          ${l.map(e=>U`
            <div class="sensor-item">
              <ha-icon class="sensor-icon" icon="${e.icon}"></ha-icon>
              <span class="sensor-value">${e.value}</span>
              <div class="sensor-label">${e.label}</div>
            </div>
          `)}
        </div>
      `}if("energy"===t.category){const e=this._getSensorValue(i,"power"),t=this._getSensorValue(i,"energy")||this._getSensorValue(i,"total"),o=this._getSensorValue(i,"voltage");return U`
        <div class="sensor-grid">
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:flash"></ha-icon>
            <span class="sensor-value">${this._formatValue(e," W",0)}</span>
            <div class="sensor-label">Power</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:lightning-bolt"></ha-icon>
            <span class="sensor-value">${this._formatValue(t," kWh")}</span>
            <div class="sensor-label">Energy</div>
          </div>
          <div class="sensor-item">
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
                    <ha-icon icon="${t.icon}"></ha-icon>
                  </div>
                  <div class="device-info">
                    <h3 class="device-name">${e.name}</h3>
                    <div class="device-type">
                      <span class="device-type-badge ${t.category}">${t.category}</span>
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
                      `:B}
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
      </div>
    `}};ze.styles=r`
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
    }
  `,e([ue({attribute:!1})],ze.prototype,"hass",void 0),e([ue()],ze.prototype,"selectedDeviceId",void 0),e([ve()],ze.prototype,"_devices",void 0),e([ve()],ze.prototype,"_loading",void 0),e([ve()],ze.prototype,"_detailDevice",void 0),e([ve()],ze.prototype,"_insights",void 0),e([ve()],ze.prototype,"_showMeterForm",void 0),e([ve()],ze.prototype,"_meterInput",void 0),e([ve()],ze.prototype,"_detailTab",void 0),ze=e([he("shs-dashboard-page")],ze);const Pe=800,Me=400,De=[{id:"bed",name:"Bed",icon:"mdi:bed-double",defaultWidth:1600,defaultHeight:2e3},{id:"sofa",name:"Sofa",icon:"mdi:sofa",defaultWidth:2e3,defaultHeight:900},{id:"chair",name:"Chair",icon:"mdi:chair-rolling",defaultWidth:500,defaultHeight:500},{id:"table",name:"Table",icon:"mdi:table-furniture",defaultWidth:1200,defaultHeight:800},{id:"cabinet",name:"Cabinet",icon:"mdi:wardrobe",defaultWidth:1e3,defaultHeight:600}],Se={detection:4,exclusion:2,entry:2},Ie={detection:{fill:"rgba(34, 197, 94, 0.2)",stroke:"#22c55e"},exclusion:{fill:"rgba(239, 68, 68, 0.2)",stroke:"#ef4444"},entry:{fill:"rgba(16, 185, 129, 0.25)",stroke:"#10b981"}},Te={detection:{singular:"Detection",plural:"Detection",icon:"📍"},exclusion:{singular:"Exclusion",plural:"Exclusion",icon:"🚷"},entry:{singular:"Entry Line",plural:"Entry Lines",icon:"🚪"}};let Ce=class extends de{constructor(){super(...arguments),this.rooms=[],this._selectedRoomId=null,this._roomPoints=[],this._furniture=[],this._doors=[],this._windows=[],this._sensors=[],this._selectedSensorIndex=null,this._draggingSensorIndex=null,this._zones=[],this._selectedZoneIndex=null,this._drawingZone=[],this._newZoneType="detection",this._showZoneTypePicker=!1,this._pendingZonePoints=[],this._draggingZonePointIndex=null,this._draggingDrawingPointIndex=null,this._draggingWholeZoneIndex=null,this._dragStartPos=null,this._zoneMidpointPreview=null,this._editingZoneIndex=null,this._liveTargets={},this._entryExitEnabled=!1,this._assumedPresent=!1,this._pushingToSensor=!1,this._toolMode="select",this._zoom=1,this._panOffset={x:0,y:0},this._cursorPos=null,this._saving=!1,this._isDragging=!1,this._dirty=!1,this._designMode="layout",this._pendingStart=null,this._previewPoint=null,this._wallHoverPreview=null,this._draggingPointIndex=null,this._selectedFurnitureType=null,this._showFurnitureDialog=!1,this._furnitureWidth=1e3,this._furnitureHeight=1e3,this._selectedFurnitureIndex=null,this._draggingFurnitureIndex=null,this._draggingDoorIndex=null,this._draggingWindowIndex=null,this._doorWindowPreview=null,this._showDoorDialog=!1,this._showWindowDialog=!1,this._editingDoorIndex=null,this._editingWindowIndex=null,this._selectedWallIndex=null,this._doorWidth=900,this._doorOpenDirection="inward",this._doorOpenSide="left",this._windowWidth=1200,this._windowHeight=1e3,this._windowType="open",this._showNewRoomDialog=!1,this._newRoomName="",this._newRoomWidth=0,this._newRoomLength=0,this._targetTrails={},this._targetUpdateInterval=null,this._viewMode="2d",this._camera3d={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3},this._isDragging3D=!1,this._lastMouseX=0,this._lastMouseY=0,this.WALL_HEIGHT_3D=2500,this._handleKeyDown=e=>{const t=e.composedPath()[0];if(!t||!["INPUT","SELECT","TEXTAREA"].includes(t.tagName))if("Escape"===e.key){if(this._showZoneTypePicker)return void this._cancelZoneTypePicker();if(this._showDoorDialog)return void this._hideDoorDialog();if(this._showWindowDialog)return void this._hideWindowDialog();if(this._showFurnitureDialog)return void(this._showFurnitureDialog=!1);if(this._showNewRoomDialog)return void(this._showNewRoomDialog=!1);if(this._drawingZone.length>0)return void(this._drawingZone=[]);if(this._pendingStart)return this._pendingStart=null,void(this._previewPoint=null);this._selectedZoneIndex=null,this._editingZoneIndex=null,this._selectedFurnitureIndex=null,this._selectedFurnitureType=null}else"Delete"!==e.key&&"Backspace"!==e.key||null===this._selectedFurnitureIndex?"Delete"!==e.key&&"Backspace"!==e.key||null===this._selectedZoneIndex?(e.metaKey||e.ctrlKey)&&"z"===e.key.toLowerCase()&&this._drawingZone.length>0?(e.preventDefault(),this._drawingZone=this._drawingZone.slice(0,-1)):(e.metaKey||e.ctrlKey)&&"z"===e.key.toLowerCase()&&"walls"===this._toolMode?(e.preventDefault(),this._undoLastWallPoint()):"r"===e.key.toLowerCase()&&null!==this._selectedFurnitureIndex&&this._rotateFurniture(this._selectedFurnitureIndex):(e.preventDefault(),this._deleteZone(this._selectedZoneIndex)):(e.preventDefault(),this._deleteFurniture(this._selectedFurnitureIndex))},this._pushingToESPHome=!1}connectedCallback(){super.connectedCallback(),this._loadRooms(),this._startTargetUpdates(),window.addEventListener("keydown",this._handleKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this._stopTargetUpdates(),window.removeEventListener("keydown",this._handleKeyDown)}_markDirty(){this._dirty=!0}get _selectedSensor(){return null!==this._selectedSensorIndex?this._sensors[this._selectedSensorIndex]??null:null}_sensorLabel(e,t){return e.deviceId?e.deviceId.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase()):`Sensor ${t+1}`}_sensorColor(e){const t=["#3b82f6","#a855f7","#f59e0b","#14b8a6"];return t[e%t.length]}_updateSensor(e,t){this._sensors=this._sensors.map((i,o)=>o===e?{...i,...t}:i),this._markDirty()}_addSensor(){let e=0,t=0;this._roomPoints.length>=3&&(e=this._roomPoints.reduce((e,t)=>e+t.x,0)/this._roomPoints.length,t=this._roomPoints.reduce((e,t)=>e+t.y,0)/this._roomPoints.length);const i={id:`sensor_${Date.now()}`,deviceId:null,x:100*Math.round(e/100),y:100*Math.round(t/100),rotation:0,range:6e3,fov:120,heightMm:1500};this._sensors=[...this._sensors,i],this._selectedSensorIndex=this._sensors.length-1,this._toolMode="sensor",this._markDirty()}_removeSensor(e){const t=this._sensors[e];if(this._sensors=this._sensors.filter((t,i)=>i!==e),t){delete this._targetTrails[t.id];const e={...this._liveTargets};delete e[t.id],this._liveTargets=e,this._zones=this._zones.map(e=>e.sensorId===t.id?{...e,sensorId:void 0}:e)}this._selectedSensorIndex=this._sensors.length>0?0:null,this._markDirty()}_setDesignMode(e){this._designMode!==e&&(this._designMode=e,this._toolMode="select",this._resetTransientState())}_setToolMode(e){this._toolMode=e,this._resetTransientState()}_resetTransientState(){this._pendingStart=null,this._previewPoint=null,this._wallHoverPreview=null,this._doorWindowPreview=null,this._selectedFurnitureType=null,this._selectedFurnitureIndex=null,this._drawingZone=[],this._zoneMidpointPreview=null}_undoLastWallPoint(){this._roomPoints.length>0&&(this._roomPoints=this._roomPoints.slice(0,-1),this._pendingStart=this._roomPoints.length>0?this._roomPoints[this._roomPoints.length-1]:null,this._markDirty())}_clearWalls(){confirm("Clear all walls of this room?")&&(this._roomPoints=[],this._pendingStart=null,this._previewPoint=null,this._markDirty())}_addPointOnWall(e,t,i=!1){if(e>=this._roomPoints.length)return;const o=this._roomPoints[e],s=this._roomPoints[(e+1)%this._roomPoints.length],n=this._snapToGrid({x:o.x+(s.x-o.x)*t,y:o.y+(s.y-o.y)*t}),r=[...this._roomPoints];r.splice(e+1,0,n),this._roomPoints=r,this._markDirty(),i&&(this._draggingPointIndex=e+1),this._wallHoverPreview=null}_deleteWallPoint(e){this._roomPoints.length<=3||(this._roomPoints=this._roomPoints.filter((t,i)=>i!==e),this._draggingPointIndex=null,this._markDirty())}_findNearestWall(e){if(this._roomPoints.length<3)return null;let t=-1,i=1/0,o=0;for(let s=0;s<this._roomPoints.length;s++){const n=this._roomPoints[s],r=this._roomPoints[(s+1)%this._roomPoints.length],a=r.x-n.x,l=r.y-n.y,d=Math.hypot(a,l);if(0===d)continue;const c=Math.max(.05,Math.min(.95,((e.x-n.x)*a+(e.y-n.y)*l)/(d*d))),h=n.x+c*a,p=n.y+c*l,g=Math.hypot(e.x-h,e.y-p);g<i&&(i=g,t=s,o=c)}return t>=0?{wallIndex:t,position:o,distance:i}:null}_calculateArea(){if(this._roomPoints.length<3)return 0;let e=0;for(let t=0;t<this._roomPoints.length;t++){const i=(t+1)%this._roomPoints.length;e+=this._roomPoints[t].x*this._roomPoints[i].y,e-=this._roomPoints[i].x*this._roomPoints[t].y}return Math.abs(e/2)/1e6}_placeFurniture(){this._selectedFurnitureType&&this._pendingStart&&(this._furniture=[...this._furniture,{id:`furniture_${Date.now()}`,type:this._selectedFurnitureType.id,name:this._selectedFurnitureType.name,x:this._pendingStart.x,y:this._pendingStart.y,width:this._furnitureWidth,height:this._furnitureHeight,rotation:0}],this._markDirty(),this._showFurnitureDialog=!1,this._pendingStart=null)}_deleteFurniture(e){this._furniture=this._furniture.filter((t,i)=>i!==e),this._selectedFurnitureIndex=null,this._markDirty()}_rotateFurniture(e){this._furniture=this._furniture.map((t,i)=>i===e?{...t,rotation:((t.rotation||0)+90)%360}:t),this._markDirty()}_updateSelectedFurniture(e){null!==this._selectedFurnitureIndex&&(this._furniture=this._furniture.map((t,i)=>i===this._selectedFurnitureIndex?{...t,...e}:t),this._markDirty())}_addDoor(){null!==this._selectedWallIndex&&this._pendingStart&&(this._doors=[...this._doors,{id:"door_"+Date.now(),wallIndex:this._selectedWallIndex,position:this._pendingStart.x,width:this._doorWidth,openDirection:this._doorOpenDirection,openSide:this._doorOpenSide}],this._markDirty(),this._hideDoorDialog())}_hideDoorDialog(){this._showDoorDialog=!1,this._selectedWallIndex=null,this._pendingStart=null,this._editingDoorIndex=null}_deleteDoor(e){this._doors=this._doors.filter((t,i)=>i!==e),this._markDirty()}_editDoor(e){const t=this._doors[e];t&&(this._editingDoorIndex=e,this._doorWidth=t.width,this._doorOpenDirection=t.openDirection,this._doorOpenSide=t.openSide,this._showDoorDialog=!0)}_saveDoorEdit(){null!==this._editingDoorIndex&&(this._doors=this._doors.map((e,t)=>t===this._editingDoorIndex?{...e,width:this._doorWidth,openDirection:this._doorOpenDirection,openSide:this._doorOpenSide}:e),this._markDirty(),this._editingDoorIndex=null,this._showDoorDialog=!1)}_addWindow(){null!==this._selectedWallIndex&&this._pendingStart&&(this._windows=[...this._windows,{id:"window_"+Date.now(),wallIndex:this._selectedWallIndex,position:this._pendingStart.x,width:this._windowWidth,height:this._windowHeight,windowType:this._windowType}],this._markDirty(),this._hideWindowDialog())}_hideWindowDialog(){this._showWindowDialog=!1,this._selectedWallIndex=null,this._pendingStart=null,this._editingWindowIndex=null}_deleteWindow(e){this._windows=this._windows.filter((t,i)=>i!==e),this._markDirty()}_editWindow(e){const t=this._windows[e];t&&(this._editingWindowIndex=e,this._windowWidth=t.width,this._windowHeight=t.height,this._windowType=t.windowType,this._showWindowDialog=!0)}_saveWindowEdit(){null!==this._editingWindowIndex&&(this._windows=this._windows.map((e,t)=>t===this._editingWindowIndex?{...e,width:this._windowWidth,height:this._windowHeight,windowType:this._windowType}:e),this._markDirty(),this._editingWindowIndex=null,this._showWindowDialog=!1)}async _createNewRoom(){if(!this._newRoomName.trim())return;let e=[];if(this._newRoomWidth>0&&this._newRoomLength>0){const t=10*this._newRoomWidth/2,i=10*this._newRoomLength/2;e=[{x1:-t,y1:-i,x2:t,y2:-i},{x1:t,y1:-i,x2:t,y2:i},{x1:t,y1:i,x2:-t,y2:i},{x1:-t,y1:i,x2:-t,y2:-i}]}const t={id:"room_"+Date.now(),name:this._newRoomName.trim(),walls:e,furniture:[],devices:[],zones:[]};try{await this.hass.callWS({type:"smarthomeshop/room/save",room:t}),this.rooms=[...this.rooms,t],this._selectRoom(t.id),this._showNewRoomDialog=!1}catch(e){console.error("Failed to create room:",e)}}_startTargetUpdates(){this._stopTargetUpdates(),this._targetUpdateInterval=window.setInterval(()=>this._updateTargets(),200)}_stopTargetUpdates(){this._targetUpdateInterval&&(clearInterval(this._targetUpdateInterval),this._targetUpdateInterval=null)}_updateTargets(){if(!this.hass)return;let e=!1;const t={};for(const i of this._sensors){if(!i.deviceId)continue;const o=[];let s=this._targetTrails[i.id];s||(s=[[],[],[]],this._targetTrails[i.id]=s);for(let e=1;e<=3;e++){const t=this.hass.states[`sensor.${i.deviceId}_target_${e}_x`],n=this.hass.states[`sensor.${i.deviceId}_target_${e}_y`];if(!t||!n)continue;const r=parseFloat(t.state)||0,a=parseFloat(n.state)||0,l=0!==r||0!==a;o.push({x:r,y:a,active:l});const d=s[e-1];if(l){const e=d[d.length-1];(!e||Math.hypot(r-e.x,a-e.y)>30)&&(d.push({x:r,y:a}),d.length>60&&d.shift())}else d.length>0&&(s[e-1]=[])}t[i.id]=o,JSON.stringify(o)!==JSON.stringify(this._liveTargets[i.id]||[])&&(e=!0)}(e||Object.keys(t).length!==Object.keys(this._liveTargets).length)&&(this._liveTargets=t,this._updateTargetCirclesInDOM())}_getRadarDevices(){if(!this.hass)return[];const e=[],t=new Set;return Object.keys(this.hass.states).forEach(i=>{const o=i.match(/^sensor\.(.+)_target_1_x$/);if(o){const i=o[1];if(!t.has(i)){t.add(i);const o=i.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase());e.push({id:i,name:o})}}}),e}async _loadRooms(){try{const e=await this.hass.callWS({type:"smarthomeshop/rooms"});this.rooms=e.rooms||[],this.rooms.length>0&&!this._selectedRoomId&&this._selectRoom(this.rooms[0].id)}catch(e){console.error("Failed to load rooms:",e)}}_selectRoom(e){if(this._dirty&&this._selectedRoomId&&e!==this._selectedRoomId&&!confirm("You have unsaved changes. Discard them?"))return;this._dirty=!1,this._targetTrails={},this._liveTargets={},this._selectedRoomId=e;const t=this.rooms.find(t=>t.id===e);if(t){this._roomPoints=t.walls?.length>0?t.walls.map(e=>({x:e.x1,y:e.y1})):[],this._furniture=(t.furniture||[]).map(e=>({id:e.id,type:e.typeId||e.type||"unknown",name:e.name||"Furniture",x:e.x,y:e.y,width:e.width,height:e.height||e.depth||e.width,rotation:e.rotationDeg??e.rotation??0})),this._doors=t.doors||[],this._windows=t.windows||[];const e=t.sensors,i=t.sensor;e&&e.length>0?this._sensors=e.map((e,t)=>({id:e.id||`sensor_${t+1}`,deviceId:e.deviceId??null,x:e.x,y:e.y,rotation:e.rotation??0,range:e.range??6e3,fov:e.fov??120,heightMm:e.heightMm??2e3})):this._sensors=i?[{id:"sensor_1",deviceId:i.deviceId??null,x:i.x,y:i.y,rotation:i.rotation??0,range:i.range??6e3,fov:i.fov??120,heightMm:i.heightMm??2e3}]:[],this._selectedSensorIndex=this._sensors.length>0?0:null,this._zones=t.zones||[],this._autoZoom()}this._toolMode="select",this._selectedZoneIndex=null,this._drawingZone=[]}async _saveRoom(){if(!this._selectedRoomId)return;const e=this.rooms.find(e=>e.id===this._selectedRoomId);if(!e)return;this._saving=!0;const t=this._sensors[0],i=t?{x:t.x,y:t.y,rotation:t.rotation,range:t.range,fov:t.fov,deviceId:t.deviceId}:null;try{const t=this._roomPoints.map((e,t)=>{const i=this._roomPoints[(t+1)%this._roomPoints.length];return{x1:e.x,y1:e.y,x2:i.x,y2:i.y}}),o=this._furniture.map(e=>({id:e.id,typeId:e.type,x:e.x,y:e.y,width:e.width,height:e.height,rotationDeg:e.rotation})),s={...e,walls:t,furniture:o,doors:this._doors,windows:this._windows,sensor:i,sensors:this._sensors,zones:this._zones};await this.hass.callWS({type:"smarthomeshop/room/save",room:s}),this.rooms=this.rooms.map(e=>e.id===this._selectedRoomId?s:e),this._dirty=!1}catch(e){console.error("Failed to save room:",e)}finally{this._saving=!1}}async _pushToESPHome(){const e=this._sensors.filter(e=>e.deviceId);if(0===e.length)return void alert("Add a sensor and link it to a device first!");this._pushingToESPHome=!0;const t=this._zones.filter(e=>"detection"===e.type),i=this._zones.filter(e=>"exclusion"===e.type),o=this._zones.filter(e=>"entry"===e.type),s=e[0].id,n=[];try{for(const r of e){const e=r.deviceId,a=(r.rotation-90)*Math.PI/180,l=e=>{const t=e.x-r.x,i=e.y-r.y;return{x:-t*Math.sin(a)+i*Math.cos(a),y:t*Math.cos(a)+i*Math.sin(a)}},d=e=>e.map(e=>{const t=l(e);return`${Math.round(t.x)}:${Math.round(t.y)}`}).join(";");for(let i=0;i<4;i++){const o=t[i];try{await this.hass.callService("esphome",`${e}_set_polygon_zone`,{zone_id:i+1,polygon:o?d(o.points):""})}catch(t){n.push(`${e}: set_polygon_zone not available`);break}}for(let t=0;t<2;t++){const o=i[t];try{await this.hass.callService("esphome",`${e}_set_polygon_exclusion`,{zone_id:t+1,polygon:o?d(o.points):""})}catch(t){n.push(`${e}: set_polygon_exclusion not available`);break}}const c=o.filter(e=>(e.sensorId||s)===r.id);for(let t=0;t<2;t++){const i=c[t];let o="";if(i&&2===i.points.length){const e=i.inDirection||"left",t=l(i.points[0]),s=l(i.points[1]);o=`${Math.round(t.x)}:${Math.round(t.y)};${Math.round(s.x)}:${Math.round(s.y)};${e}`}try{await this.hass.callService("esphome",`${e}_set_entry_line`,{line_id:t+1,line_data:o})}catch(t){n.push(`${e}: set_entry_line not available`);break}}}n.length>0?alert(`Push finished with warnings:\n${[...new Set(n)].join("\n")}`):alert(`Zones successfully pushed to ${e.length} sensor${1!==e.length?"s":""}!`)}catch(e){console.error("Failed to push to ESPHome:",e),alert(`Failed to push zones: ${e}`)}finally{this._pushingToESPHome=!1}}_autoZoom(){if(this._roomPoints.length<3)return this._zoom=1,void(this._panOffset={x:0,y:0});const e=this._roomPoints.map(e=>e.x),t=this._roomPoints.map(e=>e.y),i=Math.min(...e),o=Math.max(...e),s=Math.min(...t),n=Math.max(...t),r=o-i,a=n-s;this._zoom=Math.min(8500/Math.max(r,a),3);const l=(i+o)/2,d=(s+n)/2;this._panOffset={x:.08*-l*this._zoom,y:.08*-d*this._zoom}}_toCanvas(e){return{x:Me+e.x*Pe/1e4*this._zoom+this._panOffset.x,y:Me+e.y*Pe/1e4*this._zoom+this._panOffset.y}}_fromCanvas(e,t){return{x:(e-Me-this._panOffset.x)/this._zoom*1e4/Pe,y:(t-Me-this._panOffset.y)/this._zoom*1e4/Pe}}_getSvgPoint(e){if(!this._svg)return null;const t=this._svg.createSVGPoint();t.x=e.clientX,t.y=e.clientY;const i=this._svg.getScreenCTM();if(!i)return null;const o=t.matrixTransform(i.inverse());return{x:o.x,y:o.y}}_snapToGrid(e){const t=100;return{x:Math.round(e.x/t)*t,y:Math.round(e.y/t)*t}}_isPointInRoom(e){if(this._roomPoints.length<3)return!0;let t=!1;const i=this._roomPoints.length;for(let o=0,s=i-1;o<i;s=o++){const i=this._roomPoints[o].x,n=this._roomPoints[o].y,r=this._roomPoints[s].x,a=this._roomPoints[s].y;n>e.y!=a>e.y&&e.x<(r-i)*(e.y-n)/(a-n)+i&&(t=!t)}return t}_handleCanvasClick(e){if(0!==e.button)return;const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if("sensor"===this._toolMode&&null!==this._selectedSensorIndex){const e=this._snapToGrid(i);return void(this._isPointInRoom(e)&&this._updateSensor(this._selectedSensorIndex,{x:e.x,y:e.y}))}if("furniture"===this._toolMode&&this._selectedFurnitureType)return this._furnitureWidth=this._selectedFurnitureType.defaultWidth,this._furnitureHeight=this._selectedFurnitureType.defaultHeight,this._pendingStart=this._snapToGrid(i),void(this._showFurnitureDialog=!0);if("door"!==this._toolMode&&"window"!==this._toolMode){if("walls"===this._toolMode){const e=this._snapToGrid(i);if(this._roomPoints.length>=3)return;if(!this._pendingStart)return void(this._pendingStart=e);const t=this._roomPoints[0];return t&&this._roomPoints.length>=2&&Math.hypot(e.x-t.x,e.y-t.y)<250?(this._pendingStart=null,void(this._previewPoint=null)):(0===this._roomPoints.length?this._roomPoints=[this._pendingStart,e]:this._roomPoints=[...this._roomPoints,e],this._pendingStart=e,void this._markDirty())}if("zone"===this._toolMode){const e=this._snapToGrid(i);if(this._zoneMidpointPreview){if(-1===this._zoneMidpointPreview.zoneIndex){const e=[...this._drawingZone];e.splice(this._zoneMidpointPreview.segmentIndex+1,0,this._zoneMidpointPreview.point),this._drawingZone=e}else if(null!==this._selectedZoneIndex){const e=this._zones[this._selectedZoneIndex];if("entry"!==e.type){const t=[...e.points];t.splice(this._zoneMidpointPreview.segmentIndex+1,0,this._zoneMidpointPreview.point),this._zones=this._zones.map((e,i)=>i===this._selectedZoneIndex?{...e,points:t}:e),this._markDirty()}}return void(this._zoneMidpointPreview=null)}if(0===this._drawingZone.length)return void(this._drawingZone=[e]);if(1===this._drawingZone.length)return this._drawingZone=[...this._drawingZone,e],this._pendingZonePoints=[...this._drawingZone],this._showZoneTypePicker=!0,void(this._drawingZone=[]);if(this._drawingZone.length>=3){const t=this._drawingZone[0];if(Math.hypot(e.x-t.x,e.y-t.y)<250)return this._pendingZonePoints=[...this._drawingZone],this._drawingZone=[],void(this._showZoneTypePicker=!0)}this._drawingZone=[...this._drawingZone,e]}}}_handleContextMenu(e){e.preventDefault(),e.stopPropagation();const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if("layout"===this._designMode&&("walls"===this._toolMode||"select"===this._toolMode)){const e=this._roomPoints.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==e)return void this._deleteWallPoint(e)}if(this._drawingZone.length>0){const e=this._drawingZone.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==e)return void(this._drawingZone=this._drawingZone.filter((t,i)=>i!==e))}if(null!==this._selectedZoneIndex){const e=this._zones[this._selectedZoneIndex],t=e.points.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==t&&e.points.length>3){const i=e.points.filter((e,i)=>i!==t);this._zones=this._zones.map((e,t)=>t===this._selectedZoneIndex?{...e,points:i}:e),this._markDirty()}}}_handleCanvasMove(e){const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if(this._cursorPos=i,null!==this._draggingSensorIndex){const e=this._snapToGrid(i);return void(this._isPointInRoom(e)&&this._updateSensor(this._draggingSensorIndex,{x:e.x,y:e.y}))}if(null!==this._draggingFurnitureIndex){const e=this._snapToGrid(i);return this._furniture=this._furniture.map((t,i)=>i===this._draggingFurnitureIndex?{...t,x:e.x,y:e.y}:t),void this._markDirty()}if(null!==this._draggingPointIndex){const e=this._snapToGrid(i);return this._roomPoints=this._roomPoints.map((t,i)=>i===this._draggingPointIndex?e:t),void this._markDirty()}if(null!==this._draggingDoorIndex){const e=this._doors[this._draggingDoorIndex];if(e&&e.wallIndex<this._roomPoints.length){const t=this._roomPoints[e.wallIndex],o=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],s=o.x-t.x,n=o.y-t.y,r=Math.hypot(s,n);if(r>0){const e=Math.max(.05,Math.min(.95,((i.x-t.x)*s+(i.y-t.y)*n)/(r*r)));this._doors=this._doors.map((t,i)=>i===this._draggingDoorIndex?{...t,position:e}:t),this._markDirty()}}return}if(null!==this._draggingWindowIndex){const e=this._windows[this._draggingWindowIndex];if(e&&e.wallIndex<this._roomPoints.length){const t=this._roomPoints[e.wallIndex],o=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],s=o.x-t.x,n=o.y-t.y,r=Math.hypot(s,n);if(r>0){const e=Math.max(.05,Math.min(.95,((i.x-t.x)*s+(i.y-t.y)*n)/(r*r)));this._windows=this._windows.map((t,i)=>i===this._draggingWindowIndex?{...t,position:e}:t),this._markDirty()}}return}if("walls"===this._toolMode&&this._pendingStart&&(this._previewPoint=this._snapToGrid(i)),"layout"===this._designMode&&("walls"===this._toolMode||"select"===this._toolMode)&&this._roomPoints.length>=3){const e=this._findNearestWall(i);if(e&&e.distance<400){const t=this._roomPoints[e.wallIndex],i=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length];this._wallHoverPreview={wallIndex:e.wallIndex,position:.5,point:{x:t.x+.5*(i.x-t.x),y:t.y+.5*(i.y-t.y)}}}else this._wallHoverPreview=null}else this._wallHoverPreview=null;if(("door"===this._toolMode||"window"===this._toolMode)&&this._roomPoints.length>=3){const e=this._findNearestWall(i);if(e){const t=this._roomPoints[e.wallIndex],i=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length];this._doorWindowPreview={wallIndex:e.wallIndex,position:e.position,point:{x:t.x+(i.x-t.x)*e.position,y:t.y+(i.y-t.y)*e.position},type:this._toolMode}}else this._doorWindowPreview=null}else this._doorWindowPreview=null;if(null!==this._draggingZonePointIndex&&null!==this._selectedZoneIndex){const e=this._snapToGrid(i),t=[...this._zones[this._selectedZoneIndex].points];return t[this._draggingZonePointIndex]=e,this._zones=this._zones.map((e,i)=>i===this._selectedZoneIndex?{...e,points:t}:e),void this._markDirty()}if(null!==this._draggingWholeZoneIndex&&this._dragStartPos){const e=i.x-this._dragStartPos.x,t=i.y-this._dragStartPos.y,o=this._zones[this._draggingWholeZoneIndex].points.map(i=>({x:i.x+e,y:i.y+t}));return this._zones=this._zones.map((e,t)=>t===this._draggingWholeZoneIndex?{...e,points:o}:e),this._dragStartPos=i,void this._markDirty()}if(null!==this._draggingDrawingPointIndex){const e=this._snapToGrid(i),t=[...this._drawingZone];return t[this._draggingDrawingPointIndex]=e,void(this._drawingZone=t)}if(this._zoneMidpointPreview=null,"zone"===this._toolMode&&this._drawingZone.length>=2)for(let e=0;e<this._drawingZone.length-1;e++){const t=this._drawingZone[e],o=this._drawingZone[e+1],s=(t.x+o.x)/2,n=(t.y+o.y)/2;if(Math.hypot(i.x-s,i.y-n)<200){this._zoneMidpointPreview={zoneIndex:-1,segmentIndex:e,point:{x:s,y:n}};break}}if("zone"===this._toolMode&&null!==this._selectedZoneIndex&&0===this._drawingZone.length&&!this._zoneMidpointPreview){const e=this._zones[this._selectedZoneIndex];for(let t=0;t<e.points.length;t++){const o=e.points[t],s=e.points[(t+1)%e.points.length],n=(o.x+s.x)/2,r=(o.y+s.y)/2;if(Math.hypot(i.x-n,i.y-r)<200){this._zoneMidpointPreview={zoneIndex:this._selectedZoneIndex,segmentIndex:t,point:{x:n,y:r}};break}}}this._isDragging&&(this._panOffset={x:this._panOffset.x+e.movementX,y:this._panOffset.y+e.movementY})}_handleCanvasDown(e){if(1===e.button||0===e.button&&e.altKey)return void(this._isDragging=!0);if(0!==e.button)return;const t=this._getSvgPoint(e);if(!t)return;const i=this._fromCanvas(t.x,t.y);if("layout"===this._designMode&&("walls"===this._toolMode||"select"===this._toolMode)){const e=this._roomPoints.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==e)return void(this._draggingPointIndex=e)}for(let e=0;e<this._sensors.length;e++){const t=this._sensors[e];if(Math.hypot(i.x-t.x,i.y-t.y)<200)return this._selectedSensorIndex=e,void(this._draggingSensorIndex=e)}if(this._drawingZone.length>0){const e=this._drawingZone.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==e)return void(this._draggingDrawingPointIndex=e)}if(null!==this._selectedZoneIndex&&"zone"===this._toolMode){const e=this._zones[this._selectedZoneIndex],t=e.points.findIndex(e=>Math.hypot(e.x-i.x,e.y-i.y)<200);if(-1!==t)return void(this._draggingZonePointIndex=t);if("entry"===e.type&&2===e.points.length){const t=e.points[0],o=e.points[1],s=o.x-t.x,n=o.y-t.y,r=s*s+n*n;if(r>0){const e=Math.max(0,Math.min(1,((i.x-t.x)*s+(i.y-t.y)*n)/r)),o=t.x+e*s,a=t.y+e*n;if(Math.hypot(i.x-o,i.y-a)<200)return this._draggingWholeZoneIndex=this._selectedZoneIndex,void(this._dragStartPos=i)}}if(e.points.length>=3&&this._isPointInZone(i,e.points))return this._draggingWholeZoneIndex=this._selectedZoneIndex,void(this._dragStartPos=i)}}_isPointInZone(e,t){if(t.length<3)return!1;let i=!1;for(let o=0,s=t.length-1;o<t.length;s=o++){const n=t[o].x,r=t[o].y,a=t[s].x,l=t[s].y;r>e.y!=l>e.y&&e.x<(a-n)*(e.y-r)/(l-r)+n&&(i=!i)}return i}_handleCanvasUp(){this._isDragging=!1,this._draggingSensorIndex=null,this._draggingFurnitureIndex=null,this._draggingPointIndex=null,this._draggingDoorIndex=null,this._draggingWindowIndex=null,this._draggingZonePointIndex=null,this._draggingDrawingPointIndex=null,this._draggingWholeZoneIndex=null,this._dragStartPos=null}_handleWheel(e){e.preventDefault();const t=e.deltaY>0?.9:1.1,i=Math.max(.2,Math.min(5,this._zoom*t)),o=this._getSvgPoint(e);if(o){const e=this._fromCanvas(o.x,o.y),t=.08;this._panOffset={x:o.x-Me-e.x*t*i,y:o.y-Me-e.y*t*i}}this._zoom=i}_deleteZone(e){this._zones=this._zones.filter((t,i)=>i!==e),this._markDirty(),this._selectedZoneIndex===e&&(this._selectedZoneIndex=null),this._editingZoneIndex===e&&(this._editingZoneIndex=null)}_updateZoneName(e,t){this._zones=this._zones.map((i,o)=>o===e?{...i,name:t}:i),this._markDirty()}_updateZoneType(e,t){this._zones=this._zones.map((i,o)=>o===e?{...i,type:t}:i),this._markDirty()}_getZoneCountByType(e){return this._zones.filter(t=>t.type===e).length}_canAddZone(e){return this._getZoneCountByType(e)<Se[e]}_startDrawingZone(e){this._canAddZone(e)&&(this._newZoneType=e,this._drawingZone=[],this._toolMode="zone",this._selectedZoneIndex=null)}_startDrawingAnyZone(){const e=["detection","exclusion","entry"].some(e=>this._canAddZone(e));e&&(this._drawingZone=[],this._toolMode="zone",this._selectedZoneIndex=null)}_selectZoneType(e){if(!this._canAddZone(e))return;if("entry"===e){if(2!==this._pendingZonePoints.length)return;const t=this._zones.filter(t=>t.type===e).length+1;return this._zones=[...this._zones,{id:Date.now(),points:[...this._pendingZonePoints],type:e,name:`Entry Line ${t}`,inDirection:"left"}],this._showZoneTypePicker=!1,this._pendingZonePoints=[],this._markDirty(),this._selectedZoneIndex=this._zones.length-1,void(this._editingZoneIndex=this._zones.length-1)}if(this._pendingZonePoints.length<3)return;const t=this._zones.filter(t=>t.type===e).length+1,i=Te[e];this._zones=[...this._zones,{id:Date.now(),points:[...this._pendingZonePoints],type:e,name:`${i.singular} Zone ${t}`}],this._showZoneTypePicker=!1,this._pendingZonePoints=[],this._markDirty()}_continueDrawingPolygon(){this._drawingZone=[...this._pendingZonePoints],this._pendingZonePoints=[],this._showZoneTypePicker=!1}_cancelZoneTypePicker(){this._showZoneTypePicker=!1,this._pendingZonePoints=[]}_toggleEntryDirection(e){const t=this._zones[e];if("entry"!==t.type)return;const i="left"===t.inDirection?"right":"left";this._zones=this._zones.map((t,o)=>o===e?{...t,inDirection:i}:t),this._markDirty()}_renderZoneEditForm(e,t){return this._editingZoneIndex!==t?"":"entry"===e.type?U`
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
          `:B}

          <div class="edit-actions">
            <button class="cancel-btn" @click="${()=>this._editingZoneIndex=null}">Close</button>
          </div>
        </div>
      `:U`
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
        </div>
        <div class="edit-actions">
          <button class="cancel-btn" @click="${()=>this._editingZoneIndex=null}">Close</button>
        </div>
      </div>
    `}_getInstructions(){switch(this._toolMode){case"select":return{title:"Select",text:"Drag a sensor or select a zone to edit it."};case"sensor":return{title:"Sensors",text:this._sensors.length>0?"Drag a sensor to move it, click one to select it. Manage sensors on the right.":"Add a sensor on the right, then drag it into position."};case"zone":if(1===this._drawingZone.length)return{title:"Place point 2",text:"Click for the second point. After 2 points you can create an entry line or continue for a polygon zone."};if(this._drawingZone.length>1)return{title:"Draw Zone",text:"Click to add points. Click the green point to close. Drag points to move them. Right-click a point to delete it."};if(null!==this._selectedZoneIndex){const e=this._zones[this._selectedZoneIndex];return"entry"===e?.type?{title:"Edit Entry Line",text:"Drag the endpoints to move the line. Use the edit menu to change the IN/OUT direction."}:{title:"Edit Zone",text:"Drag points to move them. Click a green midpoint to add a point. Right-click a point to delete it."}}return{title:"Draw Zone",text:"Click to place the first point. 2 points = entry line, 3+ points = detection/exclusion zone."};case"walls":return{title:"Draw Walls",text:this._roomPoints.length>=3?"Hover a wall for the green add-point handle. Drag corners to move, right-click to delete.":this._pendingStart?"Click to add corners. Click the first point to close the room. Esc cancels, Ctrl+Z undoes.":"Click to place the first corner of the room."};case"door":return{title:"Add Door",text:"Hover a wall for the purple preview and click to place. Drag existing doors along their wall."};case"window":return{title:"Add Window",text:"Hover a wall for the blue preview and click to place. Drag existing windows along their wall."};case"furniture":return{title:"Place Furniture",text:this._selectedFurnitureType?`Click the canvas to place the ${this._selectedFurnitureType.name.toLowerCase()}.`:"Pick a furniture type on the right, or drag existing furniture. R rotates, Delete removes."};default:return{title:"Room Designer",text:"Pick a tool to get started."}}}_project3D(e){const t=this._camera3d,i=t.azimuth*Math.PI/180,o=t.elevation*Math.PI/180,s=e.x-t.targetX,n=e.y-t.targetY,r=e.z-t.targetZ,a=s*Math.cos(i)-n*Math.sin(i),l=s*Math.sin(i)+n*Math.cos(i),d=r,c=l*Math.cos(o)-d*Math.sin(o),h=l*Math.sin(o)+d*Math.cos(o),p=1/Math.tan(60*Math.PI/360)*400,g=t.distance+c,u=g>50?p/g:p/50;return{x:400-a*u,y:300-h*u}}_render3DScene(){if(!this._canvas3d)return;const e=this._canvas3d.getContext("2d");if(!e)return;const t=this._canvas3d.width,i=this._canvas3d.height,o=e.createLinearGradient(0,0,0,i);o.addColorStop(0,"#1e293b"),o.addColorStop(1,"#0f172a"),e.fillStyle=o,e.fillRect(0,0,t,i),this._draw3DGrid(e),this._roomPoints.length>=3&&(this._draw3DRoom(e),this._draw3DFurniture(e),this._draw3DDoors(e),this._draw3DWindows(e),this._draw3DZones(e)),this._draw3DSensor(e),this._draw3DTargets(e)}_draw3DGrid(e){e.strokeStyle="rgba(71, 85, 105, 0.3)",e.lineWidth=1;const t=5e3;for(let i=-5e3;i<=t;i+=1e3){const o=this._project3D({x:i,y:-5e3,z:0}),s=this._project3D({x:i,y:t,z:0});e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(s.x,s.y),e.stroke();const n=this._project3D({x:-5e3,y:i,z:0}),r=this._project3D({x:t,y:i,z:0});e.beginPath(),e.moveTo(n.x,n.y),e.lineTo(r.x,r.y),e.stroke()}}_draw3DRoom(e){const t=this._roomPoints;if(t.length<3)return;e.fillStyle="rgba(67, 97, 238, 0.08)",e.strokeStyle="rgba(67, 97, 238, 0.4)",e.lineWidth=2,e.beginPath();const i=this._project3D({x:t[0].x,y:t[0].y,z:0});e.moveTo(i.x,i.y);for(let i=1;i<t.length;i++){const o=this._project3D({x:t[i].x,y:t[i].y,z:0});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();const o=t.map((e,i)=>{const o=t[(i+1)%t.length],s=(e.x+o.x)/2,n=(e.y+o.y)/2;return{index:i,dist:Math.hypot(s-this._camera3d.targetX,n-this._camera3d.targetY)}}).sort((e,t)=>t.dist-e.dist);for(const{index:t}of o)this._draw3DWall(e,t)}_draw3DWall(e,t){const i=this._roomPoints,o=i[t],s=i[(t+1)%i.length],n=this._project3D({x:o.x,y:o.y,z:0}),r=this._project3D({x:s.x,y:s.y,z:0}),a=this._project3D({x:s.x,y:s.y,z:this.WALL_HEIGHT_3D}),l=this._project3D({x:o.x,y:o.y,z:this.WALL_HEIGHT_3D}),d=s.x-o.x,c=s.y-o.y,h=Math.atan2(c,d)+Math.PI/2,p=this._camera3d.azimuth*Math.PI/180,g=.3+.4*Math.abs(Math.cos(h-p)),u=e.createLinearGradient((n.x+r.x)/2,Math.max(n.y,r.y),(l.x+a.x)/2,Math.min(l.y,a.y));u.addColorStop(0,`rgba(71, 85, 105, ${.5*g})`),u.addColorStop(1,`rgba(71, 85, 105, ${.2*g})`),e.fillStyle=u,e.strokeStyle="#475569",e.lineWidth=2,e.beginPath(),e.moveTo(n.x,n.y),e.lineTo(r.x,r.y),e.lineTo(a.x,a.y),e.lineTo(l.x,l.y),e.closePath(),e.fill(),e.stroke()}_draw3DFurniture(e){for(const t of this._furniture){const i=t.width/2,o=t.height/2,s=400,n=[{x:t.x-i,y:t.y-o,z:0},{x:t.x+i,y:t.y-o,z:0},{x:t.x+i,y:t.y+o,z:0},{x:t.x-i,y:t.y+o,z:0}],r=n.map(e=>({...e,z:s})),a=n.map(e=>this._project3D(e)),l=r.map(e=>this._project3D(e));e.fillStyle="rgba(148, 163, 184, 0.5)",e.strokeStyle="#64748b",e.lineWidth=1,e.beginPath(),e.moveTo(l[0].x,l[0].y);for(let t=1;t<4;t++)e.lineTo(l[t].x,l[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle="rgba(148, 163, 184, 0.25)",e.beginPath(),e.moveTo(a[t].x,a[t].y),e.lineTo(a[i].x,a[i].y),e.lineTo(l[i].x,l[i].y),e.lineTo(l[t].x,l[t].y),e.closePath(),e.fill(),e.stroke()}const d=this._project3D({x:t.x,y:t.y,z:s+100});e.fillStyle="#94a3b8",e.font="11px sans-serif",e.textAlign="center",e.fillText(t.name,d.x,d.y)}}_draw3DDoors(e){if(this._roomPoints.length<3)return;for(const t of this._doors){if(t.wallIndex>=this._roomPoints.length)continue;const i=this._roomPoints[t.wallIndex],o=this._roomPoints[(t.wallIndex+1)%this._roomPoints.length],s=i.x+(o.x-i.x)*t.position,n=i.y+(o.y-i.y)*t.position,r=Math.atan2(o.y-i.y,o.x-i.x),a=t.width/2,l=Math.cos(r),d=Math.sin(r),c=Math.cos(r+Math.PI/2),h=Math.sin(r+Math.PI/2),p=[{x:s-a*l-40*c,y:n-a*d-40*h},{x:s+a*l-40*c,y:n+a*d-40*h},{x:s+a*l+40*c,y:n+a*d+40*h},{x:s-a*l+40*c,y:n-a*d+40*h}],g=p.map(e=>this._project3D({...e,z:0})),u=p.map(e=>this._project3D({...e,z:2e3}));e.strokeStyle="#8b5a2b",e.lineWidth=1,e.fillStyle="rgba(139, 90, 43, 0.6)",e.beginPath(),e.moveTo(u[0].x,u[0].y);for(let t=1;t<4;t++)e.lineTo(u[t].x,u[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(139, 90, 43, 0.5)":"rgba(139, 90, 43, 0.35)",e.beginPath(),e.moveTo(g[t].x,g[t].y),e.lineTo(g[i].x,g[i].y),e.lineTo(u[i].x,u[i].y),e.lineTo(u[t].x,u[t].y),e.closePath(),e.fill(),e.stroke()}const v=this._project3D({x:s,y:n,z:2100});e.fillStyle="#d4a574",e.font="14px sans-serif",e.textAlign="center",e.fillText("🚪",v.x,v.y)}}_draw3DWindows(e){if(this._roomPoints.length<3)return;for(const t of this._windows){if(t.wallIndex>=this._roomPoints.length)continue;const i=this._roomPoints[t.wallIndex],o=this._roomPoints[(t.wallIndex+1)%this._roomPoints.length],s=i.x+(o.x-i.x)*t.position,n=i.y+(o.y-i.y)*t.position,r=Math.atan2(o.y-i.y,o.x-i.x),a=t.width/2,l=Math.cos(r),d=Math.sin(r),c=Math.cos(r+Math.PI/2),h=Math.sin(r+Math.PI/2),p=[{x:s-a*l-25*c,y:n-a*d-25*h},{x:s+a*l-25*c,y:n+a*d-25*h},{x:s+a*l+25*c,y:n+a*d+25*h},{x:s-a*l+25*c,y:n-a*d+25*h}],g=p.map(e=>this._project3D({...e,z:900})),u=p.map(e=>this._project3D({...e,z:2e3}));e.strokeStyle="#4a90a4",e.lineWidth=1,e.fillStyle="rgba(135, 206, 235, 0.4)",e.beginPath(),e.moveTo(u[0].x,u[0].y);for(let t=1;t<4;t++)e.lineTo(u[t].x,u[t].y);e.closePath(),e.fill(),e.stroke();for(let t=0;t<4;t++){const i=(t+1)%4;e.fillStyle=t%2==0?"rgba(135, 206, 235, 0.35)":"rgba(135, 206, 235, 0.25)",e.beginPath(),e.moveTo(g[t].x,g[t].y),e.lineTo(g[i].x,g[i].y),e.lineTo(u[i].x,u[i].y),e.lineTo(u[t].x,u[t].y),e.closePath(),e.fill(),e.stroke()}}}_draw3DZones(e){const t=this.WALL_HEIGHT_3D;for(const i of this._zones){const o=Ie[i.type],s=i.points;if("entry"===i.type&&2===s.length){const n=s[0],r=s[1],a=this._project3D({x:n.x,y:n.y,z:0}),l=this._project3D({x:r.x,y:r.y,z:0}),d=this._project3D({x:n.x,y:n.y,z:t}),c=this._project3D({x:r.x,y:r.y,z:t});e.fillStyle=o.fill.replace("0.25","0.4"),e.strokeStyle=o.stroke,e.lineWidth=3,e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(l.x,l.y),e.lineTo(c.x,c.y),e.lineTo(d.x,d.y),e.closePath(),e.fill(),e.stroke();const h=(n.x+r.x)/2,p=(n.y+r.y)/2,g=this._project3D({x:h,y:p,z:t/2});e.fillStyle=o.stroke,e.font="bold 14px sans-serif",e.textAlign="center",e.fillText("left"===i.inDirection?"← IN":"IN →",g.x,g.y)}else if(s.length>=3){e.fillStyle=o.fill,e.strokeStyle=o.stroke,e.lineWidth=2,e.beginPath();const n=this._project3D({x:s[0].x,y:s[0].y,z:10});e.moveTo(n.x,n.y);for(let t=1;t<s.length;t++){const i=this._project3D({x:s[t].x,y:s[t].y,z:10});e.lineTo(i.x,i.y)}e.closePath(),e.fill(),e.stroke(),e.fillStyle=o.fill.replace("0.2","0.15"),e.beginPath();const r=this._project3D({x:s[0].x,y:s[0].y,z:t});e.moveTo(r.x,r.y);for(let i=1;i<s.length;i++){const o=this._project3D({x:s[i].x,y:s[i].y,z:t});e.lineTo(o.x,o.y)}e.closePath(),e.fill(),e.stroke();for(let i=0;i<s.length;i++){const n=s[i],r=s[(i+1)%s.length],a=this._project3D({x:n.x,y:n.y,z:10}),l=this._project3D({x:r.x,y:r.y,z:10}),d=this._project3D({x:r.x,y:r.y,z:t}),c=this._project3D({x:n.x,y:n.y,z:t});e.fillStyle=o.fill.replace("0.2","0.12"),e.strokeStyle=o.stroke,e.lineWidth=1,e.beginPath(),e.moveTo(a.x,a.y),e.lineTo(l.x,l.y),e.lineTo(d.x,d.y),e.lineTo(c.x,c.y),e.closePath(),e.fill(),e.stroke()}const a=s.reduce((e,t)=>e+t.x,0)/s.length,l=s.reduce((e,t)=>e+t.y,0)/s.length,d=this._project3D({x:a,y:l,z:t/2});e.fillStyle=o.stroke,e.font="bold 12px sans-serif",e.textAlign="center",e.fillText(i.name,d.x,d.y)}}}_draw3DSensor(e){for(const t of this._sensors){const i=t.heightMm??2e3,o=this._project3D({x:t.x,y:t.y,z:i}),s=t.fov/2*Math.PI/180,n=(t.rotation-90)*Math.PI/180,r=n-s,a=n+s,l=t.x+Math.cos(r)*t.range,d=t.y+Math.sin(r)*t.range,c=t.x+Math.cos(a)*t.range,h=t.y+Math.sin(a)*t.range,p=this._project3D({x:t.x,y:t.y,z:0}),g=this._project3D({x:l,y:d,z:0}),u=this._project3D({x:c,y:h,z:0});e.fillStyle="rgba(67, 97, 238, 0.15)",e.strokeStyle="#4361ee",e.lineWidth=2,e.beginPath(),e.moveTo(p.x,p.y),e.lineTo(g.x,g.y),e.lineTo(u.x,u.y),e.closePath(),e.fill(),e.stroke(),e.strokeStyle="rgba(67, 97, 238, 0.5)",e.lineWidth=1,e.setLineDash([4,4]),e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(p.x,p.y),e.stroke(),e.setLineDash([]),e.fillStyle="#4361ee",e.beginPath(),e.arc(o.x,o.y,12,0,2*Math.PI),e.fill(),e.fillStyle="white",e.font="bold 10px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText("📡",o.x,o.y)}}_draw3DTargets(e){const t=[];for(const e of this._sensors){const i=(e.rotation-90)*Math.PI/180;for(const o of this._liveTargets[e.id]||[])o.active&&t.push({x:e.x+o.y*Math.cos(i)-o.x*Math.sin(i),y:e.y+o.y*Math.sin(i)+o.x*Math.cos(i)})}for(let i=0;i<t.length;i++){const o=t[i].x,s=t[i].y;e.save();const n=this._project3D({x:o+80,y:s+80,z:5});e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.ellipse(n.x,n.y,25,10,.3,0,2*Math.PI),e.fill(),this._draw3DCapsule(e,o-60,s,0,60,700,"#8b9299","#6b7280"),this._draw3DCapsule(e,o+60,s,0,60,700,"#8b9299","#6b7280"),this._draw3DCapsule(e,o-160,s,900,50,380,"#8b9299","#6b7280"),this._draw3DCapsule(e,o+160,s,900,50,380,"#8b9299","#6b7280"),this._draw3DCapsule(e,o,s,700,120,600,"#b8bfc7","#9ca3af"),this._draw3DSphere(e,o,s,1500,110);const r=this._project3D({x:o,y:s,z:1700});e.fillStyle="rgba(239, 68, 68, 0.95)",e.beginPath(),e.arc(r.x,r.y,14,0,2*Math.PI),e.fill(),e.strokeStyle="rgba(255, 255, 255, 0.6)",e.lineWidth=2,e.stroke(),e.fillStyle="white",e.font="bold 12px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText(`${i+1}`,r.x,r.y),e.restore()}}_draw3DCapsule(e,t,i,o,s,n,r,a){const l=.8*s,d=o+n,c=[];for(let e=0;e<8;e++){const n=e/8*Math.PI*2,r=(e+1)/8*Math.PI*2,a=t+Math.cos(n)*s,h=i+Math.sin(n)*l,p=t+Math.cos(r)*s,g=i+Math.sin(r)*l,u=this._project3D({x:a,y:h,z:o}),v=this._project3D({x:p,y:g,z:o}),m=this._project3D({x:p,y:g,z:d}),_=this._project3D({x:a,y:h,z:d}),x=(h+g)/2;c.push({points:[u,v,m,_],depth:x,isTop:!1,isSide:!0})}const h=[];for(let e=0;e<8;e++){const o=e/8*Math.PI*2,n=t+Math.cos(o)*s,r=i+Math.sin(o)*l;h.push(this._project3D({x:n,y:r,z:d}))}c.push({points:h,depth:-1e3,isTop:!0,isSide:!1}),c.sort((e,t)=>t.depth-e.depth);for(const t of c){e.beginPath(),e.moveTo(t.points[0].x,t.points[0].y);for(let i=1;i<t.points.length;i++)e.lineTo(t.points[i].x,t.points[i].y);if(e.closePath(),t.isTop)e.fillStyle=r;else{const i=t.depth>0?.85:1;e.fillStyle=this._shadeColor(r,i)}e.fill(),e.strokeStyle=a,e.lineWidth=.5,e.stroke()}}_draw3DSphere(e,t,i,o,s){const n=this._project3D({x:t,y:i,z:o}),r=this._project3D({x:t,y:i,z:o+s}),a=Math.abs(n.y-r.y),l=e.createRadialGradient(n.x-.35*a,n.y-.35*a,0,n.x,n.y,a);l.addColorStop(0,"#ffffff"),l.addColorStop(.3,"#e5e7eb"),l.addColorStop(.7,"#d1d5db"),l.addColorStop(1,"#9ca3af"),e.fillStyle=l,e.beginPath(),e.arc(n.x,n.y,a,0,2*Math.PI),e.fill(),e.strokeStyle="#6b7280",e.lineWidth=1,e.stroke()}_shadeColor(e,t){const i=e.replace("#","");return`rgb(${Math.round(parseInt(i.substr(0,2),16)*t)}, ${Math.round(parseInt(i.substr(2,2),16)*t)}, ${Math.round(parseInt(i.substr(4,2),16)*t)})`}_handle3DMouseDown(e){0===e.button&&(this._isDragging3D=!0,this._lastMouseX=e.clientX,this._lastMouseY=e.clientY)}_handle3DMouseMove(e){if(!this._isDragging3D)return;const t=e.clientX-this._lastMouseX,i=e.clientY-this._lastMouseY;this._camera3d={...this._camera3d,azimuth:(this._camera3d.azimuth-.5*t)%360,elevation:Math.max(5,Math.min(85,this._camera3d.elevation+.3*i))},this._lastMouseX=e.clientX,this._lastMouseY=e.clientY,this._render3DScene()}_handle3DMouseUp(){this._isDragging3D=!1}_handle3DWheel(e){e.preventDefault();const t=e.deltaY>0?1.1:.9;this._camera3d={...this._camera3d,distance:Math.max(2e3,Math.min(2e4,this._camera3d.distance*t))},this._render3DScene()}_reset3DCamera(){if(this._roomPoints.length>=3){const e=this._roomPoints.map(e=>e.x),t=this._roomPoints.map(e=>e.y),i=(Math.min(...e)+Math.max(...e))/2,o=(Math.min(...t)+Math.max(...t))/2,s=Math.max(Math.max(...e)-Math.min(...e),Math.max(...t)-Math.min(...t));this._camera3d={azimuth:45,elevation:35,distance:Math.max(4e3,1.5*s),targetX:i,targetY:o,targetZ:this.WALL_HEIGHT_3D/2}}else this._camera3d={azimuth:45,elevation:35,distance:8e3,targetX:0,targetY:0,targetZ:1e3};this._render3DScene()}_toggleViewMode(){this._viewMode="2d"===this._viewMode?"3d":"2d","3d"===this._viewMode&&(this._reset3DCamera(),requestAnimationFrame(()=>{this._canvas3d&&(this._canvas3d.width=this._canvas3d.offsetWidth,this._canvas3d.height=this._canvas3d.offsetHeight,this._render3DScene())}))}_renderGrid(){const e=[];for(let t=-1e4;t<=1e4;t+=500){const i=t%1e3==0,o=this._toCanvas({x:t,y:-1e4}),s=this._toCanvas({x:t,y:1e4}),n=this._toCanvas({x:-1e4,y:t}),r=this._toCanvas({x:1e4,y:t});e.push(V`<line class="grid-line ${i?"major":""}" x1="${o.x}" y1="${o.y}" x2="${s.x}" y2="${s.y}"/>`),e.push(V`<line class="grid-line ${i?"major":""}" x1="${n.x}" y1="${n.y}" x2="${r.x}" y2="${r.y}"/>`)}return e}_renderRoom(){if(this._roomPoints.length<2)return B;const e=[],t=this._roomPoints.map((e,t)=>{const i=this._toCanvas(e);return(0===t?"M":"L")+` ${i.x} ${i.y}`}).join(" ")+(this._roomPoints.length>=3?" Z":"");this._roomPoints.length>=3&&e.push(V`<path d="${t}" fill="rgba(67, 97, 238, 0.06)" style="pointer-events: none;"/>`);for(let t=0;t<this._roomPoints.length;t++){const i=this._roomPoints[t],o=this._roomPoints[(t+1)%this._roomPoints.length];if(this._roomPoints.length<3&&t===this._roomPoints.length-1)break;const s=this._toCanvas(i),n=this._toCanvas(o);if(e.push(V`<line class="wall-line" x1="${s.x}" y1="${s.y}" x2="${n.x}" y2="${n.y}"/>`),"layout"===this._designMode){const t=(Math.hypot(o.x-i.x,o.y-i.y)/1e3).toFixed(2),r=(s.x+n.x)/2,a=(s.y+n.y)/2,l=180*Math.atan2(n.y-s.y,n.x-s.x)/Math.PI,d=l>90||l<-90?l+180:l,c=(l+90)*Math.PI/180,h=14*Math.cos(c),p=14*Math.sin(c);e.push(V`
          <text x="${r+h}" y="${a+p}" text-anchor="middle" dominant-baseline="middle"
            transform="rotate(${d}, ${r+h}, ${a+p})"
            fill="#7c93f5" font-size="11" font-weight="600"
            stroke="#0a1628" stroke-width="3" paint-order="stroke"
            style="pointer-events: none;">${t}m</text>
        `)}}if("layout"===this._designMode&&this._roomPoints.length>=3){let t=0,i=0,o=0;for(let e=0;e<this._roomPoints.length;e++){const s=this._roomPoints[e],n=this._roomPoints[(e+1)%this._roomPoints.length],r=s.x*n.y-n.x*s.y;o+=r,t+=(s.x+n.x)*r,i+=(s.y+n.y)*r}if(Math.abs(o)>1e-6){o/=2,t/=6*o,i/=6*o;const s=this._toCanvas({x:t,y:i});e.push(V`<text x="${s.x}" y="${s.y}" text-anchor="middle" dominant-baseline="middle" fill="#64748b" font-size="15" font-weight="600" style="pointer-events: none;">${this._calculateArea().toFixed(1)} m²</text>`)}}if("layout"===this._designMode&&("walls"===this._toolMode||"select"===this._toolMode)&&(this._roomPoints.forEach((t,i)=>{const o=this._toCanvas(t),s=i===this._draggingPointIndex;e.push(V`
          <circle cx="${o.x}" cy="${o.y}" r="7"
            fill="${s?"#22c55e":"#4361ee"}" stroke="white" stroke-width="2"
            style="cursor: ${s?"grabbing":"grab"};"
            @mousedown="${e=>{e.stopPropagation(),e.preventDefault(),this._draggingPointIndex=i}}"
          />
        `)}),this._wallHoverPreview)){const t=this._toCanvas(this._wallHoverPreview.point);e.push(V`
          <g style="cursor: pointer;"
             @mousedown="${e=>{e.stopPropagation(),e.preventDefault(),this._addPointOnWall(this._wallHoverPreview.wallIndex,this._wallHoverPreview.position,!0)}}">
            <circle cx="${t.x}" cy="${t.y}" r="11" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="2" stroke-dasharray="4 2"/>
            <circle cx="${t.x}" cy="${t.y}" r="4" fill="#22c55e"/>
          </g>
        `)}return e}_renderWallDrawPreview(){if("walls"!==this._toolMode||!this._pendingStart||!this._previewPoint)return B;const e=this._toCanvas(this._pendingStart),t=this._toCanvas(this._previewPoint),i=this._roomPoints[0],o=i&&this._roomPoints.length>=2&&Math.hypot(this._previewPoint.x-i.x,this._previewPoint.y-i.y)<250,s=i?this._toCanvas(i):null;return V`
      ${o&&s?V`<circle cx="${s.x}" cy="${s.y}" r="18" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="1"/>`:B}
      <line x1="${e.x}" y1="${e.y}" x2="${t.x}" y2="${t.y}" stroke="#22c55e" stroke-width="2" stroke-dasharray="8 4"/>
      <circle cx="${t.x}" cy="${t.y}" r="5" fill="#22c55e" stroke="white" stroke-width="2"/>
    `}_renderFurnitureGhost(){if("furniture"!==this._toolMode||!this._selectedFurnitureType||!this._cursorPos)return B;const e=this._snapToGrid(this._cursorPos),t=this._toCanvas(e),i=.08*this._zoom,o=this._selectedFurnitureType.defaultWidth*i,s=this._selectedFurnitureType.defaultHeight*i;return V`<rect x="${t.x-o/2}" y="${t.y-s/2}" width="${o}" height="${s}" rx="4"
      fill="rgba(34, 197, 94, 0.12)" stroke="#22c55e" stroke-width="2" stroke-dasharray="6 3" pointer-events="none"/>`}_renderDoorWindowPreview(){if(!this._doorWindowPreview)return B;const e=this._doorWindowPreview,t=this._roomPoints[e.wallIndex],i=this._roomPoints[(e.wallIndex+1)%this._roomPoints.length],o=this._toCanvas(e.point),s=Math.atan2(i.y-t.y,i.x-t.x),n=.08*this._zoom,r=("door"===e.type?this._doorWidth:this._windowWidth)*n,a="door"===e.type,l=a?"#a855f7":"#0ea5e9",d=o.x-Math.cos(s)*r/2,c=o.y-Math.sin(s)*r/2,h=o.x+Math.cos(s)*r/2,p=o.y+Math.sin(s)*r/2;return V`
      <g style="cursor: pointer;"
         @mousedown="${t=>{t.stopPropagation(),t.preventDefault(),this._selectedWallIndex=e.wallIndex,this._pendingStart={x:e.position,y:0},a?this._showDoorDialog=!0:this._showWindowDialog=!0}}">
        <line x1="${d}" y1="${c}" x2="${h}" y2="${p}" stroke="${l}" stroke-width="6" stroke-dasharray="8 4" opacity="0.8"/>
        <circle cx="${o.x}" cy="${o.y}" r="10" fill="rgba(168, 85, 247, 0.25)" stroke="${l}" stroke-width="2"/>
      </g>
    `}_renderFurniture(){const e="layout"===this._designMode&&("furniture"===this._toolMode||"select"===this._toolMode);return this._furniture.map((t,i)=>{const o=this._toCanvas({x:t.x,y:t.y}),s=.08*this._zoom,n=t.width*s,r=t.height*s,a=i===this._selectedFurnitureIndex,l=i===this._draggingFurnitureIndex;return V`
        <g @mousedown="${t=>{e&&(t.stopPropagation(),t.preventDefault(),this._selectedFurnitureIndex=i,this._draggingFurnitureIndex=i)}}"
           style="cursor: ${l?"grabbing":e?"grab":"default"};">
          <rect
            x="${o.x-n/2}" y="${o.y-r/2}"
            width="${n}" height="${r}"
            fill="${l?"rgba(34, 197, 94, 0.3)":a?"rgba(59, 130, 246, 0.3)":"#334155"}"
            stroke="${l?"#22c55e":a?"#3b82f6":"#475569"}"
            stroke-width="${l||a?2:1}"
            transform="rotate(${t.rotation||0} ${o.x} ${o.y})"
            rx="3"
          />
          ${"layout"===this._designMode?V`
            <text x="${o.x}" y="${o.y+4}" text-anchor="middle"
              fill="${l?"#22c55e":a?"#3b82f6":"#94a3b8"}"
              font-size="11" font-weight="500" style="pointer-events: none;">${t.name}</text>
          `:B}
        </g>
      `})}_renderDoorsAndWindows(){const e=[],t=.08*this._zoom,i="layout"===this._designMode&&("door"===this._toolMode||"window"===this._toolMode||"select"===this._toolMode);return this._doors.forEach((o,s)=>{if(o.wallIndex>=this._roomPoints.length)return;const n=this._roomPoints[o.wallIndex],r=this._roomPoints[(o.wallIndex+1)%this._roomPoints.length],a=n.x+(r.x-n.x)*o.position,l=n.y+(r.y-n.y)*o.position,d=this._toCanvas({x:a,y:l}),c=Math.atan2(r.y-n.y,r.x-n.x),h=c+("inward"===o.openDirection?Math.PI/2:-Math.PI/2),p=o.width*t,g=s===this._draggingDoorIndex,u=g?"#22c55e":"#a855f7";e.push(V`
        <g style="cursor: ${g?"grabbing":i?"grab":"default"};"
           @mousedown="${e=>{i&&(e.stopPropagation(),e.preventDefault(),this._draggingDoorIndex=s)}}">
          <circle cx="${d.x}" cy="${d.y}" r="15" fill="transparent"/>
          <line
            x1="${d.x-Math.cos(c)*p/2}"
            y1="${d.y-Math.sin(c)*p/2}"
            x2="${d.x+Math.cos(c)*p/2}"
            y2="${d.y+Math.sin(c)*p/2}"
            stroke="#0a1628" stroke-width="6"
          />
          <line
            x1="${d.x}" y1="${d.y}"
            x2="${d.x+Math.cos(h)*p*.9}"
            y2="${d.y+Math.sin(h)*p*.9}"
            stroke="${u}" stroke-width="3"
          />
          <path
            d="M ${d.x+Math.cos(h)*p*.9} ${d.y+Math.sin(h)*p*.9} A ${.9*p} ${.9*p} 0 0 ${"left"===o.openSide?1:0} ${d.x+Math.cos(c+("left"===o.openSide?-1:1)*Math.PI/2)*p*.9} ${d.y+Math.sin(c+("left"===o.openSide?-1:1)*Math.PI/2)*p*.9}"
            fill="none" stroke="${u}" stroke-width="1" stroke-dasharray="4 2" opacity="0.5"
          />
          ${"layout"===this._designMode?V`<circle cx="${d.x}" cy="${d.y}" r="6" fill="${u}" stroke="white" stroke-width="2"/>`:B}
        </g>
      `)}),this._windows.forEach((o,s)=>{if(o.wallIndex>=this._roomPoints.length)return;const n=this._roomPoints[o.wallIndex],r=this._roomPoints[(o.wallIndex+1)%this._roomPoints.length],a=n.x+(r.x-n.x)*o.position,l=n.y+(r.y-n.y)*o.position,d=this._toCanvas({x:a,y:l}),c=Math.atan2(r.y-n.y,r.x-n.x),h=o.width*t,p=s===this._draggingWindowIndex,g=p?"#22c55e":"#0ea5e9",u=d.x-Math.cos(c)*h/2,v=d.y-Math.sin(c)*h/2,m=d.x+Math.cos(c)*h/2,_=d.y+Math.sin(c)*h/2;e.push(V`
        <g style="cursor: ${p?"grabbing":i?"grab":"default"};"
           @mousedown="${e=>{i&&(e.stopPropagation(),e.preventDefault(),this._draggingWindowIndex=s)}}">
          <circle cx="${d.x}" cy="${d.y}" r="15" fill="transparent"/>
          <line x1="${u}" y1="${v}" x2="${m}" y2="${_}" stroke="${g}" stroke-width="6"/>
          <line x1="${u}" y1="${v}" x2="${m}" y2="${_}" stroke="${p?"#4ade80":"#38bdf8"}" stroke-width="3"/>
          ${"layout"===this._designMode?V`<circle cx="${d.x}" cy="${d.y}" r="6" fill="${g}" stroke="white" stroke-width="2"/>`:B}
        </g>
      `)}),e}_renderZones(){const e=[];if(this._zones.forEach((t,i)=>{const o=Ie[t.type],s=this._selectedZoneIndex===i;if("entry"===t.type&&2===t.points.length){const n=this._toCanvas(t.points[0]),r=this._toCanvas(t.points[1]),a=(n.x+r.x)/2,l=(n.y+r.y)/2,d=r.x-n.x,c=r.y-n.y,h=Math.sqrt(d*d+c*c),p=Math.atan2(c,d),g=-c/h,u=d/h,v="left"===(t.inDirection||"left")?1:-1;e.push(V`
          <line
            x1="${n.x}" y1="${n.y}"
            x2="${r.x}" y2="${r.y}"
            stroke="${o.stroke}"
            stroke-width="${s?4:3}"
            stroke-linecap="round"
            style="cursor: pointer;"
            @click="${e=>{e.stopPropagation(),this._selectedZoneIndex=i,this._toolMode="zone"}}"
          />
        `);const m=30,_=5,x=a+g*v*(m+_),y=l+u*v*(m+_),f=a-g*v*_,b=l-u*v*_;e.push(V`
          <line
            x1="${x}" y1="${y}"
            x2="${f}" y2="${b}"
            stroke="#22c55e" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrowhead-in)"
            style="pointer-events: none;"
          />
          <text
            x="${x+g*v*15}" y="${y+u*v*15+4}"
            fill="#22c55e" font-size="13" font-weight="700" text-anchor="middle"
            style="pointer-events: none;"
          >IN</text>
        `);const w=a-g*v*(m+_),$=l-u*v*(m+_),k=a+g*v*_,z=l+u*v*_;e.push(V`
          <line
            x1="${w}" y1="${$}"
            x2="${k}" y2="${z}"
            stroke="#ef4444" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrowhead-out)"
            style="pointer-events: none;"
          />
          <text
            x="${w-g*v*15}" y="${$-u*v*15+4}"
            fill="#ef4444" font-size="13" font-weight="700" text-anchor="middle"
            style="pointer-events: none;"
          >OUT</text>
        `);const P=(Math.hypot(t.points[1].x-t.points[0].x,t.points[1].y-t.points[0].y)/1e3).toFixed(2),M=180*p/Math.PI,D=M>90||M<-90?M+180:M;return e.push(V`
          <text
            x="${a}" y="${l-12}"
            fill="${o.stroke}"
            font-size="11" font-weight="600" text-anchor="middle"
            transform="rotate(${D} ${a} ${l-12})"
            style="pointer-events: none;"
          >${P}m</text>
        `),void(s&&e.push(V`
            <circle cx="${n.x}" cy="${n.y}" r="8" fill="${o.stroke}" stroke="white" stroke-width="2" style="cursor: grab;" />
            <circle cx="${r.x}" cy="${r.y}" r="8" fill="${o.stroke}" stroke="white" stroke-width="2" style="cursor: grab;" />
          `))}if(t.points.length<3)return;const n=t.points.map(e=>this._toCanvas(e)),r=`M ${n.map(e=>`${e.x} ${e.y}`).join(" L ")} Z`,a="exclusion"===t.type?"8 4":"none";if(e.push(V`
        <path
          d="${r}"
          fill="${o.fill}"
          stroke="${o.stroke}"
          stroke-width="${s?3:2}"
          stroke-dasharray="${a}"
          style="cursor: ${s&&"zone"===this._toolMode?"move":"pointer"};"
          @click="${e=>{e.stopPropagation(),this._selectedZoneIndex=i,this._toolMode="zone"}}"
        />
      `),s)for(let i=0;i<t.points.length;i++){const s=t.points[i],n=t.points[(i+1)%t.points.length],r=(Math.hypot(n.x-s.x,n.y-s.y)/1e3).toFixed(2),a=this._toCanvas(s),l=this._toCanvas(n),d=(a.x+l.x)/2,c=(a.y+l.y)/2,h=180*Math.atan2(l.y-a.y,l.x-a.x)/Math.PI,p=h>90||h<-90?h+180:h;e.push(V`
            <text
              x="${d}" y="${c-8}"
              fill="${o.stroke}"
              font-size="11"
              font-weight="600"
              text-anchor="middle"
              transform="rotate(${p} ${d} ${c-8})"
              style="pointer-events: none;"
            >${r}m</text>
          `)}if(s&&(t.points.forEach((t,i)=>{const s=this._toCanvas(t);e.push(V`
            <circle
              cx="${s.x}" cy="${s.y}" r="8"
              fill="${o.stroke}" stroke="white" stroke-width="2"
              style="cursor: ${"zone"===this._toolMode?"grab":"default"};"
            />
          `)}),"zone"===this._toolMode&&this._zoneMidpointPreview&&this._zoneMidpointPreview.zoneIndex===i)){const t=this._toCanvas(this._zoneMidpointPreview.point);e.push(V`
            <circle
              cx="${t.x}" cy="${t.y}" r="8"
              fill="#22c55e" stroke="white" stroke-width="2"
              style="cursor: pointer;"
            />
          `)}}),this._drawingZone.length>0){const t=Ie[this._newZoneType],i=this._drawingZone.map(e=>this._toCanvas(e));for(let o=0;o<i.length-1;o++){e.push(V`
          <line
            x1="${i[o].x}" y1="${i[o].y}"
            x2="${i[o+1].x}" y2="${i[o+1].y}"
            stroke="${t.stroke}" stroke-width="2"
          />
        `);const s=this._drawingZone[o],n=this._drawingZone[o+1],r=(Math.hypot(n.x-s.x,n.y-s.y)/1e3).toFixed(2),a=(i[o].x+i[o+1].x)/2,l=(i[o].y+i[o+1].y)/2,d=180*Math.atan2(i[o+1].y-i[o].y,i[o+1].x-i[o].x)/Math.PI,c=d>90||d<-90?d+180:d;e.push(V`
          <text
            x="${a}" y="${l-8}"
            fill="${t.stroke}"
            font-size="11"
            font-weight="600"
            text-anchor="middle"
            transform="rotate(${c} ${a} ${l-8})"
            style="pointer-events: none;"
          >${r}m</text>
        `)}if(this._cursorPos){const o=i[i.length-1],s=this._toCanvas(this._cursorPos);e.push(V`
          <line
            x1="${o.x}" y1="${o.y}"
            x2="${s.x}" y2="${s.y}"
            stroke="${t.stroke}" stroke-width="2" stroke-dasharray="4 4"
          />
        `)}if(i.forEach((i,o)=>{const s=0===o&&this._drawingZone.length>=3;e.push(V`
          <circle
            cx="${i.x}" cy="${i.y}" r="8"
            fill="${s?"#22c55e":t.stroke}"
            stroke="white" stroke-width="2"
            style="cursor: grab;"
          />
        `)}),this._zoneMidpointPreview&&-1===this._zoneMidpointPreview.zoneIndex){const t=this._toCanvas(this._zoneMidpointPreview.point);e.push(V`
          <circle
            cx="${t.x}" cy="${t.y}" r="8"
            fill="#22c55e" stroke="white" stroke-width="2"
            style="cursor: pointer;"
          />
        `)}}return e}_renderSensorFOV(){if(0===this._sensors.length)return B;const e=.08*this._zoom,t=[];return this._sensors.forEach((i,o)=>{const s=o===this._selectedSensorIndex,n=this._toCanvas({x:i.x,y:i.y}),r=i.range*e,a=(i.rotation-90)*Math.PI/180,l=i.fov*Math.PI/360,d=a-l,c=a+l,h=[];for(let e=0;e<=32;e++){const t=d+e/32*(c-d);h.push({x:n.x+Math.cos(t)*r,y:n.y+Math.sin(t)*r})}const p=`M ${n.x} ${n.y} L ${h.map(e=>`${e.x} ${e.y}`).join(" L ")} Z`,g=s?1:.45;if(t.push(V`<path d="${p}" fill="rgba(34, 197, 94, ${.12*g})" stroke="#22c55e" stroke-opacity="${g}" stroke-width="1.5" style="pointer-events: none;"/>`),s){for(let o=1e3;o<=i.range;o+=1e3){const i=o*e,s=[];for(let e=0;e<=24;e++){const t=d+e/24*(c-d);s.push({x:n.x+Math.cos(t)*i,y:n.y+Math.sin(t)*i})}const r=`M ${s.map(e=>`${e.x} ${e.y}`).join(" L ")}`;t.push(V`<path d="${r}" fill="none" stroke="rgba(34, 197, 94, 0.25)" stroke-width="1" style="pointer-events: none;"/>`);const l=n.x+Math.cos(a)*i,h=n.y+Math.sin(a)*i;t.push(V`<text x="${l}" y="${h-4}" fill="rgba(34, 197, 94, 0.6)" font-size="9" text-anchor="middle" style="pointer-events: none;">${o/1e3}m</text>`)}for(let e=-180;e<=180;e+=30){if(Math.abs(e)>i.fov/2)continue;const o=a+e*Math.PI/180;t.push(V`<line x1="${n.x}" y1="${n.y}" x2="${n.x+Math.cos(o)*r}" y2="${n.y+Math.sin(o)*r}" stroke="rgba(34, 197, 94, 0.15)" stroke-width="1" style="pointer-events: none;"/>`)}}}),V`${t}`}_renderSensorIcon(){if(0===this._sensors.length)return B;const e="sensor"===this._toolMode||"select"===this._toolMode;return V`${this._sensors.map((t,i)=>{const o=this._toCanvas({x:t.x,y:t.y}),s=(t.rotation-90)*Math.PI/180,n=o.x+25*Math.cos(s),r=o.y+25*Math.sin(s),a=this._draggingSensorIndex===i,l=this._selectedSensorIndex===i,d=a?"#22c55e":this._sensorColor(i);return V`
        ${l?V`<circle cx="${o.x}" cy="${o.y}" r="25" fill="none" stroke="${d}" stroke-width="2" stroke-dasharray="4 3" style="pointer-events: none;"/>`:B}
        <circle
          cx="${o.x}" cy="${o.y}" r="18"
          fill="${d}" stroke="white" stroke-width="2"
          style="cursor: ${a?"grabbing":e?"grab":"default"}"
          @mousedown="${t=>{e&&(t.stopPropagation(),t.preventDefault(),this._selectedSensorIndex=i,this._draggingSensorIndex=i)}}"
        />
        <line x1="${o.x}" y1="${o.y}" x2="${n}" y2="${r}" stroke="white" stroke-width="3" stroke-linecap="round" style="pointer-events: none;"/>
        <text x="${o.x}" y="${o.y+4}" text-anchor="middle" fill="white" font-size="11" font-weight="700" style="pointer-events: none;">${i+1}</text>
      `})}`}updated(e){super.updated(e),(e.has("_liveTargets")||e.has("_sensors"))&&this._updateTargetCirclesInDOM(),"3d"===this._viewMode&&this._canvas3d&&this._render3DScene()}_updateTargetCirclesInDOM(){const e=this.shadowRoot?.querySelector("svg");if(!e)return;e.querySelectorAll(".live-target").forEach(e=>e.remove());const t=[["#ef4444","#4361ee","#eab308"],["#f97316","#8b5cf6","#06b6d4"],["#ec4899","#22c55e","#94a3b8"]];this._sensors.forEach((i,o)=>{const s=(i.rotation-90)*Math.PI/180,n=e=>({x:i.x+e.y*Math.cos(s)-e.x*Math.sin(s),y:i.y+e.y*Math.sin(s)+e.x*Math.cos(s)}),r=t[o%t.length],a=this._liveTargets[i.id]||[],l=this._targetTrails[i.id]||[];a.forEach((t,i)=>{if(!t.active)return;const o=n(t),s=this._toCanvas(o),a=r[i]||"#ef4444",d=l[i]||[];if(d.length>1){const t=d.map(e=>{const t=this._toCanvas(n(e));return`${t.x},${t.y}`}).join(" "),i=document.createElementNS("http://www.w3.org/2000/svg","polyline");i.setAttribute("class","live-target"),i.setAttribute("points",t),i.setAttribute("fill","none"),i.setAttribute("stroke",a),i.setAttribute("stroke-width","2"),i.setAttribute("stroke-opacity","0.35"),i.setAttribute("stroke-linecap","round"),i.setAttribute("stroke-linejoin","round"),e.appendChild(i)}const c=document.createElementNS("http://www.w3.org/2000/svg","circle");c.setAttribute("class","live-target"),c.setAttribute("cx",s.x.toString()),c.setAttribute("cy",s.y.toString()),c.setAttribute("r","18"),c.setAttribute("fill",a),c.setAttribute("stroke","white"),c.setAttribute("stroke-width","4");const h=document.createElementNS("http://www.w3.org/2000/svg","animate");h.setAttribute("attributeName","r"),h.setAttribute("values","14;22;14"),h.setAttribute("dur","1s"),h.setAttribute("repeatCount","indefinite"),c.appendChild(h),e.appendChild(c);const p=document.createElementNS("http://www.w3.org/2000/svg","text");p.setAttribute("class","live-target"),p.setAttribute("x",s.x.toString()),p.setAttribute("y",(s.y+6).toString()),p.setAttribute("text-anchor","middle"),p.setAttribute("fill","white"),p.setAttribute("font-size","14"),p.setAttribute("font-weight","bold"),p.textContent=(i+1).toString(),e.appendChild(p)})})}_renderSelectedFurniturePanel(){const e=this._selectedFurnitureIndex;if(null===e||!this._furniture[e])return B;const t=this._furniture[e];return U`
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
            ${De.map(e=>U`
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
                <ha-icon icon="${De.find(t=>t.id===e.type)?.icon||"mdi:square"}"></ha-icon>
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
        `:B}
      `;if("door"===this._toolMode)return U`
        <div>
          <div class="section-title">DOORS</div>
          <p class="info-text" style="margin-bottom: 10px;">Hover a wall and click the preview to add a door.</p>
          ${0===this._doors.length?U`
            <p class="info-text" style="color: #64748b;">No doors added yet.</p>
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
            <p class="info-text" style="color: #64748b;">No windows added yet.</p>
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
    `}render(){const e=this.rooms.find(e=>e.id===this._selectedRoomId),t=this._getInstructions(),i=this._getRadarDevices(),o=Object.values(this._liveTargets).reduce((e,t)=>e+t.filter(e=>e.active).length,0);return U`
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
              `:B}
              <button class="save-btn ${this._dirty?"dirty":""}" @click="${this._saveRoom}" ?disabled="${this._saving||!this._dirty}">
                <ha-icon icon="mdi:content-save"></ha-icon>
                ${this._saving?"Saving...":this._dirty?"Save":"Saved"}
              </button>
            `:B}
          </div>
        </div>
        ${e?"2d"===this._viewMode?U`
          <svg viewBox="0 0 ${Pe} ${Pe}"
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
            `:B}
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
                    <div class="sensor-item-sub">${e.deviceId?"Linked":"No device linked"}</div>
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
                <select @change="${e=>this._updateSensor(this._selectedSensorIndex,{deviceId:e.target.value||null})}">
                  <option value="">-- Select device --</option>
                  ${i.map(e=>U`<option value="${e.id}" ?selected="${this._selectedSensor?.deviceId===e.id}">${e.name}</option>`)}
                </select>
              </div>
              <div class="setting-item">
                <label>Rotation: ${this._selectedSensor.rotation}°</label>
                <input type="range" min="0" max="359" .value="${String(this._selectedSensor.rotation)}"
                       @input="${e=>this._updateSensor(this._selectedSensorIndex,{rotation:parseInt(e.target.value)})}"/>
              </div>
              <div class="setting-item">
                <label>Range: ${(this._selectedSensor.range/1e3).toFixed(1)}m</label>
                <input type="range" min="1" max="10" step="0.5" .value="${String(this._selectedSensor.range/1e3)}"
                       @input="${e=>this._updateSensor(this._selectedSensorIndex,{range:1e3*parseFloat(e.target.value)})}"/>
              </div>
              <div class="setting-item">
                <label>FOV: ${this._selectedSensor.fov}°</label>
                <input type="range" min="30" max="180" .value="${String(this._selectedSensor.fov)}"
                       @input="${e=>this._updateSensor(this._selectedSensorIndex,{fov:parseInt(e.target.value)})}"/>
              </div>
              <div class="setting-item">
                <label>Mounting height: ${((this._selectedSensor.heightMm??2e3)/1e3).toFixed(1)}m</label>
                <input type="range" min="0.2" max="3" step="0.1" .value="${String((this._selectedSensor.heightMm??2e3)/1e3)}"
                       @input="${e=>this._updateSensor(this._selectedSensorIndex,{heightMm:Math.round(1e3*parseFloat(e.target.value))})}"/>
              </div>
            </div>
          `:B}
        `:"zone"===this._toolMode&&this._drawingZone.length>0?U`        `:"zone"===this._toolMode&&this._drawingZone.length>0?U`
            <div>
              <div class="section-title">CURRENT DRAWING</div>
              <p class="info-text">${this._drawingZone.length} points drawn</p>
              <button class="tool-btn" style="width: 100%;" @click="${()=>this._drawingZone=[]}">
                <ha-icon icon="mdi:cancel"></ha-icon>
                <span>Cancel</span>
              </button>
        </div>
        `:""}

        <!-- Detection Zones Section -->
        <div>
          <div class="section-title" style="color: #22c55e;">📍 DETECTION ZONES (${this._getZoneCountByType("detection")}/${Se.detection})</div>
          ${0===this._zones.filter(e=>"detection"===e.type).length?U`
            <p class="info-text">No detection zones yet. Draw a zone and choose "Detection".</p>
          `:U`
            <div class="zone-list">
              ${this._zones.map((e,t)=>"detection"!==e.type?"":U`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex===t?"selected":""}"
                       @click="${()=>{this._selectedZoneIndex=t,this._editingZoneIndex=null,this._toolMode="zone"}}">
                    <div class="zone-color" style="background: ${Ie[e.type].stroke};"></div>
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

        <!-- Exclusion Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #f87171;">🚷 EXCLUSION ZONES (${this._getZoneCountByType("exclusion")}/${Se.exclusion})</div>
          ${0===this._zones.filter(e=>"exclusion"===e.type).length?U`
            <p class="info-text">No exclusion zones yet. Draw a zone and choose "Exclusion".</p>
          `:U`
            <div class="zone-list">
              ${this._zones.map((e,t)=>"exclusion"!==e.type?"":U`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex===t?"selected":""}"
                       @click="${()=>{this._selectedZoneIndex=t,this._editingZoneIndex=null,this._toolMode="zone"}}">
                    <div class="zone-color" style="background: ${Ie[e.type].stroke};"></div>
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
          <div class="section-title" style="color: #10b981;">🚪 ENTRY LINES (${this._getZoneCountByType("entry")}/${Se.entry})</div>
          ${0===this._zones.filter(e=>"entry"===e.type).length?U`
            <p class="info-text">No entry lines yet. Draw 2 points and choose "Entry Line" for in/out detection at doorways.</p>
          `:U`
            <div class="zone-list">
              ${this._zones.map((e,t)=>"entry"!==e.type?"":U`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex===t?"selected":""}"
                       @click="${()=>{this._selectedZoneIndex=t,this._editingZoneIndex=null,this._toolMode="zone"}}">
                    <div class="zone-color" style="background: ${Ie[e.type].stroke};"></div>
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

        ${this._sensors.some(e=>e.deviceId)?U`
          <div class="live-status" style="border-left: 3px solid ${o>0?"#22c55e":"#64748b"};">
            <div class="header">
              <span class="dot ${o>0?"active":"inactive"}"></span>
              <span style="font-weight: 600; color: #e2e8f0;">Live Tracking</span>
            </div>
            <div class="count" style="color: ${o>0?"#22c55e":"#64748b"};">
              ${o} ${1===o?"person":"people"}
            </div>
            ${this._sensors.map((e,t)=>{if(!e.deviceId)return B;const i=(this._liveTargets[e.id]||[]).filter(e=>e.active).length;return U`
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
                  <span class="badge">${this._getZoneCountByType("entry")}/${Se.entry}</span>
                </div>
                <div class="zone-type-option continue" @click="${this._continueDrawingPolygon}">
                  <span class="icon">✏️</span>
                  <div class="info">
                    <div class="name">Continue drawing</div>
                    <div class="desc">Add more points for a polygon zone</div>
                  </div>
                  <span class="badge" style="background: rgba(100, 116, 139, 0.2); color: #94a3b8;">→</span>
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
                  <span class="badge">${this._getZoneCountByType("detection")}/${Se.detection}</span>
                </div>
                <div class="zone-type-option exclusion ${this._canAddZone("exclusion")?"":"disabled"}"
                     @click="${()=>this._canAddZone("exclusion")&&this._selectZoneType("exclusion")}">
                  <span class="icon">🚷</span>
                  <div class="info">
                    <div class="name">Exclusion Zone</div>
                    <div class="desc">Ignores motion in this area</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType("exclusion")}/${Se.exclusion}</span>
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
    `}};Ce.styles=r`
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
    .canvas-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; background: #0f172a; border-bottom: 1px solid #334155; }
    .header-group { display: flex; align-items: center; gap: 8px; }
    .room-label { font-size: 13px; color: #94a3b8; }
    .room-label span { color: #e2e8f0; font-weight: 600; }
    .save-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #334155; border: none; border-radius: 8px; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: default; }
    .save-btn.dirty { background: #22c55e; color: white; cursor: pointer; }
    .save-btn.dirty:hover { background: #16a34a; }
    .push-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: 1px solid #3b82f6; border-radius: 8px; color: #3b82f6; font-size: 13px; font-weight: 600; cursor: pointer; }
    .push-btn:disabled { border-color: #475569; color: #64748b; cursor: not-allowed; }
    .push-btn:hover:not(:disabled) { background: rgba(59, 130, 246, 0.12); }
    svg { flex: 1; background: #0a1628; cursor: crosshair; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; }
    .empty-state ha-icon { --mdc-icon-size: 64px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { margin: 0 0 8px 0; color: #94a3b8; }
    .grid-line { stroke: #16213a; stroke-width: 0.5; }
    .grid-line.major { stroke: #1e293b; stroke-width: 1; }
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
    .sensor-list { display: flex; flex-direction: column; gap: 6px; }
    .sensor-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; cursor: pointer; }
    .sensor-item:hover { border-color: #475569; }
    .sensor-item.selected { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .sensor-dot { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .sensor-dot.small { width: 18px; height: 18px; font-size: 10px; }
    .sensor-item-info { flex: 1; min-width: 0; }
    .sensor-item-name { font-size: 13px; color: #e2e8f0; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sensor-item-sub { font-size: 11px; color: #64748b; }
    .add-sensor-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 2px dashed #475569; border-radius: 8px; background: transparent; color: #94a3b8; font-size: 13px; cursor: pointer; }
    .add-sensor-btn:hover { border-color: #4361ee; color: #4361ee; }
    .add-sensor-btn ha-icon { --mdc-icon-size: 16px; }
    .live-sensor-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; }
    .live-sensor-name { flex: 1; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .live-sensor-count { color: #e2e8f0; font-weight: 600; }
    .mode-toggle { display: flex; background: #0f172a; border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
    .mode-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: none; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .mode-btn:hover { color: #e2e8f0; }
    .mode-btn.active { background: #4361ee; color: white; }
    .mode-btn ha-icon { --mdc-icon-size: 16px; }
    .add-room-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 2px dashed #475569; border-radius: 8px; background: transparent; color: #94a3b8; font-size: 13px; cursor: pointer; }
    .add-room-btn:hover { border-color: #4361ee; color: #4361ee; }
    .add-room-btn ha-icon { --mdc-icon-size: 16px; }
    .furniture-grid { display: flex; flex-direction: column; gap: 6px; }
    .furniture-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; cursor: pointer; }
    .furniture-item:hover { border-color: #4361ee; }
    .furniture-item.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .furniture-item ha-icon { --mdc-icon-size: 20px; color: #94a3b8; }
    .furniture-item span { flex: 1; font-size: 13px; color: #e2e8f0; }
    .furniture-item small { font-size: 11px; color: #64748b; }
    .placed-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; margin-bottom: 6px; font-size: 12px; }
    .placed-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .placed-item ha-icon { --mdc-icon-size: 18px; color: #64748b; }
    .placed-item .name { flex: 1; color: #e2e8f0; }
    .placed-item .size { color: #64748b; }
    .icon-btn { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; }
    .icon-btn:hover { color: #e2e8f0; }
    .icon-btn ha-icon { --mdc-icon-size: 16px; }
    .selected-panel { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; }
    .selected-panel input { width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; box-sizing: border-box; }
    .selected-panel label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
    .panel-btn-row { display: flex; gap: 8px; margin-top: 10px; }
    .panel-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: 8px; border: 1px solid #334155; background: transparent; color: #e2e8f0; font-size: 12px; cursor: pointer; }
    .panel-btn:hover { border-color: #4361ee; }
    .panel-btn.danger { color: #ef4444; }
    .panel-btn.danger:hover { border-color: #ef4444; }
    .panel-btn ha-icon { --mdc-icon-size: 16px; }
    .input-row { display: flex; gap: 12px; }
    .input-row > div { flex: 1; }
    .dialog-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px; min-width: 340px; max-width: 420px; }
    .dialog h3 { margin: 0 0 16px; font-size: 16px; color: #e2e8f0; }
    .dialog label { display: block; font-size: 12px; color: #94a3b8; margin: 10px 0 4px; }
    .dialog input, .dialog select { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #e2e8f0; font-size: 13px; box-sizing: border-box; }
    .dialog input:focus, .dialog select:focus { outline: none; border-color: #4361ee; }
    .dialog-buttons { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .dialog-btn { padding: 10px 18px; border-radius: 8px; font-size: 13px; cursor: pointer; border: none; }
    .dialog-btn.cancel { background: transparent; border: 1px solid #475569; color: #94a3b8; }
    .dialog-btn.primary { background: #4361ee; color: white; }
    .remove-sensor-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 8px; margin-top: 4px; background: transparent; border: 1px solid #334155; border-radius: 6px; color: #ef4444; font-size: 12px; cursor: pointer; }
    .remove-sensor-btn:hover { border-color: #ef4444; }
    .remove-sensor-btn ha-icon { --mdc-icon-size: 16px; }
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
    .view-toggle-btn.active { background: #4361ee; color: white; }
    .view-toggle-btn ha-icon { --mdc-icon-size: 16px; }
    .canvas3d { flex: 1; display: block; cursor: grab; background: #0a1628; }
    .canvas3d:active { cursor: grabbing; }
    .view3d-info { position: absolute; bottom: 16px; left: 16px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; z-index: 10; font-size: 12px; color: #94a3b8; }
  `,e([ue({attribute:!1})],Ce.prototype,"hass",void 0),e([ue({type:Array})],Ce.prototype,"rooms",void 0),e([ve()],Ce.prototype,"_selectedRoomId",void 0),e([ve()],Ce.prototype,"_roomPoints",void 0),e([ve()],Ce.prototype,"_furniture",void 0),e([ve()],Ce.prototype,"_doors",void 0),e([ve()],Ce.prototype,"_windows",void 0),e([ve()],Ce.prototype,"_sensors",void 0),e([ve()],Ce.prototype,"_selectedSensorIndex",void 0),e([ve()],Ce.prototype,"_draggingSensorIndex",void 0),e([ve()],Ce.prototype,"_zones",void 0),e([ve()],Ce.prototype,"_selectedZoneIndex",void 0),e([ve()],Ce.prototype,"_drawingZone",void 0),e([ve()],Ce.prototype,"_newZoneType",void 0),e([ve()],Ce.prototype,"_showZoneTypePicker",void 0),e([ve()],Ce.prototype,"_pendingZonePoints",void 0),e([ve()],Ce.prototype,"_draggingZonePointIndex",void 0),e([ve()],Ce.prototype,"_draggingDrawingPointIndex",void 0),e([ve()],Ce.prototype,"_draggingWholeZoneIndex",void 0),e([ve()],Ce.prototype,"_dragStartPos",void 0),e([ve()],Ce.prototype,"_zoneMidpointPreview",void 0),e([ve()],Ce.prototype,"_editingZoneIndex",void 0),e([ve()],Ce.prototype,"_liveTargets",void 0),e([ve()],Ce.prototype,"_entryExitEnabled",void 0),e([ve()],Ce.prototype,"_assumedPresent",void 0),e([ve()],Ce.prototype,"_pushingToSensor",void 0),e([ve()],Ce.prototype,"_toolMode",void 0),e([ve()],Ce.prototype,"_zoom",void 0),e([ve()],Ce.prototype,"_panOffset",void 0),e([ve()],Ce.prototype,"_cursorPos",void 0),e([ve()],Ce.prototype,"_saving",void 0),e([ve()],Ce.prototype,"_isDragging",void 0),e([ve()],Ce.prototype,"_dirty",void 0),e([ve()],Ce.prototype,"_designMode",void 0),e([ve()],Ce.prototype,"_pendingStart",void 0),e([ve()],Ce.prototype,"_previewPoint",void 0),e([ve()],Ce.prototype,"_wallHoverPreview",void 0),e([ve()],Ce.prototype,"_draggingPointIndex",void 0),e([ve()],Ce.prototype,"_selectedFurnitureType",void 0),e([ve()],Ce.prototype,"_showFurnitureDialog",void 0),e([ve()],Ce.prototype,"_furnitureWidth",void 0),e([ve()],Ce.prototype,"_furnitureHeight",void 0),e([ve()],Ce.prototype,"_selectedFurnitureIndex",void 0),e([ve()],Ce.prototype,"_draggingFurnitureIndex",void 0),e([ve()],Ce.prototype,"_draggingDoorIndex",void 0),e([ve()],Ce.prototype,"_draggingWindowIndex",void 0),e([ve()],Ce.prototype,"_doorWindowPreview",void 0),e([ve()],Ce.prototype,"_showDoorDialog",void 0),e([ve()],Ce.prototype,"_showWindowDialog",void 0),e([ve()],Ce.prototype,"_editingDoorIndex",void 0),e([ve()],Ce.prototype,"_editingWindowIndex",void 0),e([ve()],Ce.prototype,"_selectedWallIndex",void 0),e([ve()],Ce.prototype,"_doorWidth",void 0),e([ve()],Ce.prototype,"_doorOpenDirection",void 0),e([ve()],Ce.prototype,"_doorOpenSide",void 0),e([ve()],Ce.prototype,"_windowWidth",void 0),e([ve()],Ce.prototype,"_windowHeight",void 0),e([ve()],Ce.prototype,"_windowType",void 0),e([ve()],Ce.prototype,"_showNewRoomDialog",void 0),e([ve()],Ce.prototype,"_newRoomName",void 0),e([ve()],Ce.prototype,"_newRoomWidth",void 0),e([ve()],Ce.prototype,"_newRoomLength",void 0),e([me("svg")],Ce.prototype,"_svg",void 0),e([me("#canvas3d")],Ce.prototype,"_canvas3d",void 0),e([ve()],Ce.prototype,"_viewMode",void 0),e([ve()],Ce.prototype,"_pushingToESPHome",void 0),Ce=e([he("shs-zones-page")],Ce);const Ae="1.0.0";let Ze=class extends de{constructor(){super(...arguments),this.narrow=!1,this._currentPage="dashboard"}firstUpdated(e){console.log(`SmartHomeShop Panel v${Ae} initialized`)}_navigateTo(e){this._currentPage=e}_handleDeviceSelect(e){this._selectedDeviceId=e.detail.deviceId}render(){return U`
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
        </nav>
        <div class="header-right">
          <span class="version">v${Ae}</span>
        </div>
      </div>
      <div class="panel-content">${this._renderPage()}</div>
    `}_renderPage(){switch(this._currentPage){case"dashboard":case"settings":return U`<shs-dashboard-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
          @device-select=${this._handleDeviceSelect}
          @navigate=${e=>this._navigateTo(e.detail.page)}
        ></shs-dashboard-page>`;case"room-builder":case"zones":return U`<shs-zones-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
        ></shs-zones-page>`;default:return U`<p>Page not found</p>`}}};Ze.styles=r`
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
  `,e([ue({attribute:!1})],Ze.prototype,"hass",void 0),e([ue({type:Boolean,reflect:!0})],Ze.prototype,"narrow",void 0),e([ue({attribute:!1})],Ze.prototype,"panel",void 0),e([ve()],Ze.prototype,"_currentPage",void 0),e([ve()],Ze.prototype,"_selectedDeviceId",void 0),Ze=e([he("smarthomeshop-panel")],Ze);export{Ze as SmartHomeShopPanel};
