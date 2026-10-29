create table Users(
	id_user int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name_user varchar(50) not null,
	email_user varchar(254) not null unique,
	password_user varchar(255)not null
);
create table Locations(
	id_location int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name_location varchar(50)not null unique,
	country_location varchar(50),
	region_location varchar(50),
	city_location varchar(50),
	latitude_location double precision not null
	CHECK (latitude_location BETWEEN -90 AND 90),
	longitude_location double precision not null
	CHECK (longitude_location BETWEEN -180 AND 180)
);

create table Services(
	id_service int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_location int ,
	name_service varchar(50)not null unique,
	path_metric varchar(50) not null,
	active_service BOOLEAN NOT NULL DEFAULT TRUE,
	date_houry TIMESTAMP DEFAULT NOW(),
	constraint fk_service 
		foreign key (id_location)
		references locations(id_location)
);

create table Metrics (
	id_metric bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_service int,
	cpu_metric numeric not null
	CHECK (cpu_metric BETWEEN 0 AND 100),
	ram_metric numeric not null check(ram_metric>=0),
	hd_metric numeric not null check(hd_metric>=0),
	network_metric numeric not null check(hd_metric>=0),
	date_houry TIMESTAMP NOT NULL,
	colletion_interval_metric numeric not null,
	constraint fk_service
		foreign key (id_service)
		references services(id_service),
	CONSTRAINT uq_metrics_service_date
        UNIQUE (id_service, date_houry)
);

create table Carbons(
	id_carbon int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_location int,
	date_houry TIMESTAMP not null,
	intesity_co2e_kwh_carbon int not null check(intesity_co2e_kwh_carbon>0),
	renewable_percent_carbon int not null
	CHECK (renewable_percent_carbon BETWEEN 0 AND 100),
	constraint fk_service
		foreign key(id_location)
		references locations(id_location),
	CONSTRAINT uq_metrics_Carbon_date
        UNIQUE (id_location, date_houry)
);

