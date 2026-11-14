const flags:Record<string,string>={'Brasil':'🇧🇷','México':'🇲🇽','Chile':'🇨🇱','Peru':'🇵🇪','Argentina':'🇦🇷','Colômbia':'🇨🇴','Uruguai':'🇺🇾','Costa Rica':'🇨🇷','Equador':'🇪🇨','Paraguai':'🇵🇾','Venezuela':'🇻🇪','Bolívia':'🇧🇴'};
export const countryLabel=(country:string)=>`${flags[country]??''} ${country}`.trim();
