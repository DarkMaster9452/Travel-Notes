/**
 * Slovak copy for the location catalogue.
 *
 * Kept beside `locations.ts` rather than inside it: the catalogue's structural
 * data (coordinates, bands, tags) is language-neutral and shouldn't be touched
 * when a translation is edited. `name` is only overridden where the English
 * entry reads as a description rather than a proper noun.
 */
export type LocationCopy = {
  name?: string;
  character: string;
  landmarks: string[];
  caution?: string;
};

export const LOCATIONS_SK: Record<string, LocationCopy> = {
  "janosikove-diery": {
    character: "reťaz úzkych tiesňav, kde chodník stúpa po rebríkoch priamo popri vode",
    landmarks: ["prvý reťazový rebrík", "sútok pod Podžiarom", "drevená lávka v Nových dierach"],
    caution: "Rebríky a reťaze sú po daždi klzké a v sezóne je tiesňava jednosmerná.",
  },
  "velky-rozsutec": {
    character: "tupý vápencový kužeľ, ktorý si výhľad vyslúži naozaj strmým záverom",
    landmarks: ["vrcholový kríž", "posledný skalný stupeň pod vrcholom", "sedlo Medziholie"],
    caution: "Horná časť je exponovaná; pri vetre alebo búrkovej predpovedi sa vráť.",
  },
  "sutovsky-vodopad": {
    character: "jeden z najvyšších vodopádov na Slovensku, ukrytý na konci tichej lesnej doliny",
    landmarks: ["jazierko pod vodopádom", "križovatka starej lesnej cesty", "balvanisko pod stenou"],
  },
  "sulovske-skaly": {
    character: "zlepencové veže, prírodná skalná brána a zrúcanina hradu naskladané do jedného krátkeho okruhu",
    landmarks: ["gotická skalná brána", "zrúcanina Súľovského hradu", "skalné okno nad dedinou"],
  },
  "vratna-chleb": {
    name: "Chleb a vrátňanský hrebeň",
    character: "otvorený trávnatý hrebeň, z ktorého vidíš celé pohorie naraz",
    landmarks: ["rázcestník v Snilovskom sedle", "vetrom ohnuté kosodreviny pod Chlebom"],
    caution: "Hrebeň je úplne vystavený počasiu — medzi sedlami nie je kam sa schovať.",
  },
  "gaderska-dolina": {
    character: "dlhá vápencová dolina, ktorá zostáva chladná a zelená aj v auguste",
    landmarks: ["vápencová úžina", "lúčna čistina pri Dedošovej", "starý uhliarsky milier"],
  },
  "ostra-tlsta": {
    name: "Ostrá a Tlstá",
    character: "dva skalné vrcholy nad jaskyňami prevŕtaným svahom, strmé od prvého kroku",
    landmarks: ["vchod do jaskyne Mažarná", "sedlo medzi dvojicou vrcholov"],
  },
  dumbier: {
    character: "najvyšší bod pohoria, dlhý prístup a naozaj vysokohorský záver",
    landmarks: ["vrcholová tabuľa", "traverz sutinou pod hrebeňom", "chata pod sedlom"],
    caution: "Nad 1 700 m sa počasie mení rýchlo. Vyraz skoro a nes so sebou vrstvy.",
  },
  "demanovska-dolina": {
    character: "krasová dolina, kde rieka zmizne pod zemou a vynorí sa niekde inde",
    landmarks: ["terasa pred vchodom do jaskyne", "závrt nad chodníkom", "vyvieračka"],
  },
  "mlynicka-skok": {
    name: "Mlynická dolina a vodopád Skok",
    character: "visutá dolina naskladaná plesami nad vodopádom, popri ktorom sa lezie hore",
    landmarks: ["reťaze popri vodopáde", "Pleso nad Skokom", "prvé pleso nad hranicou lesa"],
    caution: "Vysokotatranské chodníky sú v zime uzavreté. Over si termíny uzávery.",
  },
  "velke-hincovo": {
    name: "Veľké Hincovo pleso",
    character: "najhlbšie pleso v pohorí, uložené v mise zo sivej žuly",
    landmarks: ["balvanitý breh na druhej strane", "posledná serpentína pred plesom"],
    caution: "Dlhý deň. Posledný autobus dole ide skôr, než si myslíš.",
  },
  "zdiar-meadows": {
    name: "Ždiar a belianske lúky",
    character: "otvorené kosné lúky s celou belianskou stenou v pozadí",
    landmarks: ["maľované drevenice na starej ceste", "kaplnka na lúke", "línia plotu nad dedinou"],
  },
  "sucha-bela": {
    character: "jednosmerná roklina, ktorá sa zdoláva po rebríkoch pripevnených vedľa vodopádov",
    landmarks: ["rebrík pri Misových vodopádoch", "východ z rokliny na planinu", "drevená lávka pri vstupe"],
    caution: "Prevádzka je len jedným smerom. Po rebríkoch nezostupuj.",
  },
  klastorisko: {
    character: "zrúcanina kartuziánskeho kláštora na planine, kam sa dá dostať len pešo",
    landmarks: ["odkryté múry kláštora", "previs Tomášovského výhľadu"],
  },
  "zadielska-tiesnava": {
    character: "štyristo metrov hlboká vápencová štrbina, ktorá sa otvára na prázdnu krasovú planinu",
    landmarks: ["skalná ihla Cukrová homoľa", "hrana planiny nad tiesňavou"],
  },
  "muranska-planina": {
    character: "prázdna krasová planina so zrúcaninou hradu na hrane bralá a polodivokými koňmi",
    landmarks: ["zrúcanina hradu na hrane bralá", "pastvina divokých koní", "prameň pod planinou"],
  },
  "morske-oko": {
    character: "sopečné jazero obkolesené bukovým lesom, ktorý sa v októbri sfarbí do medena",
    landmarks: ["hrádza pri odtoku", "skalný útvar Sninský kameň"],
  },
  "sninsky-kamen": {
    character: "dva andezitové bloky týčiace sa nad lesom, prístupné po železnom schodisku",
    landmarks: ["kovové schodisko na hornú plošinu", "dvojica skalných vrcholov"],
  },
  kremenec: {
    character: "najprázdnejší kút krajiny, kde sa na otvorenom trávnatom hrebeni stretávajú tri hranice",
    landmarks: ["trojhraničný medzník", "otvorená polonina"],
    caution: "Na dlhých úsekoch nie je signál. Povedz niekomu svoj plán.",
  },
  vapec: {
    character: "ostrý vápencový vrchol, z ktorého máš celé Považie na jedno otočenie",
    landmarks: ["vrcholový kríž", "cesta starým lomom"],
  },
  "velka-javorina": {
    character: "zvlnené hraničné lúky, kde chodník vedie jednou nohou v každej krajine",
    landmarks: ["hraničný kameň na hrebeni", "prameň na lúke"],
  },
  "cachticky-hrad": {
    character: "zrúcanina so zlou povesťou na suchom vápencovom hrebeni nad vinicami",
    landmarks: ["vonkajší obranný múr", "krasová lúka pod hrebeňom"],
  },
  "devinska-kobyla": {
    character: "fosílna stena a sútok riek dvadsať minút od hlavného mesta",
    landmarks: ["fosílna stena Sandberg", "hradné bralo nad sútokom riek"],
  },
  tematin: {
    character: "zrúcanina dosť hlboko v lese na to, aby si ju najprv počul a až potom uvidel",
    landmarks: ["obnovená vstupná veža", "cisterna na dolnom nádvorí"],
  },
  sitno: {
    character: "stará sopka s hradom, rozhľadňou a jazerom na úpätí kopca",
    landmarks: ["rozhľadňa na vrchole", "zvyšky hradu pod planinou", "Počúvadlianske jazero"],
  },
  polana: {
    character: "okraj kaldery najväčšej vyhasnutej sopky v Európe, väčšinou les a väčšinou prázdno",
    landmarks: ["hrana kaldery", "čistina so salašom", "prameň pod vrcholom"],
    caution: "Aktívne medvedie územie. Na neprehľadných zákrutách rob hluk.",
  },
  simonka: {
    character: "najvyšší bod zabudnutého sopečného pohoria, samý bukový les a voľné kamene",
    landmarks: ["andezitové kamenné more", "rázcestník na hrebeni"],
  },
  "spissky-hrad": {
    name: "Spišský hrad a Dreveník",
    character: "najväčší hradný komplex v strednej Európe, ku ktorému sa ide cez otvorené travertínové lúky",
    landmarks: ["travertínové bloky Dreveníka", "horné nádvorie hradu", "brána Spišskej Kapituly"],
  },
  "tri-koruny": {
    name: "Tri koruny a Dunajec",
    character: "vápencová koruna nad riečnou tiesňavou, ktorá tvorí hranicu",
    landmarks: ["vyhliadková plošina nad tiesňavou", "zákruta rieky pri Červenom Kláštore"],
  },
  rohace: {
    name: "Roháčske plesá",
    character: "štyri ľadovcové plesá navlečené v doline pod zubatým hrebeňom",
    landmarks: ["reťaz štyroch plies", "vodopád pod prvým plesom", "chata v závere doliny"],
    caution: "V hornej doline sa sneh drží do júna.",
  },
  "kvacianska-dolina": {
    character: "fungujúci vodný mlyn na dne tiesňavy, popri ktorej nikto neprejde náhodou",
    landmarks: ["obnovený vodný mlyn", "drevený náhon nad potokom", "úžina, kde je chodník vytesaný do skaly"],
  },
  "velky-choc": {
    character: "samostatne stojaci vápencový štít, z ktorého za jasného dňa vidno Tatry aj Fatry",
    landmarks: ["vrcholová panoramatická tabuľa", "traverz sutinou na severnej strane"],
  },
  zobor: {
    name: "Zobor a Pyramída",
    character: "mestský hrebeň suchého dubového lesa, ktorý sa hodinu pred západom sfarbí do zlata",
    landmarks: ["vysielač na vrchole", "opustená stena lomu", "zvyšky pustovne"],
  },
  somoska: {
    character: "hrad na čadičovej zátke a pod ním zamrznutý „kamenný vodopád“ zo šesťhranných stĺpov",
    landmarks: ["kamenný vodopád z čadičových stĺpov", "obnovená hradná veža"],
  },
  "havrania-skala": {
    character: "hrana bralá nad priehradou, s ľadovou jaskyňou ukrytou pod prístupovým chodníkom",
    landmarks: ["hrana bralá nad priehradou", "vchod do ľadovej jaskyne pod chodníkom"],
  },
  "velka-raca": {
    character: "široký hraničný hrebeň, kde sa les otvára do dlhých trávnatých pásov",
    landmarks: ["trojhraničný medzník na hrebeni", "lúka pod vrcholom"],
  },
  "velky-javornik": {
    character: "dlhé otvorené pasienkové hrebene, ktoré pôsobia oveľa vyššie, než v skutočnosti sú",
    landmarks: ["vrcholový prístrešok", "línia plotu pozdĺž hrebeňa"],
  },
};
