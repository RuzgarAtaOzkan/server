echo "
      NO!                          MNO!
     MNO!!         [NBK]          MNNOO!
   MMNO!                           MNNOO!!
 MNOONNOO!   MMMMMMMMMMPPPOII!   MNNO!!!!
 !O! NNO! MMMMMMMMMMMMMPPPOOOII!! NO!
       ! MMMMMMMMMMMMMPPPPOOOOIII! !
        MMMMMMMMMMMMPPPPPOOOOOOII!!
        MMMMMOOOOOOPPPPPPPPOOOOMII!
        MMMMM..    OPPMMP    .,OMI!
        MMMM::   o.,OPMP,.o   ::I!!
          NNM:::.,,OOPM!P,.::::!!
         MMNNNNNOOOOPMO!!IIPPO!!O!
         MMMMMNNNNOO:!!:!!IPPPPOO!
          MMMMMNNOOMMNNIIIPPPOO!!
             MMMONNMMNNNIIIOO!

           MN MOMMMNNNIIIIIO! OO
          MNO! IiiiiiiiiiiiI OOOO
     NNN.MNO!   O!!!!!!!!!O   OONO NO!
    MNNNNNO!    OOOOOOOOOOO    MMNNON!
      MNNNNO!    PPPPPPPPP    MMNON!
         OO!                   ON!



██████╗ ██╗   ██╗███████╗██╗  ██╗██╗███╗   ██╗ ██████╗          
██╔══██╗██║   ██║██╔════╝██║  ██║██║████╗  ██║██╔════╝          
██████╔╝██║   ██║███████╗███████║██║██╔██╗ ██║██║  ███╗         
██╔═══╝ ██║   ██║╚════██║██╔══██║██║██║╚██╗██║██║   ██║         
██║     ╚██████╔╝███████║██║  ██║██║██║ ╚████║╚██████╔╝██╗██╗██╗
╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝╚═
"

git status

git add .

echo "Please enter your commit message"
read commit_message

git commit -m "$commit_message"

git push origin main


