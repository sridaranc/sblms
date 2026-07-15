using AutoMapper;
using SBLMS.Application.Features.Auth.Commands.Login;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserResponse>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
            .ForMember(dest => dest.Roles, opt => opt.Ignore());

        CreateMap<RefreshToken, RefreshToken>();
    }
}
