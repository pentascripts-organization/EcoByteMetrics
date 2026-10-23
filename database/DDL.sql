CREATE TABLE Users (
    id_user INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name_user VARCHAR(50) NOT NULL,
    email_user VARCHAR(254) NOT NULL UNIQUE,
    password_user VARCHAR(255) NOT NULL
);
create table Locations(
	id_location int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name_location varchar(50)not null,
	county_location varchar(50),
	region_location varchar(50),
	city_location varchar(50),
	latitude_location double precision not null,
	logitude_location double precision not null
);

create table Services(
	id_service int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_location int,
	name_service varchar(50),
	constraint fk_service 
	foreign key (id_location)
	references locations(id_location)
);

create table Metrics (
	id_metric int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_service int,
	date_houry TIMESTAMP NOT NULL,
	path_metric varchar(50) not null,
	colletion_interval_metric int not null,
	cpu_metric numeric not null,
	ram_metric numeric not null,
	hd_metric numeric not null,
	network_metric numeric not null,
	constraint fk_service
	foreign key (id_service)
	references services(id_service)
);

create table Carbons(
	id_carbon int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_location int,
	date_houry TIMESTAMP not null,
	intesity_co2e_kwh_carbon int not null,
	renewable_percent_carbon int not null,
	constraint fk_service
	foreign key(id_location)
	references locations(id_location)
);
--insert into Users (name_user, email_user, password_user) values ('ecobytemetrics','ecobytemetrics@gamil.com', '123eco');
