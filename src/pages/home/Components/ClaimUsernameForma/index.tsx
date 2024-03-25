import { Button, Text, TextInput } from "@ignite-ui/react";
import { Form, FormAnnotation } from "./styles";
import { ArrowRight } from "phosphor-react";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from "zod";


const claimUsernameForm = z.object({
  username: z.string()
    .min(3, { message: 'O usuário precisa ter pelo menos 3 letras' })
    .regex(/^([a-z\\-]+)$/i, { message: 'O usuário pode ter apenas letras e hifens' })
    .transform((username) => username.toLowerCase()),
})

type ClainUsernameFormData = z.infer<typeof claimUsernameForm>

export function ClaimUsernameForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ClainUsernameFormData>({
    resolver: zodResolver(claimUsernameForm),
  });


  async function handleClaimUsername(data: ClainUsernameFormData) {
    console.log(data);
  }

  return (
    <>
      <Form as="form" onSubmit={handleSubmit(handleClaimUsername)}>
        <TextInput
          size="sm"
          prefix="ignite.com/"
          placeholder="seu-usuario"
          {...register('username')}
        />
        <Button size="sm" type="submit">
          Reservar
          <ArrowRight />
        </Button>

      </Form>

      <FormAnnotation>
        <Text size="sm">
          {errors.username ? errors.username.message
            : 'Digite o nome do usuário desejado'}
        </Text>
      </FormAnnotation>
    </>
  )
}