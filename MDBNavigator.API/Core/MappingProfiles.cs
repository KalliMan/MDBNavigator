﻿using AutoMapper;
using MDBNavigator.API.DTOs;
using Models.Connect;

namespace MDBNavigator.API.Core
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            CreateMap<ConnectionSettingsDto, ConnectionSettings>();
        }
    }
}
