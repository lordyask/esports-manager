/** Product identity is fixed; the manager's team keeps its own crest and color. */
export default function ProductLogo({className=''}:{className?:string}){
 return <img className={`product-logo ${className}`} src={`${process.env.NEXT_PUBLIC_BASE_PATH??''}/brand/logo-horizontal.svg`} width={370} height={100} alt="Esports Manager"/>;
}
