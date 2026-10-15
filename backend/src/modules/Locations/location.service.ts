import { listServicesByLocationIdRepository } from "../Services/service.repository";
import {
    Location,
    createLocationInput,
    createLocationRepository,
    getLocationByIdRepository,
    listLocationsRepository
} from "./location.repository";

export class LocationError extends Error{
    constructor(message:string, public readonly statusCode:number){
        super(message);
        this.name = "LocationError"
    }
}

function validateLocationId(id:number):void{
    if(!Number.isSafeInteger(id) || id<=0){
        throw new LocationError("ID da localização invalido",400)
    }
}

function validadeLocationInput(localInput:Omit<Location, "id_location">): Omit<Location, "id_location">{
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

function handleRepositoryError(error: unknown): never {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        throw new LocationError("Já existe um latitude com esse nome.", 409);
    }
    throw error; 
}

export async function createLocation(local:Location):Promise<Location> {
    const data = validadeLocationInput(local)
    try{
        const location = await createLocationRepository(data);
        return location;
    }catch(error){
        handleRepositoryError(error)
    }
}

export async function getLocationById(id_location:number):Promise<Location> {
    validateLocationId(id_location)
    const location = await getLocationByIdRepository(id_location)
    if(!location){
        throw new LocationError("Localização não encotrado", 404)
    }
    return location;
}

export async function listLocationALl():Promise<Location[]> {
    const location = await listLocationsRepository();
    if(location.length===0){
        throw new LocationError("Não existe Localizações", 404)
    }
    return location;
}
