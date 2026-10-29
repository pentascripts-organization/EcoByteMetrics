
//importação de tipos e funções do repositório de localização, incluindo Location, createLocationInput, createLocationRepository, getLocationByIdRepository e listLocationsRepository.
import {
    Location,
    createLocationInput,
    createLocationRepository,
    getLocationByExistRepository,
    getLocationByIdRepository,
    listLocationsRepository
} from "./location.repository";

/**
 * Criação da classe LocationError que estende a classe Error e
 *  adiciona uma propriedade statusCode para representar o código de status HTTP associado ao erro.
 */
export class LocationError extends Error{
    constructor(message:string, public readonly statusCode:number){
        super(message);
        this.name = "LocationError"
    }
}
/*Função validateLocationId que valida o identificador de localização,
 lançando um erro LocationError se o identificador não for um número inteiro seguro ou for menor ou igual a zero.
 */
function validateLocationId(id:number):void{
    if(!Number.isSafeInteger(id) || id<=0){
        throw new LocationError("ID da localização invalido",400)
    }
}
/*Função validadeLocationInput que valida os dados de entrada para criar uma nova localização,
  lançando erros LocationError se algum campo for inválido ou ausente.
 */
function validadeLocationInput(localInput:createLocationInput): createLocationInput{
    if(!localInput.name_location || localInput.name_location.trim()===""){
        throw new LocationError("Nome da Localização Invalido",400);
    }
    if(!localInput.region_location  || localInput.region_location.trim()===""){
        throw new LocationError("Região da Localização Invalido",400);
    }
    if(!localInput.country_location || localInput.country_location.trim()===""){
        throw  new LocationError("Pais da Localização Invalido",400)       
    }
    if(!localInput.city_location || localInput.city_location.trim()===""){
        throw new LocationError("Cidade da Localização Invalido",400)
    }
    if(!localInput.latitude_location || Number.isInteger(localInput.latitude_location)){
        throw new LocationError("Latitude da Localização Invalido",400)
    }
    if(!localInput.longitude_location || Number.isInteger(localInput.longitude_location)){
        throw new LocationError("Logitude da Localização Invalido",400)
    }
    return localInput;
}
/* Função handleRepositoryError que trata erros do repositório,
lançando um erro LocationError específico se o código de erro for "23505" (violação de chave única) ou
propagando o erro original caso contrário.
*/
function handleRepositoryError(error: unknown): never {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        throw new LocationError("Já existe um Local com esse nome.", 409);
    }
    throw error; 
}
/*Função assíncrona createLocation que valida os dados de entrada,
  chama a função createLocationRepository para criar uma nova localização e trata erros do repositório.
*/
export async function createLocation(local:createLocationInput):Promise<Location> {
    const data = validadeLocationInput(local)
    try{
        const location = await createLocationRepository(data);
        return location;
    }catch(error){
        handleRepositoryError(error)
    }
}
/*Função assíncrona getLocationById que valida o identificador de localização,
  chama a função getLocationByIdRepository para buscar a localização correspondente e lança um erro LocationError se a localização não for encontrada.
*/
export async function getLocationById(id_location:number):Promise<Location> {
    validateLocationId(id_location)
    const location = await getLocationByIdRepository(id_location)
    if(!location){
        throw new LocationError("Localização não encotrado", 404)
    }
    return location;
}

export async function getLocationByName(longitude_location:number, latitude_location:number):Promise<Location | null> {
    const location = await getLocationByExistRepository(longitude_location,latitude_location)
    if(location){
        return location;
    }
    return null;
}
/*Função assíncrona listLocationALl que chama a função listLocationsRepository para buscar todas as localizações,
  lançando um erro LocationError se não houver localizações encontradas.
*/  
export async function listLocationALl():Promise<Location[]> {
    const location = await listLocationsRepository();
    if(location.length===0){
        throw new LocationError("Não existe Localizações", 404)
    }
    return location;
}
