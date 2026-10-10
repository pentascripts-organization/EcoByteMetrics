create table Users(
	id_user int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name_user varchar(50) not null,
	email_user varchar(50) not null,
	password_user varchar(25)not null,
	token_user varchar(255)not null
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

create table Cabons(
	id_carbon int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_location int,
	date_houry TIMESTAMP not null,
	intesity_co2e_kwh_carbon int not null,
	renewable_percent_carbon int not null,
	constraint fk_service
	foreign key(id_location)
	references locations(id_location)
);