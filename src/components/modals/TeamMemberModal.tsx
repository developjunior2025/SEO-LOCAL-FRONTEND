import {
  Award,
  Briefcase,
  Clock,
  ExternalLink,
  Languages,
  Mail,
  MapPin,
  Phone,
  X,
} from 'lucide-react';
import type { AgencyTeamMember } from '@/types';

interface TeamMemberModalProps {
  member: AgencyTeamMember;
  onClose: () => void;
}

const fallbackAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=320';

export default function TeamMemberModal({ member, onClose }: TeamMemberModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#0B1F3A]/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar perfil del consultor"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-modal-title"
        className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-20 flex items-center justify-end border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-[#D32323] hover:border-[#D32323]/30"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-8 sm:px-8">
          <div className="flex flex-col items-center pt-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#D32323]/20 to-[#0074E0]/20 blur-xl" />
              <img
                src={member.avatarUrl || fallbackAvatar}
                alt={member.name}
                className="relative h-36 w-36 rounded-3xl object-cover ring-4 ring-white shadow-xl"
              />
            </div>
            <div className="mt-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#D32323]">Equipo Técnico de Consultores</p>
              <h2 id="team-modal-title" className="mt-1 text-2xl font-black text-[#333]">{member.name}</h2>
              <p className="text-sm font-bold text-[#0074E0]">{member.roleTitle}</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Perfil profesional</h3>
              <p className="mt-2 text-sm font-semibold text-gray-600 leading-relaxed">
                {member.fullBio || member.bio}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {member.experience && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0074E0]">
                    <Briefcase className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Experiencia</p>
                    <p className="text-sm font-black text-[#333]">{member.experience}</p>
                  </div>
                </div>
              )}
              {member.availability && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Disponibilidad</p>
                    <p className="text-sm font-black text-[#333]">{member.availability}</p>
                  </div>
                </div>
              )}
              {member.languages && member.languages.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Languages className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Idiomas</p>
                    <p className="text-sm font-black text-[#333]">{member.languages.join(', ')}</p>
                  </div>
                </div>
              )}
              {member.projects !== undefined && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#D32323]">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Proyectos gestionados</p>
                    <p className="text-sm font-black text-[#333]">{member.projects}+</p>
                  </div>
                </div>
              )}
            </div>

            {member.skills && member.skills.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-[#071A2F] px-3 py-1.5 text-[10px] font-black text-white">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {member.certifications && member.certifications.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400">
                  <Award className="h-4 w-4 text-amber-500" /> Certificaciones
                </h3>
                <ul className="mt-3 space-y-2">
                  {member.certifications.map((cert) => (
                    <li key={cert} className="flex items-start gap-2 text-sm font-bold text-[#333]">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D32323] shrink-0" />
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-xs font-black text-[#333] hover:border-[#D32323]/40 inline-flex items-center justify-center gap-2"
                >
                  <Mail className="h-4 w-4 text-[#D32323]" /> Email
                </a>
              )}
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-xs font-black text-[#333] hover:border-[#D32323]/40 inline-flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4 text-emerald-600" /> Llamar
                </a>
              )}
              {member.linkedIn && (
                <a
                  href={member.linkedIn}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-xs font-black text-[#333] hover:border-[#D32323]/40 inline-flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4 text-sky-600" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
