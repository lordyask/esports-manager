// Start a real circuit in a disposable browser profile.
export async function enrollEconomy(page){
 await page.getByRole('button',{name:/^Iniciar carreira/}).click();
 await page.getByRole('button',{name:'Escolher meu elenco',exact:true}).click();
 await page.getByRole('button',{name:/^Elenco econômico/}).click();
 await page.getByRole('button',{name:'Revisar inscrição',exact:true}).click();
 await page.getByRole('button',{name:'Confirmar inscrição',exact:true}).click();
 await page.getByRole('heading',{name:'Central de comando',exact:true}).waitFor();
}
