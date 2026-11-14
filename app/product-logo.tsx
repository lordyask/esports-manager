/** Product identity is fixed; the manager's team keeps its own crest and color. */
export default function ProductLogo({className=''}:{className?:string}){
 return <span className={`product-logo ${className}`}><img src={`${process.env.NEXT_PUBLIC_BASE_PATH??''}/brand/nexus-monogram.png`} width={52} height={52} alt=""/><span className="product-wordmark" aria-hidden="true">NEXUS<small>ESPORTS MANAGER</small></span><span className="sr-only">NEXUS Esports Manager</span></span>;
}
